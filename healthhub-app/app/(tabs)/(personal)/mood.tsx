import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet,
  ActivityIndicator, Alert,
} from "react-native";
import { TrendingUp, Flame, ChevronRight, Dumbbell } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter, useFocusEffect } from "expo-router";
import { useTranslation } from "react-i18next";
import { useScreenTour, useScreenTourStep } from "@/src/context/ScreenTourContext";

import moodApi from "@/src/api/moodApi";
import fitnessApi from "@/src/api/fitnessApi";
import { communityApi } from "@/src/api/communityApi";
import { getRandomMoodMessage } from "@/src/utils/moodMessages";
import { useColors, Colors, Shadow, Radius, Spacing, Typography, sw, sf } from "@/src/theme";
import { useTheme } from "@/src/context/ThemeContext";
import { CardSkeleton } from "@/components/ui/SkeletonLoader";
import EmptyState from "@/components/ui/EmptyState";

const MOOD_CONFIGS = [
  { emoji: "😔", labelKey: "mood.label_sad",     value: 1, color: "#64748B", bg: "rgba(100,116,139,0.12)" },
  { emoji: "😐", labelKey: "mood.label_neutral",  value: 2, color: "#78909C", bg: "rgba(120,144,156,0.12)" },
  { emoji: "🙂", labelKey: "mood.label_ok",       value: 3, color: "#D97706", bg: "rgba(217,119,6,0.12)"  },
  { emoji: "😊", labelKey: "mood.label_happy",    value: 4, color: "#10B981", bg: "rgba(16,185,129,0.12)" },
  { emoji: "😄", labelKey: "mood.label_great",    value: 5, color: "#3B82F6", bg: "rgba(59,130,246,0.12)" },
];

export default function MoodTrackerScreen() {
  const router = useRouter();
  const colors = useColors();
  const { isDark } = useTheme();
  const { t } = useTranslation();
  const { startScreenTour } = useScreenTour();
  const tourStartedRef = useRef(false);
  const step0 = useScreenTourStep(0); // Mood selector card
  const step1 = useScreenTourStep(1); // Insights stats
  const step2 = useScreenTourStep(2); // Suggested workouts

  const MOODS = MOOD_CONFIGS.map((m) => ({ ...m, label: t(m.labelKey) }));
  const [selectedValue, setSelectedValue] = useState(3);
  const [hasTodayEntry, setHasTodayEntry] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [insights, setInsights] = useState<{ averageMood: number | null; bestDay: string | null; bestDayScore: number | null; streak: number | null }>({ averageMood: null, bestDay: null, bestDayScore: null, streak: null });
  const [weekTrend, setWeekTrend] = useState<{ labels: string[]; values: number[] } | null>(null);
  const [todayDateText, setTodayDateText] = useState("Hôm nay");
  const [suggestedWorkouts, setSuggestedWorkouts] = useState<any[]>([]);
  const [loadingWorkout, setLoadingWorkout] = useState(false);
  const [moodMessage, setMoodMessage] = useState("");

  useFocusEffect(useCallback(() => { loadDashboard(); }, []));

  useEffect(() => {
    if (!loading && !tourStartedRef.current) {
      tourStartedRef.current = true;
      startScreenTour('mood', [
        {
          id: 'selector',
          placement: 'bottom',
          icon: '😊',
          title: 'Chọn tâm trạng hôm nay',
          body: 'Nhấn vào một trong 5 emoji để chọn tâm trạng. Sau đó nhấn "Lưu tâm trạng" — dữ liệu này được AI phân tích để gợi ý bài tập phù hợp.',
        },
        {
          id: 'insights',
          placement: 'bottom',
          icon: '📈',
          title: 'Thống kê tâm trạng',
          body: 'Tổng hợp 7 ngày qua: tâm trạng trung bình, ngày tốt nhất và streak ghi mood liên tiếp. Duy trì streak mỗi ngày để nhận thành tích!',
        },
        {
          id: 'workouts',
          placement: 'top',
          icon: '🏃',
          title: 'Bài tập gợi ý theo mood',
          body: 'AI chọn bài tập phù hợp với tâm trạng hiện tại của bạn. Nhấn vào để bắt đầu ngay!',
        },
      ]);
    }
  }, [loading]);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const res = await moodApi.getDashboard();
      const data = res.data;
      const score = data.today?.mood?.score ?? 3;
      setSelectedValue(score);
      setHasTodayEntry(data.today?.hasEntry ?? false);
      setMoodMessage(getRandomMoodMessage(score));
      if (data.today?.date) {
        const d = new Date(data.today.date);
        setTodayDateText(d.toLocaleDateString("vi-VN", { weekday: "long", month: "short", day: "numeric" }));
      }
      setInsights({ averageMood: data.insights?.averageMood ?? null, bestDay: data.insights?.bestDay ?? null, bestDayScore: data.insights?.bestDayScore ?? null, streak: data.insights?.streak ?? null });
      if (data.weekTrend) setWeekTrend(data.weekTrend);
      await loadMoodWorkouts(score);
    } catch {
      Alert.alert("Lỗi", "Không thể tải dữ liệu tâm trạng");
    } finally {
      setLoading(false);
    }
  };

  const loadMoodWorkouts = async (score: number) => {
    try {
      setLoadingWorkout(true);
      const res = await fitnessApi.getMoodWorkouts(score);
      setSuggestedWorkouts((res.data ?? []).slice(0, 3));
    } catch { setSuggestedWorkouts([]); } finally { setLoadingWorkout(false); }
  };

  const handleSelectMood = (value: number) => {
    setSelectedValue(value);
    setMoodMessage(getRandomMoodMessage(value));
  };

  const handleSaveMood = async () => {
    try {
      setSaving(true);
      const mood = MOODS.find((m) => m.value === selectedValue)!;
      await moodApi.saveMood({ date: new Date().toISOString(), mood: { emoji: mood.emoji, color: mood.color, score: selectedValue } });
      setHasTodayEntry(true);
      await loadDashboard();

      const moodTexts: Record<number, string> = {
        1: "Hôm nay mình không được vui lắm 😔 Nhưng ngày mai sẽ tốt hơn!",
        2: "Tâm trạng hôm nay bình thường 😐 Cố lên nào!",
        3: "Hôm nay cảm giác ổn 🙂 Tiếp tục duy trì nhé!",
        4: "Hôm nay mình đang rất vui 😊 Năng lượng tích cực!",
        5: "Hôm nay mình tuyệt vời 😄 Cảm giác đỉnh của chóp!",
      };

      Alert.alert(
        "Đã lưu 💙",
        hasTodayEntry ? "Tâm trạng đã được cập nhật." : "Tâm trạng hôm nay đã được ghi lại.",
        [
          { text: "Đóng", style: "cancel" },
          {
            text: "Chia sẻ lên cộng đồng",
            onPress: async () => {
              try {
                await communityApi.createPost({
                  content: `${mood.emoji} Tâm trạng hôm nay: ${mood.label}\n${moodTexts[selectedValue] ?? ""}\n#HealthHub #Mood #WellBeing`,
                });
                Alert.alert("Đã chia sẻ!", "Tâm trạng của bạn đã được đăng lên cộng đồng.");
              } catch {
                Alert.alert("Lỗi", "Không thể chia sẻ. Thử lại sau.");
              }
            },
          },
        ]
      );
    } catch {
      Alert.alert("Lỗi", "Không thể lưu tâm trạng. Vui lòng thử lại.");
    } finally { setSaving(false); }
  };

  const selectedMood = MOODS.find((m) => m.value === selectedValue) ?? MOODS[2];

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.bgSecondary }]} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={[styles.hero, { backgroundColor: colors.bgPrimary, borderBottomColor: colors.border }]}>
        <View style={styles.heroRow}>
          <View>
            <Text style={[styles.heroTitle, { color: colors.textPrimary }]}>{t("mood.title")}</Text>
            <Text style={[styles.heroSub, { color: colors.textMuted }]}>{todayDateText}</Text>
          </View>
          {(insights.streak ?? 0) > 0 && (
            <View style={[styles.streakBadge, { backgroundColor: colors.orangeBg }]}>
              <Flame size={14} color={colors.orange} />
              <Text style={[styles.streakText, { color: colors.orange }]}>{insights.streak} {t("mood.streak_days")}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Mood Selector */}
      <View style={styles.section}>
        {loading ? <CardSkeleton /> : (
          <View
            ref={step0.ref}
            onLayout={step0.measure}
            style={[styles.moodCard, { backgroundColor: colors.bgCard, borderColor: colors.border }, isDark ? {} : Shadow.sm]}
          >
            <View style={styles.rowBetween}>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>{t("mood.how_feeling")}</Text>
              {hasTodayEntry && (
                <View style={styles.savedBadge}>
                  <Text style={styles.savedText}>{t("mood.saved")}</Text>
                </View>
              )}
            </View>

            {/* Big emoji */}
            <View style={styles.bigEmojiWrap}>
              <View style={[styles.bigEmojiCircle, { backgroundColor: selectedMood.bg }]}>
                <Text style={styles.bigEmoji}>{selectedMood.emoji}</Text>
              </View>
              <Text style={[styles.bigLabel, { color: selectedMood.color }]}>{selectedMood.label}</Text>
            </View>

            {/* Mood buttons */}
            <View style={styles.moodRow}>
              {MOODS.map((m) => (
                <TouchableOpacity
                  key={m.value}
                  onPress={() => handleSelectMood(m.value)}
                  style={[styles.moodBtn, selectedValue === m.value ? { backgroundColor: m.bg, borderColor: m.color } : [styles.moodInactive, { backgroundColor: colors.bgGlass, borderColor: colors.border }]]}
                  activeOpacity={0.75}
                >
                  <Text style={styles.moodEmoji}>{m.emoji}</Text>
                  <Text style={[styles.moodLabel, { color: colors.textMuted }, selectedValue === m.value && { color: m.color }]}>{m.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity onPress={handleSaveMood} disabled={saving} activeOpacity={0.85} style={{ borderRadius: Radius.xl, overflow: "hidden" }}>
              <LinearGradient colors={Colors.gradientPrimary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[styles.saveBtn, saving && { opacity: 0.6 }]}>
                {saving ? <ActivityIndicator color="white" size="small" /> : <Text style={styles.saveBtnText}>{hasTodayEntry ? t("mood.update_button") : t("mood.save_button")}</Text>}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Mood message */}
      {!!moodMessage && (
        <View style={styles.section}>
          <View style={[styles.messageCard, { borderLeftColor: selectedMood.color, backgroundColor: colors.bgCard, borderColor: colors.border }]}>
            <Text style={[styles.messageText, { color: colors.textSecondary }]}>{moodMessage}</Text>
          </View>
        </View>
      )}

      {/* Insights */}
      <View style={styles.section}>
        <View
          ref={step1.ref}
          onLayout={step1.measure}
          style={styles.insightsRow}
        >
          {[
            { icon: <TrendingUp size={16} color={colors.primary} />, bg: colors.primaryBg, val: insights.averageMood != null ? insights.averageMood.toFixed(1) : "--", label: t("mood.average"), unit: "/ 5" },
            { icon: <Text style={{ fontSize: 16 }}>🌟</Text>, bg: colors.warningBg, val: insights.bestDay ?? "--", label: t("mood.best_day"), unit: insights.bestDayScore ? MOODS[insights.bestDayScore - 1]?.emoji : "" },
            { icon: <Flame size={16} color={colors.orange} />, bg: colors.orangeBg, val: insights.streak != null ? insights.streak : "--", label: t("mood.streak"), unit: t("mood.streak_days") },
          ].map((s, i) => (
            <View key={i} style={[styles.insightCard, { backgroundColor: colors.bgCard, borderColor: colors.border }, isDark ? {} : Shadow.xs]}>
              <View style={[styles.insightIcon, { backgroundColor: s.bg }]}>{s.icon}</View>
              <Text style={[styles.insightVal, { color: colors.textPrimary }]}>{s.val}</Text>
              <Text style={[styles.insightLabel, { color: colors.textMuted }]}>{s.label}</Text>
              <Text style={[styles.insightUnit, { color: colors.textMuted }]}>{s.unit}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Weekly trend */}
      {weekTrend && (
        <View style={styles.section}>
          <View style={[styles.trendCard, { borderColor: colors.border, backgroundColor: colors.bgCard }, isDark ? {} : Shadow.sm]}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 7, marginBottom: Spacing.md }}>
              <TrendingUp size={15} color={colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>{t("mood.week_trend")}</Text>
            </View>
            <View style={styles.chartContainer}>
              {weekTrend.labels.map((label, i) => {
                const val = weekTrend.values[i] ?? 3;
                const mood = MOODS[val - 1] ?? MOODS[2];
                const isToday = i === new Date().getDay() - 1;
                return (
                  <View key={i} style={styles.chartBar}>
                    <Text style={styles.chartEmoji}>{mood.emoji}</Text>
                    <View style={[styles.barTrack, { backgroundColor: colors.border }]}>
                      <View style={[styles.barFill, { height: `${(val / 5) * 100}%` as any, backgroundColor: isToday ? mood.color : colors.borderLight }]} />
                    </View>
                    <Text style={[styles.barLabel, { color: colors.textMuted }, isToday && { color: colors.textPrimary }]}>{label}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        </View>
      )}

      {/* Workout suggestions */}
      <View
        ref={step2.ref}
        onLayout={step2.measure}
        style={styles.section}
      >
        <View style={styles.rowBetween}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>{t("mood.suggestions")}</Text>
          <Text style={[styles.subHint, { color: colors.textMuted }]}>dựa trên tâm trạng</Text>
        </View>
        {loadingWorkout ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 12 }} />
        ) : suggestedWorkouts.length === 0 ? (
          <EmptyState emoji="🏃" title={t("mood.no_suggestions")} subtitle={t("mood.no_exercises")} />
        ) : (
          suggestedWorkouts.map((w, i) => (
            <TouchableOpacity key={w.id ?? i} style={[styles.workoutRow, { backgroundColor: colors.bgCard, borderColor: colors.border }, i !== suggestedWorkouts.length - 1 && { marginBottom: Spacing.sm }, isDark ? {} : Shadow.xs]} onPress={() => router.push(`/workout/${w.id}` as any)} activeOpacity={0.8}>
              <View style={[styles.workoutIconBox, { backgroundColor: colors.primaryBg }]}>
                <Dumbbell size={16} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.workoutTitle, { color: colors.textPrimary }]}>{w.title}</Text>
                <Text style={[styles.workoutMeta, { color: colors.textMuted }]}>{w.muscleGroup ?? w.focusType} · {w.level}</Text>
              </View>
              <ChevronRight size={15} color={colors.textMuted} />
            </TouchableOpacity>
          ))
        )}
      </View>

      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {},
  hero: { paddingTop: sw(54), paddingHorizontal: Spacing.base, paddingBottom: Spacing.base, borderBottomWidth: 1 },
  heroRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  heroTitle: { fontSize: sf(26), fontWeight: "800", letterSpacing: -0.4 },
  heroSub: { fontSize: sf(12), marginTop: 3 },
  streakBadge: { flexDirection: "row", alignItems: "center", gap: 5, borderRadius: Radius.full, paddingHorizontal: 12, paddingVertical: 6 },
  streakText: { fontWeight: "700", fontSize: sf(13) },

  section: { paddingHorizontal: Spacing.base, marginTop: Spacing.lg },
  rowBetween: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: Spacing.md },
  sectionTitle: { fontSize: 15, fontWeight: "700" },

  moodCard: { borderRadius: Radius.xxl, padding: Spacing.base, borderWidth: 1 },
  savedBadge: { backgroundColor: "#D1FAE5", borderRadius: Radius.sm, paddingHorizontal: 8, paddingVertical: 3 },
  savedText: { color: "#34D399", fontSize: 11, fontWeight: "600" },
  bigEmojiWrap: { alignItems: "center", paddingVertical: Spacing.xl, gap: Spacing.sm },
  bigEmojiCircle: { width: 108, height: 108, borderRadius: 54, justifyContent: "center", alignItems: "center" },
  bigEmoji: { fontSize: 60 },
  bigLabel: { fontSize: 20, fontWeight: "800" },
  moodRow: { flexDirection: "row", justifyContent: "space-between", gap: 5, marginBottom: Spacing.base },
  moodBtn: { flex: 1, alignItems: "center", paddingVertical: Spacing.sm, borderRadius: Radius.lg, borderWidth: 1.5 },
  moodInactive: {},
  moodEmoji: { fontSize: 22 },
  moodLabel: { fontSize: 9, marginTop: 4, textAlign: "center" },
  saveBtn: { paddingVertical: 14, alignItems: "center", borderRadius: Radius.xl },
  saveBtnText: { color: "white", fontWeight: "700", fontSize: 15 },

  messageCard: { borderRadius: Radius.xl, padding: Spacing.md, borderWidth: 1, borderLeftWidth: 3 },
  messageText: { fontSize: 14, lineHeight: 22 },

  insightsRow: { flexDirection: "row", gap: Spacing.sm },
  insightCard: { flex: 1, borderRadius: Radius.xl, padding: Spacing.md, borderWidth: 1, alignItems: "center", gap: 3 },
  insightIcon: { width: 34, height: 34, borderRadius: 10, justifyContent: "center", alignItems: "center", marginBottom: 3 },
  insightVal: { fontSize: 22, fontWeight: "700" },
  insightLabel: { fontSize: 10 },
  insightUnit: { fontSize: 10 },

  trendCard: { borderRadius: Radius.xl, padding: Spacing.base, borderWidth: 1 },
  chartContainer: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", height: 100 },
  chartBar: { flex: 1, alignItems: "center", gap: 4 },
  chartEmoji: { fontSize: 13 },
  barTrack: { flex: 1, width: "60%", borderRadius: 4, justifyContent: "flex-end", overflow: "hidden" },
  barFill: { width: "100%", borderRadius: 4, minHeight: 4 },
  barLabel: { fontSize: 10 },

  subHint: { fontSize: 11 },
  workoutRow: { flexDirection: "row", alignItems: "center", gap: Spacing.md, padding: Spacing.md, borderRadius: Radius.xl, borderWidth: 1 },
  workoutIconBox: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  workoutTitle: { fontWeight: "600", fontSize: 14 },
  workoutMeta: { fontSize: 12, marginTop: 2 },
});
