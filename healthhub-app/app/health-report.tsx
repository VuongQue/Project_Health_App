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
      <View style={styles.center}>
        <ActivityIndicator color="#3b82f6" size="large" />
      </View>
    );
  }

  const waterPct = data ? Math.min(data.waterMl / data.waterGoalMl, 1) : 0;
  const stepsPct = data ? Math.min(data.steps / 10000, 1) : 0;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <Text style={styles.backText}>← Quay lại</Text>
        </TouchableOpacity>
        <Text style={styles.header}>Báo cáo sức khoẻ</Text>
        <TouchableOpacity
          style={styles.shareBtn}
          onPress={handleShare}
          disabled={sharing}
        >
          <Text style={styles.shareBtnText}>{sharing ? "..." : "Chia sẻ"}</Text>
        </TouchableOpacity>
      </View>

      <ViewShot ref={shotRef} options={{ format: "png", quality: 0.95 }} style={styles.reportCard}>
        <View style={styles.reportHeader}>
          <Text style={styles.reportTitle}>HealthHub — Báo cáo hàng ngày</Text>
          <Text style={styles.reportDate}>{today}</Text>
        </View>

        <View style={styles.reportUser}>
          <Text style={styles.reportName}>{data?.user.fullName}</Text>
          <Text style={styles.reportLevel}>Lv.{data?.user.level} · {data?.user.points} điểm</Text>
        </View>

        {/* Số bước */}
        <View style={styles.metricCard}>
          <Text style={styles.metricTitle}>👟 Số bước chân</Text>
          <Text style={styles.metricValue}>{(data?.steps ?? 0).toLocaleString()}</Text>
          <Text style={styles.metricSub}>Mục tiêu: 10.000 bước</Text>
          <View style={styles.bar}>
            <View style={[styles.barFill, { width: `${Math.round(stepsPct * 100)}%`, backgroundColor: "#3b82f6" }]} />
          </View>
          <Text style={styles.metricPct}>{Math.round(stepsPct * 100)}%</Text>
        </View>

        {/* Nước */}
        <View style={styles.metricCard}>
          <Text style={styles.metricTitle}>💧 Lượng nước uống</Text>
          <Text style={styles.metricValue}>{data?.waterMl ?? 0} ml</Text>
          <Text style={styles.metricSub}>Mục tiêu: {data?.waterGoalMl ?? 2000} ml</Text>
          <View style={styles.bar}>
            <View style={[styles.barFill, { width: `${Math.round(waterPct * 100)}%`, backgroundColor: "#06b6d4" }]} />
          </View>
          <Text style={styles.metricPct}>{Math.round(waterPct * 100)}%</Text>
        </View>

        <View style={styles.reportFooter}>
          <Text style={styles.footerText}>Tạo bởi HealthHub</Text>
        </View>
      </ViewShot>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0A0F1F" },
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#0A0F1F" },
  headerRow: { flexDirection: "row", alignItems: "center", padding: 16, paddingBottom: 8 },
  back: { width: 80 },
  backText: { color: "#94a3b8", fontSize: 14 },
  header: { flex: 1, color: "white", fontSize: 20, fontWeight: "bold", textAlign: "center" },
  shareBtn: { backgroundColor: "#2563eb", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  shareBtnText: { color: "white", fontWeight: "600", fontSize: 13 },

  reportCard: {
    margin: 16, backgroundColor: "#0f172a", borderRadius: 20,
    padding: 24, borderWidth: 1, borderColor: "#334155",
  },
  reportHeader: { marginBottom: 16, borderBottomWidth: 1, borderBottomColor: "#334155", paddingBottom: 12 },
  reportTitle: { color: "#3b82f6", fontSize: 20, fontWeight: "bold" },
  reportDate: { color: "#64748b", fontSize: 12, marginTop: 2 },
  reportUser: { marginBottom: 16 },
  reportName: { color: "white", fontSize: 18, fontWeight: "bold" },
  reportLevel: { color: "#f59e0b", fontSize: 13, marginTop: 2 },

  metricCard: {
    backgroundColor: "#1e293b", borderRadius: 12, padding: 14,
    marginBottom: 10, borderWidth: 1, borderColor: "#334155",
  },
  metricTitle: { color: "#94a3b8", fontSize: 13, marginBottom: 4 },
  metricValue: { color: "white", fontSize: 24, fontWeight: "bold" },
  metricSub: { color: "#64748b", fontSize: 11, marginTop: 2, marginBottom: 6 },
  bar: { height: 6, backgroundColor: "#334155", borderRadius: 3, overflow: "hidden" },
  barFill: { height: "100%", borderRadius: 3, minWidth: 4 },
  metricPct: { color: "#94a3b8", fontSize: 11, marginTop: 4, textAlign: "right" },

  reportFooter: { marginTop: 16, alignItems: "center" },
  footerText: { color: "#334155", fontSize: 11 },
});
