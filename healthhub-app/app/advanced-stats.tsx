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
import { useColors, Colors, Radius, Spacing, sf, sw } from "@/src/theme";

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
      ? "rgba(255,255,255,0.05)"
      : `rgba(76,142,248,${0.2 + 0.8 * intensity})`;
  return <View style={[styles.heatCell, { backgroundColor: bg }]} />;
}

function HeatMap({ data }: { data: HeatDay[] }) {
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

function BarChart({ data, colors }: { data: MonthStat[]; colors: ReturnType<typeof useColors> }) {
  const maxKcal = Math.max(...data.map((d) => d.kcal), 1);
  return (
    <View style={styles.barChartWrap}>
      {data.map((d) => {
        const pct = d.kcal / maxKcal;
        const [year, month] = d.month.split("-");
        const label = `${month}/${year.slice(2)}`;
        return (
          <View key={d.month} style={styles.barCol}>
            <Text style={[styles.barVal, { color: colors.textSecondary }]}>
              {d.kcal > 0 ? `${(d.kcal / 1000).toFixed(1)}k` : ""}
            </Text>
            <View style={[styles.barBg, { backgroundColor: colors.bgSecondary }]}>
              <View
                style={[
                  styles.barFill,
                  {
                    height: `${Math.max(Math.round(pct * 100), d.kcal > 0 ? 2 : 0)}%`,
                    backgroundColor: Colors.primary,
                  },
                ]}
              />
            </View>
            <Text style={[styles.barLabel, { color: colors.textMuted }]}>{label}</Text>
            <Text style={[styles.barSessions, { color: Colors.primary }]}>{d.sessions}x</Text>
          </View>
        );
      })}
    </View>
  );
}

export default function AdvancedStatsScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const colors = useColors();
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
      <View style={[styles.center, { backgroundColor: colors.bgPrimary }]}>
        <ActivityIndicator color={Colors.primary} size="large" />
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.bgPrimary }]}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <Text style={[styles.backText, { color: colors.textMuted }]} numberOfLines={1}>
            {t("common.back")}
          </Text>
        </TouchableOpacity>
        <Text style={[styles.header, { color: colors.textPrimary }]}>
          {t("advanced_stats.title")}
        </Text>
        <View style={{ width: 60 }} />
      </View>

      {/* Summary cards */}
      <View style={styles.summaryRow}>
        {[
          { val: totalSessions, label: t("advanced_stats.active_days") },
          { val: streak, label: t("advanced_stats.day_streak") },
          { val: `${(totalKcal / 1000).toFixed(1)}k`, label: t("advanced_stats.total_kcal") },
        ].map((item, i) => (
          <View key={i} style={[styles.summaryCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
            <Text style={[styles.summaryVal, { color: Colors.primary }]}>{item.val}</Text>
            <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>{item.label}</Text>
          </View>
        ))}
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        {(["heatmap", "chart"] as const).map((tabKey) => (
          <TouchableOpacity
            key={tabKey}
            style={[
              styles.tabBtn,
              { backgroundColor: colors.bgCard },
              tab === tabKey && { backgroundColor: Colors.primaryDark },
            ]}
            onPress={() => setTab(tabKey)}
          >
            <Text style={[
              styles.tabText,
              { color: colors.textMuted },
              tab === tabKey && { color: "white" },
            ]}>
              {tabKey === "heatmap" ? t("advanced_stats.heatmap_tab") : t("advanced_stats.chart_tab")}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {tab === "heatmap" ? (
        <View style={[styles.card, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            {t("advanced_stats.heatmap_title")}
          </Text>
          <View style={styles.legendRow}>
            {[0, 0.33, 0.66, 1].map((v, i) => (
              <View
                key={i}
                style={[
                  styles.legendCell,
                  { backgroundColor: v === 0 ? "rgba(255,255,255,0.05)" : `rgba(76,142,248,${0.2 + 0.8 * v})` },
                ]}
              />
            ))}
            <Text style={[styles.legendText, { color: colors.textMuted }]}>
              {t("advanced_stats.heatmap_legend")}
            </Text>
          </View>
          <HeatMap data={heatmap} />
        </View>
      ) : (
        <View style={[styles.card, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            {t("advanced_stats.chart_title")}
          </Text>
          <BarChart data={monthlyStats} colors={colors} />
          <View style={styles.monthTable}>
            {monthlyStats.map((d) => (
              <View key={d.month} style={[styles.monthRow, { borderTopColor: colors.border }]}>
                <Text style={[styles.monthLabel, { color: colors.textSecondary }]}>{d.month}</Text>
                <Text style={[styles.monthVal, { color: colors.textMuted }]}>
                  {d.sessions} {t("advanced_stats.sessions_unit")}
                </Text>
                <Text style={[styles.monthVal, { color: colors.textMuted }]}>{d.kcal} kcal</Text>
                <Text style={[styles.monthVal, { color: colors.textMuted }]}>
                  {d.minutes} {t("advanced_stats.min_unit")}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  headerRow: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: Spacing.base, paddingTop: sw(52), paddingBottom: Spacing.sm,
  },
  back: { width: 70 },
  backText: { fontSize: sf(14) },
  header: { flex: 1, fontSize: sf(20), fontWeight: "bold", textAlign: "center" },

  summaryRow: { flexDirection: "row", paddingHorizontal: Spacing.base, gap: 10, marginBottom: Spacing.sm },
  summaryCard: {
    flex: 1, borderRadius: Radius.lg, padding: 14,
    alignItems: "center", borderWidth: 1,
  },
  summaryVal: { fontSize: sf(22), fontWeight: "bold" },
  summaryLabel: { fontSize: sf(11), marginTop: 2, textAlign: "center" },

  tabs: { flexDirection: "row", paddingHorizontal: Spacing.base, gap: 8, marginBottom: Spacing.sm },
  tabBtn: { flex: 1, paddingVertical: 8, borderRadius: Radius.md, alignItems: "center" },
  tabText: { fontSize: sf(12), fontWeight: "600" },

  card: {
    margin: Spacing.base, borderRadius: Radius.xl,
    padding: Spacing.base, borderWidth: 1,
  },
  sectionTitle: { fontSize: sf(14), fontWeight: "bold", marginBottom: 12 },

  legendRow: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 8 },
  legendCell: { width: 12, height: 12, borderRadius: 2 },
  legendText: { fontSize: sf(10), marginLeft: 4 },

  heatMap: { flexDirection: "row", gap: 3, flexWrap: "nowrap", overflow: "hidden" },
  heatWeek: { gap: 3 },
  heatCell: { width: 10, height: 10, borderRadius: 2 },

  barChartWrap: {
    flexDirection: "row", alignItems: "flex-end", height: 120,
    gap: 6, justifyContent: "space-between", marginBottom: 12,
  },
  barCol: { flex: 1, alignItems: "center", height: "100%" },
  barVal: { fontSize: sf(8), marginBottom: 2 },
  barBg: { flex: 1, width: "100%", borderRadius: 4, overflow: "hidden", justifyContent: "flex-end" },
  barFill: { width: "100%", borderRadius: 4 },
  barLabel: { fontSize: sf(9), marginTop: 3 },
  barSessions: { fontSize: sf(9) },

  monthTable: { gap: 6, marginTop: 4 },
  monthRow: { flexDirection: "row", justifyContent: "space-between", paddingTop: 6, borderTopWidth: 1 },
  monthLabel: { fontSize: sf(12), flex: 1 },
  monthVal: { fontSize: sf(12), flex: 1, textAlign: "right" },
});
