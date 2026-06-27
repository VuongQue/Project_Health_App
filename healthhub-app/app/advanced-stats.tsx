import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import axiosClient from "@/src/api/axiosClient";

interface HeatDay {
  date: string;
  count: number;
  kcal: number;
  minutes: number;
}

interface MonthStat {
  month: string;
  kcal: number;
  sessions: number;
  minutes: number;
}

function HeatCell({ day }: { day: HeatDay }) {
  const intensity = day.count === 0 ? 0 : Math.min(day.count / 3, 1);
  const bg =
    day.count === 0
      ? "#1e293b"
      : `rgba(59,130,246,${0.2 + 0.8 * intensity})`;
  return <View style={[styles.heatCell, { backgroundColor: bg }]} />;
}

function HeatMap({ data }: { data: HeatDay[] }) {
  // Split into weeks (7-day columns)
  const weeks: HeatDay[][] = [];
  for (let i = 0; i < data.length; i += 7) {
    weeks.push(data.slice(i, i + 7));
  }

  return (
    <View style={styles.heatMap}>
      {weeks.map((week, wi) => (
        <View key={wi} style={styles.heatWeek}>
          {week.map((day) => (
            <HeatCell key={day.date} day={day} />
          ))}
        </View>
      ))}
    </View>
  );
}

function BarChart({ data }: { data: MonthStat[] }) {
  const maxKcal = Math.max(...data.map((d) => d.kcal), 1);

  return (
    <View style={styles.barChartWrap}>
      {data.map((d) => {
        const pct = d.kcal / maxKcal;
        const [year, month] = d.month.split("-");
        const label = `${month}/${year.slice(2)}`;
        return (
          <View key={d.month} style={styles.barCol}>
            <Text style={styles.barVal}>{d.kcal > 0 ? `${(d.kcal / 1000).toFixed(1)}k` : ""}</Text>
            <View style={styles.barBg}>
              <View
                style={[
                  styles.barFill,
                  { height: `${Math.max(Math.round(pct * 100), d.kcal > 0 ? 2 : 0)}%` },
                ]}
              />
            </View>
            <Text style={styles.barLabel}>{label}</Text>
            <Text style={styles.barSessions}>{d.sessions}x</Text>
          </View>
        );
      })}
    </View>
  );
}

export default function AdvancedStatsScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [heatmap, setHeatmap] = useState<HeatDay[]>([]);
  const [monthlyStats, setMonthlyStats] = useState<MonthStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"heatmap" | "chart">("heatmap");

  const load = useCallback(async () => {
    try {
      const [hmRes, ltRes] = await Promise.all([
        axiosClient.get<HeatDay[]>("/fitness/heatmap?days=90"),
        axiosClient.get<MonthStat[]>("/fitness/stats/long-term?months=6"),
      ]);
      setHeatmap(hmRes.data as HeatDay[]);
      setMonthlyStats(ltRes.data as MonthStat[]);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const totalSessions = heatmap.filter((d) => d.count > 0).length;
  const totalKcal = heatmap.reduce((s, d) => s + d.kcal, 0);
  const streak = (() => {
    let s = 0;
    for (let i = heatmap.length - 1; i >= 0; i--) {
      if (heatmap[i].count > 0) s++;
      else if (s > 0) break;
    }
    return s;
  })();

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#3b82f6" size="large" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <Text style={styles.backText}>{t("common.back")}</Text>
        </TouchableOpacity>
        <Text style={styles.header}>{t("advanced_stats.title")}</Text>
        <View style={{ width: 60 }} />
      </View>

      {/* Summary cards */}
      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryVal}>{totalSessions}</Text>
          <Text style={styles.summaryLabel}>{t("advanced_stats.active_days")}</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryVal}>{streak}</Text>
          <Text style={styles.summaryLabel}>{t("advanced_stats.day_streak")}</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryVal}>{(totalKcal / 1000).toFixed(1)}k</Text>
          <Text style={styles.summaryLabel}>{t("advanced_stats.total_kcal")}</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        {(["heatmap", "chart"] as const).map((tabKey) => (
          <TouchableOpacity
            key={tabKey}
            style={[styles.tabBtn, tab === tabKey && styles.tabBtnActive]}
            onPress={() => setTab(tabKey)}
          >
            <Text style={[styles.tabText, tab === tabKey && styles.tabTextActive]}>
              {tabKey === "heatmap" ? t("advanced_stats.heatmap_tab") : t("advanced_stats.chart_tab")}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {tab === "heatmap" ? (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>{t("advanced_stats.heatmap_title")}</Text>
          <View style={styles.legendRow}>
            {[0, 0.33, 0.66, 1].map((v, i) => (
              <View key={i} style={[styles.legendCell, { backgroundColor: v === 0 ? "#1e293b" : `rgba(59,130,246,${0.2 + 0.8 * v})` }]} />
            ))}
            <Text style={styles.legendText}>{t("advanced_stats.heatmap_legend")}</Text>
          </View>
          <HeatMap data={heatmap} />
        </View>
      ) : (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>{t("advanced_stats.chart_title")}</Text>
          <BarChart data={monthlyStats} />
          <View style={styles.monthTable}>
            {monthlyStats.map((d) => (
              <View key={d.month} style={styles.monthRow}>
                <Text style={styles.monthLabel}>{d.month}</Text>
                <Text style={styles.monthVal}>{d.sessions} {t("advanced_stats.sessions_unit")}</Text>
                <Text style={styles.monthVal}>{d.kcal} kcal</Text>
                <Text style={styles.monthVal}>{d.minutes} {t("advanced_stats.min_unit")}</Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0A0F1F" },
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#0A0F1F" },
  headerRow: { flexDirection: "row", alignItems: "center", padding: 16, paddingBottom: 8 },
  back: { width: 60 },
  backText: { color: "#94a3b8", fontSize: 14 },
  header: { flex: 1, color: "white", fontSize: 20, fontWeight: "bold", textAlign: "center" },

  summaryRow: { flexDirection: "row", paddingHorizontal: 16, gap: 10, marginBottom: 8 },
  summaryCard: {
    flex: 1, backgroundColor: "#1e293b", borderRadius: 12, padding: 14,
    alignItems: "center", borderWidth: 1, borderColor: "#334155",
  },
  summaryVal: { color: "#3b82f6", fontSize: 22, fontWeight: "bold" },
  summaryLabel: { color: "#64748b", fontSize: 11, marginTop: 2 },

  tabs: { flexDirection: "row", paddingHorizontal: 16, gap: 8, marginBottom: 8 },
  tabBtn: {
    flex: 1, paddingVertical: 8, borderRadius: 8,
    backgroundColor: "#1e293b", alignItems: "center",
  },
  tabBtnActive: { backgroundColor: "#2563eb" },
  tabText: { color: "#64748b", fontSize: 12, fontWeight: "600" },
  tabTextActive: { color: "white" },

  card: {
    margin: 16, backgroundColor: "#1e293b", borderRadius: 16,
    padding: 16, borderWidth: 1, borderColor: "#334155",
  },
  sectionTitle: { color: "white", fontSize: 14, fontWeight: "bold", marginBottom: 12 },

  legendRow: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 8 },
  legendCell: { width: 12, height: 12, borderRadius: 2 },
  legendText: { color: "#64748b", fontSize: 10, marginLeft: 4 },

  heatMap: { flexDirection: "row", gap: 3, flexWrap: "nowrap", overflow: "hidden" },
  heatWeek: { gap: 3 },
  heatCell: { width: 10, height: 10, borderRadius: 2 },

  barChartWrap: {
    flexDirection: "row", alignItems: "flex-end", height: 120,
    gap: 6, justifyContent: "space-between", marginBottom: 12,
  },
  barCol: { flex: 1, alignItems: "center", height: "100%" },
  barVal: { color: "#94a3b8", fontSize: 8, marginBottom: 2 },
  barBg: {
    flex: 1, width: "100%", backgroundColor: "#334155",
    borderRadius: 4, overflow: "hidden", justifyContent: "flex-end",
  },
  barFill: { width: "100%", backgroundColor: "#3b82f6", borderRadius: 4 },
  barLabel: { color: "#64748b", fontSize: 9, marginTop: 3 },
  barSessions: { color: "#3b82f6", fontSize: 9 },

  monthTable: { gap: 6, marginTop: 4 },
  monthRow: { flexDirection: "row", justifyContent: "space-between" },
  monthLabel: { color: "#94a3b8", fontSize: 12, flex: 1 },
  monthVal: { color: "#64748b", fontSize: 12, flex: 1, textAlign: "right" },
});
