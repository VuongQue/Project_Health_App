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
import { Droplets, Plus, Trash2 } from "lucide-react-native";
import { useFocusEffect } from "expo-router";
import { useTranslation } from "react-i18next";
import { waterIntakeApi, TodayWater, WaterLog } from "@/src/api/waterIntakeApi";

const QUICK_OPTIONS = [150, 200, 250, 330, 500];
const DAILY_GOAL = 2000;

function formatTime(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
}

export default function WaterIntakeScreen() {
  const { t } = useTranslation();
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
    await waterIntakeApi.delete(id);
    loadData();
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  const total = data?.total ?? 0;
  const pct = data?.percentage ?? 0;
  const glasses = Math.round(total / 250);
  const remaining = Math.max(0, DAILY_GOAL - total);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Droplets size={28} color="#38bdf8" />
        <Text style={styles.title}>{t("water.title")}</Text>
      </View>

      {/* Main progress circle area */}
      <View style={styles.progressCard}>
        <View style={styles.circleArea}>
          <Text style={styles.circleValue}>{total}</Text>
          <Text style={styles.circleUnit}>ml</Text>
          <Text style={styles.circleGoal}>mục tiêu {DAILY_GOAL} ml</Text>
        </View>

        {/* Wave/progress bar */}
        <View style={styles.progressBarContainer}>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${pct}%` }]} />
          </View>
          <Text style={styles.progressPct}>{pct}%</Text>
        </View>

        <View style={styles.statsRow}>
          <StatItem label={t("water.glasses")} value={`${glasses} ly`} color="#38bdf8" />
          <StatItem label={t("water.remaining")} value={`${remaining} ml`} color="#94a3b8" />
        </View>
      </View>

      {/* Quick add buttons */}
      <Text style={styles.sectionTitle}>{t("water.quick_add")}</Text>
      <View style={styles.quickRow}>
        {QUICK_OPTIONS.map((ml) => (
          <TouchableOpacity
            key={ml}
            style={styles.quickBtn}
            onPress={() => handleLog(ml)}
            disabled={logging}
          >
            <Droplets size={16} color="#38bdf8" />
            <Text style={styles.quickBtnText}>{ml}ml</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Log history */}
      {data?.logs && data.logs.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>{t("water.today_logs", { count: data.logs.length })}</Text>
          {[...data.logs].reverse().map((log) => (
            <View key={log.id} style={styles.logItem}>
              <Droplets size={16} color="#38bdf8" />
              <Text style={styles.logAmount}>{log.amount} ml</Text>
              <Text style={styles.logTime}>{formatTime(log.loggedAt)}</Text>
              <TouchableOpacity onPress={() => handleDelete(log.id)}>
                <Trash2 size={14} color="#475569" />
              </TouchableOpacity>
            </View>
          ))}
        </>
      )}

      {/* Tip */}
      <View style={styles.tipCard}>
        <Text style={styles.tipText}>{t("water.tip")}</Text>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

function StatItem({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={styles.statItem}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f172a", padding: 16 },
  centered: { flex: 1, backgroundColor: "#0f172a", justifyContent: "center", alignItems: "center" },

  header: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 20 },
  title: { color: "white", fontSize: 24, fontWeight: "800" },

  progressCard: {
    backgroundColor: "#1e293b",
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#334155",
    alignItems: "center",
  },
  circleArea: { alignItems: "center", marginBottom: 20 },
  circleValue: { color: "#38bdf8", fontSize: 64, fontWeight: "800" },
  circleUnit: { color: "#94a3b8", fontSize: 18, marginTop: -8 },
  circleGoal: { color: "#64748b", fontSize: 13, marginTop: 4 },

  progressBarContainer: { width: "100%", flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 16 },
  progressBarBg: { flex: 1, height: 12, backgroundColor: "#0f172a", borderRadius: 6, overflow: "hidden" },
  progressBarFill: { height: "100%", backgroundColor: "#38bdf8", borderRadius: 6 },
  progressPct: { color: "#38bdf8", fontSize: 14, fontWeight: "700", width: 40 },

  statsRow: { flexDirection: "row", gap: 32 },
  statItem: { alignItems: "center" },
  statValue: { fontSize: 20, fontWeight: "700" },
  statLabel: { color: "#64748b", fontSize: 12, marginTop: 2 },

  sectionTitle: { color: "white", fontSize: 17, fontWeight: "700", marginBottom: 12 },

  quickRow: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 24 },
  quickBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#1e293b",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#334155",
  },
  quickBtnText: { color: "#38bdf8", fontSize: 14, fontWeight: "700" },

  logItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#1e293b",
    borderRadius: 12,
    padding: 12,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: "#334155",
  },
  logAmount: { color: "white", fontSize: 15, fontWeight: "700", flex: 1 },
  logTime: { color: "#64748b", fontSize: 13 },

  tipCard: {
    backgroundColor: "#0c2340",
    borderRadius: 14,
    padding: 14,
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#1e4076",
  },
  tipText: { color: "#93c5fd", fontSize: 13, lineHeight: 20 },
});
