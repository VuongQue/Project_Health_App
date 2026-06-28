import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import {
  Heart,
  Wind,
  Moon,
  Zap,
  RefreshCw,
  Wifi,
  WifiOff,
  TrendingUp,
  Footprints,
  Flame,
} from "lucide-react-native";
import { useWearableHealth } from "@/src/context/WearableHealthContext";
import { useColors, Radius, Spacing, sf, sw } from "@/src/theme";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function minutesToHourMin(min: number | null): string {
  if (min == null) return "--";
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function heartRateZone(bpm: number | null): { label: string; color: string } {
  if (bpm == null) return { label: "--", color: "#94a3b8" };
  if (bpm < 60) return { label: "Nghỉ ngơi", color: "#3B82F6" };
  if (bpm < 80) return { label: "Bình thường", color: "#10B981" };
  if (bpm < 100) return { label: "Tích cực", color: "#F59E0B" };
  return { label: "Cao", color: "#EF4444" };
}

function stressLevel(score: number | null): { label: string; color: string } {
  if (score == null) return { label: "--", color: "#94a3b8" };
  if (score < 30) return { label: "Thấp", color: "#10B981" };
  if (score < 60) return { label: "Trung bình", color: "#F59E0B" };
  return { label: "Cao", color: "#EF4444" };
}

function sleepQuality(min: number | null): { label: string; color: string } {
  if (min == null) return { label: "--", color: "#94a3b8" };
  if (min >= 420) return { label: "Tốt (7h+)", color: "#10B981" };
  if (min >= 360) return { label: "Ổn (6h+)", color: "#F59E0B" };
  return { label: "Thiếu ngủ", color: "#EF4444" };
}

// ─── Components ───────────────────────────────────────────────────────────────

function MetricCard({
  icon,
  label,
  value,
  sub,
  gradientColors,
  badge,
  badgeColor,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  gradientColors: [string, string];
  badge?: string;
  badgeColor?: string;
}) {
  const colors = useColors();
  return (
    <LinearGradient colors={gradientColors} style={styles.card} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
      <View style={styles.cardHeader}>
        <View style={styles.cardIcon}>{icon}</View>
        {badge ? (
          <View style={[styles.badge, { backgroundColor: badgeColor ?? "#10B981" }]}>
            <Text style={styles.badgeText}>{badge}</Text>
          </View>
        ) : null}
      </View>
      <Text style={styles.cardValue}>{value}</Text>
      <Text style={styles.cardLabel}>{label}</Text>
      {sub ? <Text style={styles.cardSub}>{sub}</Text> : null}
    </LinearGradient>
  );
}

function HistoryBar({
  value,
  max,
  label,
  color,
}: {
  value: number;
  max: number;
  label: string;
  color: string;
}) {
  const pct = max > 0 ? Math.min(value / max, 1) : 0;
  return (
    <View style={styles.barRow}>
      <Text style={styles.barLabel}>{label}</Text>
      <View style={styles.barTrack}>
        <View style={[styles.barFill, { width: `${pct * 100}%`, backgroundColor: color }]} />
      </View>
      <Text style={styles.barValue}>{value}</Text>
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function WearableHealthScreen() {
  const colors = useColors();
  const { isAvailable, isSyncing, lastSyncAt, todayData, summary, sync } = useWearableHealth();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await sync();
    setRefreshing(false);
  }, [sync]);

  const handleSyncPress = useCallback(async () => {
    if (!isAvailable) {
      Alert.alert(
        "Không hỗ trợ",
        "Thiết bị hoặc nền tảng này không hỗ trợ Health Connect / HealthKit.\n\nĐảm bảo:\n• Đã cài ứng dụng Health Connect (Android)\n• Xiaomi Band đã sync với Zepp Life\n• Zepp Life đã kết nối với Google Fit / Health Connect",
      );
      return;
    }
    await sync();
  }, [isAvailable, sync]);

  const today = todayData ?? {};
  const hr = today.heart_rate;
  const spo2 = today.spo2;
  const sleep = today.sleep;
  const stress = today.stress;
  const steps = today.steps_wearable;
  const cals = today.calories_wearable;

  const hrZone = heartRateZone(hr?.value ?? null);
  const stressLvl = stressLevel(stress?.value ?? null);
  const sleepQ = sleepQuality(sleep?.value ?? null);

  const maxHr = Math.max(...(summary?.heartRateHistory.map((r) => r.value) ?? [1]));

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: colors.text }]}>Sức khoẻ Wearable</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Từ Xiaomi Band / Google Fit
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.syncBtn, { backgroundColor: isAvailable ? colors.primary : colors.border }]}
          onPress={handleSyncPress}
          disabled={isSyncing}
        >
          {isSyncing ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <RefreshCw size={sw(16)} color="#fff" />
          )}
          <Text style={styles.syncText}>{isSyncing ? "Đang sync..." : "Sync"}</Text>
        </TouchableOpacity>
      </View>

      {/* Trạng thái kết nối */}
      <View style={[styles.statusBar, { backgroundColor: isAvailable ? "#d1fae5" : "#fee2e2" }]}>
        {isAvailable ? (
          <Wifi size={sw(14)} color="#059669" />
        ) : (
          <WifiOff size={sw(14)} color="#dc2626" />
        )}
        <Text style={[styles.statusText, { color: isAvailable ? "#059669" : "#dc2626" }]}>
          {isAvailable
            ? `Health Connect đã kết nối${lastSyncAt ? ` · Sync lúc ${lastSyncAt.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}` : ""}`
            : "Chưa kết nối · Cần cài Health Connect và cấp quyền"}
        </Text>
      </View>

      {/* Grid chỉ số hôm nay */}
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Hôm nay</Text>
      <View style={styles.grid}>
        <MetricCard
          icon={<Heart size={sw(20)} color="#fff" fill="#fff" />}
          label="Nhịp tim TB"
          value={hr?.value != null ? `${hr.value} bpm` : "--"}
          sub={hr?.minValue != null ? `${hr.minValue}–${hr.maxValue} bpm` : undefined}
          gradientColors={["#ef4444", "#f97316"]}
          badge={hrZone.label}
          badgeColor={hrZone.color}
        />
        <MetricCard
          icon={<Wind size={sw(20)} color="#fff" />}
          label="SpO2"
          value={spo2?.value != null ? `${spo2.value}%` : "--"}
          sub={spo2?.value != null ? (spo2.value >= 95 ? "Bình thường" : "Thấp") : undefined}
          gradientColors={["#3b82f6", "#06b6d4"]}
          badge={spo2?.value != null ? (spo2.value >= 95 ? "Tốt" : "Thấp") : undefined}
          badgeColor={spo2?.value != null && spo2.value >= 95 ? "#10B981" : "#ef4444"}
        />
        <MetricCard
          icon={<Moon size={sw(20)} color="#fff" />}
          label="Giấc ngủ"
          value={minutesToHourMin(sleep?.value ?? null)}
          sub={
            sleep?.meta
              ? `Sâu ${minutesToHourMin(sleep.meta.deep)} · REM ${minutesToHourMin(sleep.meta.rem)}`
              : undefined
          }
          gradientColors={["#8b5cf6", "#6366f1"]}
          badge={sleepQ.label}
          badgeColor={sleepQ.color}
        />
        <MetricCard
          icon={<Zap size={sw(20)} color="#fff" />}
          label="Stress"
          value={stress?.value != null ? `${stress.value}/100` : "--"}
          gradientColors={["#f59e0b", "#ef4444"]}
          badge={stressLvl.label}
          badgeColor={stressLvl.color}
        />
        {steps ? (
          <MetricCard
            icon={<Footprints size={sw(20)} color="#fff" />}
            label="Bước chân"
            value={steps.value.toLocaleString()}
            gradientColors={["#10b981", "#059669"]}
          />
        ) : null}
        {cals ? (
          <MetricCard
            icon={<Flame size={sw(20)} color="#fff" />}
            label="Calories đốt"
            value={`${cals.value} kcal`}
            gradientColors={["#f97316", "#ef4444"]}
          />
        ) : null}
      </View>

      {/* Tổng hợp 7 ngày */}
      {summary && (
        <>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>7 ngày qua</Text>
          <View style={[styles.summaryBox, { backgroundColor: colors.surface }]}>
            <SummaryRow label="Nhịp tim TB" value={summary.avgHeartRate ? `${summary.avgHeartRate} bpm` : "--"} color="#ef4444" />
            <SummaryRow label="SpO2 TB" value={summary.avgSpo2 ? `${summary.avgSpo2}%` : "--"} color="#3b82f6" />
            <SummaryRow label="Stress TB" value={summary.avgStress ? `${summary.avgStress}/100` : "--"} color="#f59e0b" />
            <SummaryRow label="Giấc ngủ TB" value={minutesToHourMin(summary.avgSleepMin)} color="#8b5cf6" />
          </View>

          {/* Biểu đồ nhịp tim 7 ngày */}
          {summary.heartRateHistory.length > 0 && (
            <>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Nhịp tim 7 ngày <TrendingUp size={sf(14)} color={colors.primary} />
              </Text>
              <View style={[styles.chartBox, { backgroundColor: colors.surface }]}>
                {summary.heartRateHistory.map((r) => (
                  <HistoryBar
                    key={r.date}
                    label={r.date.slice(5)}
                    value={r.value}
                    max={maxHr}
                    color="#ef4444"
                  />
                ))}
              </View>
            </>
          )}

          {/* Giấc ngủ 7 ngày */}
          {summary.sleepHistory.length > 0 && (
            <>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Giấc ngủ 7 ngày</Text>
              <View style={[styles.chartBox, { backgroundColor: colors.surface }]}>
                {summary.sleepHistory.map((r) => (
                  <HistoryBar
                    key={r.date}
                    label={r.date.slice(5)}
                    value={Math.round(r.value / 60 * 10) / 10}
                    max={10}
                    color="#8b5cf6"
                  />
                ))}
              </View>
            </>
          )}
        </>
      )}

      {/* Hướng dẫn nếu chưa kết nối */}
      {!isAvailable && (
        <View style={[styles.guideBox, { backgroundColor: colors.surface }]}>
          <Text style={[styles.guideTitle, { color: colors.text }]}>Cách kết nối Xiaomi Band 10</Text>
          {[
            "1. Cài ứng dụng Zepp Life (hoặc Mi Fitness) trên điện thoại",
            "2. Kết nối Xiaomi Band 10 với Zepp Life qua Bluetooth",
            "3. Trong Zepp Life → Cài đặt → Kết nối Google Fit / Health Connect",
            "4. Cài ứng dụng Health Connect từ Google Play",
            "5. Mở HealthHub → Nhấn nút Sync ở màn hình này",
            "6. Cấp quyền truy cập Health Connect khi được hỏi",
          ].map((step) => (
            <Text key={step} style={[styles.guideStep, { color: colors.textSecondary }]}>
              {step}
            </Text>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

function SummaryRow({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={styles.summaryRow}>
      <View style={[styles.summaryDot, { backgroundColor: color }]} />
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={[styles.summaryValue, { color }]}>{value}</Text>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: Spacing.md, paddingBottom: 40 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: Spacing.sm },
  title: { fontSize: sf(20), fontWeight: "700" },
  subtitle: { fontSize: sf(13), marginTop: 2 },
  syncBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 8,
    borderRadius: Radius.md,
  },
  syncText: { color: "#fff", fontSize: sf(13), fontWeight: "600" },
  statusBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    padding: Spacing.sm,
    borderRadius: Radius.sm,
    marginBottom: Spacing.md,
  },
  statusText: { fontSize: sf(12), flex: 1 },
  sectionTitle: { fontSize: sf(15), fontWeight: "700", marginBottom: Spacing.sm, marginTop: Spacing.md },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.sm },
  card: {
    width: (sw(375) - Spacing.md * 2 - Spacing.sm) / 2,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    minHeight: sw(100),
  },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 },
  cardIcon: { width: sw(36), height: sw(36), borderRadius: sw(18), backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 99 },
  badgeText: { color: "#fff", fontSize: sf(10), fontWeight: "700" },
  cardValue: { color: "#fff", fontSize: sf(22), fontWeight: "800" },
  cardLabel: { color: "rgba(255,255,255,0.85)", fontSize: sf(12), marginTop: 2 },
  cardSub: { color: "rgba(255,255,255,0.7)", fontSize: sf(11), marginTop: 2 },
  summaryBox: { borderRadius: Radius.lg, padding: Spacing.md, gap: 10 },
  summaryRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  summaryDot: { width: 8, height: 8, borderRadius: 4 },
  summaryLabel: { flex: 1, fontSize: sf(14), color: "#64748b" },
  summaryValue: { fontSize: sf(14), fontWeight: "700" },
  chartBox: { borderRadius: Radius.lg, padding: Spacing.md, gap: 8 },
  barRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  barLabel: { width: sw(36), fontSize: sf(11), color: "#94a3b8" },
  barTrack: { flex: 1, height: 6, backgroundColor: "#e2e8f0", borderRadius: 3, overflow: "hidden" },
  barFill: { height: "100%", borderRadius: 3 },
  barValue: { width: sw(30), fontSize: sf(11), color: "#64748b", textAlign: "right" },
  guideBox: { borderRadius: Radius.lg, padding: Spacing.md, marginTop: Spacing.md, gap: 8 },
  guideTitle: { fontSize: sf(15), fontWeight: "700", marginBottom: 4 },
  guideStep: { fontSize: sf(13), lineHeight: 20 },
});
