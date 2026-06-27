import React, { useCallback, useState } from "react";
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  RefreshControl, ActivityIndicator, Image, TextInput,
} from "react-native";
import { Users, Plus, Search, X, Lock, Globe } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router, useFocusEffect } from "expo-router";
import { communityApi } from "@/src/api/communityApi";
import { useColors, Colors, Spacing, Radius, sw, sf } from "@/src/theme";

interface Group {
  id?: string;
  _id?: string;
  name: string;
  description?: string;
  avatarUrl?: string;
  type: "public" | "private";
  memberCount?: number;
  isMember?: boolean;
}

function getGroupId(g: Group): string {
  return (g.id ?? g._id ?? "") as string;
}

export default function GroupsScreen() {
  const colors = useColors();
  const [groups, setGroups] = useState<Group[]>([]);
  const [myGroups, setMyGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"all" | "mine">("all");

  const load = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const [all, mine] = await Promise.all([
        communityApi.getGroups(),
        communityApi.getMyGroups(),
      ]);
      const normalise = (d: any): Group[] =>
        Array.isArray(d) ? d : Array.isArray(d?.groups) ? d.groups : Array.isArray(d?.data) ? d.data : [];
      setGroups(normalise(all));
      setMyGroups(normalise(mine));
    } catch (e) {
      console.log("Load groups error:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => { load(); }, []));

  const myGroupIds = new Set(myGroups.map(getGroupId));

  const data = (tab === "all" ? groups : myGroups).filter((g) => {
    const q = search.toLowerCase().trim();
    return !q || g.name.toLowerCase().includes(q);
  });

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
      <View style={[styles.header, { backgroundColor: colors.bgPrimary }]}>
        <View>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Nhóm</Text>
          <Text style={{ color: colors.textMuted, fontSize: 13, marginTop: 3 }}>
            {groups.length} nhóm · {myGroups.length} đã tham gia
          </Text>
        </View>
        <TouchableOpacity
          style={styles.createBtn}
          onPress={() => router.push("/(tabs)/(community)/groups/create" as any)}
        >
          <LinearGradient
            colors={Colors.gradientPrimary}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={styles.createGradient}
          >
            <Plus size={18} color="white" strokeWidth={2.5} />
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* SEARCH */}
      <View style={[styles.searchWrap, { backgroundColor: colors.bgInput, borderColor: colors.border }]}>
        <Search size={15} color={colors.textMuted} />
        <TextInput
          placeholder="Tìm kiếm nhóm..."
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

      {/* TABS */}
      <View style={[styles.tabs, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
        {(["all", "mine"] as const).map((key) => (
          <TouchableOpacity
            key={key}
            style={[styles.tabItem, tab === key && styles.tabItemActive]}
            onPress={() => setTab(key)}
          >
            <Text style={[styles.tabText, { color: colors.textMuted }, tab === key && styles.tabTextActive]}>
              {key === "all" ? "Tất cả" : "Của tôi"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={data}
        keyExtractor={(g) => getGroupId(g)}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.primary} />
        }
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Users size={40} color={colors.textMuted} />
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>
              {tab === "mine" ? "Bạn chưa tham gia nhóm nào." : "Chưa có nhóm nào."}
            </Text>
          </View>
        }
        renderItem={({ item: g }) => (
          <TouchableOpacity
            style={[styles.card, { backgroundColor: colors.bgCard, borderColor: colors.border }]}
            onPress={() => router.push({ pathname: "/(tabs)/(community)/groups/[id]", params: { id: getGroupId(g) } } as any)}
            activeOpacity={0.8}
          >
            {/* Avatar */}
            <View style={styles.avatarWrap}>
              {g.avatarUrl ? (
                <Image source={{ uri: g.avatarUrl }} style={styles.avatar} />
              ) : (
                <LinearGradient colors={Colors.gradientPurple} style={[styles.avatar, styles.avatarFallback]}>
                  <Users size={22} color="white" />
                </LinearGradient>
              )}
            </View>

            {/* Info */}
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <Text style={[styles.name, { color: colors.textPrimary }]} numberOfLines={1}>{g.name}</Text>
                {g.type === "private"
                  ? <Lock size={12} color={colors.textMuted} />
                  : <Globe size={12} color={colors.textMuted} />
                }
              </View>
              {g.description ? (
                <Text style={[styles.desc, { color: colors.textMuted }]} numberOfLines={1}>{g.description}</Text>
              ) : null}
              {g.memberCount != null && (
                <Text style={[styles.meta, { color: colors.textMuted }]}>{g.memberCount} thành viên</Text>
              )}
            </View>

            {(g.isMember || myGroupIds.has(getGroupId(g))) && tab === "all" && (
              <View style={[styles.memberBadge, { backgroundColor: colors.primaryBg }]}>
                <Text style={{ color: colors.primary, fontSize: sf(11), fontWeight: "700" }}>Đã tham gia</Text>
              </View>
            )}
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  header: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: Spacing.base, paddingTop: 52, paddingBottom: Spacing.base,
  },
  headerTitle: { fontSize: 26, fontWeight: "800" },
  createBtn: { borderRadius: Radius.lg, overflow: "hidden" },
  createGradient: { width: sw(40), height: sw(40), justifyContent: "center", alignItems: "center" },

  searchWrap: {
    flexDirection: "row", alignItems: "center", gap: Spacing.sm,
    borderRadius: Radius.full, paddingHorizontal: Spacing.base, paddingVertical: 11,
    borderWidth: 1, marginHorizontal: Spacing.base, marginBottom: Spacing.md,
  },
  searchInput: { flex: 1, fontSize: 14 },

  tabs: {
    flexDirection: "row", marginHorizontal: Spacing.base, marginBottom: Spacing.md,
    borderRadius: Radius.lg, padding: 4, borderWidth: 1,
  },
  tabItem: { flex: 1, paddingVertical: 9, borderRadius: Radius.md, alignItems: "center" },
  tabItemActive: { backgroundColor: "rgba(96,165,250,0.1)" },
  tabText: { fontSize: 13, fontWeight: "500" },
  tabTextActive: { color: "#60a5fa", fontWeight: "700" },

  list: { paddingHorizontal: Spacing.base, paddingBottom: 100 },
  empty: { alignItems: "center", paddingTop: 60, gap: 12 },
  emptyText: { fontSize: 14, textAlign: "center" },

  card: {
    flexDirection: "row", alignItems: "center",
    padding: Spacing.md, borderRadius: Radius.xl, borderWidth: 1,
    marginBottom: Spacing.sm, gap: Spacing.md,
  },
  avatarWrap: {},
  avatar: { width: sw(52), height: sw(52), borderRadius: sw(26) },
  avatarFallback: { justifyContent: "center", alignItems: "center" },
  name: { fontSize: sf(15), fontWeight: "700" },
  desc: { fontSize: sf(12), marginTop: 2 },
  meta: { fontSize: sf(11), marginTop: 2 },
  memberBadge: {
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: Radius.md,
  },
});
