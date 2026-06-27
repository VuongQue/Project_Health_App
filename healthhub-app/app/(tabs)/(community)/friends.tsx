import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Image,
  Alert,
} from "react-native";
import {
  Search, MessageCircle, UserPlus, Check, X,
  UserMinus, Users, RefreshCw,
} from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { friendApi } from "@/src/api/friendApi";
import { chatApi } from "@/src/api/chatApi";
import { router, useFocusEffect } from "expo-router";
import { useNotificationSocket } from "@/src/realtime/useNotificationSocket";
import { useColors, Spacing, Radius } from "@/src/theme";
import { useTranslation } from "react-i18next";

interface UserItem {
  id: number;
  fullName: string;
  username: string;
  avatarUrl?: string;
  level?: number;
}

interface FriendRequest {
  id: string;
  fromUser: UserItem;
  toUser?: UserItem;
}

type Section = "requests" | "friends" | "suggest";

export default function FriendsPage() {
  const colors = useColors();
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [friends, setFriends] = useState<UserItem[]>([]);
  const [received, setReceived] = useState<FriendRequest[]>([]);
  const [sent, setSent] = useState<FriendRequest[]>([]);
  const [suggest, setSuggest] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeSection, setActiveSection] = useState<Section>("friends");

  const q = search.toLowerCase().trim();
  const filteredFriends = q
    ? friends.filter((u) => u.fullName.toLowerCase().includes(q) || (u.username ?? "").toLowerCase().includes(q))
    : friends;
  const filteredSuggest = q
    ? suggest.filter((u) => u.fullName.toLowerCase().includes(q) || (u.username ?? "").toLowerCase().includes(q))
    : suggest;

  useNotificationSocket({ onFriendRequest: () => loadData() });

  useFocusEffect(useCallback(() => { loadData(); }, []));

  const loadData = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const [friendList, receivedReq, sentReq, suggestList] = await Promise.all([
        friendApi.getFriends(),
        friendApi.getReceivedRequests(),
        friendApi.getSentRequests(),
        friendApi.suggest(),
      ]);
      setFriends(friendList);
      setReceived(receivedReq);
      setSent(sentReq);
      const excludeIds = new Set<number>([
        ...friendList.map((u: UserItem) => u.id),
        ...receivedReq.map((r: FriendRequest) => r.fromUser.id),
        ...sentReq.map((r: FriendRequest) => r.toUser!.id),
      ]);
      setSuggest(suggestList.filter((u: UserItem) => !excludeIds.has(u.id)));
    } catch (err) {
      console.log("Load friends failed:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onAddFriend = async (id: number) => {
    await friendApi.sendRequest(id);
    loadData(true);
  };

  const onRespond = async (requestId: string, accept: boolean) => {
    await friendApi.respond(requestId, accept);
    loadData(true);
  };

  const onUnfriend = (friend: UserItem) => {
    Alert.alert(
      t("friends.unfriend_title"),
      `Bạn có chắc muốn huỷ kết bạn với ${friend.fullName}?`,
      [
        { text: t("friends.unfriend_cancel"), style: "cancel" },
        {
          text: t("friends.unfriend_confirm"),
          style: "destructive",
          onPress: async () => {
            await friendApi.unfriend(friend.id);
            loadData(true);
          },
        },
      ]
    );
  };

  const openChat = async (friend: UserItem) => {
    const res = await chatApi.openChat({ receiverId: String(friend.id) });
    router.push({
      pathname: "/(tabs)/(community)/chat/[id]",
      params: { id: res.roomId, friendName: friend.fullName, friendAvatar: friend.avatarUrl ?? "" },
    } as any);
  };

  const openProfile = (userId: number) => {
    router.push({
      pathname: "/(tabs)/(community)/user/[id]",
      params: { id: String(userId) },
    } as any);
  };

  if (loading) {
    return (
      <View style={[styles.loading, { backgroundColor: colors.bgSecondary }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const SECTIONS: { key: Section; label: string; count: number }[] = [
    { key: "friends", label: t("friends.tab_friends"), count: friends.length },
    { key: "requests", label: t("friends.tab_requests"), count: received.length },
    { key: "suggest", label: t("friends.tab_suggest"), count: suggest.length },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.bgSecondary }]}>
      {/* HEADER */}
      <View style={[styles.headerBlock, { backgroundColor: colors.bgSecondary }]}>
        <View>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>{t("friends.title")}</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textMuted }]}>
            {friends.length} bạn{received.length > 0 ? ` · ${received.length} lời mời mới` : ""}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.refreshBtn, { backgroundColor: colors.primaryBg, borderColor: colors.borderAccent }]}
          onPress={() => { setRefreshing(true); loadData(); }}
        >
          <RefreshCw size={18} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* SEARCH */}
      <View style={[styles.searchWrap, { backgroundColor: colors.bgInput, borderColor: colors.border }]}>
        <Search size={15} color={colors.textMuted} />
        <TextInput
          placeholder="Tìm kiếm bạn bè..."
          placeholderTextColor={colors.textMuted}
          style={[styles.searchInput, { color: colors.textPrimary }]}
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch("")}>
            <X size={15} color={colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* SECTION TABS */}
      <View style={[styles.sectionTabs, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
        {SECTIONS.map((s) => (
          <TouchableOpacity
            key={s.key}
            style={[styles.sectionTab, activeSection === s.key && styles.sectionTabActive]}
            onPress={() => setActiveSection(s.key)}
          >
            <Text style={[styles.sectionTabText, { color: colors.textMuted }, activeSection === s.key && styles.sectionTabTextActive]}>
              {s.label}
            </Text>
            {s.count > 0 && (
              <View style={[
                styles.sectionBadge,
                { backgroundColor: colors.bgSecondary },
                activeSection === s.key ? styles.sectionBadgeActive : {},
              ]}>
                <Text style={[
                  styles.sectionBadgeText,
                  { color: colors.textMuted },
                  activeSection === s.key && styles.sectionBadgeTextActive,
                ]}>
                  {s.count}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* FRIEND REQUESTS */}
      {activeSection === "requests" && (
        <FlatList
          data={received}
          keyExtractor={(r) => r.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Users size={36} color={colors.textMuted} />
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>Không có lời mời kết bạn nào.</Text>
            </View>
          }
          renderItem={({ item: r }) => (
            <View style={[styles.card, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
              <TouchableOpacity onPress={() => openProfile(r.fromUser.id)} activeOpacity={0.8}>
                <UserAvatar user={r.fromUser} size={52} />
              </TouchableOpacity>
              <View style={{ flex: 1 }}>
                <TouchableOpacity onPress={() => openProfile(r.fromUser.id)}>
                  <Text style={[styles.name, { color: colors.textPrimary }]}>{r.fromUser.fullName}</Text>
                  <Text style={[styles.username, { color: colors.textMuted }]}>@{r.fromUser.username}</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: "rgba(74,222,128,0.12)", borderColor: "rgba(74,222,128,0.2)" }]}
                onPress={() => onRespond(r.id, true)}
              >
                <Check size={17} color="#4ade80" />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: "rgba(239,68,68,0.1)", borderColor: "rgba(239,68,68,0.2)", marginLeft: Spacing.sm }]}
                onPress={() => onRespond(r.id, false)}
              >
                <X size={17} color="#f87171" />
              </TouchableOpacity>
            </View>
          )}
        />
      )}

      {/* FRIEND LIST */}
      {activeSection === "friends" && (
        <FlatList
          data={filteredFriends}
          keyExtractor={(u) => String(u.id)}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Users size={36} color={colors.textMuted} />
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                {q ? `Không tìm thấy "${q}"` : t("friends.no_friends")}
              </Text>
            </View>
          }
          renderItem={({ item: u }) => (
            <View style={[styles.card, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
              <TouchableOpacity onPress={() => openProfile(u.id)} activeOpacity={0.8}>
                <UserAvatar user={u} size={50} />
              </TouchableOpacity>
              <TouchableOpacity style={{ flex: 1 }} onPress={() => openProfile(u.id)}>
                <Text style={[styles.name, { color: colors.textPrimary }]}>{u.fullName}</Text>
                <Text style={[styles.username, { color: colors.textMuted }]}>
                  @{u.username ?? "—"}
                  {u.level ? <Text style={styles.levelBadge}>  Lv.{u.level}</Text> : null}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: "rgba(96,165,250,0.12)", borderColor: "rgba(96,165,250,0.2)" }]}
                onPress={() => openChat(u)}
              >
                <MessageCircle size={17} color="#60a5fa" />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: "rgba(239,68,68,0.1)", borderColor: "rgba(239,68,68,0.2)", marginLeft: Spacing.sm }]}
                onPress={() => onUnfriend(u)}
              >
                <UserMinus size={17} color="#f87171" />
              </TouchableOpacity>
            </View>
          )}
        />
      )}

      {/* SUGGEST */}
      {activeSection === "suggest" && (
        <FlatList
          data={filteredSuggest}
          keyExtractor={(u) => String(u.id)}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Users size={36} color={colors.textMuted} />
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>Không có gợi ý nào.</Text>
            </View>
          }
          renderItem={({ item: u }) => (
            <View style={[styles.card, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
              <TouchableOpacity onPress={() => openProfile(u.id)} activeOpacity={0.8}>
                <UserAvatar user={u} size={50} />
              </TouchableOpacity>
              <TouchableOpacity style={{ flex: 1 }} onPress={() => openProfile(u.id)}>
                <Text style={[styles.name, { color: colors.textPrimary }]}>{u.fullName}</Text>
                <Text style={[styles.username, { color: colors.textMuted }]}>@{u.username ?? "—"}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.addBtn}
                onPress={() => onAddFriend(u.id)}
              >
                <LinearGradient colors={["#2563eb", "#7c3aed"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.addGradient}>
                  <UserPlus size={13} color="white" />
                  <Text style={styles.addText}>Thêm bạn</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}
        />
      )}
    </View>
  );
}

function UserAvatar({ user, size = 48 }: { user: UserItem; size?: number }) {
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, overflow: "hidden", flexShrink: 0 }}>
      {user.avatarUrl ? (
        <Image source={{ uri: user.avatarUrl }} style={{ width: "100%", height: "100%" }} />
      ) : (
        <LinearGradient colors={["#2563eb", "#7c3aed"]} style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <Text style={{ color: "white", fontSize: size * 0.38, fontWeight: "800" }}>
            {user.fullName.charAt(0).toUpperCase()}
          </Text>
        </LinearGradient>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, justifyContent: "center", alignItems: "center" },
  container: { flex: 1 },

  headerBlock: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: Spacing.base, paddingTop: 52, paddingBottom: Spacing.base,
  },
  headerTitle: { fontSize: 26, fontWeight: "800" },
  headerSubtitle: { fontSize: 13, marginTop: 3 },
  refreshBtn: {
    width: 40, height: 40, borderRadius: Radius.md,
    borderWidth: 1,
    justifyContent: "center", alignItems: "center",
  },

  searchWrap: {
    flexDirection: "row", alignItems: "center", gap: Spacing.sm,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.base, paddingVertical: 11,
    borderWidth: 1,
    marginHorizontal: Spacing.base, marginBottom: Spacing.md,
  },
  searchInput: { flex: 1, fontSize: 14 },

  sectionTabs: {
    flexDirection: "row",
    marginHorizontal: Spacing.base,
    marginBottom: Spacing.md,
    borderRadius: Radius.lg,
    padding: 4,
    borderWidth: 1,
  },
  sectionTab: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    paddingVertical: 9, borderRadius: Radius.md, gap: 5,
  },
  sectionTabActive: { backgroundColor: "rgba(96,165,250,0.1)" },
  sectionTabText: { fontSize: 13, fontWeight: "500" },
  sectionTabTextActive: { color: "#60a5fa", fontWeight: "700" },
  sectionBadge: {
    borderRadius: 99,
    paddingHorizontal: 6, paddingVertical: 1,
  },
  sectionBadgeActive: { backgroundColor: "rgba(96,165,250,0.15)" },
  sectionBadgeText: { fontSize: 11, fontWeight: "700" },
  sectionBadgeTextActive: { color: "#60a5fa" },

  listContent: { paddingHorizontal: Spacing.base, paddingBottom: 100 },

  emptyState: { alignItems: "center", paddingTop: 60, gap: 12 },
  emptyText: { fontSize: 14, textAlign: "center" },

  card: {
    flexDirection: "row", alignItems: "center",
    padding: Spacing.md,
    borderRadius: Radius.xl, borderWidth: 1,
    marginBottom: Spacing.sm, gap: Spacing.md,
  },

  name: { fontSize: 15, fontWeight: "600" },
  username: { fontSize: 12, marginTop: 1 },
  levelBadge: { color: "#60a5fa", fontSize: 11, fontWeight: "700" },

  actionBtn: {
    width: 40, height: 40, borderRadius: Radius.md,
    alignItems: "center", justifyContent: "center", flexShrink: 0,
    borderWidth: 1,
  },

  addBtn: { borderRadius: Radius.lg, overflow: "hidden" },
  addGradient: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingVertical: 9, paddingHorizontal: 12,
  },
  addText: { color: "white", fontSize: 13, fontWeight: "700" },
});
