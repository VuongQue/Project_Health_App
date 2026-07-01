import React, { useCallback, useState } from "react";
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  RefreshControl, ActivityIndicator, Alert,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import {
  ArrowLeft, Calendar, CheckCircle, Clock, Trophy,
  RefreshCw, Globe, Lock,
} from "lucide-react-native";
import eventsApi, { EventRegistrationItem, RegistrationStatus } from "@/src/api/eventsApi";
import { useColors, Colors, Spacing, Radius, Shadow, sw, sf } from "@/src/theme";
import { useTheme } from "@/src/context/ThemeContext";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

const STATUS_CONFIG: Record<RegistrationStatus, { label: string; color: string }> = {
  registered:  { label: "Chờ bắt đầu", color: "#F59E0B" },
  checked_in:  { label: "Đang tham gia", color: "#4C8EF8" },
  completed:   { label: "Hoàn thành", color: "#22C55E" },
  cancelled:   { label: "Đã huỷ", color: "#6B7280" },
};

function ProgressCard({ item, onCheckIn }: { item: EventRegistrationItem; onCheckIn: (id: number) => void }) {
  const colors = useColors();
  const { isDark } = useTheme();
  const now = new Date();
  const start = new Date(item.event.startTime);
  const end   = new Date(item.event.endTime);
  const isOngoing = start <= now && end >= now;
  const isGroup   = item.event.scope === "GROUP";
  const today = now.toISOString().slice(0, 10);
  const lastCheck = item.lastCheckInDate?.slice(0, 10);
  const isManual = (item.event.conditionType ?? "MANUAL") === "MANUAL";
  // MANUAL: tự động, không cần nút; MEDIA: điều hướng riêng → chỉ hiện nút với WORKOUT/STEPS/WATER
  const canCheckIn = isOngoing && item.status !== "cancelled" && item.status !== "completed" && lastCheck !== today && !isManual;

  const cfg = STATUS_CONFIG[item.status];
  const daysTotal = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / 86400_000));
  const daysLeft  = Math.max(0, Math.ceil((end.getTime() - now.getTime()) / 86400_000));

  return (
    <View style={[styles.card, { backgroundColor: colors.bgCard, borderColor: colors.border }, isDark ? {} : Shadow.sm]}>
      {/* Title row */}
      <View style={styles.cardTitleRow}>
        <View style={[styles.scopeIcon, { backgroundColor: isGroup ? colors.purpleBg : colors.successBg }]}>
          {isGroup
            ? <Lock size={13} color={colors.purple} />
            : <Globe size={13} color={colors.success} />}
        </View>
        <Text style={[styles.cardTitle, { color: colors.textPrimary }]} numberOfLines={2}>
          {item.event.title}
        </Text>
      </View>

      {/* Status badge */}
      <View style={[styles.statusBadge, { backgroundColor: `${cfg.color}18` }]}>
        <View style={[styles.statusDot, { backgroundColor: cfg.color }]} />
        <Text style={[styles.statusText, { color: cfg.color }]}>{cfg.label}</Text>
      </View>

      {/* Date range */}
      <View style={styles.dateRow}>
        <Calendar size={12} color={colors.textMuted} />
        <Text style={[styles.dateTxt, { color: colors.textMuted }]}>
          {formatDate(item.event.startTime)} — {formatDate(item.event.endTime)}
        </Text>
        {isOngoing && (
          <Text style={[styles.daysLeft, { color: colors.warning }]}>
            còn {daysLeft}n
          </Text>
        )}
      </View>

      {/* Progress section */}
      {item.status !== "cancelled" && (
        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <Text style={[styles.progressLabel, { color: colors.textSecondary }]}>
              Tiến độ · {item.checkInCount}/{daysTotal} ngày
            </Text>
            <Text style={[styles.progressPct, { color: colors.primary }]}>{item.progress}%</Text>
          </View>
          <View style={[styles.progressTrack, { backgroundColor: colors.bgCardElevated }]}>
            <LinearGradient
              colors={item.status === "completed" ? Colors.gradientSuccess : Colors.gradientPrimary}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={[styles.progressFill, { width: `${item.progress}%` as any }]}
            />
          </View>
        </View>
      )}

      {/* Completed badge */}
      {item.status === "completed" && (
        <View style={styles.completedRow}>
          <Trophy size={14} color={colors.warning} />
          <Text style={[styles.completedText, { color: colors.warning }]}>
            Hoàn thành ngày {item.completedAt ? formatDate(item.completedAt) : "—"}
          </Text>
        </View>
      )}

      {/* Check-in button */}
      {canCheckIn && (
        <TouchableOpacity
          style={[styles.checkinBtn, { backgroundColor: colors.primary }]}
          onPress={() => onCheckIn(item.event.id)}
        >
          <CheckCircle size={14} color="white" />
          <Text style={styles.checkinBtnText}>Xác nhận tiến độ hôm nay</Text>
        </TouchableOpacity>
      )}

      {!canCheckIn && isOngoing && item.status !== "cancelled" && item.status !== "completed" && (
        <View style={[styles.checkinDone, { backgroundColor: colors.successBg }]}>
          <CheckCircle size={13} color={colors.success} />
          <Text style={[styles.checkinDoneText, { color: colors.success }]}>Đã xác nhận hôm nay</Text>
        </View>
      )}
    </View>
  );
}

type FilterKey = "all" | "active" | "completed" | "cancelled";

export default function MyEventsScreen() {
  const router = useRouter();
  const colors = useColors();
  const { isDark } = useTheme();
  const [registrations, setRegistrations] = useState<EventRegistrationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<FilterKey>("all");

  const load = useCallback(async () => {
    try {
      const res = await eventsApi.myRegistrations();
      const list = Array.isArray(res.data) ? res.data : [];
      setRegistrations(list);

      // MANUAL event: tự động verify khi mở app
      const now = new Date();
      const today = now.toISOString().slice(0, 10);
      const manualPending = list.filter((r) => {
        const condType = r.event.conditionType ?? "MANUAL";
        if (condType !== "MANUAL") return false;
        const start = new Date(r.event.startTime);
        const end = new Date(r.event.endTime);
        const isActive = start <= now && end >= now;
        const lastCheck = r.lastCheckInDate?.slice(0, 10);
        return isActive && r.status !== "cancelled" && r.status !== "completed" && lastCheck !== today;
      });

      if (manualPending.length > 0) {
        await Promise.allSettled(manualPending.map((r) => eventsApi.verifyProgress(r.event.id)));
        // Reload để cập nhật tiến độ
        const updated = await eventsApi.myRegistrations();
        setRegistrations(Array.isArray(updated.data) ? updated.data : list);
      }
    } catch {} finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const handleCheckIn = async (eventId: number) => {
    try {
      const res = await eventsApi.verifyProgress(eventId);
      Alert.alert("", res.data?.message ?? "Xác nhận tiến độ thành công!");
      load();
    } catch (e: any) {
      Alert.alert("Chưa đủ điều kiện", e?.response?.data?.message ?? "Không thể xác nhận tiến độ");
    }
  };

  const filtered = registrations.filter((r) => {
    if (filter === "active")    return r.status === "registered" || r.status === "checked_in";
    if (filter === "completed") return r.status === "completed";
    if (filter === "cancelled") return r.status === "cancelled";
    return true;
  });

  const FILTERS: { key: FilterKey; label: string }[] = [
    { key: "all",       label: "Tất cả" },
    { key: "active",    label: "Đang tham gia" },
    { key: "completed", label: "Hoàn thành" },
    { key: "cancelled", label: "Đã huỷ" },
  ];

  const stats = {
    total:     registrations.length,
    active:    registrations.filter((r) => r.status === "registered" || r.status === "checked_in").length,
    completed: registrations.filter((r) => r.status === "completed").length,
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.bgSecondary }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.bgSecondary }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.bgPrimary, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={20} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Sự kiện của tôi</Text>
        <TouchableOpacity onPress={() => { setRefreshing(true); load(); }} style={styles.refreshBtn}>
          <RefreshCw size={18} color={colors.textMuted} />
        </TouchableOpacity>
      </View>

      {/* Stats summary */}
      <View style={[styles.statsRow, { backgroundColor: colors.bgPrimary, borderBottomColor: colors.border }]}>
        <View style={styles.statItem}>
          <Text style={[styles.statNum, { color: colors.primary }]}>{stats.total}</Text>
          <Text style={[styles.statLabel, { color: colors.textMuted }]}>Đã đăng ký</Text>
        </View>
        <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
        <View style={styles.statItem}>
          <Text style={[styles.statNum, { color: colors.warning }]}>{stats.active}</Text>
          <Text style={[styles.statLabel, { color: colors.textMuted }]}>Đang tham gia</Text>
        </View>
        <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
        <View style={styles.statItem}>
          <Text style={[styles.statNum, { color: colors.success }]}>{stats.completed}</Text>
          <Text style={[styles.statLabel, { color: colors.textMuted }]}>Hoàn thành</Text>
        </View>
      </View>

      {/* Filters */}
      <FlatList
        horizontal
        data={FILTERS}
        keyExtractor={(i) => i.key}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.filterChip, filter === item.key && { backgroundColor: colors.primary }]}
            onPress={() => setFilter(item.key)}
          >
            <Text style={[styles.filterChipText, { color: filter === item.key ? "white" : colors.textMuted }]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.filterRow}
        showsHorizontalScrollIndicator={false}
        style={{ flexGrow: 0 }}
      />

      {/* List */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <ProgressCard item={item} onCheckIn={handleCheckIn} />
        )}
        contentContainerStyle={{ padding: Spacing.base, gap: Spacing.md }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); load(); }}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={[styles.emptyIcon, { backgroundColor: colors.bgCard }]}>
              <Calendar size={32} color={colors.textMuted} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>Chưa có sự kiện nào</Text>
            <Text style={[styles.emptyDesc, { color: colors.textMuted }]}>
              Tham gia các sự kiện trong cộng đồng để theo dõi tiến độ tại đây
            </Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
        ListFooterComponent={<View style={{ height: 100 }} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  header: {
    flexDirection: "row", alignItems: "center", paddingTop: sw(52),
    paddingBottom: Spacing.md, paddingHorizontal: Spacing.base,
    borderBottomWidth: 1,
  },
  backBtn: { padding: sw(6), marginRight: Spacing.sm },
  headerTitle: { flex: 1, fontSize: sf(18), fontWeight: "800" },
  refreshBtn: { padding: sw(6) },

  statsRow: {
    flexDirection: "row", paddingVertical: sw(14),
    borderBottomWidth: 1,
  },
  statItem: { flex: 1, alignItems: "center" },
  statNum: { fontSize: sf(22), fontWeight: "800" },
  statLabel: { fontSize: sf(11), marginTop: 2 },
  statDivider: { width: 1, marginVertical: sw(4) },

  filterRow: { paddingHorizontal: Spacing.base, paddingVertical: Spacing.md, gap: Spacing.sm },
  filterChip: {
    paddingHorizontal: sw(14), paddingVertical: sw(7),
    borderRadius: Radius.xl, backgroundColor: "rgba(0,0,0,0.06)",
  },
  filterChipText: { fontSize: sf(12), fontWeight: "600" },

  // Card
  card: { borderRadius: Radius.xl, borderWidth: 1, padding: Spacing.md, gap: Spacing.sm },
  cardTitleRow: { flexDirection: "row", alignItems: "flex-start", gap: Spacing.sm },
  scopeIcon: {
    width: sw(28), height: sw(28), borderRadius: Radius.md,
    alignItems: "center", justifyContent: "center", flexShrink: 0,
  },
  cardTitle: { flex: 1, fontSize: sf(14), fontWeight: "700", lineHeight: 20 },
  statusBadge: {
    flexDirection: "row", alignItems: "center", gap: 5,
    alignSelf: "flex-start", paddingHorizontal: sw(8), paddingVertical: sw(4), borderRadius: Radius.sm,
  },
  statusDot: { width: sw(6), height: sw(6), borderRadius: sw(3) },
  statusText: { fontSize: sf(11), fontWeight: "700" },
  dateRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  dateTxt: { flex: 1, fontSize: sf(12) },
  daysLeft: { fontSize: sf(11), fontWeight: "700" },

  progressSection: { gap: sw(6) },
  progressHeader: { flexDirection: "row", justifyContent: "space-between" },
  progressLabel: { fontSize: sf(12) },
  progressPct: { fontSize: sf(12), fontWeight: "700" },
  progressTrack: { height: sw(8), borderRadius: sw(4), overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: sw(4) },

  completedRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  completedText: { fontSize: sf(12), fontWeight: "700" },

  checkinBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 6, paddingVertical: sw(10), borderRadius: Radius.lg,
  },
  checkinBtnText: { color: "white", fontWeight: "700", fontSize: sf(13) },
  checkinDone: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingVertical: sw(8), paddingHorizontal: sw(12), borderRadius: Radius.md,
  },
  checkinDoneText: { fontSize: sf(12), fontWeight: "600" },

  empty: { alignItems: "center", paddingTop: sw(60), paddingHorizontal: Spacing.xl, gap: sw(12) },
  emptyIcon: { width: sw(72), height: sw(72), borderRadius: sw(20), alignItems: "center", justifyContent: "center" },
  emptyTitle: { fontSize: sf(16), fontWeight: "700" },
  emptyDesc: { fontSize: sf(13), textAlign: "center", lineHeight: 18 },
});
