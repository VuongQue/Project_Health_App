import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, RefreshControl,
} from "react-native";
import { useTranslation } from "react-i18next";
import { useTour } from "@/src/context/TourContext";
import { useScreenTour, useScreenTourStep } from "@/src/context/ScreenTourContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  Bell, Flame, Award, ChevronRight, Dumbbell, Trophy,
  Sparkles, Bot, Utensils, BarChart2,
  Map, CalendarDays, Footprints, Droplets, ShieldAlert, Users, Activity,
} from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter, useFocusEffect } from "expo-router";

import axiosClient from "@/src/api/axiosClient";
import { profileApi } from "@/src/api/profileApi";
import healthJourneyApi, { ActiveJourneyResponse } from "@/src/api/healthJourneyApi";
import { IUserChallenge } from "@/src/types/challenge";
import { useNotifications } from "@/app/notifications/NotificationContext";
import ChallengeMiniCard from "@/components/challenge/ChallengeMiniCard";
import { StatGridSkeleton, CardSkeleton } from "@/components/ui/SkeletonLoader";
import EmptyState from "@/components/ui/EmptyState";
import ProgressBar from "@/components/ui/ProgressBar";
import { useColors, Colors, Shadow, Spacing, Radius, Typography, sw, sf, SCREEN_W } from "@/src/theme";
import { useTheme } from "@/src/context/ThemeContext";

const MOOD_EMOJIS = ["😔", "😐", "🙂", "😊", "😄"];
const MOOD_LIGHT_COLORS = ["#94a3b8", "#64748b", "#D97706", "#10B981", "#3B82F6"];
const MOOD_DARK_COLORS  = ["#94a3b8", "#94a3b8", "#FBBF24", "#34D399", "#4C8EF8"];

function normalizeMoodScore(raw?: number | null) {
  if (!raw) return 3;
  return Math.min(5, Math.max(1, raw));
}

export default function DashboardScreen() {
  const router = useRouter();
  const colors = useColors();
  const { isDark } = useTheme();
  const { unreadCount } = useNotifications();

  const { t } = useTranslation();
  const { startTour } = useTour();
  const { startScreenTour } = useScreenTour();
  const tourStartedRef = useRef(false);
  const MOOD_LABELS = [t("mood.label_sad"), t("mood.label_neutral"), t("mood.label_ok"), t("mood.label_happy"), t("mood.label_great")];

  const step0 = useScreenTourStep(0);
  const step1 = useScreenTourStep(1);
  const step2 = useScreenTourStep(2);
  const step3 = useScreenTourStep(3);
  const step4 = useScreenTourStep(4);

  const [userName, setUserName] = useState("User");
  const [userLevel, setUserLevel] = useState(1);
  const [userPoints, setUserPoints] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [moodScore, setMoodScore] = useState(3);
  const [moodStreak, setMoodStreak] = useState(0);
  const [workoutsCompleted, setWorkoutsCompleted] = useState(0);
  const [weekCalories, setWeekCalories] = useState(0);
  const [challenges, setChallenges] = useState<IUserChallenge[]>([]);
  const [achievements, setAchievements] = useState<any[]>([]);
  const [activeJourney, setActiveJourney] = useState<ActiveJourneyResponse | null>(null);
  const [todaySteps, setTodaySteps] = useState(0);
  const [todayWater, setTodayWater] = useState(0);
  const [stepGoal, setStepGoal] = useState(10000);
  const [friendCount, setFriendCount] = useState(0);
  const lastFetchRef = useRef<number>(0);
  const CACHE_TTL = 60_000; // 60 giây

  useFocusEffect(useCallback(() => {
    const now = Date.now();
    if (now - lastFetchRef.current > CACHE_TTL) {
      loadAll();
    }
  }, []));

  useEffect(() => {
    if (!loading && !tourStartedRef.current) {
      tourStartedRef.current = true;
      startScreenTour('home', [
        { id: 'xp', placement: 'bottom', icon: '⭐', title: 'Điểm XP & Cấp độ', body: 'Thẻ XP của bạn. Mỗi lần tập luyện, ghi mood hay hoàn thành thử thách — bạn nhận được điểm. Nhấn vào để xem bảng xếp hạng!' },
        { id: 'stats', placement: 'bottom', icon: '📊', title: 'Bước chân · Nước · Tâm trạng', body: 'Ba chỉ số hôm nay của bạn. Nhấn vào từng ô để ghi thêm.' },
        { id: 'quick', placement: 'bottom', icon: '⚡', title: 'Truy cập nhanh', body: 'Vuốt ngang để xem tất cả. Nhấn để ghi nhật ký.' },
        { id: 'ai', placement: 'top', icon: '🤖', title: 'AI Health Coach', body: 'Bốn công cụ AI: Chat, phân tích sức khoẻ, phân tích bữa ăn, báo cáo tuần.' },
        { id: 'suggestions', placement: 'top', icon: '💡', title: 'Gợi ý hôm nay', body: 'App tự động phân tích dữ liệu và đưa ra gợi ý cụ thể.' },
      ]);
    }
  }, [loading]);

  const loadAll = async () => {
    try {
      setLoading(true);
      await Promise.all([fetchUserInfo(), fetchDashboard()]);
      lastFetchRef.current = Date.now();
    } finally {
      setLoading(false);
      setRefreshing(false);
      checkAndStartTour();
    }
  };

  const checkAndStartTour = async () => {
    const pending = await AsyncStorage.getItem('@tour_pending');
    if (pending === 'true') {
      await AsyncStorage.removeItem('@tour_pending');
      const alreadyDone = await AsyncStorage.getItem('@tour_completed');
      if (alreadyDone !== 'true') {
        setTimeout(() => startTour(), 800);
      }
    }
  };

  const fetchUserInfo = async () => {
    try {
      const res = await profileApi.getMe();
      setUserName(res.data.user?.fullName?.split(" ").pop() || "User");
      setUserLevel(res.data.user?.level ?? 1);
      setUserPoints(res.data.user?.points ?? 0);
    } catch {}
  };

  const fetchDashboard = async () => {
    try {
      const [moodRes, workoutRes, challengeRes, achRes, journeyRes, stepsRes, waterRes] = await Promise.all([
        axiosClient.get("/moods/dashboard").catch(() => ({ data: null })),
        axiosClient.get("/fitness/logs/week").catch(() => ({ data: null })),
        axiosClient.get("/challenges/me").catch(() => ({ data: [] })),
        axiosClient.get("/achievements/me").catch(() => ({ data: [] })),
        healthJourneyApi.getActive().catch(() => ({ data: null })),
        axiosClient.get("/steps/today").catch(() => ({ data: null })),
        axiosClient.get("/water-intake/today").catch(() => ({ data: null })),
      ]);
      setMoodScore(normalizeMoodScore(moodRes.data?.today?.mood?.score));
      setMoodStreak(moodRes.data?.insights?.streak ?? 0);
      setWorkoutsCompleted(workoutRes.data?.weekTotal?.workouts ?? 0);
      setWeekCalories(workoutRes.data?.weekTotal?.calories ?? 0);
      setChallenges(challengeRes.data ?? []);
      setAchievements(achRes.data ?? []);
      setActiveJourney((journeyRes.data as any) ?? null);
      setTodaySteps(stepsRes.data?.steps ?? 0);
      setStepGoal(stepsRes.data?.goalSteps ?? 10000);
      setTodayWater(waterRes.data?.total ?? 0);
      axiosClient.get("/friends/list").then((r) => {
        setFriendCount((r.data?.friends ?? r.data ?? []).length);
      }).catch(() => {});
    } catch {}
  };

  const MOOD_COLORS = isDark ? MOOD_DARK_COLORS : MOOD_LIGHT_COLORS;
  const todayEmoji = MOOD_EMOJIS[moodScore - 1];
  const todayLabel = MOOD_LABELS[moodScore - 1];
  const todayColor = MOOD_COLORS[moodScore - 1];

  const unlockedAchievements = achievements.filter((a) => a.unlocked === true).length;
  const activeChallenges = challenges.filter((c: any) => !c.completed && !c.failed);

  const THRESHOLDS = [0, 100, 250, 500, 1000, 2000, 4000, 7000, 11000, 16000];
  const nextThreshold = THRESHOLDS[userLevel] ?? THRESHOLDS[THRESHOLDS.length - 1];
  const prevThreshold = THRESHOLDS[userLevel - 1] ?? 0;
  const levelPct = nextThreshold > prevThreshold
    ? ((userPoints - prevThreshold) / (nextThreshold - prevThreshold)) * 100 : 100;

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return t("home.greeting_morning");
    if (h < 18) return t("home.greeting_afternoon");
    return t("home.greeting_evening");
  };

  const QUICK_ACTIONS = [
    { emoji: "💧", label: t("home.quick_water"),  route: "/(tabs)/(personal)/water-intake", color: colors.info },
    { emoji: "🍽️", label: t("home.quick_food"),   route: "/(tabs)/(personal)/food-diary",   color: colors.success },
    { emoji: "👟", label: t("home.quick_steps"),  route: "/(tabs)/(personal)/steps",         color: colors.primary },
    { emoji: "⚖️", label: t("home.quick_body"),   route: "/(tabs)/(personal)/body-metrics",  color: colors.purple },
    { emoji: "🎯", label: t("home.quick_goals"),  route: "/(tabs)/(personal)/goals",         color: colors.warning },
    { emoji: "📊", label: t("home.quick_stats"),  route: "/advanced-stats",                  color: colors.orange },
    { emoji: "🧮", label: t("home.quick_bmr"),    route: "/bmr-calculator",                  color: colors.pink },
    { emoji: "📋", label: t("home.quick_report"), route: "/health-report",                   color: colors.teal },
  ];

  const stepsPercent = Math.min(100, Math.round((todaySteps / stepGoal) * 100));
  const waterPercent = Math.min(100, Math.round((todayWater / 2000) * 100));

  const shadowCard = isDark
    ? { shadowColor: "#000", shadowOpacity: 0.3, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 6 }
    : Shadow.sm;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.bgSecondary }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); lastFetchRef.current = 0; loadAll(); }} tintColor={colors.primary} />
      }
    >
      {/* ── Header ── */}
      <View style={[styles.header, { backgroundColor: colors.bgPrimary, borderBottomColor: colors.border }]}>
        <View>
          <Text style={[styles.greeting, { color: colors.textMuted }]}>{getGreeting()},</Text>
          <Text style={[styles.userName, { color: colors.textPrimary }]}>{userName} 👋</Text>
        </View>
        <TouchableOpacity
          onPress={() => router.push("/notifications" as any)}
          style={[styles.notifBtn, { backgroundColor: colors.bgCardElevated }]}
          activeOpacity={0.75}
        >
          <Bell size={19} color={unreadCount > 0 ? colors.primary : colors.textMuted} strokeWidth={2} />
          {unreadCount > 0 && (
            <View style={[styles.badge, { backgroundColor: colors.danger }]}>
              <Text style={styles.badgeText}>{unreadCount > 9 ? "9+" : unreadCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* ── XP / Level Card ── */}
      <View style={styles.section}>
        <TouchableOpacity activeOpacity={0.85} onPress={() => router.push("/leaderboard" as any)}>
          <LinearGradient
            ref={step0.ref}
            onLayout={step0.measure}
            colors={isDark ? ["#1C2B4A", "#162040"] : ["#EBF3FF", "#F0F7FF"]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={[styles.xpCard, { borderColor: colors.borderAccent }]}
          >
            <View style={styles.xpRow}>
              <View style={styles.xpLeft}>
                <View style={[styles.xpBadge, { backgroundColor: colors.warning + "22" }]}>
                  <Trophy size={12} color={colors.warning} />
                  <Text style={[styles.xpLevel, { color: colors.warning }]}>Lv.{userLevel}</Text>
                </View>
                <Text style={[styles.xpName, { color: colors.textMuted }]}>{t("home.member_tag")}</Text>
              </View>
              <Text style={[styles.xpPoints, { color: colors.primary }]}>{userPoints.toLocaleString()} <Text style={[styles.xpUnit, { color: colors.textMuted }]}>XP</Text></Text>
            </View>
            <View style={[styles.xpTrack, { backgroundColor: colors.primary + "1A" }]}>
              <LinearGradient
                colors={[colors.primary, colors.primaryLight]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={[styles.xpFill, { width: `${Math.min(100, levelPct)}%` }]}
              />
            </View>
            <Text style={[styles.xpSub, { color: colors.textMuted }]}>
              {t("home.xp_to_next", { xp: Math.max(0, nextThreshold - userPoints).toLocaleString(), level: userLevel + 1 })}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* ── Today Stats ── */}
      <View
        ref={step1.ref}
        onLayout={step1.measure}
        style={styles.section}
      >
        <View style={styles.rowBetween}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Hôm nay</Text>
        </View>
        <View style={styles.todayRow}>
          {/* Steps */}
          <TouchableOpacity style={[styles.todayCard, { backgroundColor: colors.bgCard, borderColor: colors.border }, shadowCard]} activeOpacity={0.8} onPress={() => router.push("/(tabs)/(personal)/steps" as any)}>
            <View style={[styles.todayIconRing, { borderColor: colors.primary + "30", backgroundColor: colors.primaryBg }]}>
              <Text style={styles.todayEmoji}>👟</Text>
            </View>
            <Text style={[styles.todayValue, { color: colors.textPrimary }]}>{todaySteps.toLocaleString()}</Text>
            <Text style={[styles.todayLabel, { color: colors.textMuted }]}>{t("home.steps_label")}</Text>
            <View style={[styles.todayTrack, { backgroundColor: colors.border }]}>
              <View style={[styles.todayFill, { width: `${stepsPercent}%`, backgroundColor: colors.primary }]} />
            </View>
          </TouchableOpacity>

          {/* Water */}
          <TouchableOpacity style={[styles.todayCard, { backgroundColor: colors.bgCard, borderColor: colors.border }, shadowCard]} activeOpacity={0.8} onPress={() => router.push("/(tabs)/(personal)/water-intake" as any)}>
            <View style={[styles.todayIconRing, { borderColor: colors.info + "30", backgroundColor: colors.infoBg }]}>
              <Text style={styles.todayEmoji}>💧</Text>
            </View>
            <Text style={[styles.todayValue, { color: colors.textPrimary }]}>{todayWater}<Text style={[styles.todayUnit, { color: colors.textMuted }]}>ml</Text></Text>
            <Text style={[styles.todayLabel, { color: colors.textMuted }]}>{t("home.water_label")}</Text>
            <View style={[styles.todayTrack, { backgroundColor: colors.border }]}>
              <View style={[styles.todayFill, { width: `${waterPercent}%`, backgroundColor: colors.info }]} />
            </View>
          </TouchableOpacity>

          {/* Mood */}
          <TouchableOpacity style={[styles.todayCard, { backgroundColor: colors.bgCard, borderColor: colors.border }, shadowCard]} activeOpacity={0.8} onPress={() => router.push("/(tabs)/(personal)/mood" as any)}>
            <View style={[styles.todayIconRing, { borderColor: todayColor + "30", backgroundColor: todayColor + "15" }]}>
              <Text style={styles.todayEmojiLg}>{todayEmoji}</Text>
            </View>
            <Text style={[styles.todayValue, { color: todayColor, fontSize: sf(13) }]}>{todayLabel}</Text>
            <Text style={[styles.todayLabel, { color: colors.textMuted }]}>{t("home.mood_label")}</Text>
            <View style={[styles.todayTrack, { backgroundColor: colors.border }]}>
              <View style={[styles.todayFill, { width: `${(moodScore / 5) * 100}%`, backgroundColor: todayColor }]} />
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Quick Actions ── */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>{t("home.quick_access")}</Text>
        <ScrollView
          ref={step2.ref}
          onLayout={step2.measure}
          horizontal showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.quickList}
        >
          {QUICK_ACTIONS.map((a) => (
            <TouchableOpacity key={a.label} style={styles.quickItem} onPress={() => router.push(a.route as any)} activeOpacity={0.7}>
              <View style={[styles.quickIcon, { backgroundColor: a.color + "12", borderColor: a.color + "25" }]}>
                <Text style={styles.quickEmoji}>{a.emoji}</Text>
              </View>
              <Text style={[styles.quickLabel, { color: colors.textSecondary }]}>{a.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* ── This Week Stats ── */}
      <View style={styles.section}>
        <View style={styles.rowBetween}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>{t("home.this_week")}</Text>
          <TouchableOpacity onPress={() => router.push("/(tabs)/(personal)/fitness" as any)} style={styles.seeAllBtn}>
            <Text style={[styles.seeAll, { color: colors.primary }]}>{t("home.see_more")}</Text>
            <ChevronRight size={13} color={colors.primary} />
          </TouchableOpacity>
        </View>
        {loading ? <StatGridSkeleton /> : (
          <View style={styles.statsGrid}>
            <StatCard icon="🏋️" label={t("home.workouts_stat")} value={`${workoutsCompleted}/7`} unit={t("common.unit_days")} accentColor={colors.primary} bg={colors.primaryBg} textColor={colors.textPrimary} mutedColor={colors.textMuted} cardBg={colors.bgCard} border={colors.border} shadow={shadowCard} onPress={() => router.push("/(tabs)/(personal)/fitness" as any)} />
            <StatCard icon="🔥" label={t("home.calories_stat")} value={weekCalories >= 1000 ? `${(weekCalories / 1000).toFixed(1)}k` : String(weekCalories)} unit={t("common.unit_kcal")} accentColor={colors.orange} bg={colors.orangeBg} textColor={colors.textPrimary} mutedColor={colors.textMuted} cardBg={colors.bgCard} border={colors.border} shadow={shadowCard} onPress={() => router.push("/(tabs)/(personal)/fitness" as any)} />
            <StatCard icon="😊" label={t("home.mood_streak_stat")} value={String(moodStreak)} unit={t("common.unit_days")} accentColor={colors.warning} bg={colors.warningBg} textColor={colors.textPrimary} mutedColor={colors.textMuted} cardBg={colors.bgCard} border={colors.border} shadow={shadowCard} onPress={() => router.push("/(tabs)/(personal)/mood" as any)} />
            <StatCard icon="🏅" label={t("home.achievements_stat")} value={String(unlockedAchievements)} unit={t("profile.badges").toLowerCase()} accentColor={colors.purple} bg={colors.purpleBg} textColor={colors.textPrimary} mutedColor={colors.textMuted} cardBg={colors.bgCard} border={colors.border} shadow={shadowCard} onPress={() => router.push("/achievements" as any)} />
          </View>
        )}
      </View>

      {/* ── My Events shortcut ── */}
      <View style={styles.section}>
        <TouchableOpacity
          style={[styles.eventsShortcut, { backgroundColor: colors.bgCard, borderColor: colors.border }, shadowCard]}
          activeOpacity={0.8}
          onPress={() => router.push("/events" as any)}
        >
          <LinearGradient colors={Colors.gradientPrimary} style={styles.eventsShortcutIcon}>
            <CalendarDays size={18} color="white" />
          </LinearGradient>
          <View style={{ flex: 1 }}>
            <Text style={[styles.eventsShortcutTitle, { color: colors.textPrimary }]}>Sự kiện của tôi</Text>
            <Text style={[styles.eventsShortcutSub, { color: colors.textMuted }]}>Theo dõi tiến độ tham gia sự kiện</Text>
          </View>
          <ChevronRight size={18} color={colors.textMuted} />
        </TouchableOpacity>
      </View>

      {/* ── Workout goal progress ── */}
      {!loading && (
        <View style={styles.section}>
          <View style={[styles.progressCard, { backgroundColor: colors.bgCard, borderColor: colors.border }, shadowCard]}>
            <View style={styles.rowBetween}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 7 }}>
                <Activity size={15} color={colors.primary} />
                <Text style={[styles.progressTitle, { color: colors.textPrimary }]}>{t("home.workout_goal")}</Text>
              </View>
              <Text style={[styles.progressPct, { color: colors.primary }]}>{Math.round((workoutsCompleted / 7) * 100)}%</Text>
            </View>
            <ProgressBar value={(workoutsCompleted / 7) * 100} height={6} color={workoutsCompleted >= 7 ? colors.success : colors.primary} />
            <Text style={[styles.progressSub, { color: colors.textMuted }]}>{t("home.workout_progress", { done: workoutsCompleted })}</Text>
          </View>
        </View>
      )}

      {/* ── AI Health Coach ── */}
      <View
        ref={step3.ref}
        onLayout={step3.measure}
        style={styles.section}
      >
        <View style={styles.aiHeader}>
          <View style={[styles.aiTag, { backgroundColor: colors.purpleBg }]}>
            <Sparkles size={10} color={colors.purple} />
            <Text style={[styles.aiTagText, { color: colors.purple }]}>AI</Text>
          </View>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginBottom: 0 }]}>{t("home.ai_section")}</Text>
        </View>
        <View style={styles.aiGrid}>
          <AiCard icon="🤖" iconColor={colors.primary} iconBg={colors.primaryBg} label={t("home.ai_coach")} sub={t("home.ai_coach_sub")} cardBg={colors.bgCard} border={colors.border} textColor={colors.textPrimary} subColor={colors.textMuted} shadow={shadowCard} onPress={() => router.push("/ai/coach" as any)} />
          <AiCard icon="✨" iconColor={colors.purple} iconBg={colors.purpleBg} label={t("home.ai_insight")} sub={t("home.ai_insight_sub")} cardBg={colors.bgCard} border={colors.border} textColor={colors.textPrimary} subColor={colors.textMuted} shadow={shadowCard} onPress={() => router.push("/ai/daily-insight" as any)} />
          <AiCard icon="🍽️" iconColor={colors.success} iconBg={colors.successBg} label={t("home.ai_meal")} sub={t("home.ai_meal_sub")} cardBg={colors.bgCard} border={colors.border} textColor={colors.textPrimary} subColor={colors.textMuted} shadow={shadowCard} onPress={() => router.push("/ai/meal-analyzer" as any)} />
          <AiCard icon="📊" iconColor={colors.teal} iconBg={colors.tealBg} label={t("home.ai_report")} sub={t("home.ai_report_sub")} cardBg={colors.bgCard} border={colors.border} textColor={colors.textPrimary} subColor={colors.textMuted} shadow={shadowCard} onPress={() => router.push("/health-report" as any)} />
        </View>
      </View>

      {/* ── Suggestions ── */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>{t("home.today_suggestions")}</Text>
        <View
          ref={step4.ref}
          onLayout={step4.measure}
          style={[styles.suggestCard, { backgroundColor: colors.bgCard, borderColor: colors.border }, shadowCard]}
        >
          {todaySteps < stepGoal && (
            <SuggRow icon={<Footprints size={14} color={colors.primary} />} iconBg={colors.primaryBg} text={t("home.steps_goal_tip", { steps: (stepGoal - todaySteps).toLocaleString() })} textColor={colors.textSecondary} border={colors.border} onPress={() => router.push("/(tabs)/(personal)/steps" as any)} />
          )}
          {todayWater < 2000 && (
            <SuggRow icon={<Droplets size={14} color={colors.info} />} iconBg={colors.infoBg} text={t("home.water_tip", { ml: 2000 - todayWater })} textColor={colors.textSecondary} border={colors.border} onPress={() => router.push("/(tabs)/(personal)/water-intake" as any)} />
          )}
          <SuggRow icon={<Flame size={14} color={colors.warning} />} iconBg={colors.warningBg} text={moodStreak > 0 ? t("home.mood_streak_tip", { days: moodStreak }) : t("home.mood_start_tip")} textColor={colors.textSecondary} border={colors.border} onPress={() => router.push("/(tabs)/(personal)/mood" as any)} />
          <SuggRow icon={<Map size={14} color={colors.success} />} iconBg={colors.successBg} text={activeJourney ? (activeJourney.todayCheckin?.completed ? t("home.journey_done", { title: activeJourney.meta.title }) : t("home.journey_todo", { title: activeJourney.meta.title })) : t("home.journey_create")} textColor={colors.textSecondary} border={colors.border} onPress={() => router.push("/health-journey" as any)} />
          <SuggRow icon={<Dumbbell size={14} color={colors.purple} />} iconBg={colors.purpleBg} text={workoutsCompleted > 0 ? t("home.workout_done_tip", { count: workoutsCompleted }) : t("home.workout_start_tip")} textColor={colors.textSecondary} border={colors.border} isLast onPress={() => router.push("/(tabs)/(personal)/fitness" as any)} />
        </View>
      </View>

      {/* ── Journey & Weekly ── */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>{t("home.journey_plans")}</Text>
        <View style={styles.journeyRow}>
          <TouchableOpacity style={{ flex: 1 }} activeOpacity={0.8} onPress={() => router.push("/health-journey" as any)}>
            <View style={[styles.journeyCard, { backgroundColor: colors.bgCard, borderColor: colors.border }, shadowCard]}>
              <View style={[styles.journeyIcon, { backgroundColor: colors.successBg }]}>
                <Text style={{ fontSize: sf(18) }}>🗺️</Text>
              </View>
              <Text style={[styles.journeyTitle, { color: colors.textPrimary }]}>{t("home.journey_label")}</Text>
              <Text style={[styles.journeySub, { color: colors.textMuted }]}>
                {activeJourney ? t("home.journey_progress", { percent: activeJourney.progressPercent }) : t("home.journey_sub")}
              </Text>
              {activeJourney && (
                <View style={[styles.journeyBar, { backgroundColor: colors.border }]}>
                  <View style={[styles.journeyBarFill, { width: `${activeJourney.progressPercent}%`, backgroundColor: colors.success }]} />
                </View>
              )}
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={{ flex: 1 }} activeOpacity={0.8} onPress={() => router.push("/weekly-summary" as any)}>
            <View style={[styles.journeyCard, { backgroundColor: colors.bgCard, borderColor: colors.border }, shadowCard]}>
              <View style={[styles.journeyIcon, { backgroundColor: colors.purpleBg }]}>
                <Text style={{ fontSize: sf(18) }}>📅</Text>
              </View>
              <Text style={[styles.journeyTitle, { color: colors.textPrimary }]}>{t("home.weekly_summary")}</Text>
              <Text style={[styles.journeySub, { color: colors.textMuted }]}>{t("home.weekly_summary_sub")}</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Active Challenges ── */}
      <View style={styles.section}>
        <View style={styles.rowBetween}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>{t("home.challenges_section")}</Text>
          <TouchableOpacity onPress={() => router.push("/challenges" as any)} style={styles.seeAllBtn}>
            <Text style={[styles.seeAll, { color: colors.primary }]}>{t("home.see_all")}</Text>
            <ChevronRight size={13} color={colors.primary} />
          </TouchableOpacity>
        </View>
        {loading ? <CardSkeleton /> : activeChallenges.length > 0 ? (
          activeChallenges.slice(0, 2).map((c) => <ChallengeMiniCard key={c.id} challenge={c} />)
        ) : (
          <EmptyState emoji="🚀" title={t("home.no_challenges")} subtitle={t("home.no_challenges_sub")} actionLabel={t("home.explore_challenges")} onAction={() => router.push("/challenges" as any)} />
        )}
      </View>

      {/* ── Leaderboard ── */}
      <View style={styles.section}>
        <TouchableOpacity onPress={() => router.push("/leaderboard" as any)} activeOpacity={0.85}>
          <LinearGradient
            colors={isDark ? ["#1C2B4A", "#141E30"] : ["#EBF3FF", "#F0F7FF"]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={[styles.bannerCard, { borderColor: colors.primary + "20" }]}
          >
            <View style={[styles.bannerIcon, { backgroundColor: colors.warningBg }]}>
              <Trophy size={18} color={colors.warning} />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={[styles.bannerTitle, { color: colors.textPrimary }]}>{t("home.leaderboard_title")}</Text>
              <Text style={[styles.bannerSub, { color: colors.textSecondary }]}>{t("home.leaderboard_sub")}</Text>
            </View>
            <ChevronRight size={16} color={colors.textMuted} />
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* ── Community ── */}
      <View style={[styles.section, { marginBottom: 0 }]}>
        <TouchableOpacity onPress={() => router.push("/(tabs)/(community)/feed" as any)} activeOpacity={0.85}>
          <LinearGradient
            colors={isDark ? ["#0D2218", "#141E30"] : ["#ECFDF5", "#F0FFF8"]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={[styles.bannerCard, { borderColor: colors.success + "25" }]}
          >
            <View style={[styles.bannerIcon, { backgroundColor: colors.successBg }]}>
              <Users size={18} color={colors.success} />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={[styles.bannerTitle, { color: colors.textPrimary }]}>Cộng đồng của bạn</Text>
              <Text style={[styles.bannerSub, { color: colors.textSecondary }]}>
                {friendCount > 0 ? `${friendCount} bạn bè · Xem bảng tin` : "Kết nối · Chia sẻ hành trình"}
              </Text>
            </View>
            <ChevronRight size={16} color={colors.textMuted} />
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <View style={{ height: 120 }} />
    </ScrollView>
  );
}

// ── Sub-components ───────────────────────────────────────────────────────────

function StatCard({ icon, label, value, unit, accentColor, bg, textColor, mutedColor, cardBg, border, shadow, onPress }: {
  icon: string; label: string; value: string; unit: string;
  accentColor: string; bg: string; textColor: string; mutedColor: string;
  cardBg: string; border: string; shadow: any; onPress?: () => void;
}) {
  return (
    <TouchableOpacity style={styles.statCardWrap} onPress={onPress} activeOpacity={0.8}>
      <View style={[styles.statCard, { backgroundColor: cardBg, borderColor: border }, shadow]}>
        <View style={[styles.statIconWrap, { backgroundColor: bg }]}>
          <Text style={{ fontSize: sf(18) }}>{icon}</Text>
        </View>
        <Text style={[styles.statValue, { color: textColor }]}>{value}</Text>
        <Text style={[styles.statUnit, { color: accentColor }]}>{unit}</Text>
        <Text style={[styles.statLabel, { color: mutedColor }]}>{label}</Text>
      </View>
    </TouchableOpacity>
  );
}

function SuggRow({ icon, iconBg, text, textColor, border, isLast, onPress }: {
  icon: React.ReactNode; iconBg: string; text: string; textColor: string; border: string; isLast?: boolean; onPress: () => void;
}) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={[styles.suggRow, { borderBottomColor: border }, isLast && { borderBottomWidth: 0 }]}>
      <View style={[styles.suggIcon, { backgroundColor: iconBg }]}>{icon}</View>
      <Text style={[styles.suggText, { color: textColor }]} numberOfLines={2}>{text}</Text>
      <ChevronRight size={13} color={border} />
    </TouchableOpacity>
  );
}

function AiCard({ icon, iconColor, iconBg, label, sub, cardBg, border, textColor, subColor, shadow, onPress }: {
  icon: string; iconColor: string; iconBg: string; label: string; sub: string;
  cardBg: string; border: string; textColor: string; subColor: string; shadow: any; onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.aiCardWrap} onPress={onPress} activeOpacity={0.8}>
      <View style={[styles.aiCard, { backgroundColor: cardBg, borderColor: border }, shadow]}>
        <View style={[styles.aiIconBox, { backgroundColor: iconBg }]}>
          <Text style={{ fontSize: sf(20) }}>{icon}</Text>
        </View>
        <Text style={[styles.aiLabel, { color: textColor }]}>{label}</Text>
        <Text style={[styles.aiSub, { color: subColor }]} numberOfLines={2}>{sub}</Text>
      </View>
    </TouchableOpacity>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingBottom: 20 },

  // Header
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingTop: sw(54), paddingBottom: sw(14), paddingHorizontal: Spacing.base,
    borderBottomWidth: 1,
  },
  greeting: { fontSize: sf(12), fontWeight: "500", marginBottom: 1 },
  userName: { fontSize: sf(22), fontWeight: "800", letterSpacing: -0.3 },
  notifBtn: {
    width: sw(40), height: sw(40), borderRadius: Radius.lg,
    alignItems: "center", justifyContent: "center",
  },
  badge: {
    position: "absolute", top: sw(7), right: sw(7), width: sw(14), height: sw(14),
    borderRadius: sw(7), justifyContent: "center", alignItems: "center",
  },
  badgeText: { color: "white", fontSize: sf(7), fontWeight: "bold" },

  // Sections
  section: { paddingHorizontal: Spacing.base, marginTop: Spacing.lg },
  sectionTitle: { fontSize: sf(15), fontWeight: "700", marginBottom: Spacing.sm },
  rowBetween: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: Spacing.sm },
  seeAllBtn: { flexDirection: "row", alignItems: "center", gap: 2 },
  seeAll: { fontSize: sf(12), fontWeight: "600" },

  // XP Card
  xpCard: { borderRadius: Radius.xl, padding: Spacing.base, borderWidth: 1, gap: Spacing.sm },
  xpRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  xpLeft: { gap: 3 },
  xpBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: sw(8), paddingVertical: sw(3), borderRadius: Radius.full, alignSelf: "flex-start" },
  xpLevel: { fontSize: sf(11), fontWeight: "800" },
  xpName: { fontSize: sf(11) },
  xpPoints: { fontSize: sf(22), fontWeight: "800" },
  xpUnit: { fontSize: sf(13), fontWeight: "500" },
  xpTrack: { height: sw(5), borderRadius: Radius.full, overflow: "hidden" },
  xpFill: { height: "100%", borderRadius: Radius.full },
  xpSub: { fontSize: sf(11) },

  // Today Stats
  todayRow: { flexDirection: "row", gap: sw(10) },
  todayCard: {
    flex: 1, borderRadius: Radius.xl, borderWidth: 1,
    padding: sw(12), alignItems: "center", gap: sw(5),
  },
  todayIconRing: {
    width: sw(46), height: sw(46), borderRadius: sw(23),
    alignItems: "center", justifyContent: "center", marginBottom: sw(2),
  },
  todayEmoji: { fontSize: sf(20) },
  todayEmojiLg: { fontSize: sf(22) },
  todayValue: { fontSize: sf(15), fontWeight: "800", letterSpacing: -0.3 },
  todayUnit: { fontSize: sf(10), fontWeight: "500" },
  todayLabel: { fontSize: sf(10), fontWeight: "500" },
  todayTrack: { width: "100%", height: sw(3), borderRadius: Radius.full, overflow: "hidden", marginTop: sw(2) },
  todayFill: { height: "100%", borderRadius: Radius.full },

  // Quick Actions
  quickList: { paddingRight: Spacing.base, gap: sw(10) },
  quickItem: { alignItems: "center", gap: sw(5) },
  quickIcon: { width: sw(52), height: sw(52), borderRadius: Radius.lg, alignItems: "center", justifyContent: "center", borderWidth: 1 },
  quickEmoji: { fontSize: sf(22) },
  quickLabel: { fontSize: sf(10), fontWeight: "500", textAlign: "center", maxWidth: sw(56) },

  // Stats Grid
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: sw(10) },
  statCardWrap: { width: (SCREEN_W - Spacing.base * 2 - sw(10)) / 2 },
  statCard: { borderRadius: Radius.xl, padding: Spacing.base, borderWidth: 1, gap: 2 },
  statIconWrap: { width: sw(36), height: sw(36), borderRadius: sw(10), alignItems: "center", justifyContent: "center", marginBottom: sw(6) },
  statValue: { fontSize: sf(26), fontWeight: "900", letterSpacing: -0.5 },
  statUnit: { fontSize: sf(10), fontWeight: "600" },
  statLabel: { fontSize: sf(10), fontWeight: "500", marginTop: 1 },

  // Progress
  progressCard: { borderRadius: Radius.xl, padding: Spacing.base, borderWidth: 1, gap: Spacing.sm },
  progressTitle: { fontSize: sf(13), fontWeight: "600" },
  progressPct: { fontSize: sf(14), fontWeight: "800" },
  progressSub: { fontSize: sf(11) },

  // Events shortcut
  eventsShortcut: {
    flexDirection: "row", alignItems: "center", gap: Spacing.md,
    borderRadius: Radius.xl, borderWidth: 1, padding: Spacing.md,
  },
  eventsShortcutIcon: {
    width: sw(44), height: sw(44), borderRadius: Radius.lg,
    alignItems: "center", justifyContent: "center",
  },
  eventsShortcutTitle: { fontSize: sf(14), fontWeight: "700" },
  eventsShortcutSub: { fontSize: sf(12), marginTop: 2 },

  // AI
  aiHeader: { flexDirection: "row", alignItems: "center", gap: 7, marginBottom: Spacing.sm },
  aiTag: { flexDirection: "row", alignItems: "center", gap: 3, paddingHorizontal: 7, paddingVertical: 3, borderRadius: Radius.full },
  aiTagText: { fontSize: sf(10), fontWeight: "700" },
  aiGrid: { flexDirection: "row", flexWrap: "wrap", gap: sw(10) },
  aiCardWrap: { width: (SCREEN_W - Spacing.base * 2 - sw(10)) / 2 },
  aiCard: { borderRadius: Radius.xl, padding: Spacing.base, borderWidth: 1, gap: sw(6) },
  aiIconBox: { width: sw(40), height: sw(40), borderRadius: sw(12), alignItems: "center", justifyContent: "center" },
  aiLabel: { fontSize: sf(13), fontWeight: "700" },
  aiSub: { fontSize: sf(11), lineHeight: 16 },

  // Suggestions
  suggestCard: { borderRadius: Radius.xl, borderWidth: 1, overflow: "hidden" },
  suggRow: { flexDirection: "row", alignItems: "center", gap: Spacing.sm, paddingHorizontal: Spacing.base, paddingVertical: sw(12), borderBottomWidth: 1 },
  suggIcon: { width: 30, height: 30, borderRadius: Radius.full, alignItems: "center", justifyContent: "center" },
  suggText: { flex: 1, fontSize: sf(13), lineHeight: 18 },

  // Journey
  journeyRow: { flexDirection: "row", gap: sw(10) },
  journeyCard: { borderRadius: Radius.xl, padding: Spacing.base, borderWidth: 1, gap: sw(5) },
  journeyIcon: { width: sw(38), height: sw(38), borderRadius: Radius.md, alignItems: "center", justifyContent: "center", marginBottom: 2 },
  journeyTitle: { fontSize: sf(13), fontWeight: "700" },
  journeySub: { fontSize: sf(11), lineHeight: 15 },
  journeyBar: { height: 3, borderRadius: Radius.full, marginTop: 4, overflow: "hidden" },
  journeyBarFill: { height: "100%", borderRadius: Radius.full },

  // Banners
  bannerCard: { borderRadius: Radius.xl, padding: Spacing.base, flexDirection: "row", alignItems: "center", borderWidth: 1 },
  bannerIcon: { width: sw(40), height: sw(40), borderRadius: Radius.md, alignItems: "center", justifyContent: "center" },
  bannerTitle: { fontWeight: "700", fontSize: sf(14) },
  bannerSub: { fontSize: sf(11), marginTop: 2 },
});
