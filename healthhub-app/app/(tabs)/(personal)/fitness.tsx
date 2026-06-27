import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
} from "react-native";
import {
  Play, Clock, Flame, TrendingUp, ChevronRight,
  Dumbbell, Zap, BarChart2, Target,
} from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { useScreenTour, useScreenTourStep } from "@/src/context/ScreenTourContext";

import fitnessApi from "@/src/api/fitnessApi";
import { useColors, Colors, Shadow, Radius, Spacing, Typography, sw, sf } from "@/src/theme";
import { useTheme } from "@/src/context/ThemeContext";
import { CardSkeleton } from "@/components/ui/SkeletonLoader";
import EmptyState from "@/components/ui/EmptyState";
import ProgressBar from "@/components/ui/ProgressBar";
import { simpleCache } from "@/src/utils/simpleCache";

export default function FitnessScreen() {
  const router = useRouter();
  const colors = useColors();
  const { isDark } = useTheme();
  const { t } = useTranslation();
  const { startScreenTour } = useScreenTour();
  const tourStartedRef = useRef(false);
  const step0 = useScreenTourStep(0); // Quick start button
  const step1 = useScreenTourStep(1); // Weekly stats card
  const step2 = useScreenTourStep(2); // Exercises list

  const [week, setWeek] = useState<any>(null);
  const [plans, setPlans] = useState<any[]>([]);
  const [monthly, setMonthly] = useState<any>(null);
  const [workouts, setWorkouts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { loadAll(); }, []);

  useEffect(() => {
    if (!loading && !tourStartedRef.current) {
      tourStartedRef.current = true;
      startScreenTour('fitness', [
        {
          id: 'start',
          placement: 'bottom',
          icon: '⚡',
          title: 'Bắt đầu tập ngay',
          body: 'Nhấn nút này để mở danh sách bài tập. Chọn bài → xem hướng dẫn → nhấn "Bắt đầu" để vào chế độ tập luyện có đồng hồ đếm giờ.',
        },
        {
          id: 'week',
          placement: 'bottom',
          icon: '📅',
          title: 'Thống kê tuần này',
          body: 'Các chấm tròn màu = ngày đã tập. Kéo xuống để refresh. Bạn cần tập ít nhất 4 ngày/tuần để duy trì thói quen tốt.',
        },
        {
          id: 'exercises',
          placement: 'top',
          icon: '🏋️',
          title: 'Danh sách bài tập',
          body: 'Nhấn vào bài tập để xem chi tiết: nhóm cơ, calo đốt, video hướng dẫn. Nhấn "Bắt đầu" trong trang chi tiết để ghi nhật ký.',
        },
      ]);
    }
  }, [loading]);

  const loadAll = async (forceRefresh = false) => {
    try {
      setLoading(true);

      // Plans + workouts: static-ish data, cache 5 phút
      const cachedPlans = !forceRefresh && simpleCache.get<any[]>("fitness:plans");
      const cachedWorkouts = !forceRefresh && simpleCache.get<any[]>("fitness:workouts");
      // Week + monthly: thay đổi sau mỗi buổi tập, cache 2 phút
      const cachedWeek = !forceRefresh && simpleCache.get<any>("fitness:week");
      const cachedMonthly = !forceRefresh && simpleCache.get<any>("fitness:monthly");

      const needPlans = !cachedPlans;
      const needWorkouts = !cachedWorkouts;
      const needWeek = !cachedWeek;
      const needMonthly = !cachedMonthly;

      const calls = await Promise.all([
        needWeek ? fitnessApi.getWeekSummary() : Promise.resolve(null),
        needPlans ? fitnessApi.getPlans() : Promise.resolve(null),
        needMonthly ? fitnessApi.getMonthProgress() : Promise.resolve(null),
        needWorkouts ? fitnessApi.getWorkouts() : Promise.resolve(null),
      ]);

      const weekData = needWeek ? (calls[0]?.data ?? calls[0]) : cachedWeek;
      const plansData = needPlans
        ? (Array.isArray(calls[1]?.data) ? calls[1].data : Array.isArray(calls[1]) ? calls[1] : [])
        : cachedPlans;
      const monthData = needMonthly ? (calls[2]?.data ?? calls[2]) : cachedMonthly;
      const workoutsData = needWorkouts
        ? (Array.isArray(calls[3]?.data) ? calls[3].data : Array.isArray(calls[3]) ? calls[3] : [])
        : cachedWorkouts;

      if (needWeek) simpleCache.set("fitness:week", weekData, 2 * 60_000);
      if (needPlans) simpleCache.set("fitness:plans", plansData, 5 * 60_000);
      if (needMonthly) simpleCache.set("fitness:monthly", monthData, 2 * 60_000);
      if (needWorkouts) simpleCache.set("fitness:workouts", workoutsData, 5 * 60_000);

      setWeek(weekData);
      setPlans(plansData ?? []);
      setMonthly(monthData);
      setWorkouts(workoutsData ?? []);
    } catch {} finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const weekDays = week?.days ?? [];
  const weekTotal = week?.weekTotal ?? { workouts: 0, calories: 0, minutes: 0 };
  const completedDays = weekDays.filter((d: any) => d.completed).length;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.bgSecondary }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); simpleCache.deleteByPrefix("fitness:"); loadAll(true); }} tintColor={colors.primary} />}
    >
      {/* Header */}
      <View style={[styles.hero, { backgroundColor: colors.bgPrimary, borderBottomColor: colors.border }]}>
        <View style={styles.heroRow}>
          <View>
            <Text style={[styles.heroTitle, { color: colors.textPrimary }]}>{t("fitness.title")}</Text>
            <Text style={[styles.heroSub, { color: colors.textMuted }]}>{t("fitness.subtitle")}</Text>
          </View>
          <TouchableOpacity style={[styles.iconBtn, { backgroundColor: colors.bgCardElevated }]} onPress={() => router.push("/advanced-stats" as any)}>
            <BarChart2 size={19} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Quick Start */}
        <TouchableOpacity
          ref={step0.ref}
          onLayout={step0.measure}
          activeOpacity={0.85}
          onPress={() => router.push("/exercise/ExerciseList" as any)}
        >
          <LinearGradient colors={Colors.gradientPrimary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.quickStart}>
            <View style={styles.quickLeft}>
              <View style={styles.quickIcon}>
                <Zap color="white" size={20} />
              </View>
              <View>
                <Text style={styles.quickText}>{t("fitness.start_now")}</Text>
                <Text style={styles.quickSub}>{t("fitness.explore")}</Text>
              </View>
            </View>
            <ChevronRight color="rgba(255,255,255,0.7)" size={18} />
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Weekly stats */}
      <View style={styles.section}>
        {loading ? <CardSkeleton /> : (
          <View
            ref={step1.ref}
            onLayout={step1.measure}
            style={[styles.weekCard, { backgroundColor: colors.bgCard, borderColor: colors.borderAccent }]}
          >
            <View style={styles.rowBetween}>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>{t("fitness.this_week")}</Text>
              <View style={[styles.weekBadge, { backgroundColor: colors.primaryBg }]}>
                <Text style={[styles.weekBadgeText, { color: colors.primary }]}>{completedDays}/7 ngày</Text>
              </View>
            </View>

            <View style={styles.weekRow}>
              {weekDays.map((day: any, i: number) => (
                <View key={i} style={{ alignItems: "center" }}>
                  <LinearGradient
                    colors={day.completed ? [colors.primary, "#6366F1"] : ["transparent", "transparent"]}
                    style={[styles.dayCircle, !day.completed && [styles.dayEmpty, { borderColor: colors.border }]]}
                  >
                    {day.completed
                      ? <Text style={styles.checkText}>✓</Text>
                      : <Text style={[styles.dayLabelInner, { color: colors.textMuted }]}>{day.day?.charAt(0)}</Text>}
                  </LinearGradient>
                  <Text style={[styles.dayLabel, { color: colors.textMuted }]}>{day.day}</Text>
                </View>
              ))}
            </View>

            <ProgressBar value={completedDays} max={7} color={colors.primary} height={6} style={{ marginBottom: Spacing.md }} />

            <View style={[styles.statsRow, { borderColor: colors.border }]}>
              {[
                { icon: <Dumbbell size={14} color={colors.primary} />, bg: colors.primaryBg, val: weekTotal.workouts, label: t("fitness.workouts") },
                { icon: <Flame size={14} color={colors.danger} />, bg: colors.dangerBg, val: weekTotal.calories, label: t("fitness.calories") },
                { icon: <Clock size={14} color={colors.success} />, bg: colors.successBg, val: weekTotal.minutes, label: t("fitness.minutes") },
              ].map((s, i) => (
                <View key={i} style={styles.statItem}>
                  <View style={[styles.statIconBox, { backgroundColor: s.bg }]}>{s.icon}</View>
                  <Text style={[styles.statVal, { color: colors.textPrimary }]}>{s.val}</Text>
                  <Text style={[styles.statLbl, { color: colors.textMuted }]}>{s.label}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </View>

      {/* Exercises */}
      <View
        ref={step2.ref}
        onLayout={step2.measure}
        style={styles.section}
      >
        <View style={styles.rowBetween}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>{t("fitness.exercises")}</Text>
          <TouchableOpacity onPress={() => router.push("/exercise/ExerciseList" as any)} style={styles.seeAllBtn}>
            <Text style={styles.seeAll}>Xem tất cả</Text>
            <ChevronRight size={13} color={colors.primary} />
          </TouchableOpacity>
        </View>
        {loading ? <CardSkeleton /> : workouts.length === 0 ? (
          <EmptyState emoji="🏋️" title={t("fitness.no_exercises")} subtitle={t("fitness.no_exercises_sub")} actionLabel={t("fitness.explore")} onAction={() => router.push("/exercise/ExerciseList" as any)} />
        ) : (
          workouts.slice(0, 4).map((w, i) => (
            <TouchableOpacity key={i} style={[styles.exerciseCard, { backgroundColor: colors.bgCard, borderColor: colors.border }, isDark ? {} : Shadow.xs]} onPress={() => router.push({ pathname: "/workout/[id]", params: { id: w.id } } as any)} activeOpacity={0.8}>
              <View style={[styles.exerciseIconBox, { backgroundColor: colors.primaryBg }]}>
                <Dumbbell size={18} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.exerciseTitle, { color: colors.textPrimary }]}>{w.title}</Text>
                <Text style={[styles.exerciseMeta, { color: colors.textMuted }]}>{w.muscleGroup} · {w.level}</Text>
              </View>
              <View style={[styles.kcalBadge, { backgroundColor: colors.orangeBg }]}>
                <Flame size={11} color={colors.orange} />
                <Text style={[styles.kcalText, { color: colors.orange }]}>{w.kcalPerMin} kcal/min</Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </View>

      {/* Plans */}
      {plans.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { marginBottom: Spacing.sm, color: colors.textPrimary }]}>{t("fitness.plans")}</Text>
          {plans.map((plan, i) => (
            <TouchableOpacity key={i} style={[styles.planCard, { backgroundColor: colors.bgCard, borderColor: colors.border }, isDark ? {} : Shadow.xs]} onPress={() => router.push("/exercise/ExerciseList" as any)} activeOpacity={0.75}>
              <View style={[styles.planIconBox, { backgroundColor: colors.purpleBg }]}>
                <Target size={16} color={colors.purple} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.planName, { color: colors.textPrimary }]}>{plan.name}</Text>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 }}>
                  <Clock size={11} color={colors.textMuted} />
                  <Text style={[styles.planMeta, { color: colors.textMuted }]}>{plan.weeks} tuần · {plan.goalType}</Text>
                </View>
              </View>
              <LinearGradient colors={Colors.gradientPrimary} style={styles.planPlayBtn}>
                <Play size={13} color="white" fill="white" />
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Monthly Progress */}
      {monthly && (
        <View style={styles.section}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 7, marginBottom: Spacing.md }}>
            <TrendingUp size={16} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>{t("fitness.monthly")}</Text>
          </View>
          {Object.keys(monthly).map((key, i) => {
            const LABELS: Record<string, string> = { cardio: "Cardio", strength: "Sức mạnh", flex: "Giãn cơ" };
            const COLORS: Record<string, string> = { cardio: "#f97316", strength: "#60a5fa", flex: "#a78bfa" };
            const color = COLORS[key] ?? colors.primary;
            const item = monthly[key];
            const pct = Math.min(100, item?.progress ?? 0);
            return (
              <View key={i} style={{ marginBottom: Spacing.md }}>
                <View style={styles.rowBetween}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 7 }}>
                    <View style={[styles.dot, { backgroundColor: color }]} />
                    <Text style={[styles.progressLabel, { color: colors.textSecondary }]}>{LABELS[key] ?? key}</Text>
                  </View>
                  <Text style={[styles.progressVal, { color: colors.textMuted }]}>{item?.sessions ?? 0}/{item?.target ?? 10} buổi</Text>
                </View>
                <ProgressBar value={pct} max={100} color={color} height={6} style={{ marginTop: 6 }} />
              </View>
            );
          })}
        </View>
      )}

      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {},

  hero: { paddingTop: sw(56), paddingHorizontal: Spacing.base, paddingBottom: Spacing.base, borderBottomWidth: 1 },
  heroRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: Spacing.base },
  heroTitle: { fontSize: sf(28), fontWeight: "800", letterSpacing: -0.5 },
  heroSub: { ...Typography.sm, marginTop: 3 },
  iconBtn: {
    width: sw(40), height: sw(40),
    borderRadius: Radius.lg,
    alignItems: "center", justifyContent: "center",
  },
  quickStart: { borderRadius: Radius.xl, padding: Spacing.base, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  quickLeft: { flexDirection: "row", alignItems: "center", gap: Spacing.md },
  quickIcon: { width: sw(44), height: sw(44), borderRadius: Radius.lg, backgroundColor: "rgba(255,255,255,0.18)", justifyContent: "center", alignItems: "center" },
  quickText: { color: "white", ...Typography.md, fontWeight: "700" },
  quickSub: { color: "rgba(255,255,255,0.7)", ...Typography.sm, marginTop: 2 },

  section: { paddingHorizontal: Spacing.base, marginTop: Spacing.xl },
  sectionTitle: { fontSize: sf(15), fontWeight: "700" },
  rowBetween: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: Spacing.sm },
  seeAllBtn: { flexDirection: "row", alignItems: "center", gap: 2 },
  seeAll: { fontSize: sf(12), fontWeight: "600" },

  weekCard: { borderRadius: Radius.xl, padding: Spacing.base, borderWidth: 1 },
  weekBadge: { borderRadius: Radius.sm, paddingHorizontal: sw(10), paddingVertical: sw(4) },
  weekBadgeText: { ...Typography.sm, fontWeight: "600" },
  weekRow: { flexDirection: "row", justifyContent: "space-between", marginVertical: Spacing.md },
  dayCircle: { width: sw(34), height: sw(34), borderRadius: sw(17), justifyContent: "center", alignItems: "center" },
  dayEmpty: { borderWidth: 1 },
  dayLabelInner: { fontSize: sf(10), fontWeight: "600" },
  checkText: { color: "white", fontSize: sf(13), fontWeight: "bold" },
  dayLabel: { fontSize: sf(9), marginTop: sw(4) },
  statsRow: { flexDirection: "row", justifyContent: "space-around", borderTopWidth: 1, paddingTop: Spacing.md },
  statItem: { alignItems: "center", gap: 5 },
  statIconBox: { width: sw(32), height: sw(32), borderRadius: sw(9), justifyContent: "center", alignItems: "center" },
  statVal: { ...Typography.xxl, fontWeight: "700" },
  statLbl: { ...Typography.xs },

  exerciseCard: { flexDirection: "row", alignItems: "center", gap: Spacing.md, padding: Spacing.md, borderRadius: Radius.xl, borderWidth: 1, marginBottom: Spacing.sm },
  exerciseIconBox: { width: sw(44), height: sw(44), borderRadius: sw(13), alignItems: "center", justifyContent: "center" },
  exerciseTitle: { ...Typography.base, fontWeight: "600" },
  exerciseMeta: { ...Typography.sm, marginTop: 2 },
  kcalBadge: { flexDirection: "row", alignItems: "center", gap: 3, borderRadius: Radius.sm, paddingHorizontal: sw(8), paddingVertical: sw(4) },
  kcalText: { ...Typography.xs, fontWeight: "600" },

  planCard: { flexDirection: "row", alignItems: "center", gap: Spacing.md, padding: Spacing.md, borderRadius: Radius.xl, borderWidth: 1, marginBottom: Spacing.sm },
  planIconBox: { width: sw(44), height: sw(44), borderRadius: sw(12), alignItems: "center", justifyContent: "center" },
  planName: { ...Typography.base, fontWeight: "600" },
  planMeta: { ...Typography.sm },
  planPlayBtn: { width: sw(36), height: sw(36), borderRadius: sw(10), justifyContent: "center", alignItems: "center" },

  dot: { width: sw(8), height: sw(8), borderRadius: sw(4) },
  progressLabel: { fontSize: sf(13), fontWeight: "600" },
  progressVal: { ...Typography.sm },
});
