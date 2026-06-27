import React, { useEffect, useState, useCallback } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl, Image,
} from "react-native";
import {
  Bell, Heart, MessageSquare, UserPlus, Trophy,
  Flame, CheckCircle, Info, Trash2, MessageCircle,
  Newspaper, Users,
} from "lucide-react-native";
import { useFocusEffect, useRouter } from "expo-router";
import axiosClient from "@/src/api/axiosClient";
import { chatApi } from "@/src/api/chatApi";
import { friendApi } from "@/src/api/friendApi";
import { useColors, Spacing, Radius, Shadow, sw, sf } from "@/src/theme";
import { useTheme } from "@/src/context/ThemeContext";
import { simpleCache } from "@/src/utils/simpleCache";

interface NotificationItem {
  id: number; type: string; message: string;
  icon?: string; isRead: boolean; createdAt: string; priority: number;
  meta?: { postId?: string; userId?: string; friendRequestId?: number };
}

interface ChatRoomItem {
  _id: string;
  participants: Array<{ _id: string; fullName: string; avatar?: string }>;
  lastMessage?: string;
  lastMessageAt?: string;
  unreadCount: number;
}

interface FriendRequestItem {
  id: string;
  fromUser: { id: number; fullName: string; username: string; avatarUrl?: string; avatar?: string };
  createdAt: string;
}

function timeAgo(dateStr: string) {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return "Vừa xong";
  if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
  if (diff < 604800) return `${Math.floor(diff / 86400)} ngày trước`;
  return new Date(dateStr).toLocaleDateString("vi-VN");
}

const TYPE_CONFIG: Record<string, { icon: any; color: string; bgKey: string }> = {
  FRIEND_REQUEST:  { icon: UserPlus,      color: "#3b82f6", bgKey: "primaryBg" },
  FRIEND_ACCEPTED: { icon: Users,         color: "#3b82f6", bgKey: "primaryBg" },
  LIKE:            { icon: Heart,         color: "#ef4444", bgKey: "dangerBg" },
  COMMENT:         { icon: MessageSquare, color: "#8b5cf6", bgKey: "purpleBg" },
  POST:            { icon: Newspaper,     color: "#8b5cf6", bgKey: "purpleBg" },
  ACHIEVEMENT:     { icon: Trophy,        color: "#f59e0b", bgKey: "warningBg" },
  CHALLENGE:       { icon: Flame,         color: "#f97316", bgKey: "orangeBg" },
  WORKOUT:         { icon: CheckCircle,   color: "#22c55e", bgKey: "successBg" },
  MESSAGE:         { icon: MessageCircle, color: "#06b6d4", bgKey: "primaryBg" },
};

type TabKey = "all" | "social" | "posts" | "system";
const TABS: { key: TabKey; label: string; icon: any }[] = [
  { key: "all",    label: "Tất cả",   icon: Bell },
  { key: "social", label: "Bạn bè",   icon: Users },
  { key: "posts",  label: "Bài đăng", icon: Newspaper },
  { key: "system", label: "Hệ thống", icon: Info },
];

function typeToTab(type: string): TabKey {
  if (["FRIEND_REQUEST", "FRIEND_ACCEPTED", "MESSAGE"].includes(type)) return "social";
  if (["LIKE", "COMMENT", "POST"].includes(type)) return "posts";
  return "system";
}

export default function AlertsScreen() {
  const colors = useColors();
  const { isDark } = useTheme();
  const router = useRouter();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [chatRooms, setChatRooms] = useState<ChatRoomItem[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>("all");
  const [myId, setMyId] = useState<string>("");

  const load = async () => {
    try {
      const [notifRes, roomsRes, friendRes] = await Promise.allSettled([
        axiosClient.get("/notifications?page=1&limit=50"),
        chatApi.getRooms(),
        friendApi.getReceivedRequests(),
      ]);

      if (notifRes.status === "fulfilled") {
        const items: NotificationItem[] = notifRes.value.data?.items ?? notifRes.value.data ?? [];
        setNotifications(items);
      }
      if (roomsRes.status === "fulfilled") {
        const rooms = Array.isArray(roomsRes.value) ? roomsRes.value : [];
        setChatRooms(rooms.filter((r: ChatRoomItem) => (r.unreadCount ?? 0) > 0 ||
          (r.lastMessageAt && Date.now() - new Date(r.lastMessageAt).getTime() < 7 * 86400_000)));
      }
      if (friendRes.status === "fulfilled") {
        const reqs = friendRes.value;
        setFriendRequests(Array.isArray(reqs) ? reqs : []);
      }
    } catch {} finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => {
    simpleCache.delete("notif:unread");
    load();
  }, []));

  const markAllRead = async () => {
    try {
      await axiosClient.patch("/notifications/read-all");
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch {}
  };

  const markOne = async (id: number) => {
    try {
      await axiosClient.patch(`/notifications/${id}/read`);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    } catch {}
  };

  const clearAll = async () => {
    try {
      await axiosClient.delete("/notifications/clear");
      setNotifications([]);
    } catch {}
  };

  const acceptFriend = async (requestId: string) => {
    try {
      await friendApi.respond(requestId, true);
      setFriendRequests((prev) => prev.filter((r) => r.id !== requestId));
      simpleCache.deleteByPrefix("community:");
    } catch {}
  };

  const rejectFriend = async (requestId: string) => {
    try {
      await friendApi.respond(requestId, false);
      setFriendRequests((prev) => prev.filter((r) => r.id !== requestId));
    } catch {}
  };

  const openChat = (room: ChatRoomItem) => {
    const friend = room.participants.find((p) => p._id !== myId) ?? room.participants[0];
    if (!friend) return;
    chatApi.markRoomAsRead(room._id).catch(() => {});
    setChatRooms((prev) => prev.map((r) => r._id === room._id ? { ...r, unreadCount: 0 } : r));
    router.push({
      pathname: "/(tabs)/(community)/chat/[id]",
      params: { id: room._id, friendName: friend.fullName, friendAvatar: friend.avatar ?? "" },
    } as any);
  };

  const unreadNotifs = notifications.filter((n) => !n.isRead).length;
  const unreadChats = chatRooms.reduce((s, r) => s + (r.unreadCount ?? 0), 0);
  const pendingFriends = friendRequests.length;
  const totalUnread = unreadNotifs + unreadChats + pendingFriends;

  const filteredNotifs = activeTab === "all"
    ? notifications
    : notifications.filter((n) => typeToTab(n.type) === activeTab);

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
      <View style={[styles.header, { backgroundColor: colors.bgPrimary, borderBottomColor: colors.border }]}>
        <View style={styles.headerLeft}>
          <View style={[styles.bellWrap, { backgroundColor: colors.primaryBg }]}>
            <Bell size={18} color={colors.primary} />
          </View>
          <Text style={[styles.title, { color: colors.textPrimary }]}>Thông báo</Text>
          {totalUnread > 0 && (
            <View style={[styles.badge, { backgroundColor: colors.danger }]}>
              <Text style={styles.badgeText}>{totalUnread > 99 ? "99+" : totalUnread}</Text>
            </View>
          )}
        </View>
        <View style={styles.headerActions}>
          {unreadNotifs > 0 && (
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: colors.bgCardElevated, borderColor: colors.border }]}
              onPress={markAllRead}
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
        {TABS.map(({ key, label, icon: Icon }) => (
          <TouchableOpacity
            key={key}
            style={[styles.tab, activeTab === key && { borderBottomColor: colors.primary }]}
            onPress={() => setActiveTab(key)}
          >
            <Icon size={13} color={activeTab === key ? colors.primary : colors.textMuted} />
            <Text style={[styles.tabText, { color: activeTab === key ? colors.primary : colors.textMuted },
              activeTab === key && { fontWeight: "700" }]}>
              {label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.primary} />
        }
      >
        {/* FRIEND REQUESTS — chỉ hiện ở tab "all" hoặc "social" */}
        {(activeTab === "all" || activeTab === "social") && friendRequests.length > 0 && (
          <View style={[styles.section, { backgroundColor: colors.bgPrimary }]}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionDot, { backgroundColor: colors.primary }]} />
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                Lời mời kết bạn · {friendRequests.length}
              </Text>
            </View>
            {friendRequests.map((req) => {
              const user = req.fromUser;
              const avatar = user.avatarUrl ?? user.avatar;
              return (
                <View key={req.id} style={[styles.friendReqCard, { backgroundColor: colors.bgCard, borderColor: colors.border }, isDark ? {} : Shadow.xs]}>
                  {avatar ? (
                    <Image source={{ uri: avatar }} style={styles.friendAvatar} />
                  ) : (
                    <View style={[styles.friendAvatar, styles.avatarFallback, { backgroundColor: colors.primary }]}>
                      <Text style={styles.avatarInitial}>{(user.fullName ?? "?").charAt(0).toUpperCase()}</Text>
                    </View>
                  )}
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.friendName, { color: colors.textPrimary }]}>{user.fullName}</Text>
                    <Text style={[styles.friendUsername, { color: colors.textMuted }]}>@{user.username}</Text>
                    <Text style={[styles.friendTime, { color: colors.textMuted }]}>{timeAgo(req.createdAt)}</Text>
                  </View>
                  <View style={styles.friendActions}>
                    <TouchableOpacity
                      style={[styles.acceptBtn, { backgroundColor: colors.primary }]}
                      onPress={() => acceptFriend(req.id)}
                    >
                      <Text style={styles.acceptText}>Chấp nhận</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.rejectBtn, { backgroundColor: colors.bgCardElevated, borderColor: colors.border }]}
                      onPress={() => rejectFriend(req.id)}
                    >
                      <Text style={[styles.rejectText, { color: colors.textSecondary }]}>Từ chối</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* UNREAD CHAT MESSAGES — tab "all" hoặc "social" */}
        {(activeTab === "all" || activeTab === "social") && chatRooms.some((r) => (r.unreadCount ?? 0) > 0) && (
          <View style={[styles.section, { backgroundColor: colors.bgPrimary }]}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionDot, { backgroundColor: "#06b6d4" }]} />
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Tin nhắn chưa đọc</Text>
            </View>
            {chatRooms.filter((r) => (r.unreadCount ?? 0) > 0).map((room) => {
              const friend = room.participants.find((p) => p._id !== myId) ?? room.participants[0];
              if (!friend) return null;
              const isOld = room.lastMessageAt
                ? Date.now() - new Date(room.lastMessageAt).getTime() > 3600_000
                : false;
              return (
                <TouchableOpacity
                  key={room._id}
                  style={[styles.chatCard, { backgroundColor: colors.bgCard, borderColor: colors.border }, isDark ? {} : Shadow.xs]}
                  onPress={() => openChat(room)}
                  activeOpacity={0.8}
                >
                  <View style={styles.chatAvatarWrap}>
                    {friend.avatar ? (
                      <Image source={{ uri: friend.avatar }} style={styles.chatAvatar} />
                    ) : (
                      <View style={[styles.chatAvatar, styles.avatarFallback, { backgroundColor: "#06b6d4" }]}>
                        <Text style={styles.avatarInitial}>{(friend.fullName ?? "?").charAt(0).toUpperCase()}</Text>
                      </View>
                    )}
                    <View style={[styles.unreadBubble, { backgroundColor: colors.danger }]}>
                      <Text style={styles.unreadBubbleText}>{room.unreadCount > 99 ? "99+" : room.unreadCount}</Text>
                    </View>
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={styles.chatNameRow}>
                      <Text style={[styles.chatName, { color: colors.textPrimary }]}>{friend.fullName}</Text>
                      {isOld && (
                        <View style={[styles.urgentTag, { backgroundColor: "rgba(239,68,68,0.1)" }]}>
                          <Text style={styles.urgentTagText}>Chưa trả lời</Text>
                        </View>
                      )}
                    </View>
                    <Text style={[styles.chatLastMsg, { color: colors.textSecondary }]} numberOfLines={1}>
                      {room.lastMessage ?? "Bắt đầu cuộc trò chuyện"}
                    </Text>
                    {room.lastMessageAt && (
                      <Text style={[styles.chatTime, { color: isOld ? colors.danger : colors.textMuted }]}>
                        {timeAgo(room.lastMessageAt)}
                      </Text>
                    )}
                  </View>
                  <MessageCircle size={16} color="#06b6d4" />
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* NOTIFICATIONS LIST */}
        {filteredNotifs.length > 0 ? (
          <View style={[styles.section, { backgroundColor: colors.bgPrimary }]}>
            {(activeTab === "all" || activeTab === "posts" || activeTab === "social" || activeTab === "system") && (
              <View style={styles.sectionHeader}>
                <View style={[styles.sectionDot, { backgroundColor: colors.textMuted }]} />
                <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                  {activeTab === "all" ? "Tất cả thông báo" :
                   activeTab === "social" ? "Hoạt động bạn bè" :
                   activeTab === "posts" ? "Bài đăng" : "Hệ thống"}
                </Text>
              </View>
            )}
            {filteredNotifs.map((n, i) => {
              const cfg = TYPE_CONFIG[n.type] ?? { icon: Info, color: colors.textMuted, bgKey: "bgCardElevated" };
              const Icon = cfg.icon;
              const bg = (colors as any)[cfg.bgKey] ?? colors.bgCardElevated;
              return (
                <TouchableOpacity
                  key={n.id}
                  style={[
                    styles.notifItem,
                    { borderBottomColor: colors.border },
                    !n.isRead && { backgroundColor: colors.primaryBg },
                    i === filteredNotifs.length - 1 && { borderBottomWidth: 0 },
                  ]}
                  onPress={() => !n.isRead && markOne(n.id)}
                  activeOpacity={0.75}
                >
                  <View style={[styles.notifIconBox, { backgroundColor: bg }]}>
                    <Icon size={18} color={cfg.color} />
                  </View>
                  <View style={styles.notifBody}>
                    <Text style={[styles.notifMsg, { color: n.isRead ? colors.textSecondary : colors.textPrimary }]} numberOfLines={3}>
                      {n.message}
                    </Text>
                    <Text style={[styles.notifTime, { color: colors.textMuted }]}>{timeAgo(n.createdAt)}</Text>
                  </View>
                  {!n.isRead && (
                    <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        ) : (
          activeTab !== "all" || (chatRooms.filter(r => r.unreadCount > 0).length === 0 && friendRequests.length === 0) ? (
            <View style={styles.empty}>
              <View style={[styles.emptyIcon, { backgroundColor: colors.bgCard }]}>
                <Bell size={32} color={colors.textMuted} />
              </View>
              <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>Không có thông báo</Text>
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>Khi có hoạt động mới sẽ xuất hiện ở đây</Text>
            </View>
          ) : null
        )}

        <View style={{ height: 120 }} />
      </ScrollView>
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
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  bellWrap: { width: sw(36), height: sw(36), borderRadius: Radius.md, alignItems: "center", justifyContent: "center" },
  title: { fontSize: sf(20), fontWeight: "800" },
  badge: { borderRadius: 10, minWidth: sw(20), paddingHorizontal: sw(6), paddingVertical: sw(2), alignItems: "center" },
  badgeText: { color: "white", fontSize: sf(10), fontWeight: "bold" },
  headerActions: { flexDirection: "row", alignItems: "center", gap: Spacing.sm },
  actionBtn: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: sw(10), paddingVertical: sw(7), borderRadius: Radius.md, borderWidth: 1 },
  actionBtnText: { fontSize: sf(12), fontWeight: "500" },
  iconBtn: { width: sw(34), height: sw(34), borderRadius: Radius.md, alignItems: "center", justifyContent: "center", borderWidth: 1 },

  tabRow: {
    flexDirection: "row", borderBottomWidth: 1,
  },
  tab: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 4, paddingVertical: sw(12), borderBottomWidth: 2, borderBottomColor: "transparent",
  },
  tabText: { fontSize: sf(12), fontWeight: "500" },

  section: { marginBottom: Spacing.sm },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 7, paddingHorizontal: Spacing.base, paddingVertical: Spacing.md },
  sectionDot: { width: sw(8), height: sw(8), borderRadius: sw(4) },
  sectionTitle: { fontSize: sf(13), fontWeight: "700" },

  // Friend requests
  friendReqCard: {
    marginHorizontal: Spacing.base, marginBottom: Spacing.sm,
    borderRadius: Radius.xl, borderWidth: 1, padding: Spacing.md,
    flexDirection: "row", alignItems: "flex-start", gap: Spacing.md,
  },
  friendAvatar: { width: sw(48), height: sw(48), borderRadius: sw(24) },
  avatarFallback: { justifyContent: "center", alignItems: "center" },
  avatarInitial: { color: "white", fontWeight: "700", fontSize: sf(16) },
  friendName: { fontSize: sf(14), fontWeight: "700" },
  friendUsername: { fontSize: sf(12), marginTop: 1 },
  friendTime: { fontSize: sf(11), marginTop: 2 },
  friendActions: { gap: sw(6) },
  acceptBtn: { paddingHorizontal: sw(12), paddingVertical: sw(6), borderRadius: Radius.lg },
  acceptText: { color: "white", fontSize: sf(12), fontWeight: "700" },
  rejectBtn: { paddingHorizontal: sw(12), paddingVertical: sw(6), borderRadius: Radius.lg, borderWidth: 1 },
  rejectText: { fontSize: sf(12), fontWeight: "600" },

  // Chat cards
  chatCard: {
    marginHorizontal: Spacing.base, marginBottom: Spacing.sm,
    borderRadius: Radius.xl, borderWidth: 1, padding: Spacing.md,
    flexDirection: "row", alignItems: "center", gap: Spacing.md,
  },
  chatAvatarWrap: { position: "relative" },
  chatAvatar: { width: sw(48), height: sw(48), borderRadius: sw(24) },
  unreadBubble: {
    position: "absolute", top: -4, right: -4,
    minWidth: sw(18), paddingHorizontal: sw(4), paddingVertical: sw(2),
    borderRadius: sw(10), alignItems: "center",
  },
  unreadBubbleText: { color: "white", fontSize: sf(10), fontWeight: "bold" },
  chatNameRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 2 },
  chatName: { fontSize: sf(14), fontWeight: "700" },
  urgentTag: { paddingHorizontal: sw(6), paddingVertical: sw(2), borderRadius: Radius.sm },
  urgentTagText: { color: "#ef4444", fontSize: sf(10), fontWeight: "700" },
  chatLastMsg: { fontSize: sf(13) },
  chatTime: { fontSize: sf(11), marginTop: 2 },

  // Notifications
  notifItem: {
    flexDirection: "row", alignItems: "flex-start",
    paddingHorizontal: Spacing.base, paddingVertical: sw(13),
    borderBottomWidth: 1, gap: Spacing.md,
  },
  notifIconBox: { width: sw(44), height: sw(44), borderRadius: Radius.lg, justifyContent: "center", alignItems: "center", flexShrink: 0 },
  notifBody: { flex: 1 },
  notifMsg: { fontSize: sf(14), lineHeight: 20 },
  notifTime: { fontSize: sf(12), marginTop: 4 },
  unreadDot: { width: sw(8), height: sw(8), borderRadius: sw(4), marginTop: sw(8), flexShrink: 0 },

  empty: { alignItems: "center", paddingTop: sw(60), gap: sw(12) },
  emptyIcon: { width: sw(72), height: sw(72), borderRadius: sw(20), alignItems: "center", justifyContent: "center" },
  emptyTitle: { fontSize: sf(17), fontWeight: "700" },
  emptyText: { fontSize: sf(13) },
});
