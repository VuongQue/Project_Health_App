import React, { useCallback, useEffect, useState } from "react";
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  RefreshControl, ActivityIndicator, Linking, Alert, Image,
  Modal, TextInput, ScrollView,
} from "react-native";
import {
  Calendar, MapPin, Wifi, CheckCircle, Users, Globe,
  Plus, X, Clock, ChevronRight, Trophy, Lock,
} from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, router } from "expo-router";
import eventsApi, { EventItem, EventRegistrationItem, EventConditionType, CONDITION_LABELS, CONDITION_UNITS } from "@/src/api/eventsApi";
import { useColors, Colors, Spacing, Radius, Shadow, sw, sf } from "@/src/theme";
import { useTheme } from "@/src/context/ThemeContext";
import { getUserFromToken } from "@/src/utils/tokenStorage";

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("vi-VN", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function formatShortDate(iso: string) {
  return new Date(iso).toLocaleDateString("vi-VN", { day: "2-digit", month: "short" });
}

function daysLeft(endTime: string) {
  const diff = new Date(endTime).getTime() - Date.now();
  if (diff <= 0) return null;
  const d = Math.ceil(diff / 86400_000);
  return d === 1 ? "còn 1 ngày" : `còn ${d} ngày`;
}

// ─── EVENT CARD ──────────────────────────────────────────────────────────────

function EventCard({
  item, registration, onRegister, onUnregister, onCheckIn,
}: {
  item: EventItem;
  registration?: EventRegistrationItem;
  onRegister: (id: number) => void;
  onUnregister: (id: number) => void;
  onCheckIn: (id: number) => void;
}) {
  const colors = useColors();
  const { isDark } = useTheme();
  const now = new Date();
  const start = new Date(item.startTime);
  const end   = new Date(item.endTime);
  const isUpcoming = start > now;
  const isOngoing  = start <= now && end >= now;
  const isEnded    = end < now;
  const isOnline   = item.type === "online";
  const isGroup    = item.scope === "GROUP";

  const today = now.toISOString().slice(0, 10);
  const lastCheck = registration?.lastCheckInDate?.slice(0, 10);
  const canCheckIn = isOngoing && registration &&
    registration.status !== "cancelled" && registration.status !== "completed" &&
    lastCheck !== today;

  const statusColor =
    registration?.status === "completed" ? colors.success :
    registration?.status === "checked_in" ? colors.primary :
    registration?.status === "cancelled"  ? colors.textMuted :
    registration ? "#f59e0b" : "transparent";

  return (
    <View style={[styles.card, { backgroundColor: colors.bgCard, borderColor: colors.border }, isDark ? {} : Shadow.sm]}>
      {/* Header: date pill + scope badge */}
      <View style={styles.cardHeader}>
        <LinearGradient colors={Colors.gradientPrimary} style={styles.datePill}>
          <Text style={styles.dateDay}>{new Date(item.startTime).getDate()}</Text>
          <Text style={styles.dateMonth}>
            {new Date(item.startTime).toLocaleDateString("vi-VN", { month: "short" }).toUpperCase()}
          </Text>
        </LinearGradient>

        <View style={{ flex: 1, gap: 4 }}>
          <View style={styles.badgeRow}>
            {/* Online/Offline */}
            <View style={[styles.badge, isOnline
              ? { backgroundColor: colors.primaryBg }
              : { backgroundColor: colors.warningBg }]}>
              {isOnline
                ? <Wifi size={10} color={colors.primary} />
                : <MapPin size={10} color={colors.warning} />}
              <Text style={[styles.badgeText, { color: isOnline ? colors.primary : colors.warning }]}>
                {isOnline ? "Online" : "Offline"}
              </Text>
            </View>
            {/* Scope */}
            <View style={[styles.badge, { backgroundColor: isGroup ? colors.purpleBg : colors.successBg }]}>
              {isGroup ? <Lock size={10} color={colors.purple} /> : <Globe size={10} color={colors.success} />}
              <Text style={[styles.badgeText, { color: isGroup ? colors.purple : colors.success }]}>
                {isGroup ? "Nhóm" : "Công khai"}
              </Text>
            </View>
            {/* Status */}
            {isOngoing && !isGroup && (
              <View style={[styles.badge, { backgroundColor: "rgba(34,197,94,0.12)" }]}>
                <View style={[styles.livedot, { backgroundColor: colors.success }]} />
                <Text style={[styles.badgeText, { color: colors.success }]}>Đang diễn ra</Text>
              </View>
            )}
          </View>

          <Text style={[styles.cardTitle, { color: colors.textPrimary }]} numberOfLines={2}>
            {item.title}
          </Text>
        </View>
      </View>

      {/* Description */}
      {item.description ? (
        <Text style={[styles.desc, { color: colors.textSecondary }]} numberOfLines={2}>
          {item.description}
        </Text>
      ) : null}

      {/* Time */}
      <View style={styles.timeRow}>
        <Clock size={13} color={colors.textMuted} />
        <Text style={[styles.timeTxt, { color: colors.textMuted }]}>
          {formatDate(item.startTime)} → {formatDate(item.endTime)}
        </Text>
      </View>

      {/* Participants + days left */}
      <View style={styles.metaRow}>
        {item.maxParticipants && (
          <View style={styles.metaChip}>
            <Users size={12} color={colors.textMuted} />
            <Text style={[styles.metaChipText, { color: colors.textMuted }]}>
              Tối đa {item.maxParticipants} người
            </Text>
          </View>
        )}
        {!isEnded && daysLeft(item.endTime) && (
          <View style={[styles.metaChip, { backgroundColor: colors.warningBg }]}>
            <Text style={[styles.metaChipText, { color: colors.warning }]}>{daysLeft(item.endTime)}</Text>
          </View>
        )}
        {item.createdBy && (
          <Text style={[styles.organiser, { color: colors.textMuted }]}>
            bởi {item.createdBy.fullName}
          </Text>
        )}
      </View>

      {/* Progress bar (khi đã đăng ký + đang diễn ra) */}
      {registration && !isUpcoming && (
        <View style={styles.progressWrap}>
          <View style={styles.progressHeader}>
            <Text style={[styles.progressLabel, { color: colors.textSecondary }]}>
              Tiến độ · {registration.checkInCount} checkin
            </Text>
            <Text style={[styles.progressPct, { color: colors.primary }]}>{registration.progress}%</Text>
          </View>
          <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
            <LinearGradient
              colors={registration.status === "completed" ? ["#22c55e", "#16a34a"] : Colors.gradientPrimary}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={[styles.progressFill, { width: `${registration.progress}%` as any }]}
            />
          </View>
          {registration.status === "completed" && (
            <View style={styles.completedRow}>
              <Trophy size={13} color={colors.warning} />
              <Text style={[styles.completedText, { color: colors.warning }]}>Hoàn thành!</Text>
            </View>
          )}
        </View>
      )}

      {/* Actions */}
      <View style={[styles.divider, { backgroundColor: colors.border }]} />
      <View style={styles.actions}>
        {!registration && !isEnded && (
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: colors.primary }]}
            onPress={() => onRegister(item.id)}
          >
            <CheckCircle size={14} color="white" />
            <Text style={styles.actionBtnText}>Đăng ký</Text>
          </TouchableOpacity>
        )}

        {canCheckIn && (
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: colors.success }]}
            onPress={() => onCheckIn(item.id)}
          >
            <CheckCircle size={14} color="white" />
            <Text style={styles.actionBtnText}>Check-in hôm nay</Text>
          </TouchableOpacity>
        )}

        {registration && registration.status !== "cancelled" && !isEnded && isUpcoming && (
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: colors.bgCardElevated, borderWidth: 1, borderColor: colors.border }]}
            onPress={() => onUnregister(item.id)}
          >
            <X size={14} color={colors.danger} />
            <Text style={[styles.actionBtnText, { color: colors.danger }]}>Huỷ đăng ký</Text>
          </TouchableOpacity>
        )}

        {isEnded && !registration && (
          <Text style={[styles.endedText, { color: colors.textMuted }]}>Sự kiện đã kết thúc</Text>
        )}

        {isOnline && item.link && registration && (
          <TouchableOpacity
            style={[styles.actionBtnOutline, { borderColor: colors.primary }]}
            onPress={() => Linking.openURL(item.link!)}
          >
            <Wifi size={13} color={colors.primary} />
            <Text style={[styles.actionBtnOutlineText, { color: colors.primary }]}>Tham gia</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

// ─── CREATE EVENT MODAL ──────────────────────────────────────────────────────

function CreateEventModal({
  visible, onClose, onCreated, groupId, isAdmin,
}: {
  visible: boolean;
  onClose: () => void;
  onCreated: () => void;
  groupId?: string;
  isAdmin: boolean;
}) {
  const colors = useColors();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<"online" | "offline">("online");
  const [link, setLink] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [maxParticipants, setMaxParticipants] = useState("");
  const [scope, setScope] = useState<"PUBLIC" | "GROUP">(
    isAdmin ? "PUBLIC" : "GROUP"
  );
  const [conditionType, setConditionType] = useState<EventConditionType>("MANUAL");
  const [conditionValue, setConditionValue] = useState("");
  const [saving, setSaving] = useState(false);

  const reset = () => {
    setTitle(""); setDescription(""); setType("online");
    setLink(""); setStartTime(""); setEndTime(""); setMaxParticipants("");
    setConditionType("MANUAL"); setConditionValue("");
  };

  const handleCreate = async () => {
    if (!title.trim() || !startTime || !endTime) {
      Alert.alert("Thiếu thông tin", "Vui lòng nhập tên, thời gian bắt đầu và kết thúc");
      return;
    }
    if (conditionType !== "MANUAL" && conditionType !== "MEDIA" && !conditionValue) {
      Alert.alert("Thiếu thông tin", "Vui lòng nhập ngưỡng điều kiện");
      return;
    }
    setSaving(true);
    try {
      await eventsApi.create({
        title: title.trim(),
        description: description.trim() || undefined,
        type,
        link: link.trim() || undefined,
        scope,
        groupId: scope === "GROUP" ? groupId : undefined,
        maxParticipants: maxParticipants ? Number(maxParticipants) : undefined,
        startTime: new Date(startTime).toISOString(),
        endTime: new Date(endTime).toISOString(),
        conditionType,
        conditionValue: conditionType !== "MANUAL" && conditionType !== "MEDIA" && conditionValue ? Number(conditionValue) : undefined,
      } as any);
      reset();
      onCreated();
      onClose();
    } catch (e: any) {
      Alert.alert("Lỗi", e?.response?.data?.message ?? "Không thể tạo sự kiện");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalBox, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Tạo sự kiện</Text>
            <TouchableOpacity onPress={() => { reset(); onClose(); }}>
              <X size={20} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Scope (chỉ admin mới chọn PUBLIC) */}
            {isAdmin && (
              <View style={styles.fieldGroup}>
                <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Phạm vi</Text>
                <View style={styles.segRow}>
                  {(["PUBLIC", "GROUP"] as const).map((s) => (
                    <TouchableOpacity key={s}
                      style={[styles.seg, { borderColor: colors.border }, scope === s && { backgroundColor: colors.primary, borderColor: colors.primary }]}
                      onPress={() => setScope(s)}
                    >
                      <Text style={[styles.segText, { color: scope === s ? "white" : colors.textSecondary }]}>
                        {s === "PUBLIC" ? "Công khai" : "Nhóm"}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Tên sự kiện *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.bgSecondary, borderColor: colors.border, color: colors.textPrimary }]}
                value={title} onChangeText={setTitle}
                placeholder="VD: Marathon sức khoẻ tháng 6"
                placeholderTextColor={colors.textMuted}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Mô tả</Text>
              <TextInput
                style={[styles.input, styles.inputMulti, { backgroundColor: colors.bgSecondary, borderColor: colors.border, color: colors.textPrimary }]}
                value={description} onChangeText={setDescription}
                placeholder="Mô tả ngắn về sự kiện..."
                placeholderTextColor={colors.textMuted}
                multiline numberOfLines={3}
              />
            </View>

            {/* Type */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Hình thức</Text>
              <View style={styles.segRow}>
                {(["online", "offline"] as const).map((t) => (
                  <TouchableOpacity key={t}
                    style={[styles.seg, { borderColor: colors.border }, type === t && { backgroundColor: colors.primary, borderColor: colors.primary }]}
                    onPress={() => setType(t)}
                  >
                    <Text style={[styles.segText, { color: type === t ? "white" : colors.textSecondary }]}>
                      {t === "online" ? "Online" : "Offline"}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {type === "online" && (
              <View style={styles.fieldGroup}>
                <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Link tham gia</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.bgSecondary, borderColor: colors.border, color: colors.textPrimary }]}
                  value={link} onChangeText={setLink}
                  placeholder="https://meet.google.com/..."
                  placeholderTextColor={colors.textMuted}
                  keyboardType="url"
                />
              </View>
            )}

            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Thời gian bắt đầu *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.bgSecondary, borderColor: colors.border, color: colors.textPrimary }]}
                value={startTime} onChangeText={setStartTime}
                placeholder="2026-07-01T08:00"
                placeholderTextColor={colors.textMuted}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Thời gian kết thúc *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.bgSecondary, borderColor: colors.border, color: colors.textPrimary }]}
                value={endTime} onChangeText={setEndTime}
                placeholder="2026-07-07T20:00"
                placeholderTextColor={colors.textMuted}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Số lượng tối đa (để trống = không giới hạn)</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.bgSecondary, borderColor: colors.border, color: colors.textPrimary }]}
                value={maxParticipants} onChangeText={setMaxParticipants}
                placeholder="100"
                placeholderTextColor={colors.textMuted}
                keyboardType="numeric"
              />
            </View>

            {/* ── ĐIỀU KIỆN TIẾN ĐỘ TỰ ĐỘNG ── */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Điều kiện xác nhận tiến độ</Text>
              <View style={[styles.conditionGrid]}>
                {(["MANUAL", "WORKOUT", "STEPS", "WATER", "MEDIA"] as EventConditionType[]).map((c) => (
                  <TouchableOpacity
                    key={c}
                    style={[
                      styles.conditionBtn,
                      { borderColor: colors.border, backgroundColor: colors.bgSecondary },
                      conditionType === c && { borderColor: colors.primary, backgroundColor: colors.primaryBg },
                    ]}
                    onPress={() => setConditionType(c)}
                  >
                    <Text style={{ fontSize: 18 }}>
                      {c === "MANUAL" ? "✋" : c === "WORKOUT" ? "🏋️" : c === "STEPS" ? "👟" : c === "WATER" ? "💧" : "🎬"}
                    </Text>
                    <Text style={[
                      styles.conditionBtnText,
                      { color: conditionType === c ? colors.primary : colors.textSecondary },
                    ]}>
                      {CONDITION_LABELS[c]}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {conditionType !== "MANUAL" && conditionType !== "MEDIA" && (
              <View style={styles.fieldGroup}>
                <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
                  Ngưỡng cần đạt mỗi ngày ({CONDITION_UNITS[conditionType]}) *
                </Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.bgSecondary, borderColor: colors.border, color: colors.textPrimary }]}
                  value={conditionValue} onChangeText={setConditionValue}
                  placeholder={
                    conditionType === "WORKOUT" ? "VD: 1" :
                    conditionType === "STEPS"   ? "VD: 8000" : "VD: 2000"
                  }
                  placeholderTextColor={colors.textMuted}
                  keyboardType="numeric"
                />
              </View>
            )}

            <TouchableOpacity
              style={[styles.createBtn, saving && { opacity: 0.6 }]}
              onPress={handleCreate}
              disabled={saving}
            >
              <LinearGradient colors={Colors.gradientPrimary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.createBtnGradient}>
                <Plus size={16} color="white" />
                <Text style={styles.createBtnText}>{saving ? "Đang tạo..." : "Tạo sự kiện"}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

// ─── MAIN SCREEN ─────────────────────────────────────────────────────────────

type TabKey = "upcoming" | "ongoing" | "past";

export default function EventsScreen({ groupId }: { groupId?: string }) {
  const colors = useColors();
  const { isDark } = useTheme();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [registrations, setRegistrations] = useState<EventRegistrationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState<TabKey>("upcoming");
  const [showCreate, setShowCreate] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userId, setUserId] = useState<number | null>(null);

  useEffect(() => {
    getUserFromToken().then((u) => {
      if (u?.id) setUserId(u.id);
      if ((u as any)?.role === "ADMIN") setIsAdmin(true);
    });
  }, []);

  const load = useCallback(async () => {
    try {
      const [evRes, regRes] = await Promise.allSettled([
        groupId ? eventsApi.getGroupEvents(groupId) : eventsApi.getAll(),
        eventsApi.myRegistrations(),
      ]);
      if (evRes.status === "fulfilled") {
        const list = Array.isArray(evRes.value.data) ? evRes.value.data : [];
        setEvents(list);
      }
      if (regRes.status === "fulfilled") {
        const list = Array.isArray(regRes.value.data) ? regRes.value.data : [];
        setRegistrations(list);
      }
    } catch {} finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [groupId]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const registrationMap = React.useMemo(() => {
    const m = new Map<number, EventRegistrationItem>();
    registrations.forEach((r) => { if (r.event?.id) m.set(r.event.id, r); });
    return m;
  }, [registrations]);

  const handleRegister = async (id: number) => {
    try {
      const res = await eventsApi.register(id);
      Alert.alert("", "Đăng ký thành công!");
      load();
    } catch (e: any) {
      Alert.alert("Lỗi", e?.response?.data?.message ?? "Không thể đăng ký");
    }
  };

  const handleUnregister = async (id: number) => {
    Alert.alert("Huỷ đăng ký", "Bạn có chắc muốn huỷ đăng ký sự kiện này?", [
      { text: "Không", style: "cancel" },
      {
        text: "Huỷ đăng ký", style: "destructive",
        onPress: async () => {
          try {
            await eventsApi.unregister(id);
            load();
          } catch (e: any) {
            Alert.alert("Lỗi", e?.response?.data?.message ?? "Không thể huỷ đăng ký");
          }
        },
      },
    ]);
  };

  const handleCheckIn = async (id: number) => {
    try {
      await eventsApi.checkIn(id);
      Alert.alert("Check-in thành công!", "Tiến độ của bạn đã được cập nhật.");
      load();
    } catch (e: any) {
      Alert.alert("Lỗi", e?.response?.data?.message ?? "Không thể check-in");
    }
  };

  const now = new Date();
  const filtered = events.filter((e) => {
    const s = new Date(e.startTime), en = new Date(e.endTime);
    if (tab === "upcoming")  return s > now;
    if (tab === "ongoing")   return s <= now && en >= now;
    return en < now;
  });

  const TABS: { key: TabKey; label: string }[] = [
    { key: "upcoming", label: "Sắp tới" },
    { key: "ongoing",  label: "Đang diễn ra" },
    { key: "past",     label: "Đã kết thúc" },
  ];

  const canCreate = isAdmin || !!groupId;

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.bgSecondary }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.bgSecondary }]}>
      {/* HEADER */}
      {!groupId && (
        <View style={[styles.header, { backgroundColor: colors.bgPrimary, borderBottomColor: colors.border }]}>
          <View>
            <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Sự kiện</Text>
            <Text style={[styles.headerSub, { color: colors.textMuted }]}>
              {events.length} sự kiện · {registrations.filter(r => r.status !== "cancelled").length} đã tham gia
            </Text>
          </View>
          {canCreate && (
            <TouchableOpacity
              style={[styles.createFab, { backgroundColor: colors.primary }]}
              onPress={() => setShowCreate(true)}
            >
              <Plus size={18} color="white" />
              <Text style={styles.createFabText}>Tạo mới</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* TABS */}
      <View style={[styles.tabRow, { backgroundColor: colors.bgPrimary, borderBottomColor: colors.border }]}>
        {TABS.map(({ key, label }) => {
          const count = events.filter((e) => {
            const s = new Date(e.startTime), en = new Date(e.endTime);
            if (key === "upcoming")  return s > now;
            if (key === "ongoing")   return s <= now && en >= now;
            return en < now;
          }).length;
          return (
            <TouchableOpacity
              key={key}
              style={[styles.tab, tab === key && { borderBottomColor: colors.primary }]}
              onPress={() => setTab(key)}
            >
              <Text style={[styles.tabText, { color: tab === key ? colors.primary : colors.textMuted },
                tab === key && { fontWeight: "700" }]}>
                {label}
              </Text>
              {count > 0 && (
                <View style={[styles.tabBadge, { backgroundColor: tab === key ? colors.primary : colors.bgCardElevated }]}>
                  <Text style={[styles.tabBadgeText, { color: tab === key ? "white" : colors.textMuted }]}>{count}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => router.push({ pathname: "/(tabs)/(community)/event/[id]", params: { id: String(item.id) } } as any)}
          >
            <EventCard
              item={item}
              registration={registrationMap.get(item.id)}
              onRegister={handleRegister}
              onUnregister={handleUnregister}
              onCheckIn={handleCheckIn}
            />
          </TouchableOpacity>
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
            <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
              {tab === "upcoming" ? "Chưa có sự kiện sắp tới" :
               tab === "ongoing"  ? "Không có sự kiện đang diễn ra" :
               "Chưa có sự kiện nào kết thúc"}
            </Text>
            {canCreate && tab === "upcoming" && (
              <TouchableOpacity
                style={[styles.emptyBtn, { borderColor: colors.primary }]}
                onPress={() => setShowCreate(true)}
              >
                <Text style={[styles.emptyBtnText, { color: colors.primary }]}>Tạo sự kiện đầu tiên</Text>
              </TouchableOpacity>
            )}
          </View>
        }
        showsVerticalScrollIndicator={false}
        ListFooterComponent={<View style={{ height: 100 }} />}
      />

      <CreateEventModal
        visible={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={load}
        groupId={groupId}
        isAdmin={isAdmin}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: Spacing.base, paddingTop: sw(52), paddingBottom: Spacing.md,
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: sf(22), fontWeight: "800" },
  headerSub: { fontSize: sf(12), marginTop: 2 },
  createFab: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: sw(14), paddingVertical: sw(8), borderRadius: Radius.xl,
  },
  createFabText: { color: "white", fontWeight: "700", fontSize: sf(13) },

  tabRow: { flexDirection: "row", borderBottomWidth: 1 },
  tab: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 5, paddingVertical: sw(11), borderBottomWidth: 2, borderBottomColor: "transparent",
  },
  tabText: { fontSize: sf(12), fontWeight: "500" },
  tabBadge: { borderRadius: sw(8), minWidth: sw(18), paddingHorizontal: sw(4), paddingVertical: sw(2), alignItems: "center" },
  tabBadgeText: { fontSize: sf(10), fontWeight: "bold" },

  // Card
  card: { borderRadius: Radius.xl, borderWidth: 1, overflow: "hidden", padding: Spacing.md },
  cardHeader: { flexDirection: "row", gap: Spacing.md, marginBottom: Spacing.sm },
  datePill: {
    width: sw(50), height: sw(50), borderRadius: Radius.lg,
    alignItems: "center", justifyContent: "center", flexShrink: 0,
  },
  dateDay: { color: "white", fontSize: sf(18), fontWeight: "800", lineHeight: sw(20) },
  dateMonth: { color: "rgba(255,255,255,0.75)", fontSize: sf(10), fontWeight: "600" },
  badgeRow: { flexDirection: "row", gap: 5, flexWrap: "wrap", marginBottom: 4 },
  badge: { flexDirection: "row", alignItems: "center", gap: 3, paddingHorizontal: sw(7), paddingVertical: sw(3), borderRadius: Radius.sm },
  badgeText: { fontSize: sf(10), fontWeight: "700" },
  livedot: { width: sw(6), height: sw(6), borderRadius: sw(3) },
  cardTitle: { fontSize: sf(15), fontWeight: "700", lineHeight: 20 },
  desc: { fontSize: sf(13), lineHeight: 18, marginBottom: Spacing.sm },
  timeRow: { flexDirection: "row", alignItems: "center", gap: 5, marginBottom: Spacing.sm },
  timeTxt: { fontSize: sf(12) },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: Spacing.sm },
  metaChip: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: sw(7), paddingVertical: sw(3), borderRadius: Radius.sm },
  metaChipText: { fontSize: sf(11), fontWeight: "600" },
  organiser: { fontSize: sf(11) },

  // Progress
  progressWrap: { marginVertical: Spacing.sm },
  progressHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: sw(5) },
  progressLabel: { fontSize: sf(12) },
  progressPct: { fontSize: sf(12), fontWeight: "700" },
  progressTrack: { height: sw(6), borderRadius: sw(3), overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: sw(3) },
  completedRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: sw(5) },
  completedText: { fontSize: sf(12), fontWeight: "700" },

  divider: { height: 1, marginVertical: Spacing.sm },
  actions: { flexDirection: "row", alignItems: "center", gap: Spacing.sm, flexWrap: "wrap" },
  actionBtn: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: sw(12), paddingVertical: sw(7), borderRadius: Radius.lg,
  },
  actionBtnText: { color: "white", fontWeight: "700", fontSize: sf(12) },
  actionBtnOutline: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: sw(12), paddingVertical: sw(7),
    borderRadius: Radius.lg, borderWidth: 1,
  },
  actionBtnOutlineText: { fontWeight: "700", fontSize: sf(12) },
  endedText: { fontSize: sf(12) },

  empty: { alignItems: "center", paddingTop: sw(60), gap: sw(12) },
  emptyIcon: { width: sw(72), height: sw(72), borderRadius: sw(20), alignItems: "center", justifyContent: "center" },
  emptyTitle: { fontSize: sf(15), fontWeight: "600", textAlign: "center" },
  emptyBtn: { paddingHorizontal: sw(20), paddingVertical: sw(9), borderRadius: Radius.xl, borderWidth: 1 },
  emptyBtnText: { fontWeight: "700", fontSize: sf(13) },

  // Modal
  modalOverlay: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.6)" },
  modalBox: {
    borderTopLeftRadius: Radius.xxl, borderTopRightRadius: Radius.xxl,
    borderTopWidth: 1, padding: Spacing.base, paddingBottom: sw(40),
    maxHeight: "90%",
  },
  modalHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: Spacing.base },
  modalTitle: { fontSize: sf(18), fontWeight: "800" },
  fieldGroup: { marginBottom: Spacing.md },
  fieldLabel: { fontSize: sf(12), fontWeight: "600", marginBottom: sw(6) },
  input: {
    borderWidth: 1, borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md, paddingVertical: sw(11),
    fontSize: sf(14),
  },
  inputMulti: { minHeight: sw(80), textAlignVertical: "top" },
  segRow: { flexDirection: "row", gap: Spacing.sm },
  seg: {
    flex: 1, paddingVertical: sw(9), borderRadius: Radius.lg,
    borderWidth: 1, alignItems: "center",
  },
  segText: { fontSize: sf(13), fontWeight: "600" },
  createBtn: { marginTop: Spacing.md, borderRadius: Radius.xl, overflow: "hidden" },
  createBtnGradient: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 7, paddingVertical: sw(14),
  },
  createBtnText: { color: "white", fontWeight: "800", fontSize: sf(15) },

  conditionGrid: {
    flexDirection: "row", flexWrap: "wrap", gap: sw(8),
  },
  conditionBtn: {
    flexBasis: "47%", flexGrow: 1,
    alignItems: "center", gap: sw(4),
    paddingVertical: sw(10), paddingHorizontal: sw(8),
    borderRadius: Radius.lg, borderWidth: 1.5,
  },
  conditionBtnText: { fontSize: sf(11), fontWeight: "700", textAlign: "center" },
});
