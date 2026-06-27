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
import { ArrowLeft, AlertTriangle, AlertCircle, Info, CheckCircle, ShieldAlert } from "lucide-react-native";
import aiApi, { HealthAlert } from "@/src/api/aiApi";
import { Colors, Spacing, Radius, Typography } from "@/src/theme";

const LEVEL_CONFIG = {
  high: {
    icon: AlertTriangle,
    color: Colors.danger,
    bg: "rgba(239,68,68,0.12)",
    border: "rgba(239,68,68,0.3)",
    label: "Nguy cơ cao",
  },
  medium: {
    icon: AlertCircle,
    color: Colors.warning,
    bg: "rgba(234,179,8,0.12)",
    border: "rgba(234,179,8,0.3)",
    label: "Cần chú ý",
  },
  low: {
    icon: Info,
    color: Colors.primary,
    bg: Colors.primaryBg,
    border: Colors.border,
    label: "Gợi ý",
  },
} as const;

export default function HealthAlertsScreen() {
  const router = useRouter();
  const [alerts, setAlerts] = useState<HealthAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await aiApi.getHealthAlerts();
      setAlerts(res.data.alerts ?? []);
    } catch {
      // keep existing
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const highCount = alerts.filter((a) => a.level === "high").length;
  const medCount = alerts.filter((a) => a.level === "medium").length;

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
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Cảnh báo sức khoẻ</Text>
          <Text style={styles.subtitle}>Phân tích dựa trên dữ liệu hôm nay</Text>
        </View>
        <ShieldAlert size={22} color={highCount > 0 ? Colors.danger : medCount > 0 ? Colors.warning : Colors.success} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.primary} size="large" />
          <Text style={styles.loadingText}>Đang phân tích...</Text>
        </View>
      ) : alerts.length === 0 ? (
        <View style={styles.allGoodCard}>
          <CheckCircle size={48} color={Colors.success} />
          <Text style={styles.allGoodTitle}>Sức khoẻ ổn định!</Text>
          <Text style={styles.allGoodSub}>
            Không có cảnh báo nào hôm nay. Hãy tiếp tục duy trì lối sống lành mạnh!
          </Text>
        </View>
      ) : (
        <>
          {/* Summary chips */}
          <View style={styles.summaryRow}>
            {highCount > 0 && (
              <View style={[styles.chip, { backgroundColor: "rgba(239,68,68,0.12)", borderColor: "rgba(239,68,68,0.3)" }]}>
                <AlertTriangle size={12} color={Colors.danger} />
                <Text style={[styles.chipText, { color: Colors.danger }]}>{highCount} nguy cơ cao</Text>
              </View>
            )}
            {medCount > 0 && (
              <View style={[styles.chip, { backgroundColor: "rgba(234,179,8,0.12)", borderColor: "rgba(234,179,8,0.3)" }]}>
                <AlertCircle size={12} color={Colors.warning} />
                <Text style={[styles.chipText, { color: Colors.warning }]}>{medCount} cần chú ý</Text>
              </View>
            )}
          </View>

          {alerts.map((alert, i) => {
            const cfg = LEVEL_CONFIG[alert.level];
            const Icon = cfg.icon;
            return (
              <View
                key={i}
                style={[styles.alertCard, { backgroundColor: cfg.bg, borderColor: cfg.border }]}
              >
                <View style={styles.alertTop}>
                  <View style={[styles.alertIconBox, { backgroundColor: cfg.color + "20" }]}>
                    <Icon size={20} color={cfg.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={styles.alertTitleRow}>
                      <Text style={[styles.alertTitle, { color: cfg.color }]}>{alert.title}</Text>
                      <View style={[styles.levelBadge, { backgroundColor: cfg.color + "20" }]}>
                        <Text style={[styles.levelText, { color: cfg.color }]}>{cfg.label}</Text>
                      </View>
                    </View>
                    <Text style={styles.alertDesc}>{alert.description}</Text>
                  </View>
                </View>
                {alert.link && (
                  <TouchableOpacity
                    style={[styles.actionBtn, { borderColor: cfg.color + "40" }]}
                    onPress={() => router.push(alert.link as any)}
                  >
                    <Text style={[styles.actionText, { color: cfg.color }]}>{alert.action} →</Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          })}
        </>
      )}

      {/* Disclaimer */}
      <View style={styles.disclaimer}>
        <Info size={13} color={Colors.textMuted} />
        <Text style={styles.disclaimerText}>
          Cảnh báo này chỉ mang tính tham khảo dựa trên dữ liệu bạn nhập. Hãy gặp bác sĩ nếu có lo ngại về sức khoẻ.
        </Text>
      </View>

      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgSecondary },
  content: { paddingHorizontal: Spacing.base, paddingTop: Spacing.xl },
  center: { alignItems: "center", paddingVertical: 60, gap: 12 },
  loadingText: { color: Colors.textMuted, ...Typography.sm },

  header: { flexDirection: "row", alignItems: "center", gap: Spacing.md, marginBottom: Spacing.xl },
  backBtn: {
    width: 40, height: 40, backgroundColor: Colors.bgCard, borderRadius: Radius.md,
    justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: Colors.border,
  },
  title: { color: Colors.textPrimary, ...Typography.xxxl, fontWeight: "800" },
  subtitle: { color: Colors.textMuted, ...Typography.xs, marginTop: 2 },

  summaryRow: { flexDirection: "row", gap: Spacing.sm, marginBottom: Spacing.md, flexWrap: "wrap" },
  chip: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: Radius.full, borderWidth: 1,
  },
  chipText: { fontSize: 12, fontWeight: "600" },

  allGoodCard: {
    backgroundColor: Colors.bgCard, borderRadius: Radius.xxl, padding: Spacing.xxl,
    alignItems: "center", gap: 12, borderWidth: 1, borderColor: Colors.border,
    marginVertical: Spacing.xl,
  },
  allGoodTitle: { color: Colors.textPrimary, fontSize: 20, fontWeight: "800" },
  allGoodSub: { color: Colors.textMuted, fontSize: 14, textAlign: "center", lineHeight: 20 },

  alertCard: {
    borderRadius: Radius.xl, padding: Spacing.base, marginBottom: Spacing.md, borderWidth: 1,
  },
  alertTop: { flexDirection: "row", gap: Spacing.md, alignItems: "flex-start" },
  alertIconBox: { width: 40, height: 40, borderRadius: Radius.md, justifyContent: "center", alignItems: "center", flexShrink: 0 },
  alertTitleRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" },
  alertTitle: { fontSize: 14, fontWeight: "700" },
  levelBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: Radius.full },
  levelText: { fontSize: 10, fontWeight: "600" },
  alertDesc: { color: Colors.textSecondary, fontSize: 13, lineHeight: 18 },

  actionBtn: {
    marginTop: Spacing.md, borderTopWidth: 1, paddingTop: Spacing.sm,
  },
  actionText: { fontSize: 13, fontWeight: "700" },

  disclaimer: {
    flexDirection: "row", gap: 8, alignItems: "flex-start",
    backgroundColor: Colors.bgCard, borderRadius: Radius.lg, padding: Spacing.md,
    borderWidth: 1, borderColor: Colors.border, marginTop: Spacing.md,
  },
  disclaimerText: { color: Colors.textMuted, fontSize: 11, flex: 1, lineHeight: 16 },
});
