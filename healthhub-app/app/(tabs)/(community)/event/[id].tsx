import React, { useCallback, useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, Image, Alert, Linking, RefreshControl,
} from "react-native";
import {
  ArrowLeft, Calendar, Clock, MapPin, Wifi, Globe, Lock,
  Users, Trophy, CheckCircle, X, Star, Crown, Medal,
  ChevronRight, Flame,
} from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams, useFocusEffect } from "expo-router";
import eventsApi, {
  EventDetail, EventLeaderboardEntry, EventConditionType,
  CONDITION_LABELS, CONDITION_UNITS,
} from "@/src/api/eventsApi";
import { useColors, Colors, Spacing, Radius, sw, sf, Shadow } from "@/src/theme";
import { useTheme } from "@/src/context/ThemeContext";

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("vi-VN", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function daysLeft(endTime: string) {
  const diff = new Date(endTime).getTime() - Date.now();
  if (diff <= 0) return null;
  return Math.ceil(diff / 86400_000);
}

function totalDays(start: string, end: string) {
  return Math.max(1, Math.ceil((new Date(end).getTime() - new Date(start).getTime()) / 86400_000));
}

const RANK_COLORS = ["#F59E0B", "#9CA3AF", "#CD7F32"];

function RankIcon({ rank }: { rank: number }) {
  if (rank === 1) return <Crown size={16} color="#F59E0B" />;
  if (rank === 2) return <Medal size={16} color="#9CA3AF" />;
  if (rank === 3) return <Medal size={16} color="#CD7F32" />;
  return <Text style={{ color: "#6B7280", fontWeight: "700", fontSize: sf(13), width: 16, textAlign: "center" }}>#{rank}</Text>;
}

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const { isDark } = useTheme();
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [leaderboard, setLeaderboard] = useState<EventLeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState<"info" | "progress" | "leaderboard">("info");
  const [actionLoading, setActionLoading] = useState(false);

  const load = useCallback(async () => {
    try {
      const [detailRes, lbRes] = await Promise.allSettled([
        eventsApi.getById(Number(id)),
        eventsApi.getLeaderboard(Number(id)),
      ]);
      if (detailRes.status === "fulfilled") {
        const detail = detailRes.value.data;
        setEvent(detail);

        // MANUAL: tự động verify khi mở app, không cần user nhấn nút
        const now = new Date();
        const reg = detail.registration;
        const condType = detail.conditionType ?? "MANUAL";
        const isActive = new Date(detail.startTime) <= now && new Date(detail.endTime) >= now;
        const today = now.toISOString().slice(0, 10);
        const lastCheck = reg?.lastCheckInDate?.slice(0, 10);
        const needsAutoVerify = condType === "MANUAL" && isActive && reg &&
          reg?.status !== "cancelled" && reg?.status !== "completed" && lastCheck !== today;

        if (needsAutoVerify) {
          eventsApi.verifyProgress(Number(id))
            .then(() => {
              // Reload để cập nhật tiến độ mới
              eventsApi.getById(Number(id)).then((r) => setEvent(r.data)).catch(() => {});
            })
            .catch(() => {});
        }
      }
      if (lbRes.status === "fulfilled") setLeaderboard(lbRes.value.data ?? []);
    } catch (e) {
      console.log("Load event detail error:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const handleRegister = async () => {
    if (!event) return;
    setActionLoading(true);
    try {
      await eventsApi.register(event.id);
      Alert.alert("", "Đăng ký thành công!");
      load();
    } catch (e: any) {
      Alert.alert("Lỗi", e?.response?.data?.message ?? "Không thể đăng ký");
    } finally { setActionLoading(false); }
  };

  const handleUnregister = async () => {
    if (!event) return;
    Alert.alert("Huỷ đăng ký", "Bạn có chắc muốn huỷ đăng ký?", [
      { text: "Không", style: "cancel" },
      {
        text: "Huỷ đăng ký", style: "destructive",
        onPress: async () => {
          setActionLoading(true);
          try {
            await eventsApi.unregister(event.id);
            load();
          } catch (e: any) {
            Alert.alert("Lỗi", e?.response?.data?.message ?? "Không thể huỷ");
          } finally { setActionLoading(false); }
        },
      },
    ]);
  };

  const handleVerifyProgress = async () => {
    if (!event) return;
    setActionLoading(true);
    try {
      const res = await eventsApi.verifyProgress(event.id);
      Alert.alert("", res.data?.message ?? "Xác nhận thành công!");
      load();
    } catch (e: any) {
      Alert.alert("Chưa đủ điều kiện", e?.response?.data?.message ?? "Không thể xác nhận tiến độ");
    } finally { setActionLoading(false); }
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.bgSecondary }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!event) {
    return (
      <View style={[styles.center, { backgroundColor: colors.bgSecondary }]}>
        <Text style={{ color: colors.textMuted }}>Không tìm thấy sự kiện.</Text>
      </View>
    );
  }

  const now = new Date();
  const start = new Date(event.startTime);
  const end = new Date(event.endTime);
  const isUpcoming = start > now;
  const isOngoing = start <= now && end >= now;
  const isEnded = end < now;
  const isOnline = event.type === "online";
  const reg = event.registration;

  const today = now.toISOString().slice(0, 10);
  const lastCheck = reg?.lastCheckInDate?.slice(0, 10);
  const canVerify = isOngoing && reg && reg.status !== "cancelled" && reg.status !== "completed" && lastCheck !== today;
  const canRegister = !reg && !isEnded;
  const canUnregister = reg && reg.status !== "cancelled" && reg.status !== "completed" && isUpcoming;

  const conditionType  = (event.conditionType  ?? "MANUAL") as EventConditionType;
  const conditionValue = event.conditionValue;
  const isManualCondition = conditionType === "MANUAL";

  const conditionEmoji: Record<EventConditionType, string> = {
    MANUAL: "✋", WORKOUT: "🏋️", STEPS: "👟", WATER: "💧", MEDIA: "🎬",
  };
  const conditionColor: Record<EventConditionType, string> = {
    MANUAL: colors.textMuted, WORKOUT: colors.warning,
    STEPS: colors.primary, WATER: colors.info, MEDIA: colors.purple ?? colors.primary,
  };
  const isMediaCondition = conditionType === "MEDIA";

  const totalD = totalDays(event.startTime, event.endTime);
  const remaining = daysLeft(event.endTime);

  return (
    <View style={[styles.container, { backgroundColor: colors.bgSecondary }]}>
      {/* HEADER */}
      <View style={[styles.header, { backgroundColor: colors.bgPrimary, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.backBtn, { backgroundColor: colors.bgCardElevated, borderColor: colors.border }]}
        >
          <ArrowLeft size={20} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]} numberOfLines={1}>
          {event.title}
        </Text>
        <View style={{ width: 38 }} />
      </View>

      {/* TABS */}
      <View style={[styles.tabBar, { backgroundColor: colors.bgPrimary, borderBottomColor: colors.border }]}>
        {(["info", "progress", "leaderboard"] as const).map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.tabItem, tab === t && { borderBottomColor: colors.primary }]}
            onPress={() => setTab(t)}
          >
            <Text style={[styles.tabText, { color: tab === t ? colors.primary : colors.textMuted }, tab === t && { fontWeight: "700" }]}>
              {t === "info" ? "Thông tin" : t === "progress" ? "Tiến độ" : "Bảng XH"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.primary} />
        }
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {/* ── TAB: INFO ── */}
        {tab === "info" && (
          <View style={styles.section}>
            {/* DATE HERO */}
            <LinearGradient colors={Colors.gradientPrimary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.dateHero}>
              <View style={styles.dateHeroLeft}>
                <Text style={styles.dateHeroDay}>{start.getDate()}</Text>
                <Text style={styles.dateHeroMonth}>
                  {start.toLocaleDateString("vi-VN", { month: "long" }).toUpperCase()}
                </Text>
              </View>
              <View style={styles.dateHeroRight}>
                <View style={styles.badgeRow}>
                  <View style={[styles.pill, { backgroundColor: "rgba(255,255,255,0.2)" }]}>
                    {isOnline ? <Wifi size={11} color="white" /> : <MapPin size={11} color="white" />}
                    <Text style={styles.pillText}>{isOnline ? "Online" : "Offline"}</Text>
                  </View>
                  <View style={[styles.pill, { backgroundColor: "rgba(255,255,255,0.2)" }]}>
                    {event.scope === "GROUP" ? <Lock size={11} color="white" /> : <Globe size={11} color="white" />}
                    <Text style={styles.pillText}>{event.scope === "GROUP" ? "Nhóm" : "Công khai"}</Text>
                  </View>
                  {isOngoing && (
                    <View style={[styles.pill, { backgroundColor: "rgba(34,197,94,0.35)" }]}>
                      <View style={[styles.liveDot, { backgroundColor: "#22c55e" }]} />
                      <Text style={styles.pillText}>Đang diễn ra</Text>
                    </View>
                  )}
                  {isEnded && (
                    <View style={[styles.pill, { backgroundColor: "rgba(107,114,128,0.35)" }]}>
                      <Text style={styles.pillText}>Đã kết thúc</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.dateHeroTitle} numberOfLines={2}>{event.title}</Text>
              </View>
            </LinearGradient>

            {/* STATS ROW */}
            <View style={[styles.statsRow, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
              <View style={styles.statItem}>
                <Text style={[styles.statVal, { color: colors.primary }]}>{totalD}</Text>
                <Text style={[styles.statLabel, { color: colors.textMuted }]}>Tổng ngày</Text>
              </View>
              <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
              <View style={styles.statItem}>
                <Text style={[styles.statVal, { color: colors.warning }]}>
                  {remaining != null ? remaining : isEnded ? "—" : "0"}
                </Text>
                <Text style={[styles.statLabel, { color: colors.textMuted }]}>Còn lại</Text>
              </View>
              <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
              <View style={styles.statItem}>
                <Text style={[styles.statVal, { color: colors.success }]}>{event.totalRegistered}</Text>
                <Text style={[styles.statLabel, { color: colors.textMuted }]}>Đã đăng ký</Text>
              </View>
              {event.maxParticipants && (
                <>
                  <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
                  <View style={styles.statItem}>
                    <Text style={[styles.statVal, { color: colors.purple }]}>{event.maxParticipants}</Text>
                    <Text style={[styles.statLabel, { color: colors.textMuted }]}>Tối đa</Text>
                  </View>
                </>
              )}
            </View>

            {/* DESCRIPTION */}
            {event.description ? (
              <View style={[styles.card, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
                <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Mô tả</Text>
                <Text style={[styles.descText, { color: colors.textSecondary }]}>{event.description}</Text>
              </View>
            ) : null}

            {/* TIME INFO */}
            <View style={[styles.card, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
              <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Thời gian</Text>
              <View style={styles.infoRow}>
                <View style={[styles.infoIcon, { backgroundColor: colors.primaryBg }]}>
                  <Calendar size={14} color={colors.primary} />
                </View>
                <View>
                  <Text style={[styles.infoLabel, { color: colors.textMuted }]}>Bắt đầu</Text>
                  <Text style={[styles.infoVal, { color: colors.textPrimary }]}>{formatDate(event.startTime)}</Text>
                </View>
              </View>
              <View style={styles.infoRow}>
                <View style={[styles.infoIcon, { backgroundColor: colors.warningBg }]}>
                  <Clock size={14} color={colors.warning} />
                </View>
                <View>
                  <Text style={[styles.infoLabel, { color: colors.textMuted }]}>Kết thúc</Text>
                  <Text style={[styles.infoVal, { color: colors.textPrimary }]}>{formatDate(event.endTime)}</Text>
                </View>
              </View>
            </View>

            {/* ĐIỀU KIỆN TIẾN ĐỘ */}
            <View style={[styles.card, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
              <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Điều kiện xác nhận tiến độ</Text>
              <View style={[styles.conditionRow, {
                backgroundColor: isManualCondition ? colors.bgSecondary : colors.primaryBg,
                borderColor: isManualCondition ? colors.border : colors.borderAccent,
              }]}>
                <Text style={{ fontSize: 24 }}>{conditionEmoji[conditionType]}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.conditionLabel, { color: conditionColor[conditionType] }]}>
                    {CONDITION_LABELS[conditionType]}
                  </Text>
                  {!isManualCondition && conditionValue && (
                    <Text style={[styles.conditionDesc, { color: colors.textSecondary }]}>
                      Cần đạt: <Text style={{ fontWeight: "700", color: colors.textPrimary }}>
                        {conditionValue.toLocaleString()} {CONDITION_UNITS[conditionType]}
                      </Text>
                    </Text>
                  )}
                  {isManualCondition && (
                    <Text style={[styles.conditionDesc, { color: colors.textMuted }]}>
                      Nhấn xác nhận tiến độ mỗi ngày
                    </Text>
                  )}
                </View>
                {!isManualCondition && (
                  <View style={[styles.autoBadge, { backgroundColor: colors.successBg }]}>
                    <Text style={[styles.autoBadgeText, { color: colors.success }]}>Tự động</Text>
                  </View>
                )}
              </View>

              {/* Hướng dẫn */}
              <Text style={[styles.conditionHint, { color: colors.textMuted }]}>
                {isManualCondition &&
                  `Nhấn "Xác nhận tiến độ hôm nay" mỗi ngày để ghi nhận tham gia.`}
                {conditionType === "WORKOUT" &&
                  `Hoàn thành ít nhất ${conditionValue ?? 1} buổi tập trong app mỗi ngày → nhấn "Xác nhận tiến độ" để hệ thống tự kiểm tra.`}
                {conditionType === "STEPS" &&
                  `Đạt ${(conditionValue ?? 0).toLocaleString()} bước chân mỗi ngày (đồng bộ từ bước chân trong app) → nhấn "Xác nhận tiến độ".`}
                {conditionType === "WATER" &&
                  `Ghi nhận uống đủ ${conditionValue ?? 0}ml nước mỗi ngày trong app → nhấn "Xác nhận tiến độ".`}
              </Text>
            </View>

            {/* ONLINE LINK */}
            {isOnline && event.link && reg && (
              <TouchableOpacity
                style={[styles.card, { backgroundColor: colors.primaryBg, borderColor: colors.borderAccent, flexDirection: "row", alignItems: "center", gap: 12 }]}
                onPress={() => Linking.openURL(event.link!)}
              >
                <View style={[styles.infoIcon, { backgroundColor: colors.primary }]}>
                  <Wifi size={14} color="white" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.cardTitle, { color: colors.primary }]}>Link tham gia</Text>
                  <Text style={[styles.infoLabel, { color: colors.primary }]} numberOfLines={1}>{event.link}</Text>
                </View>
                <ChevronRight size={16} color={colors.primary} />
              </TouchableOpacity>
            )}

            {/* ORGANISER */}
            {event.createdBy && (
              <View style={[styles.card, { backgroundColor: colors.bgCard, borderColor: colors.border, flexDirection: "row", alignItems: "center", gap: 12 }]}>
                <View style={[styles.orgAvatar, { backgroundColor: colors.primary }]}>
                  <Text style={styles.orgAvatarText}>{event.createdBy?.fullName?.charAt(0) ?? "?"}</Text>
                </View>
                <View>
                  <Text style={[styles.infoLabel, { color: colors.textMuted }]}>Người tổ chức</Text>
                  <Text style={[styles.infoVal, { color: colors.textPrimary }]}>{event.createdBy.fullName}</Text>
                </View>
              </View>
            )}
          </View>
        )}

        {/* ── TAB: PROGRESS ── */}
        {tab === "progress" && (
          <View style={styles.section}>
            {!reg || reg.status === "cancelled" ? (
              <View style={styles.emptyWrap}>
                <Calendar size={44} color={colors.textMuted} />
                <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>Chưa đăng ký</Text>
                <Text style={[styles.emptyDesc, { color: colors.textMuted }]}>
                  Đăng ký sự kiện để theo dõi tiến độ của bạn.
                </Text>
              </View>
            ) : (
              <>
                {/* Progress circle + stats */}
                <View style={[styles.progressCard, { backgroundColor: colors.bgCard, borderColor: colors.border }, isDark ? {} : Shadow.sm]}>
                  {/* Big progress ring */}
                  <View style={styles.ringWrap}>
                    <LinearGradient
                      colors={reg.status === "completed" ? Colors.gradientSuccess : Colors.gradientPrimary}
                      start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                      style={styles.ringOuter}
                    >
                      <View style={[styles.ringInner, { backgroundColor: colors.bgCard }]}>
                        <Text style={[styles.ringPct, { color: colors.textPrimary }]}>{reg.progress}%</Text>
                        <Text style={[styles.ringLabel, { color: colors.textMuted }]}>tiến độ</Text>
                      </View>
                    </LinearGradient>
                  </View>

                  {/* Status badge */}
                  <View style={[styles.statusBadge, {
                    backgroundColor:
                      reg.status === "completed" ? colors.successBg :
                      reg.status === "checked_in" ? colors.primaryBg :
                      colors.warningBg,
                  }]}>
                    {reg.status === "completed"
                      ? <><Trophy size={13} color={colors.success} /><Text style={[styles.statusText, { color: colors.success }]}>Hoàn thành!</Text></>
                      : reg.status === "checked_in"
                      ? <><CheckCircle size={13} color={colors.primary} /><Text style={[styles.statusText, { color: colors.primary }]}>Đang tham gia</Text></>
                      : <><Clock size={13} color={colors.warning} /><Text style={[styles.statusText, { color: colors.warning }]}>Đã đăng ký</Text></>
                    }
                  </View>

                  {/* Stats grid */}
                  <View style={styles.progressStatsGrid}>
                    <View style={[styles.progressStatBox, { backgroundColor: colors.bgSecondary }]}>
                      <Flame size={18} color={colors.orange} />
                      <Text style={[styles.progressStatVal, { color: colors.textPrimary }]}>{reg.checkInCount}</Text>
                      <Text style={[styles.progressStatLabel, { color: colors.textMuted }]}>Ngày check-in</Text>
                    </View>
                    <View style={[styles.progressStatBox, { backgroundColor: colors.bgSecondary }]}>
                      <Calendar size={18} color={colors.primary} />
                      <Text style={[styles.progressStatVal, { color: colors.textPrimary }]}>{totalD}</Text>
                      <Text style={[styles.progressStatLabel, { color: colors.textMuted }]}>Tổng ngày</Text>
                    </View>
                    <View style={[styles.progressStatBox, { backgroundColor: colors.bgSecondary }]}>
                      <Clock size={18} color={colors.warning} />
                      <Text style={[styles.progressStatVal, { color: colors.textPrimary }]}>
                        {remaining != null ? remaining : isEnded ? "0" : "0"}
                      </Text>
                      <Text style={[styles.progressStatLabel, { color: colors.textMuted }]}>Ngày còn lại</Text>
                    </View>
                  </View>

                  {/* Progress bar */}
                  <View style={{ width: "100%", marginTop: Spacing.md }}>
                    <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
                      <LinearGradient
                        colors={reg.status === "completed" ? Colors.gradientSuccess : Colors.gradientPrimary}
                        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                        style={[styles.progressFill, { width: `${reg.progress}%` as any }]}
                      />
                    </View>
                    <View style={styles.progressBarLabels}>
                      <Text style={[styles.progressBarLabel, { color: colors.textMuted }]}>0%</Text>
                      <Text style={[styles.progressBarLabel, { color: colors.textMuted }]}>100%</Text>
                    </View>
                  </View>

                  {/* Completed date */}
                  {reg.completedAt && (
                    <View style={[styles.completedRow, { backgroundColor: colors.successBg }]}>
                      <Trophy size={14} color={colors.success} />
                      <Text style={[styles.completedText, { color: colors.success }]}>
                        Hoàn thành lúc {formatDate(reg.completedAt)}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Xác nhận tiến độ */}
                {canVerify && isMediaCondition && (
                  <TouchableOpacity
                    style={[styles.bigBtn, { backgroundColor: colors.purple ?? colors.primary }]}
                    onPress={() => router.push({
                      pathname: "/(tabs)/(community)/event/submit-media",
                      params: { eventId: String(event.id), eventTitle: event.title },
                    } as any)}
                  >
                    <Text style={{ fontSize: 16 }}>🎬</Text>
                    <Text style={styles.bigBtnText}>Nộp minh chứng hôm nay</Text>
                  </TouchableOpacity>
                )}
                {canVerify && !isMediaCondition && !isManualCondition && (
                  <TouchableOpacity
                    style={[styles.bigBtn, { backgroundColor: colors.primary }, actionLoading && { opacity: 0.6 }]}
                    onPress={handleVerifyProgress}
                    disabled={actionLoading}
                  >
                    <CheckCircle size={18} color="white" />
                    <Text style={styles.bigBtnText}>
                      {`Xác nhận tiến độ hôm nay ${conditionEmoji[conditionType]}`}
                    </Text>
                  </TouchableOpacity>
                )}
                {isOngoing && reg && lastCheck === today && (
                  <View style={[styles.checkedTodayBanner, { backgroundColor: colors.successBg, borderColor: colors.success + "40" }]}>
                    <CheckCircle size={16} color={colors.success} />
                    <Text style={[styles.checkedTodayText, { color: colors.success }]}>Đã check-in hôm nay!</Text>
                  </View>
                )}
              </>
            )}
          </View>
        )}

        {/* ── TAB: LEADERBOARD ── */}
        {tab === "leaderboard" && (
          <View style={styles.section}>
            {leaderboard.length === 0 ? (
              <View style={styles.emptyWrap}>
                <Trophy size={44} color={colors.textMuted} />
                <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>Chưa có dữ liệu</Text>
                <Text style={[styles.emptyDesc, { color: colors.textMuted }]}>
                  Bảng xếp hạng sẽ hiển thị khi có người check-in.
                </Text>
              </View>
            ) : (
              <>
                {/* Top 3 podium */}
                {leaderboard.length >= 3 && (
                  <View style={styles.podiumWrap}>
                    {/* 2nd */}
                    <PodiumItem entry={leaderboard[1]} rank={2} colors={colors} />
                    {/* 1st */}
                    <PodiumItem entry={leaderboard[0]} rank={1} colors={colors} tall />
                    {/* 3rd */}
                    <PodiumItem entry={leaderboard[2]} rank={3} colors={colors} />
                  </View>
                )}

                {/* Full list */}
                <View style={[styles.lbCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
                  {leaderboard.map((entry, i) => (
                    <View
                      key={entry.userId}
                      style={[
                        styles.lbRow,
                        { borderBottomColor: colors.border },
                        i === leaderboard.length - 1 && { borderBottomWidth: 0 },
                      ]}
                    >
                      <View style={styles.lbRankWrap}>
                        <RankIcon rank={entry.rank} />
                      </View>

                      {/* Avatar */}
                      <View style={styles.lbAvatarWrap}>
                        {entry.avatarUrl ? (
                          <Image source={{ uri: entry.avatarUrl }} style={styles.lbAvatar} />
                        ) : (
                          <LinearGradient colors={Colors.gradientPrimary} style={[styles.lbAvatar, { justifyContent: "center", alignItems: "center" }]}>
                            <Text style={{ color: "white", fontWeight: "800", fontSize: sf(14) }}>
                              {entry.fullName?.charAt(0) ?? "?"}
                            </Text>
                          </LinearGradient>
                        )}
                      </View>

                      {/* Info */}
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.lbName, { color: colors.textPrimary }]} numberOfLines={1}>{entry.fullName}</Text>
                        <View style={styles.lbMeta}>
                          <Star size={11} color={colors.warning} />
                          <Text style={[styles.lbMetaText, { color: colors.textMuted }]}>Lv.{entry.level}</Text>
                          <Flame size={11} color={colors.orange} />
                          <Text style={[styles.lbMetaText, { color: colors.textMuted }]}>{entry.checkInCount} ngày</Text>
                        </View>
                      </View>

                      {/* Progress */}
                      <View style={{ alignItems: "flex-end", gap: 4 }}>
                        <Text style={[styles.lbProgress, { color: entry.status === "completed" ? colors.success : colors.primary }]}>
                          {entry.progress}%
                        </Text>
                        {entry.status === "completed" && <Trophy size={12} color={colors.warning} />}
                      </View>
                    </View>
                  ))}
                </View>
              </>
            )}
          </View>
        )}
      </ScrollView>

      {/* BOTTOM ACTION BAR */}
      {!isEnded && (
        <View style={[styles.bottomBar, { backgroundColor: colors.bgCard, borderTopColor: colors.border }]}>
          {canRegister && (
            <TouchableOpacity
              style={[styles.bigBtn, { backgroundColor: colors.primary }, actionLoading && { opacity: 0.6 }]}
              onPress={handleRegister}
              disabled={actionLoading}
            >
              <CheckCircle size={18} color="white" />
              <Text style={styles.bigBtnText}>{actionLoading ? "Đang xử lý..." : "Đăng ký tham gia"}</Text>
            </TouchableOpacity>
          )}
          {canUnregister && (
            <TouchableOpacity
              style={[styles.bigBtn, { backgroundColor: colors.bgCardElevated, borderWidth: 1, borderColor: colors.border }, actionLoading && { opacity: 0.6 }]}
              onPress={handleUnregister}
              disabled={actionLoading}
            >
              <X size={18} color={colors.danger} />
              <Text style={[styles.bigBtnText, { color: colors.danger }]}>{actionLoading ? "Đang xử lý..." : "Huỷ đăng ký"}</Text>
            </TouchableOpacity>
          )}
          {canVerify && tab !== "progress" && isMediaCondition && (
            <TouchableOpacity
              style={[styles.bigBtn, { backgroundColor: colors.purple ?? colors.primary }]}
              onPress={() => router.push({
                pathname: "/(tabs)/(community)/event/submit-media",
                params: { eventId: String(event.id), eventTitle: event.title },
              } as any)}
            >
              <Text style={{ fontSize: 16 }}>🎬</Text>
              <Text style={styles.bigBtnText}>Nộp minh chứng hôm nay</Text>
            </TouchableOpacity>
          )}
          {canVerify && tab !== "progress" && !isMediaCondition && !isManualCondition && (
            <TouchableOpacity
              style={[styles.bigBtn, { backgroundColor: colors.primary }, actionLoading && { opacity: 0.6 }]}
              onPress={handleVerifyProgress}
              disabled={actionLoading}
            >
              <CheckCircle size={18} color="white" />
              <Text style={styles.bigBtnText}>
                {`Xác nhận tiến độ hôm nay ${conditionEmoji[conditionType]}`}
              </Text>
            </TouchableOpacity>
          )}
          {reg && !canRegister && !canUnregister && !canVerify && (
            <View style={[styles.bigBtn, { backgroundColor: colors.bgCardElevated }]}>
              <Text style={[styles.bigBtnText, { color: colors.textMuted }]}>
                {reg.status === "completed" ? "🏆 Đã hoàn thành" :
                 reg.status === "cancelled" ? "Đã huỷ đăng ký" :
                 isEnded ? "Sự kiện đã kết thúc" : "Đã check-in hôm nay"}
              </Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

function PodiumItem({ entry, rank, colors, tall }: { entry: EventLeaderboardEntry; rank: number; colors: any; tall?: boolean }) {
  const rankColor = rank === 1 ? "#F59E0B" : rank === 2 ? "#9CA3AF" : "#CD7F32";
  return (
    <View style={[styles.podiumItem, tall && styles.podiumItemTall]}>
      {rank === 1 && <Crown size={18} color="#F59E0B" style={{ marginBottom: 4 }} />}
      <LinearGradient
        colors={rank === 1 ? Colors.gradientGold : rank === 2 ? ["#6B7280", "#9CA3AF"] : ["#A0522D", "#CD7F32"]}
        style={[styles.podiumAvatar, tall && styles.podiumAvatarTall]}
      >
        {entry.avatarUrl ? (
          <Image source={{ uri: entry.avatarUrl }} style={{ width: "100%", height: "100%", borderRadius: 999 }} />
        ) : (
          <Text style={[styles.podiumAvatarText, tall && { fontSize: 20 }]}>{entry.fullName.charAt(0)}</Text>
        )}
      </LinearGradient>
      <Text style={[styles.podiumName, { color: colors.textPrimary }]} numberOfLines={1}>{entry.fullName?.split(" ").pop() ?? ""}</Text>
      <View style={[styles.podiumBadge, { backgroundColor: rankColor + "22" }]}>
        <Text style={[styles.podiumBadgeText, { color: rankColor }]}>{entry.checkInCount} ngày</Text>
      </View>
      <View style={[styles.podiumBase, { backgroundColor: rankColor, height: tall ? 60 : rank === 2 ? 44 : 36 }]}>
        <Text style={styles.podiumRankText}>{rank}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  header: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: Spacing.base, paddingTop: 52, paddingBottom: Spacing.md,
    borderBottomWidth: 1, gap: 10,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: Radius.md,
    justifyContent: "center", alignItems: "center", borderWidth: 1,
  },
  headerTitle: { flex: 1, fontSize: sf(17), fontWeight: "700" },

  tabBar: {
    flexDirection: "row", borderBottomWidth: 1,
  },
  tabItem: {
    flex: 1, paddingVertical: sw(12),
    alignItems: "center", borderBottomWidth: 2, borderBottomColor: "transparent",
  },
  tabText: { fontSize: sf(13), fontWeight: "500" },

  section: { padding: Spacing.base, gap: Spacing.md },

  // Date hero
  dateHero: {
    borderRadius: Radius.xl, padding: Spacing.base,
    flexDirection: "row", gap: Spacing.md, alignItems: "flex-start",
  },
  dateHeroLeft: { alignItems: "center", minWidth: sw(50) },
  dateHeroDay: { color: "white", fontSize: sf(32), fontWeight: "900", lineHeight: sf(36) },
  dateHeroMonth: { color: "rgba(255,255,255,0.8)", fontSize: sf(10), fontWeight: "700" },
  dateHeroRight: { flex: 1, gap: 6 },
  dateHeroTitle: { color: "white", fontSize: sf(16), fontWeight: "800", lineHeight: 22 },
  badgeRow: { flexDirection: "row", gap: 5, flexWrap: "wrap" },
  pill: {
    flexDirection: "row", alignItems: "center", gap: 3,
    paddingHorizontal: sw(7), paddingVertical: sw(3), borderRadius: Radius.sm,
  },
  pillText: { color: "white", fontSize: sf(10), fontWeight: "700" },
  liveDot: { width: sw(6), height: sw(6), borderRadius: sw(3) },

  // Stats row
  statsRow: {
    flexDirection: "row", borderRadius: Radius.xl, borderWidth: 1,
    overflow: "hidden",
  },
  statItem: { flex: 1, alignItems: "center", paddingVertical: Spacing.md },
  statVal: { fontSize: sf(20), fontWeight: "800" },
  statLabel: { fontSize: sf(11), marginTop: 2 },
  statDivider: { width: 1 },

  // Cards
  card: {
    borderRadius: Radius.xl, borderWidth: 1, padding: Spacing.md, gap: Spacing.sm,
  },
  cardTitle: { fontSize: sf(14), fontWeight: "700", marginBottom: 2 },
  descText: { fontSize: sf(14), lineHeight: 20 },

  infoRow: { flexDirection: "row", alignItems: "center", gap: Spacing.md },
  infoIcon: { width: 30, height: 30, borderRadius: Radius.md, alignItems: "center", justifyContent: "center" },
  infoLabel: { fontSize: sf(11) },
  infoVal: { fontSize: sf(13), fontWeight: "600", marginTop: 1 },

  orgAvatar: { width: sw(40), height: sw(40), borderRadius: sw(20), alignItems: "center", justifyContent: "center" },
  orgAvatarText: { color: "white", fontWeight: "800", fontSize: sf(16) },

  // Progress tab
  progressCard: {
    borderRadius: Radius.xl, borderWidth: 1, padding: Spacing.lg,
    alignItems: "center", gap: Spacing.md,
  },
  ringWrap: { alignItems: "center" },
  ringOuter: {
    width: sw(120), height: sw(120), borderRadius: sw(60),
    alignItems: "center", justifyContent: "center",
  },
  ringInner: {
    width: sw(96), height: sw(96), borderRadius: sw(48),
    alignItems: "center", justifyContent: "center",
  },
  ringPct: { fontSize: sf(24), fontWeight: "900" },
  ringLabel: { fontSize: sf(11), marginTop: 2 },

  statusBadge: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: Radius.full,
  },
  statusText: { fontSize: sf(13), fontWeight: "700" },

  progressStatsGrid: { flexDirection: "row", gap: Spacing.sm, width: "100%" },
  progressStatBox: {
    flex: 1, alignItems: "center", padding: Spacing.md,
    borderRadius: Radius.lg, gap: 4,
  },
  progressStatVal: { fontSize: sf(18), fontWeight: "800" },
  progressStatLabel: { fontSize: sf(11), textAlign: "center" },

  progressTrack: { height: sw(8), borderRadius: sw(4), overflow: "hidden", width: "100%" },
  progressFill: { height: "100%", borderRadius: sw(4) },
  progressBarLabels: { flexDirection: "row", justifyContent: "space-between", marginTop: 4 },
  progressBarLabel: { fontSize: sf(11) },

  completedRow: {
    flexDirection: "row", alignItems: "center", gap: 8,
    padding: Spacing.md, borderRadius: Radius.lg, width: "100%",
  },
  completedText: { fontSize: sf(13), fontWeight: "700" },

  checkedTodayBanner: {
    flexDirection: "row", alignItems: "center", gap: 8,
    padding: Spacing.md, borderRadius: Radius.xl, borderWidth: 1,
  },
  checkedTodayText: { fontSize: sf(14), fontWeight: "700" },

  // Leaderboard
  podiumWrap: { flexDirection: "row", alignItems: "flex-end", justifyContent: "center", gap: Spacing.sm, marginBottom: Spacing.md },
  podiumItem: { alignItems: "center", width: sw(90) },
  podiumItemTall: { marginBottom: -Spacing.sm },
  podiumAvatar: { width: sw(48), height: sw(48), borderRadius: sw(24), alignItems: "center", justifyContent: "center", marginBottom: 6 },
  podiumAvatarTall: { width: sw(60), height: sw(60), borderRadius: sw(30) },
  podiumAvatarText: { color: "white", fontWeight: "900", fontSize: sf(16) },
  podiumName: { fontSize: sf(12), fontWeight: "700", textAlign: "center", marginBottom: 4 },
  podiumBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: Radius.full, marginBottom: 4 },
  podiumBadgeText: { fontSize: sf(11), fontWeight: "700" },
  podiumBase: { width: "100%", borderRadius: Radius.md, alignItems: "center", justifyContent: "center" },
  podiumRankText: { color: "white", fontWeight: "900", fontSize: sf(16) },

  lbCard: { borderRadius: Radius.xl, borderWidth: 1, overflow: "hidden" },
  lbRow: {
    flexDirection: "row", alignItems: "center", gap: Spacing.md,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  lbRankWrap: { width: 24, alignItems: "center" },
  lbAvatarWrap: {},
  lbAvatar: { width: sw(40), height: sw(40), borderRadius: sw(20) },
  lbName: { fontSize: sf(14), fontWeight: "700" },
  lbMeta: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 },
  lbMetaText: { fontSize: sf(11) },
  lbProgress: { fontSize: sf(14), fontWeight: "800" },

  // Buttons
  bigBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, borderRadius: Radius.xl, paddingVertical: sw(14),
  },
  bigBtnText: { color: "white", fontWeight: "800", fontSize: sf(15) },

  bottomBar: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    padding: Spacing.base, borderTopWidth: 1,
    paddingBottom: sw(24),
  },

  emptyWrap: { alignItems: "center", paddingTop: sw(60), gap: sw(12) },
  emptyTitle: { fontSize: sf(16), fontWeight: "700" },
  emptyDesc: { fontSize: sf(13), textAlign: "center", lineHeight: 18 },

  // Condition card
  conditionRow: {
    flexDirection: "row", alignItems: "center", gap: sw(12),
    padding: sw(12), borderRadius: Radius.lg, borderWidth: 1.5, marginBottom: sw(8),
  },
  conditionLabel: { fontSize: sf(14), fontWeight: "700" },
  conditionDesc: { fontSize: sf(12), marginTop: 2 },
  autoBadge: {
    paddingHorizontal: sw(8), paddingVertical: sw(3),
    borderRadius: Radius.full,
  },
  autoBadgeText: { fontSize: sf(11), fontWeight: "700" },
  conditionHint: { fontSize: sf(12), lineHeight: 18, marginTop: 4 },
});
