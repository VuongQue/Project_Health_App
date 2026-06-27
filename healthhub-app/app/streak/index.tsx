import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { ArrowLeft, Flame, Trophy, Calendar, Target, Star } from "lucide-react-native";
import stepsApi, { StepStreakResponse } from "@/src/api/stepsApi";
import { Colors, Spacing, Radius, Typography } from "@/src/theme";

const DAY_LABELS = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

function getDayOfWeek(dateStr: string) {
  return new Date(dateStr).getDay(); // 0=Sun
}

export default function StreakScreen() {
  const router = useRouter();
  const [data, setData] = useState<StepStreakResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await stepsApi.getStreak();
      setData(res.data);
    } catch {
      // keep existing data on error
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={Colors.primary} size="large" />
        <Text style={styles.loadingText}>Đang tải streak...</Text>
      </View>
    );
  }

  const streak = data?.currentStreak ?? 0;
  const bestStreak = data?.bestStreak ?? 0;
  const totalActiveDays = data?.totalActiveDays ?? 0;
  const last30 = data?.last30Days ?? [];

  // Group last30 into 5 weeks × 7 days grid
  const grid: ({ date: string; steps: number; goalSteps: number; reached: boolean } | null)[][] = [];
  let week: ({ date: string; steps: number; goalSteps: number; reached: boolean } | null)[] = [];

  if (last30.length > 0) {
    const firstDow = getDayOfWeek(last30[0].date);
    for (let i = 0; i < firstDow; i++) week.push(null);
    for (const day of last30) {
      week.push(day);
      if (week.length === 7) { grid.push(week); week = []; }
    }
    if (week.length > 0) {
      while (week.length < 7) week.push(null);
      grid.push(week);
    }
  }

  const streakColor = streak >= 7 ? Colors.orange : streak >= 3 ? Colors.warning : Colors.primary;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(true); }} tintColor={Colors.primary} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={22} color={Colors.textSecondary} />
        </TouchableOpacity>
        <Text style={styles.title}>Streak Tracker</Text>
      </View>

      {/* Hero card */}
      <LinearGradient
        colors={streak >= 7 ? ["#f97316", "#ea580c"] : streak >= 3 ? ["#eab308", "#ca8a04"] : ["#2563eb", "#7c3aed"]}
        style={styles.heroCard}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Flame size={48} color="rgba(255,255,255,0.9)" />
        <Text style={styles.streakNumber}>{streak}</Text>
        <Text style={styles.streakLabel}>ngày liên tiếp</Text>
        <Text style={styles.streakSub}>
          {streak === 0
            ? "Hãy bắt đầu streak hôm nay!"
            : streak < 3
            ? "Tiếp tục đi! Bạn đang xây dựng thói quen."
            : streak < 7
            ? "Tuyệt vời! Duy trì streak này nhé."
            : "Streak khủng! Bạn thật xuất sắc!"}
        </Text>
      </LinearGradient>

      {/* Stats row */}
      <View style={styles.statsRow}>
        <StatCard
          icon={<Trophy size={20} color={Colors.warning} />}
          bg={Colors.warningBg}
          label="Kỷ lục"
          value={`${bestStreak} ngày`}
        />
        <StatCard
          icon={<Calendar size={20} color={Colors.success} />}
          bg={Colors.successBg}
          label="Tổng ngày đạt"
          value={`${totalActiveDays} ngày`}
        />
        <StatCard
          icon={<Star size={20} color={Colors.primary} />}
          bg={Colors.primaryBg}
          label="Tỷ lệ (30 ngày)"
          value={`${last30.length > 0 ? Math.round((last30.filter((d) => d.reached).length / last30.length) * 100) : 0}%`}
        />
      </View>

      {/* 30-day heatmap */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>30 ngày gần đây</Text>
        <View style={styles.dayLabels}>
          {DAY_LABELS.map((d) => (
            <Text key={d} style={styles.dayLabel}>{d}</Text>
          ))}
        </View>
        {grid.map((week, wi) => (
          <View key={wi} style={styles.weekRow}>
            {week.map((day, di) => {
              if (!day) return <View key={di} style={styles.dayEmpty} />;
              const isToday = day.date === new Date().toISOString().slice(0, 10);
              return (
                <View
                  key={di}
                  style={[
                    styles.dayCell,
                    day.reached && { backgroundColor: streakColor },
                    !day.reached && day.steps > 0 && styles.dayCellPartial,
                    isToday && styles.dayCellToday,
                  ]}
                >
                  {day.reached && <Flame size={10} color="white" />}
                </View>
              );
            })}
          </View>
        ))}
        <View style={styles.legend}>
          <View style={[styles.legendDot, { backgroundColor: Colors.bgSecondary, borderColor: Colors.border }]} />
          <Text style={styles.legendText}>Chưa đạt</Text>
          <View style={[styles.legendDot, { backgroundColor: Colors.primary + "60" }]} />
          <Text style={styles.legendText}>Đang đi</Text>
          <View style={[styles.legendDot, { backgroundColor: streakColor }]} />
          <Text style={styles.legendText}>Đạt mục tiêu</Text>
        </View>
      </View>

      {/* Tips */}
      <View style={styles.tipsCard}>
        <Text style={styles.tipsTitle}>Mẹo duy trì streak</Text>
        {[
          "Đặt mục tiêu bước chân hàng ngày (10,000 bước)",
          "Đi bộ trong giờ nghỉ trưa hoặc sau bữa tối",
          "Bật nhắc nhở tập luyện trong phần Cài đặt",
          "Streak dài hơn = thói quen bền vững hơn",
        ].map((tip, i) => (
          <View key={i} style={styles.tipRow}>
            <View style={styles.tipDot} />
            <Text style={styles.tipText}>{tip}</Text>
          </View>
        ))}
      </View>

      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

function StatCard({ icon, bg, label, value }: { icon: React.ReactNode; bg: string; label: string; value: string }) {
  return (
    <View style={styles.statCard}>
      <View style={[styles.statIcon, { backgroundColor: bg }]}>{icon}</View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgSecondary },
  content: { paddingHorizontal: Spacing.base, paddingTop: Spacing.xl },
  center: { flex: 1, backgroundColor: Colors.bgSecondary, justifyContent: "center", alignItems: "center", gap: 12 },
  loadingText: { color: Colors.textMuted, ...Typography.sm },

  header: { flexDirection: "row", alignItems: "center", gap: Spacing.md, marginBottom: Spacing.xl },
  backBtn: {
    width: 40, height: 40, backgroundColor: Colors.bgCard, borderRadius: Radius.md,
    justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: Colors.border,
  },
  title: { color: Colors.textPrimary, ...Typography.xxxl, fontWeight: "800" },

  heroCard: {
    borderRadius: Radius.xxl, padding: Spacing.xl, alignItems: "center", gap: 8, marginBottom: Spacing.lg,
  },
  streakNumber: { color: "white", fontSize: 64, fontWeight: "900", lineHeight: 72 },
  streakLabel: { color: "rgba(255,255,255,0.9)", fontSize: 18, fontWeight: "700" },
  streakSub: { color: "rgba(255,255,255,0.75)", fontSize: 13, textAlign: "center", marginTop: 4 },

  statsRow: { flexDirection: "row", gap: Spacing.sm, marginBottom: Spacing.lg },
  statCard: {
    flex: 1, backgroundColor: Colors.bgCard, borderRadius: Radius.xl, padding: Spacing.md,
    alignItems: "center", gap: 6, borderWidth: 1, borderColor: Colors.border,
  },
  statIcon: { width: 36, height: 36, borderRadius: Radius.md, justifyContent: "center", alignItems: "center" },
  statValue: { color: Colors.textPrimary, fontSize: 15, fontWeight: "800" },
  statLabel: { color: Colors.textMuted, fontSize: 10, textAlign: "center" },

  section: {
    backgroundColor: Colors.bgCard, borderRadius: Radius.xl, padding: Spacing.base,
    marginBottom: Spacing.lg, borderWidth: 1, borderColor: Colors.border,
  },
  sectionTitle: { color: Colors.textPrimary, fontSize: 15, fontWeight: "700", marginBottom: Spacing.md },

  dayLabels: { flexDirection: "row", marginBottom: 6 },
  dayLabel: { flex: 1, color: Colors.textMuted, fontSize: 10, textAlign: "center" },
  weekRow: { flexDirection: "row", marginBottom: 4 },
  dayCell: {
    flex: 1, aspectRatio: 1, margin: 2, borderRadius: 6,
    backgroundColor: Colors.bgSecondary, alignItems: "center", justifyContent: "center",
  },
  dayCellPartial: { backgroundColor: Colors.primary + "40" },
  dayCellToday: { borderWidth: 2, borderColor: Colors.primary },
  dayEmpty: { flex: 1, margin: 2 },

  legend: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 10, justifyContent: "center" },
  legendDot: { width: 12, height: 12, borderRadius: 3, borderWidth: 1, borderColor: "transparent" },
  legendText: { color: Colors.textMuted, fontSize: 10, marginRight: 8 },

  tipsCard: {
    backgroundColor: Colors.bgCard, borderRadius: Radius.xl, padding: Spacing.base,
    borderWidth: 1, borderColor: Colors.border, marginBottom: Spacing.lg,
  },
  tipsTitle: { color: Colors.textPrimary, fontSize: 14, fontWeight: "700", marginBottom: Spacing.md },
  tipRow: { flexDirection: "row", alignItems: "flex-start", gap: 8, marginBottom: 8 },
  tipDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.primary, marginTop: 5 },
  tipText: { color: Colors.textSecondary, fontSize: 13, flex: 1, lineHeight: 18 },
});
