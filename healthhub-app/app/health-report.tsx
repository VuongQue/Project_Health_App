import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import ViewShot from "react-native-view-shot";
import * as Sharing from "expo-sharing";
import axiosClient from "@/src/api/axiosClient";
import stepsApi from "@/src/api/stepsApi";
import { waterIntakeApi } from "@/src/api/waterIntakeApi";
import { useColors, Colors, Radius, Spacing, sf, sw } from "@/src/theme";

interface ReportData {
  user: { fullName: string; level: number; points: number };
  steps: number;
  waterMl: number;
  waterGoalMl: number;
  weight?: number;
  bmi?: number;
  workoutsThisWeek: number;
}

export default function HealthReportScreen() {
  const router = useRouter();
  const colors = useColors();
  const shotRef = useRef<ViewShot>(null);
  const [loading, setLoading] = useState(true);
  const [sharing, setSharing] = useState(false);
  const [data, setData] = useState<ReportData | null>(null);

  const load = useCallback(async () => {
    try {
      const [meRes, stepsRes, waterToday] = await Promise.all([
        axiosClient.get("/users/me"),
        stepsApi.getToday().catch(() => ({ data: { steps: 0 } })),
        waterIntakeApi.getToday().catch(() => ({ total: 0, goal: 2000 })),
      ]);

      const me = (meRes.data as any);
      const steps = (stepsRes.data as any).steps ?? 0;
      const water = waterToday as any;

      setData({
        user: { fullName: me.fullName, level: me.level, points: me.points },
        steps,
        waterMl: water.total ?? 0,
        waterGoalMl: water.goal ?? 2000,
        workoutsThisWeek: 0,
      });
    } catch {
      Alert.alert("Lỗi", "Không thể tải dữ liệu báo cáo.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleShare = async () => {
    if (!shotRef.current) return;
    setSharing(true);
    try {
      const uri = await (shotRef.current as any).capture();
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(uri, { mimeType: "image/png", dialogTitle: "Chia sẻ báo cáo sức khoẻ" });
      } else {
        Alert.alert("", "Thiết bị không hỗ trợ chia sẻ.");
      }
    } catch {
      Alert.alert("Lỗi", "Không thể chụp ảnh màn hình.");
    } finally {
      setSharing(false);
    }
  };

  const today = new Date().toLocaleDateString("vi-VN", {
    weekday: "long", day: "2-digit", month: "2-digit", year: "numeric",
  });

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.bgPrimary }]}>
        <ActivityIndicator color={Colors.primary} size="large" />
      </View>
    );
  }

  const waterPct = data ? Math.min(data.waterMl / data.waterGoalMl, 1) : 0;
  const stepsPct = data ? Math.min(data.steps / 10000, 1) : 0;

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.bgPrimary }]}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <Text style={[styles.backText, { color: colors.textMuted }]} numberOfLines={1}>
            ← Quay lại
          </Text>
        </TouchableOpacity>
        <Text style={[styles.header, { color: colors.textPrimary }]}>Báo cáo sức khoẻ</Text>
        <TouchableOpacity
          style={[styles.shareBtn, { backgroundColor: Colors.primary }]}
          onPress={handleShare}
          disabled={sharing}
        >
          <Text style={styles.shareBtnText}>{sharing ? "..." : "Chia sẻ"}</Text>
        </TouchableOpacity>
      </View>

      <ViewShot ref={shotRef} options={{ format: "png", quality: 0.95 }} style={[styles.reportCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
        <View style={[styles.reportHeader, { borderBottomColor: colors.border }]}>
          <Text style={[styles.reportTitle, { color: Colors.primary }]}>HealthHub — Báo cáo hàng ngày</Text>
          <Text style={[styles.reportDate, { color: colors.textMuted }]}>{today}</Text>
        </View>

        <View style={styles.reportUser}>
          <Text style={[styles.reportName, { color: colors.textPrimary }]}>{data?.user.fullName}</Text>
          <Text style={[styles.reportLevel, { color: Colors.warning }]}>
            Lv.{data?.user.level} · {data?.user.points} điểm
          </Text>
        </View>

        {/* Số bước */}
        <View style={[styles.metricCard, { backgroundColor: colors.bgSecondary, borderColor: colors.border }]}>
          <Text style={[styles.metricTitle, { color: colors.textSecondary }]}>👟 Số bước chân</Text>
          <Text style={[styles.metricValue, { color: colors.textPrimary }]}>
            {(data?.steps ?? 0).toLocaleString()}
          </Text>
          <Text style={[styles.metricSub, { color: colors.textMuted }]}>Mục tiêu: 10.000 bước</Text>
          <View style={[styles.bar, { backgroundColor: colors.border }]}>
            <View style={[styles.barFill, { width: `${Math.round(stepsPct * 100)}%`, backgroundColor: Colors.primary }]} />
          </View>
          <Text style={[styles.metricPct, { color: colors.textMuted }]}>{Math.round(stepsPct * 100)}%</Text>
        </View>

        {/* Nước */}
        <View style={[styles.metricCard, { backgroundColor: colors.bgSecondary, borderColor: colors.border }]}>
          <Text style={[styles.metricTitle, { color: colors.textSecondary }]}>💧 Lượng nước uống</Text>
          <Text style={[styles.metricValue, { color: colors.textPrimary }]}>{data?.waterMl ?? 0} ml</Text>
          <Text style={[styles.metricSub, { color: colors.textMuted }]}>
            Mục tiêu: {data?.waterGoalMl ?? 2000} ml
          </Text>
          <View style={[styles.bar, { backgroundColor: colors.border }]}>
            <View style={[styles.barFill, { width: `${Math.round(waterPct * 100)}%`, backgroundColor: Colors.info }]} />
          </View>
          <Text style={[styles.metricPct, { color: colors.textMuted }]}>{Math.round(waterPct * 100)}%</Text>
        </View>

        <View style={styles.reportFooter}>
          <Text style={[styles.footerText, { color: colors.textMuted }]}>Tạo bởi HealthHub</Text>
        </View>
      </ViewShot>
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
  back: { width: 80 },
  backText: { fontSize: sf(14) },
  header: { flex: 1, fontSize: sf(20), fontWeight: "bold", textAlign: "center" },
  shareBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: Radius.md },
  shareBtnText: { color: "white", fontWeight: "600", fontSize: sf(13) },

  reportCard: {
    margin: Spacing.base, borderRadius: Radius.xxl,
    padding: Spacing.xl, borderWidth: 1,
  },
  reportHeader: { marginBottom: 16, borderBottomWidth: 1, paddingBottom: 12 },
  reportTitle: { fontSize: sf(18), fontWeight: "bold" },
  reportDate: { fontSize: sf(12), marginTop: 2 },
  reportUser: { marginBottom: 16 },
  reportName: { fontSize: sf(18), fontWeight: "bold" },
  reportLevel: { fontSize: sf(13), marginTop: 2 },

  metricCard: {
    borderRadius: Radius.lg, padding: 14,
    marginBottom: 10, borderWidth: 1,
  },
  metricTitle: { fontSize: sf(13), marginBottom: 4 },
  metricValue: { fontSize: sf(24), fontWeight: "bold" },
  metricSub: { fontSize: sf(11), marginTop: 2, marginBottom: 6 },
  bar: { height: 6, borderRadius: 3, overflow: "hidden" },
  barFill: { height: "100%", borderRadius: 3, minWidth: 4 },
  metricPct: { fontSize: sf(11), marginTop: 4, textAlign: "right" },

  reportFooter: { marginTop: 16, alignItems: "center" },
  footerText: { fontSize: sf(11) },
});
