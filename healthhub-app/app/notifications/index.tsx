import React, { useState } from "react";
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet,
  ActivityIndicator, RefreshControl,
} from "react-native";
import {
  Bell, Heart, MessageSquare, UserPlus, Trophy,
  Flame, CheckCircle, Info, Trash2, ArrowLeft,
  Newspaper, Users, MessageCircle,
} from "lucide-react-native";
import { useRouter } from "expo-router";
import { useNotifications } from "./NotificationContext";
import { useColors, Spacing, Radius, Shadow, sw, sf } from "@/src/theme";
import { useTheme } from "@/src/context/ThemeContext";

function timeAgo(dateStr: string) {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return "Vừa xong";
  if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
  if (diff < 604800) return `${Math.floor(diff / 86400)} ngày trước`;
  return new Date(dateStr).toLocaleDateString("vi-VN");
}

const TYPE_CONFIG: Record<string, { icon: any; color: string; bgKey: string; label: string }> = {
  FRIEND_REQUEST:  { icon: UserPlus,      color: "#3b82f6", bgKey: "primaryBg",     label: "Kết bạn" },
  FRIEND_ACCEPTED: { icon: Users,         color: "#3b82f6", bgKey: "primaryBg",     label: "Bạn bè" },
  LIKE:            { icon: Heart,         color: "#ef4444", bgKey: "dangerBg",      label: "Yêu thích" },
  COMMENT:         { icon: MessageSquare, color: "#8b5cf6", bgKey: "purpleBg",      label: "Bình luận" },
  POST:            { icon: Newspaper,     color: "#8b5cf6", bgKey: "purpleBg",      label: "Bài đăng" },
  ACHIEVEMENT:     { icon: Trophy,        color: "#f59e0b", bgKey: "warningBg",     label: "Thành tích" },
  CHALLENGE:       { icon: Flame,         color: "#f97316", bgKey: "orangeBg",      label: "Thử thách" },
  WORKOUT:         { icon: CheckCircle,   color: "#22c55e", bgKey: "successBg",     label: "Tập luyện" },
  MESSAGE:         { icon: MessageCircle, color: "#06b6d4", bgKey: "primaryBg",     label: "Tin nhắn" },
  SYSTEM:          { icon: Info,          color: "#64748b", bgKey: "bgCardElevated",label: "Hệ thống" },
  MOOD:            { icon: Heart,         color: "#ec4899", bgKey: "dangerBg",      label: "Cảm xúc" },
};

type TabKey = "all" | "social" | "health" | "system";

const TABS: { key: TabKey; label: string }[] = [
  { key: "all",    label: "Tất cả" },
  { key: "social", label: "Xã hội" },
  { key: "health", label: "Sức khoẻ" },
  { key: "system", label: "Hệ thống" },
];

function typeToTab(type: string): TabKey {
  if (["FRIEND_REQUEST", "FRIEND_ACCEPTED", "LIKE", "COMMENT", "POST", "MESSAGE"].includes(type)) return "social";
  if (["ACHIEVEMENT", "CHALLENGE", "WORKOUT", "MOOD"].includes(type)) return "health";
  return "system";
}

export default function NotificationsScreen() {
  const router = useRouter();
  const colors = useColors();
  useTheme();
  const { notifications, loading, unreadCount, clearAll, markAllAsRead, markAsRead, refresh } = useNotifications();
  const [activeTab, setActiveTab] = useState<TabKey>("all");
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refresh();
    } finally {
      setRefreshing(false);
    }
  };

  const filtered = activeTab === "all"
    ? notifications
    : notifications.filter((n) => typeToTab(n.type) === activeTab);

  return (
    <View style={[styles.container, { backgroundColor: colors.bgSecondary }]}>
      {/* HEADER */}
      <View style={[styles.header, { backgroundColor: colors.bgPrimary, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.backBtn, { backgroundColor: colors.bgCardElevated, borderColor: colors.border }]}
          onPress={() => router.back()}
        >
          <ArrowLeft size={18} color={colors.textPrimary} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <View style={[styles.bellWrap, { backgroundColor: colors.primaryBg }]}>
            <Bell size={17} color={colors.primary} />
          </View>
          <View>
            <Text style={[styles.title, { color: colors.textPrimary }]}>Thông báo</Text>
            {unreadCount > 0 && (
              <Text style={[styles.subtitle, { color: colors.textMuted }]}>{unreadCount} chưa đọc</Text>
            )}
          </View>
          {unreadCount > 0 && (
            <View style={[styles.badge, { backgroundColor: colors.danger }]}>
              <Text style={styles.badgeText}>{unreadCount > 99 ? "99+" : unreadCount}</Text>
            </View>
          )}
        </View>

        <View style={styles.headerActions}>
          {unreadCount > 0 && (
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: colors.bgCardElevated, borderColor: colors.border }]}
              onPress={markAllAsRead}
            >
              <CheckCircle size={13} color={colors.success} />
              <Text style={[styles.actionBtnText, { color: colors.textSecondary }]}>Đọc tất cả</Text>
            </TouchableOpacity>
          )}
          {notifications.length > 0 && (
            <TouchableOpacity
              style={[styles.iconBtn, { backgroundColor: "rgba(239,68,68,0.08)", borderColor: "rgba(239,68,68,0.2)" }]}
              onPress={clearAll}
            >
              <Trash2 size={14} color={colors.danger} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* TABS */}
      <View style={[styles.tabRow, { backgroundColor: colors.bgPrimary, borderBottomColor: colors.border }]}>
        {TABS.map(({ key, label }) => {
          const count = key === "all"
            ? notifications.filter((n) => !n.isRead).length
            : notifications.filter((n) => typeToTab(n.type) === key && !n.isRead).length;
          return (
            <TouchableOpacity
              key={key}
              style={[styles.tab, activeTab === key && { borderBottomColor: colors.primary }]}
              onPress={() => setActiveTab(key)}
            >
              <Text style={[styles.tabText, { color: activeTab === key ? colors.primary : colors.textMuted },
                activeTab === key && { fontWeight: "700" }]}>
                {label}
              </Text>
              {count > 0 && (
                <View style={[styles.tabBadge, { backgroundColor: activeTab === key ? colors.primary : colors.textMuted }]}>
                  <Text style={styles.tabBadgeText}>{count}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* LIST */}
      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />
        }
      >
        {loading && !refreshing ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : filtered.length === 0 ? (
          <View style={styles.empty}>
            <View style={[styles.emptyIcon, { backgroundColor: colors.bgCard }]}>
              <Bell size={32} color={colors.textMuted} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>Không có thông báo</Text>
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>
              {activeTab === "all" ? "Khi có hoạt động mới sẽ xuất hiện ở đây" :
               activeTab === "social" ? "Chưa có hoạt động từ bạn bè" :
               activeTab === "health" ? "Chưa có thành tích hay thử thách mới" :
               "Chưa có thông báo hệ thống"}
            </Text>
          </View>
        ) : (
          <View style={[styles.listCard, { backgroundColor: colors.bgPrimary }]}>
            {filtered.map((n, i) => {
              const cfg = TYPE_CONFIG[n.type] ?? TYPE_CONFIG["SYSTEM"];
              const Icon = cfg.icon;
              const bg = (colors as any)[cfg.bgKey] ?? colors.bgCardElevated;
              return (
                <TouchableOpacity
                  key={n.id}
                  style={[
                    styles.item,
                    { borderBottomColor: colors.border },
                    !n.isRead && { backgroundColor: colors.primaryBg },
                    i === filtered.length - 1 && { borderBottomWidth: 0 },
                  ]}
                  onPress={() => !n.isRead && markAsRead(n.id)}
                  activeOpacity={0.75}
                >
                  <View style={[styles.iconBox, { backgroundColor: bg }]}>
                    <Icon size={18} color={cfg.color} />
                  </View>

                  <View style={styles.itemBody}>
                    <View style={styles.itemTop}>
                      <View style={[styles.typePill, { backgroundColor: bg }]}>
                        <Text style={[styles.typeText, { color: cfg.color }]}>{cfg.label}</Text>
                      </View>
                    </View>
                    <Text
                      style={[styles.itemMsg, { color: n.isRead ? colors.textSecondary : colors.textPrimary }]}
                      numberOfLines={3}
                    >
                      {n.message}
                    </Text>
                    <Text style={[styles.itemTime, { color: colors.textMuted }]}>{timeAgo(n.createdAt)}</Text>
                  </View>

                  {!n.isRead && <View style={[styles.dot, { backgroundColor: colors.primary }]} />}
                </TouchableOpacity>
              );
            })}
          </View>
        )}
        <View style={{ height: 120 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { paddingTop: sw(60), alignItems: "center" },

  header: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: Spacing.base,
    paddingTop: sw(52), paddingBottom: Spacing.md,
    borderBottomWidth: 1, gap: Spacing.sm,
  },
  backBtn: {
    width: sw(36), height: sw(36), borderRadius: Radius.md,
    alignItems: "center", justifyContent: "center", borderWidth: 1,
  },
  headerCenter: { flex: 1, flexDirection: "row", alignItems: "center", gap: Spacing.sm },
  bellWrap: { width: sw(34), height: sw(34), borderRadius: Radius.md, alignItems: "center", justifyContent: "center" },
  title: { fontSize: sf(18), fontWeight: "800" },
  subtitle: { fontSize: sf(12), marginTop: 1 },
  badge: { borderRadius: sw(10), minWidth: sw(20), paddingHorizontal: sw(5), paddingVertical: sw(2), alignItems: "center" },
  badgeText: { color: "white", fontSize: sf(10), fontWeight: "bold" },
  headerActions: { flexDirection: "row", alignItems: "center", gap: Spacing.sm },
  actionBtn: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: sw(9), paddingVertical: sw(6),
    borderRadius: Radius.md, borderWidth: 1,
  },
  actionBtnText: { fontSize: sf(11), fontWeight: "500" },
  iconBtn: {
    width: sw(32), height: sw(32), borderRadius: Radius.md,
    alignItems: "center", justifyContent: "center", borderWidth: 1,
  },

  tabRow: { flexDirection: "row", borderBottomWidth: 1 },
  tab: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 4, paddingVertical: sw(11),
    borderBottomWidth: 2, borderBottomColor: "transparent",
  },
  tabText: { fontSize: sf(12), fontWeight: "500" },
  tabBadge: { borderRadius: sw(8), minWidth: sw(16), paddingHorizontal: sw(4), paddingVertical: sw(1), alignItems: "center" },
  tabBadgeText: { color: "white", fontSize: sf(9), fontWeight: "bold" },

  listCard: { marginBottom: Spacing.sm },
  item: {
    flexDirection: "row", alignItems: "flex-start",
    paddingHorizontal: Spacing.base, paddingVertical: sw(13),
    borderBottomWidth: 1, gap: Spacing.md,
  },
  iconBox: { width: sw(44), height: sw(44), borderRadius: Radius.lg, justifyContent: "center", alignItems: "center", flexShrink: 0 },
  itemBody: { flex: 1 },
  itemTop: { flexDirection: "row", alignItems: "center", marginBottom: sw(4) },
  typePill: { paddingHorizontal: sw(7), paddingVertical: sw(2), borderRadius: Radius.sm },
  typeText: { fontSize: sf(10), fontWeight: "700" },
  itemMsg: { fontSize: sf(14), lineHeight: 20 },
  itemTime: { fontSize: sf(11), marginTop: sw(4) },
  dot: { width: sw(8), height: sw(8), borderRadius: sw(4), marginTop: sw(8), flexShrink: 0 },

  empty: { alignItems: "center", paddingTop: sw(60), gap: sw(10), paddingHorizontal: Spacing.xl },
  emptyIcon: { width: sw(72), height: sw(72), borderRadius: sw(20), alignItems: "center", justifyContent: "center" },
  emptyTitle: { fontSize: sf(17), fontWeight: "700" },
  emptyText: { fontSize: sf(13), textAlign: "center" },
});
