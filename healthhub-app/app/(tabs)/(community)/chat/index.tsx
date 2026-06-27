import { router } from "expo-router";
import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  Image,
  RefreshControl,
  TouchableOpacity,
} from "react-native";
import { MessageCircle, ArrowLeft, Edit3 } from "lucide-react-native";
import { useFocusEffect } from "expo-router";
import { chatApi } from "@/src/api/chatApi";
import { getUserFromToken } from "@/src/utils/tokenStorage";
import { useColors, Spacing, Radius, sf, sw } from "@/src/theme";
import { useTranslation } from "react-i18next";

interface Participant {
  _id: string;
  fullName: string;
  avatar?: string;
}

interface ChatRoom {
  _id: string;
  participants: Participant[];
  lastMessage?: string;
  lastMessageAt?: string;
  unreadCount?: number;
}

function timeAgo(dateStr?: string) {
  if (!dateStr) return "";
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return "Vừa xong";
  if (diff < 3600) return `${Math.floor(diff / 60)}p`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}g`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}n`;
  return new Date(dateStr).toLocaleDateString("vi-VN");
}

export default function ChatListScreen() {
  const colors = useColors();
  const { t } = useTranslation();
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [myId, setMyId] = useState<string>("");

  useEffect(() => {
    getUserFromToken().then((u) => { if (u?.id) setMyId(String(u.id)); });
  }, []);

  const load = async () => {
    try {
      const data = await chatApi.getRooms();
      setRooms(data);
    } catch (e) {
      console.log("Load rooms error:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => { load(); }, []));

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
        <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: colors.bgCardElevated, borderColor: colors.border }]}>
          <ArrowLeft size={20} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <View style={styles.msgIconWrap}>
            <MessageCircle size={18} color="#60a5fa" />
          </View>
          <Text style={[styles.title, { color: colors.textPrimary }]}>{t("chat.title")}</Text>
        </View>
        <TouchableOpacity style={[styles.editBtn, { backgroundColor: colors.bgCardElevated, borderColor: colors.border }]}>
          <Edit3 size={18} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); load(); }}
            tintColor={colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {rooms.length === 0 ? (
          <View style={styles.empty}>
            <View style={[styles.emptyIcon, { backgroundColor: colors.bgCard }]}>
              <MessageCircle size={36} color={colors.textMuted} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>{t("chat.no_chats")}</Text>
            <Text style={[styles.emptySubText, { color: colors.textMuted }]}>
              Vào trang Bạn bè và nhấn biểu tượng chat để bắt đầu.
            </Text>
          </View>
        ) : (
          rooms.map((room, i) => {
            const friend =
              room.participants.find((p) => p._id !== myId) ??
              room.participants[0];
            if (!friend) return null;

            const initials = (friend.fullName ?? "?").charAt(0).toUpperCase();
            const isLast = i === rooms.length - 1;

            const hasUnread = (room.unreadCount ?? 0) > 0;
            return (
              <Pressable
                key={room._id}
                style={({ pressed }) => [
                  styles.item,
                  { borderBottomColor: colors.border },
                  hasUnread && { backgroundColor: colors.primaryBg },
                  pressed && { backgroundColor: colors.bgCard },
                  isLast && { borderBottomWidth: 0 },
                ]}
                onPress={() => {
                  chatApi.markRoomAsRead(room._id).catch(() => {});
                  setRooms((prev) => prev.map((r) => r._id === room._id ? { ...r, unreadCount: 0 } : r));
                  router.push({
                    pathname: "/(tabs)/(community)/chat/[id]",
                    params: { id: room._id, friendName: friend.fullName, friendAvatar: friend.avatar ?? "" },
                  } as any);
                }}
              >
                {/* AVATAR */}
                <View style={styles.avatarWrap}>
                  {friend.avatar ? (
                    <Image source={{ uri: friend.avatar }} style={styles.avatar} />
                  ) : (
                    <View style={[styles.avatar, styles.avatarFallback, { backgroundColor: "#2563eb" }]}>
                      <Text style={styles.avatarInitial}>{initials}</Text>
                    </View>
                  )}
                  {hasUnread && (
                    <View style={[styles.unreadDot, { backgroundColor: colors.danger, borderColor: colors.bgCard }]}>
                      <Text style={styles.unreadDotText}>{(room.unreadCount ?? 0) > 9 ? "9+" : room.unreadCount}</Text>
                    </View>
                  )}
                </View>

                {/* INFO */}
                <View style={styles.info}>
                  <Text style={[styles.friendName, { color: colors.textPrimary }, hasUnread && { fontWeight: "700" }]} numberOfLines={1}>
                    {friend.fullName}
                  </Text>
                  <Text
                    style={[styles.lastMsg, { color: hasUnread ? colors.textPrimary : colors.textMuted }, !room.lastMessage && styles.lastMsgEmpty, hasUnread && { fontWeight: "600" }]}
                    numberOfLines={1}
                  >
                    {room.lastMessage && room.lastMessage !== "__init__"
                      ? room.lastMessage
                      : "Bắt đầu cuộc trò chuyện"}
                  </Text>
                </View>

                {/* TIME + unread indicator */}
                <View style={styles.timeCol}>
                  {room.lastMessageAt && (
                    <Text style={[styles.time, { color: hasUnread ? colors.primary : colors.textMuted }]}>{timeAgo(room.lastMessageAt)}</Text>
                  )}
                </View>
              </Pressable>
            );
          })
        )}
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.base,
    paddingTop: 52,
    paddingBottom: Spacing.md,
    gap: 10,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 38, height: 38,
    borderRadius: Radius.md,
    justifyContent: "center", alignItems: "center",
    borderWidth: 1,
  },
  headerCenter: { flex: 1, flexDirection: "row", alignItems: "center", gap: 10 },
  msgIconWrap: {
    width: 34, height: 34, borderRadius: 10,
    backgroundColor: "rgba(96,165,250,0.15)",
    alignItems: "center", justifyContent: "center",
  },
  title: { fontSize: 20, fontWeight: "800" },
  editBtn: {
    width: 38, height: 38,
    borderRadius: Radius.md,
    justifyContent: "center", alignItems: "center",
    borderWidth: 1,
  },

  item: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.base,
    paddingVertical: 13,
    borderBottomWidth: 1,
    gap: 12,
  },

  avatarWrap: { position: "relative" },
  avatar: { width: sw(52), height: sw(52), borderRadius: sw(26) },
  avatarFallback: { justifyContent: "center", alignItems: "center" },
  avatarInitial: { color: "white", fontWeight: "bold", fontSize: sf(20) },
  unreadDot: {
    position: "absolute", top: -2, right: -2,
    minWidth: sw(18), paddingHorizontal: sw(3), paddingVertical: sw(1),
    borderRadius: sw(9), alignItems: "center",
    borderWidth: 1.5,
  },
  unreadDotText: { color: "white", fontSize: sf(9), fontWeight: "bold" },

  info: { flex: 1 },
  friendName: { fontSize: sf(15), fontWeight: "600" },
  lastMsg: { fontSize: sf(13), marginTop: 3 },
  lastMsgEmpty: { fontStyle: "italic" },
  timeCol: { alignItems: "flex-end" },
  time: { fontSize: sf(12) },

  empty: {
    alignItems: "center",
    paddingTop: 80,
    gap: 12,
    paddingHorizontal: Spacing.xl,
  },
  emptyIcon: {
    width: 80, height: 80, borderRadius: 24,
    alignItems: "center", justifyContent: "center",
    marginBottom: 4,
  },
  emptyTitle: { fontSize: 18, fontWeight: "700" },
  emptySubText: { fontSize: 14, textAlign: "center" },
});
