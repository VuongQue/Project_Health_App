import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { ArrowLeft, Dumbbell, Target, Calendar, Lightbulb, ChevronRight } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import aiApi, { WorkoutPlan } from "@/src/api/aiApi";
import { Colors, Spacing, Radius, Typography } from "@/src/theme";

const DAYS_OPTIONS = [2, 3, 4, 5];

const GOAL_OPTIONS = [
  { key: "Giảm cân", emoji: "🔥", desc: "Đốt mỡ, cardio nhiều" },
  { key: "Tăng cơ", emoji: "💪", desc: "Strength training" },
  { key: "Tăng sức bền", emoji: "🏃", desc: "Cardio & endurance" },
  { key: "Duy trì sức khoẻ", emoji: "❤️", desc: "Cân bằng, nhẹ nhàng" },
  { key: "Giảm stress", emoji: "🧘", desc: "Yoga, thở, thư giãn" },
];

const DAY_COLORS: Record<string, string> = {
  "Thứ Hai": "#3b82f6",
  "Thứ Ba": "#8b5cf6",
  "Thứ Tư": "#22c55e",
  "Thứ Năm": "#f59e0b",
  "Thứ Sáu": "#ef4444",
  "Thứ Bảy": "#ec4899",
  "Chủ Nhật": "#14b8a6",
};

export default function WorkoutPlannerScreen() {
  const router = useRouter();
  const [daysPerWeek, setDaysPerWeek] = useState(3);
  const [selectedGoal, setSelectedGoal] = useState("Duy trì sức khoẻ");
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<WorkoutPlan | null>(null);

  const generate = async () => {
    setLoading(true);
    setPlan(null);
    try {
      const res = await aiApi.generateWorkoutPlan(daysPerWeek, selectedGoal);
      setPlan(res.data);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <LinearGradient colors={["#1a1040", Colors.bgPrimary]} style={styles.header}>
        <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)/(personal)')} style={styles.backBtn}>
          <ArrowLeft size={22} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <LinearGradient colors={["#8b5cf6", "#6d28d9"]} style={styles.headerIcon}>
            <Dumbbell size={24} color="#fff" />
          </LinearGradient>
          <Text style={styles.headerTitle}>AI Workout Planner</Text>
          <Text style={styles.headerSub}>Kế hoạch tập cá nhân hoá</Text>
        </View>
      </LinearGradient>

      <View style={styles.body}>
        {/* Days per week */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Số buổi/tuần</Text>
          <View style={styles.daysRow}>
            {DAYS_OPTIONS.map((d) => (
              <TouchableOpacity
                key={d}
                style={[styles.dayChip, daysPerWeek === d && styles.dayChipActive]}
                onPress={() => setDaysPerWeek(d)}
              >
                <Text style={[styles.dayChipNum, daysPerWeek === d && styles.dayChipNumActive]}>{d}</Text>
                <Text style={[styles.dayChipLabel, daysPerWeek === d && styles.dayChipLabelActive]}>buổi</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Goal */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Mục tiêu</Text>
          <View style={styles.goalList}>
            {GOAL_OPTIONS.map((g) => (
              <TouchableOpacity
                key={g.key}
                style={[styles.goalItem, selectedGoal === g.key && styles.goalItemActive]}
                onPress={() => setSelectedGoal(g.key)}
              >
                <Text style={styles.goalEmoji}>{g.emoji}</Text>
                <View style={styles.goalInfo}>
                  <Text style={[styles.goalKey, selectedGoal === g.key && styles.goalKeyActive]}>{g.key}</Text>
                  <Text style={styles.goalDesc}>{g.desc}</Text>
                </View>
                {selectedGoal === g.key && <Target size={16} color="#8b5cf6" />}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Generate */}
        <TouchableOpacity onPress={generate} disabled={loading}>
          <LinearGradient
            colors={loading ? [Colors.bgCard, Colors.bgCard] : ["#8b5cf6", "#6d28d9"]}
            style={styles.generateBtn}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Calendar size={18} color="#fff" />
            )}
            <Text style={styles.generateBtnText}>
              {loading ? "AI đang lập kế hoạch..." : "Tạo kế hoạch tập"}
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Result */}
        {plan && (
          <>
            {/* Weekly goal */}
            <LinearGradient colors={["#1a1040", "#2d1b69"]} style={styles.weekGoalCard}>
              <Target size={18} color="#8b5cf6" />
              <Text style={styles.weekGoalText}>{plan.weeklyGoal}</Text>
            </LinearGradient>

            {/* Plan schedule */}
            <View style={styles.planSection}>
              <Text style={styles.planTitle}>Lịch tập tuần</Text>
              {plan.plan.map((item, i) => {
                const color = DAY_COLORS[item.day] ?? Colors.primary;
                return (
                  <TouchableOpacity
                    key={i}
                    style={styles.planItem}
                    onPress={() => item.workoutId && router.push(`/workout/${item.workoutId}`)}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.planDayBadge, { backgroundColor: color + "20" }]}>
                      <Text style={[styles.planDay, { color }]}>{item.day}</Text>
                    </View>
                    <View style={styles.planInfo}>
                      <Text style={styles.planWorkout}>{item.workoutTitle}</Text>
                      <Text style={styles.planReason}>{item.reason}</Text>
                    </View>
                    <ChevronRight size={16} color={Colors.textMuted} />
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Tips */}
            {plan.tips.length > 0 && (
              <View style={styles.tipsCard}>
                <View style={styles.tipsHeader}>
                  <Lightbulb size={16} color={Colors.warning} />
                  <Text style={styles.tipsTitle}>Mẹo từ AI Coach</Text>
                </View>
                {plan.tips.map((tip, i) => (
                  <Text key={i} style={styles.tipItem}>• {tip}</Text>
                ))}
              </View>
            )}
          </>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgPrimary },
  header: { paddingTop: 52, paddingBottom: 24, paddingHorizontal: Spacing.base },
  backBtn: { marginBottom: 16 },
  headerContent: { alignItems: "center", gap: 10 },
  headerIcon: { width: 60, height: 60, borderRadius: 30, alignItems: "center", justifyContent: "center" },
  headerTitle: { color: "#fff", fontSize: Typography.xxl, fontWeight: "800" },
  headerSub: { color: Colors.textSecondary, fontSize: Typography.sm },
  body: { padding: Spacing.base, gap: Spacing.md },
  section: { gap: 10 },
  sectionLabel: { color: Colors.textSecondary, fontSize: Typography.sm, fontWeight: "600" },
  daysRow: { flexDirection: "row", gap: 10 },
  dayChip: {
    flex: 1,
    alignItems: "center",
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  dayChipActive: { borderColor: "#8b5cf6", backgroundColor: "rgba(139,92,246,0.12)" },
  dayChipNum: { color: Colors.textSecondary, fontSize: Typography.xl, fontWeight: "700" },
  dayChipNumActive: { color: "#8b5cf6" },
  dayChipLabel: { color: Colors.textMuted, fontSize: Typography.xs },
  dayChipLabelActive: { color: "#8b5cf6" },
  goalList: { gap: 8 },
  goalItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    padding: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  goalItemActive: { borderColor: "#8b5cf6", backgroundColor: "rgba(139,92,246,0.08)" },
  goalEmoji: { fontSize: 22 },
  goalInfo: { flex: 1 },
  goalKey: { color: Colors.textPrimary, fontSize: Typography.sm, fontWeight: "600" },
  goalKeyActive: { color: "#8b5cf6" },
  goalDesc: { color: Colors.textMuted, fontSize: Typography.xs },
  generateBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: Radius.lg,
    paddingVertical: 14,
  },
  generateBtnText: { color: "#fff", fontSize: Typography.md, fontWeight: "700" },
  weekGoalCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: Radius.xl,
    padding: Spacing.base,
  },
  weekGoalText: { color: "#fff", fontSize: Typography.sm, flex: 1, lineHeight: 20 },
  planSection: { backgroundColor: Colors.bgCard, borderRadius: Radius.xl, overflow: "hidden" },
  planTitle: { color: Colors.textPrimary, fontSize: Typography.md, fontWeight: "700", padding: Spacing.base, paddingBottom: 8 },
  planItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: Spacing.base,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  planDayBadge: { borderRadius: Radius.sm, paddingHorizontal: 8, paddingVertical: 4, minWidth: 68, alignItems: "center" },
  planDay: { fontSize: Typography.xs, fontWeight: "700" },
  planInfo: { flex: 1 },
  planWorkout: { color: Colors.textPrimary, fontSize: Typography.sm, fontWeight: "600" },
  planReason: { color: Colors.textMuted, fontSize: Typography.xs, marginTop: 2 },
  tipsCard: { backgroundColor: Colors.bgCard, borderRadius: Radius.xl, padding: Spacing.base, gap: 8 },
  tipsHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  tipsTitle: { color: Colors.textPrimary, fontSize: Typography.md, fontWeight: "700" },
  tipItem: { color: Colors.textSecondary, fontSize: Typography.sm, lineHeight: 20 },
});
