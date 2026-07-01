import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Droplets, Trash2 } from "lucide-react-native";
import { useFocusEffect } from "expo-router";
import { useTranslation } from "react-i18next";
import { waterIntakeApi, TodayWater } from "@/src/api/waterIntakeApi";
import { useColors, Radius, Spacing, sf } from "@/src/theme";

const QUICK_OPTIONS = [150, 200, 250, 330, 500];
const DAILY_GOAL = 2000;

function formatTime(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
}

export default function WaterIntakeScreen() {
  const { t } = useTranslation();
  const colors = useColors();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<TodayWater | null>(null);
  const [logging, setLogging] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadData(false);
    }, [])
  );

  const loadData = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const res = await waterIntakeApi.getToday();
      setData(res);
    } catch (e) {
      console.error("[WaterIntake] loadData error:", e);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const handleLog = async (amount: number) => {
    try {
      setLogging(true);
      await waterIntakeApi.log(amount);
      await loadData(true);
    } catch (e) {
      console.error("[WaterIntake] handleLog error:", e);
      Alert.alert("Lỗi", "Không thể ghi nhận lượng nước. Thử lại sau.");
    } finally {
      setLogging(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await waterIntakeApi.delete(id);
      await loadData(true);
    } catch (e) {
      console.error("[WaterIntake] handleDelete error:", e);
    }
  };

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.bgSecondary }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const total = data?.total ?? 0;
  const pct = Math.min(data?.percentage ?? 0, 100);
  const glasses = Math.round(total / 250);
  const remaining = Math.max(0, DAILY_GOAL - total);

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.bgSecondary }]} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Droplets size={28} color={colors.primary} />
        <Text style={[styles.title, { color: colors.textPrimary }]}>{t("water.title")}</Text>
      </View>

      {/* Main progress card */}
      <View style={[styles.progressCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
        <View style={styles.circleArea}>
          <Text style={[styles.circleValue, { color: colors.primary }]}>{total}</Text>
          <Text style={[styles.circleUnit, { color: colors.textSecondary }]}>ml</Text>
          <Text style={[styles.circleGoal, { color: colors.textMuted }]}>mục tiêu {DAILY_GOAL} ml</Text>
        </View>

        {/* Progress bar */}
        <View style={styles.progressBarContainer}>
          <View style={[styles.progressBarBg, { backgroundColor: colors.bgSecondary }]}>
            <View style={[styles.progressBarFill, { width: `${pct}%`, backgroundColor: colors.primary }]} />
          </View>
          <Text style={[styles.progressPct, { color: colors.primary }]}>{pct}%</Text>
        </View>

        <View style={styles.statsRow}>
          <StatItem label={t("water.glasses")} value={`${glasses} ly`} color={colors.primary} textMuted={colors.textMuted} />
          <StatItem label={t("water.remaining")} value={`${remaining} ml`} color={colors.textSecondary} textMuted={colors.textMuted} />
        </View>
      </View>

      {/* Quick add buttons */}
      <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>{t("water.quick_add")}</Text>
      <View style={styles.quickRow}>
        {QUICK_OPTIONS.map((ml) => (
          <TouchableOpacity
            key={ml}
            style={[styles.quickBtn, { backgroundColor: colors.bgCard, borderColor: colors.border }]}
            onPress={() => handleLog(ml)}
            disabled={logging}
          >
            <Droplets size={16} color={colors.primary} />
            <Text style={[styles.quickBtnText, { color: colors.primary }]}>{ml}ml</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Log history */}
      {data?.logs && data.logs.length > 0 && (
        <>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>{t("water.today_logs", { count: data.logs.length })}</Text>
          {[...data.logs].reverse().map((log) => (
            <View key={log.id} style={[styles.logItem, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
              <Droplets size={16} color={colors.primary} />
              <Text style={[styles.logAmount, { color: colors.textPrimary }]}>{log.amount} ml</Text>
              <Text style={[styles.logTime, { color: colors.textMuted }]}>{formatTime(log.loggedAt)}</Text>
              <TouchableOpacity onPress={() => handleDelete(log.id)}>
                <Trash2 size={14} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
          ))}
        </>
      )}

      {/* Tip */}
      <View style={[styles.tipCard, { backgroundColor: colors.primaryBg, borderColor: colors.borderAccent }]}>
        <Text style={[styles.tipText, { color: colors.primary }]}>{t("water.tip")}</Text>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

function StatItem({ label, value, color, textMuted }: { label: string; value: string; color: string; textMuted: string }) {
  return (
    <View style={styles.statItem}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: textMuted }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: Spacing.base },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },

  header: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 20, paddingTop: 52 },
  title: { fontSize: sf(24), fontWeight: "800" },

  progressCard: { borderRadius: Radius.xxl, padding: 24, marginBottom: 24, borderWidth: 1, alignItems: "center" },
  circleArea: { alignItems: "center", marginBottom: 20 },
  circleValue: { fontSize: sf(64), fontWeight: "800" },
  circleUnit: { fontSize: sf(18), marginTop: -8 },
  circleGoal: { fontSize: sf(13), marginTop: 4 },

  progressBarContainer: { width: "100%", flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 16 },
  progressBarBg: { flex: 1, height: 12, borderRadius: 6, overflow: "hidden" },
  progressBarFill: { height: "100%", borderRadius: 6 },
  progressPct: { fontSize: sf(14), fontWeight: "700", width: 40 },

  statsRow: { flexDirection: "row", gap: 32 },
  statItem: { alignItems: "center" },
  statValue: { fontSize: sf(20), fontWeight: "700" },
  statLabel: { fontSize: sf(12), marginTop: 2 },

  sectionTitle: { fontSize: sf(17), fontWeight: "700", marginBottom: 12 },

  quickRow: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 24 },
  quickBtn: { flexDirection: "row", alignItems: "center", gap: 6, borderRadius: Radius.lg, paddingHorizontal: 16, paddingVertical: 10, borderWidth: 1 },
  quickBtnText: { fontSize: sf(14), fontWeight: "700" },

  logItem: { flexDirection: "row", alignItems: "center", gap: 10, borderRadius: Radius.md, padding: 12, marginBottom: 6, borderWidth: 1 },
  logAmount: { fontSize: sf(15), fontWeight: "700", flex: 1 },
  logTime: { fontSize: sf(13) },

  tipCard: { borderRadius: Radius.lg, padding: 14, marginTop: 8, borderWidth: 1 },
  tipText: { fontSize: sf(13), lineHeight: 20 },
});
