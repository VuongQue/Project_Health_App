import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Alert, RefreshControl,
} from "react-native";
import { Pedometer } from "expo-sensors";
import { LinearGradient } from "expo-linear-gradient";
import { Footprints, Flame, Timer, TrendingUp, Play, Square } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import stepsApi, { DailyStepsRecord } from "@/src/api/stepsApi";
import { useColors, Colors, Radius, Spacing, sw, sf } from "@/src/theme";

const GOAL = 10000;

export default function StepsScreen() {
  const colors = useColors();
  const { t } = useTranslation();
  const [steps, setSteps] = useState(0);
  const [goal] = useState(GOAL);
  const [tracking, setTracking] = useState(false);
  const [available, setAvailable] = useState<boolean | null>(null);
  const [history, setHistory] = useState<DailyStepsRecord[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const subRef = useRef<any>(null);
  const savedRef = useRef<number>(0);

  const loadData = useCallback(async (silent = false) => {
    try {
      const [todayRes, histRes] = await Promise.all([
        stepsApi.getToday(),
        stepsApi.getHistory(7),
      ]);
      const saved = (todayRes.data as DailyStepsRecord).steps;
      savedRef.current = saved;
      setSteps(saved);
      setHistory((histRes.data as DailyStepsRecord[]).reverse());
    } catch {}
    finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    Pedometer.isAvailableAsync().then(setAvailable).catch(() => setAvailable(false));
  }, [loadData]);

  const startTracking = async () => {
    if (!available) {
      Alert.alert(t("steps.no_sensor"), t("steps.no_sensor"));
      return;
    }
    const { granted } = await Pedometer.requestPermissionsAsync();
    if (!granted) {
      Alert.alert(t("steps.permission_denied"), t("steps.permission_denied"));
      return;
    }
    subRef.current = Pedometer.watchStepCount((result) => {
      setSteps(savedRef.current + result.steps);
    });
    setTracking(true);
  };

  const stopTracking = async () => {
    subRef.current?.remove();
    setTracking(false);
    try {
      await stepsApi.upsert(steps, goal);
    } catch {}
  };

  useEffect(() => () => { subRef.current?.remove(); }, []);

  const pct = Math.min((steps / goal) * 100, 100);
  const calories = Math.round(steps * 0.04);
  const distanceKm = (steps * 0.00078).toFixed(2);
  const minutes = Math.floor(steps / 100);
  const maxSteps = Math.max(...history.map((r) => r.steps), 1);

  const ringColor = pct >= 100 ? Colors.success : pct >= 50 ? Colors.primary : Colors.warning;
  const ringGradient: [string, string] = pct >= 100
    ? [Colors.success, Colors.teal]
    : pct >= 50
    ? [Colors.primary, "#6366F1"]
    : [Colors.warning, Colors.orange];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.bgSecondary }]}
      contentContainerStyle={{ paddingBottom: 100 }}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(true); }} tintColor={colors.primary} />}
    >
      {/* Hero Header */}
      <LinearGradient colors={["#0B1629", "#0E1B2E", colors.bgSecondary]} style={styles.hero}>
        <View style={styles.blobBL} />
        <Text style={[styles.heroTitle, { color: colors.textPrimary }]}>{t("steps.title")}</Text>
        <Text style={[styles.heroSub, { color: colors.textMuted }]}>{t("steps.subtitle")}</Text>
      </LinearGradient>

      {/* Ring Card */}
      <View style={styles.section}>
        <LinearGradient colors={["#0E1A30", colors.bgCard]} style={[styles.ringCard, { borderColor: colors.border }]}>
          {/* Circular ring visual */}
          <View style={styles.ringOuter}>
            <View style={[styles.ringTrack, { borderColor: ringColor + "25" }]}>
              <View style={[styles.ringArc, {
                borderColor: "transparent",
                borderTopColor: pct > 0 ? ringColor : "transparent",
                borderRightColor: pct > 25 ? ringColor : "transparent",
                borderBottomColor: pct > 50 ? ringColor : "transparent",
                borderLeftColor: pct > 75 ? ringColor : "transparent",
              }]} />
              <View style={styles.ringInner}>
                <Text style={[styles.stepCount, { color: ringColor }]}>{steps.toLocaleString()}</Text>
                <Text style={[styles.stepUnit, { color: colors.textSecondary }]}>{t("steps.unit")}</Text>
                <Text style={[styles.goalHint, { color: colors.textMuted }]}>/ {goal.toLocaleString()}</Text>
              </View>
            </View>
          </View>

          {/* Progress bar */}
          <View style={[styles.progressBg, { backgroundColor: colors.bgSecondary }]}>
            <LinearGradient
              colors={ringGradient}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={[styles.progressFill, { width: `${pct}%` }]}
            />
          </View>
          <Text style={[styles.pctText, { color: colors.textMuted }]}>{Math.round(pct)}% mục tiêu hôm nay</Text>

          {/* Stats row */}
          <View style={[styles.statsRow, { borderColor: colors.border }]}>
            <StepStat icon={<Flame size={16} color={Colors.orange} />} bg={Colors.orangeBg} val={String(calories)} unit="kcal" label={t("steps.calories")} textPrimary={colors.textPrimary} textSecondary={colors.textSecondary} textMuted={colors.textMuted} />
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <StepStat icon={<Footprints size={16} color={Colors.primary} />} bg={Colors.primaryBg} val={String(distanceKm)} unit="km" label={t("steps.distance")} textPrimary={colors.textPrimary} textSecondary={colors.textSecondary} textMuted={colors.textMuted} />
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <StepStat icon={<Timer size={16} color={Colors.success} />} bg={Colors.successBg} val={String(minutes)} unit="phút" label={t("steps.time")} textPrimary={colors.textPrimary} textSecondary={colors.textSecondary} textMuted={colors.textMuted} />
          </View>

          {/* Tracking button */}
          {available === false ? (
            <View style={styles.noSensorBox}>
              <Text style={styles.noSensorText}>{t("steps.no_sensor")}</Text>
            </View>
          ) : (
            <TouchableOpacity
              onPress={tracking ? stopTracking : startTracking}
              activeOpacity={0.85}
              style={{ borderRadius: Radius.xl, overflow: "hidden" }}
            >
              <LinearGradient
                colors={tracking ? [Colors.danger, "#C0392B"] : ringGradient}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={styles.trackBtn}
              >
                {tracking
                  ? <><Square size={16} color="white" fill="white" /><Text style={styles.trackBtnText}>{t("steps.stop_tracking")}</Text></>
                  : <><Play size={16} color="white" fill="white" /><Text style={styles.trackBtnText}>{t("steps.start_tracking")}</Text></>
                }
              </LinearGradient>
            </TouchableOpacity>
          )}
        </LinearGradient>
      </View>

      {/* Weekly Chart */}
      {history.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <TrendingUp size={15} color={Colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>{t("steps.last_7_days")}</Text>
          </View>
          <View style={[styles.chartCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
            <View style={styles.chart}>
              {history.map((r) => {
                const barPct = maxSteps > 0 ? r.steps / maxSteps : 0;
                const reached = r.steps >= r.goalSteps;
                const day = new Date(r.date).toLocaleDateString("vi-VN", { weekday: "short" });
                const isToday = r.date === new Date().toISOString().slice(0, 10);
                return (
                  <View key={r.date} style={styles.barWrap}>
                    <Text style={[styles.barSteps, { color: colors.textMuted }, isToday && { color: Colors.primary }]}>
                      {r.steps >= 1000 ? `${(r.steps / 1000).toFixed(1)}k` : r.steps}
                    </Text>
                    <View style={[styles.barBg, { backgroundColor: colors.bgSecondary }]}>
                      <LinearGradient
                        colors={reached ? [Colors.success, Colors.teal] : [Colors.primary, "#6366F1"]}
                        style={[styles.barFill, { height: `${Math.max(barPct * 100, 3)}%` }]}
                      />
                    </View>
                    <Text style={[styles.barLabel, { color: colors.textMuted }, isToday && { color: Colors.primary, fontWeight: "700" }]}>{day}</Text>
                    {isToday && <View style={styles.todayDot} />}
                  </View>
                );
              })}
            </View>

            {/* Weekly total */}
            <View style={[styles.weekTotalRow, { borderColor: colors.border }]}>
              <Footprints size={13} color={colors.textMuted} />
              <Text style={[styles.weekTotalText, { color: colors.textMuted }]}>
                Tổng tuần: {history.reduce((s, r) => s + r.steps, 0).toLocaleString()} bước
              </Text>
            </View>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

function StepStat({ icon, bg, val, unit, label, textPrimary, textSecondary, textMuted }: {
  icon: React.ReactNode; bg: string; val: string; unit: string; label: string;
  textPrimary: string; textSecondary: string; textMuted: string;
}) {
  return (
    <View style={styles.statItem}>
      <View style={[styles.statIcon, { backgroundColor: bg }]}>{icon}</View>
      <Text style={[styles.statVal, { color: textPrimary }]}>{val}</Text>
      <Text style={[styles.statUnit, { color: textSecondary }]}>{unit}</Text>
      <Text style={[styles.statLabel, { color: textMuted }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  hero: { paddingTop: sw(56), paddingHorizontal: Spacing.base, paddingBottom: Spacing.xl, overflow: "hidden" },
  blobBL: { position: "absolute", bottom: -sw(20), left: -sw(20), width: sw(140), height: sw(140), borderRadius: sw(70), backgroundColor: "rgba(79,142,247,0.08)" },
  heroTitle: { fontSize: sf(28), fontWeight: "800", letterSpacing: -0.5 },
  heroSub: { fontSize: sf(13), marginTop: 3 },

  section: { paddingHorizontal: Spacing.base, marginTop: Spacing.xl },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 7, marginBottom: Spacing.sm },
  sectionTitle: { fontSize: sf(15), fontWeight: "700" },

  ringCard: {
    borderRadius: Radius.xxl, padding: Spacing.xl,
    borderWidth: 1, alignItems: "center", gap: Spacing.md,
  },
  ringOuter: { alignItems: "center", justifyContent: "center", marginBottom: Spacing.sm },
  ringTrack: {
    width: sw(180), height: sw(180), borderRadius: sw(90),
    borderWidth: sw(14), justifyContent: "center", alignItems: "center",
    position: "relative",
  },
  ringArc: {
    position: "absolute", width: sw(180), height: sw(180), borderRadius: sw(90),
    borderWidth: sw(14),
  },
  ringInner: { alignItems: "center", gap: 2 },
  stepCount: { fontSize: sf(36), fontWeight: "900", letterSpacing: -1 },
  stepUnit: { fontSize: sf(13), fontWeight: "600" },
  goalHint: { fontSize: sf(11) },

  progressBg: { width: "100%", height: sw(8), borderRadius: Radius.full, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: Radius.full },
  pctText: { fontSize: sf(12) },

  statsRow: { flexDirection: "row", justifyContent: "space-around", width: "100%", paddingVertical: Spacing.sm, borderTopWidth: 1 },
  statItem: { alignItems: "center", gap: 4 },
  statIcon: { width: sw(34), height: sw(34), borderRadius: sw(10), justifyContent: "center", alignItems: "center", marginBottom: 2 },
  statVal: { fontSize: sf(18), fontWeight: "800" },
  statUnit: { fontSize: sf(10) },
  statLabel: { fontSize: sf(9) },
  statDivider: { width: 1, height: 50 },

  noSensorBox: { backgroundColor: Colors.warningBg, borderRadius: Radius.lg, padding: Spacing.md, width: "100%" },
  noSensorText: { color: Colors.warning, fontSize: sf(12), textAlign: "center" },

  trackBtn: { paddingVertical: sw(14), paddingHorizontal: sw(40), borderRadius: Radius.xl, flexDirection: "row", alignItems: "center", gap: 8 },
  trackBtnText: { color: "white", fontWeight: "700", fontSize: sf(15) },

  chartCard: {
    borderRadius: Radius.xl, padding: Spacing.base,
    borderWidth: 1,
  },
  chart: { flexDirection: "row", alignItems: "flex-end", height: sw(100), gap: 6, justifyContent: "space-between", marginBottom: Spacing.md },
  barWrap: { flex: 1, alignItems: "center", gap: 3 },
  barBg: { flex: 1, width: "100%", borderRadius: 6, overflow: "hidden", justifyContent: "flex-end" },
  barFill: { width: "100%", borderRadius: 6 },
  barLabel: { fontSize: sf(9) },
  barSteps: { fontSize: sf(8) },
  todayDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: Colors.primary },

  weekTotalRow: { flexDirection: "row", alignItems: "center", gap: 6, borderTopWidth: 1, paddingTop: Spacing.sm },
  weekTotalText: { fontSize: sf(12) },
});
