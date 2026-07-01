import React, { useEffect, useState, useCallback } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Image, ActivityIndicator, TextInput, RefreshControl,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import {
  Compass, TrendingUp, Users, Trophy, Search, Flame,
  Heart, MessageSquare, Star, Crown,
} from "lucide-react-native";
import { useFocusEffect, router } from "expo-router";
import axiosClient from "@/src/api/axiosClient";
import { communityApi } from "@/src/api/communityApi";
import { friendApi } from "@/src/api/friendApi";
import { useColors, Spacing, Radius, sw, sf } from "@/src/theme";

interface TrendingPost {
  _id: string;
  content: string;
  likeCount: number;
  commentCount: number;
  user: { name: string; avatar: string };
  media: string[];
  createdAt: string;
}

interface TopUser {
  id: number;
  fullName: string;
  avatarUrl?: string | null;
  level: number;
  points: number;
}

interface SuggestedGroup {
  _id: string;
  name: string;
  description: string;
  memberCount: number;
  avatarUrl?: string;
  type: string;
}

export default function ExploreScreen() {
  const colors = useColors();
  const [trendingPosts, setTrendingPosts] = useState<TrendingPost[]>([]);
  const [topUsers, setTopUsers] = useState<TopUser[]>([]);
  const [suggestedGroups, setSuggestedGroups] = useState<SuggestedGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<TrendingPost[]>([]);
  const [searching, setSearching] = useState(false);
  const searchTimer = React.useRef<any>(null);

  const load = async () => {
    try {
      const [postsRes, groupsRes, leaderRes] = await Promise.all([
        axiosClient.get("/posts?page=1&limit=20").catch(() => ({ data: { posts: [] } })),
        communityApi.getGroups(1, 10).catch(() => ({ groups: [] })),
        friendApi.getLeaderboard().catch(() => []),
      ]);

      const posts: TrendingPost[] = (postsRes.data?.posts ?? postsRes.data ?? []);
      const sorted = [...posts].sort(
        (a, b) => (b.likeCount + b.commentCount * 2) - (a.likeCount + a.commentCount * 2)
      );
      setTrendingPosts(sorted.slice(0, 5));
      setSuggestedGroups((groupsRes.groups ?? []).slice(0, 5));
      setTopUsers((Array.isArray(leaderRes) ? leaderRes : []).slice(0, 5));
    } catch {}
    finally { setLoading(false); setRefreshing(false); }
  };

  useFocusEffect(useCallback(() => { load(); }, []));

  const handleSearch = (q: string) => {
    setSearchQuery(q);
    clearTimeout(searchTimer.current);
    if (!q.trim()) { setSearchResults([]); return; }
    searchTimer.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await communityApi.searchPosts(q);
        setSearchResults(res.posts ?? []);
      } finally { setSearching(false); }
    }, 500);
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
      {/* HEADER */}
      <View style={[styles.header, { backgroundColor: colors.bgPrimary }]}>
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <View style={[styles.iconWrap, { backgroundColor: colors.primaryBg }]}>
              <Compass size={20} color={colors.primary} />
            </View>
            <Text style={[styles.title, { color: colors.textPrimary }]}>Khám phá</Text>
          </View>
        </View>
        {/* Search bar */}
        <View style={[styles.searchBar, { backgroundColor: colors.bgInput, borderColor: colors.border }]}>
          <Search size={15} color={colors.textMuted} />
          <TextInput
            value={searchQuery}
            onChangeText={handleSearch}
            placeholder="Tìm bài viết, nhóm, người dùng..."
            placeholderTextColor={colors.textMuted}
            style={[styles.searchInput, { color: colors.textPrimary }]}
          />
          {searching && <ActivityIndicator size="small" color={colors.primary} />}
        </View>
      </View>

      {/* SEARCH RESULTS */}
      {searchQuery.trim() ? (
        <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
          {searching ? (
            <View style={styles.center}><ActivityIndicator color={colors.primary} /></View>
          ) : searchResults.length === 0 ? (
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>Không tìm thấy kết quả</Text>
          ) : (
            searchResults.map((p) => <MiniPostCard key={p._id} post={p} colors={colors} />)
          )}
        </ScrollView>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 120 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.primary} />
          }
        >
          {/* TRENDING POSTS */}
          <Section icon={<TrendingUp size={16} color="#f97316" />} title="Bài viết nổi bật" color="#f97316" colors={colors}>
            {trendingPosts.length === 0 ? (
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>Chưa có bài viết nào</Text>
            ) : trendingPosts.map((p, i) => (
              <TrendingPostCard key={p._id} post={p} rank={i + 1} colors={colors} />
            ))}
          </Section>

          {/* TOP USERS LEADERBOARD */}
          <Section icon={<Crown size={16} color="#fbbf24" />} title="Top thành viên" color="#fbbf24" colors={colors}>
            {topUsers.length === 0 ? (
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>Chưa có dữ liệu</Text>
            ) : topUsers.map((u, i) => (
              <TopUserCard key={u.id} user={u} rank={i + 1} colors={colors} />
            ))}
          </Section>

          {/* SUGGESTED GROUPS */}
          <Section icon={<Users size={16} color="#a78bfa" />} title="Nhóm đề xuất" color="#a78bfa" colors={colors}>
            {suggestedGroups.length === 0 ? (
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>Chưa có nhóm nào</Text>
            ) : suggestedGroups.map((g) => (
              <GroupSuggestCard key={g._id} group={g} colors={colors} />
            ))}
          </Section>
        </ScrollView>
      )}
    </View>
  );
}

function Section({ icon, title, color, children, colors }: { icon: any; title: string; color: string; children: any; colors: any }) {
  return (
    <View style={sectionStyles.wrap}>
      <View style={sectionStyles.header}>
        <View style={[sectionStyles.iconBg, { backgroundColor: color + "22" }]}>{icon}</View>
        <Text style={[sectionStyles.title, { color: colors.textPrimary }]}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

function TrendingPostCard({ post, rank, colors }: { post: TrendingPost; rank: number; colors: any }) {
  const rankColors = ["#fbbf24", "#94a3b8", "#cd7f32", "#60a5fa", "#60a5fa"];
  return (
    <TouchableOpacity
      style={[sectionStyles.card, { backgroundColor: colors.bgCard, borderColor: colors.border }]}
      onPress={() => router.push({ pathname: "/(tabs)/(community)/posts/[id]", params: { id: post._id } } as any)}
      activeOpacity={0.8}
    >
      <View style={[sectionStyles.rankBadge, { backgroundColor: rankColors[rank - 1] + "22" }]}>
        <Text style={[sectionStyles.rankText, { color: rankColors[rank - 1] }]}>#{rank}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <View style={sectionStyles.userRow}>
          {post.user?.avatar ? (
            <Image source={{ uri: post.user.avatar }} style={sectionStyles.avatar} />
          ) : (
            <LinearGradient colors={["#2563eb", "#7c3aed"]} style={sectionStyles.avatar} />
          )}
          <Text style={[sectionStyles.userName, { color: colors.textSecondary }]}>{post.user?.name}</Text>
        </View>
        <Text style={[sectionStyles.postContent, { color: colors.textPrimary }]} numberOfLines={2}>
          {post.content}
        </Text>
        <View style={sectionStyles.statsRow}>
          <Heart size={13} color="#f87171" />
          <Text style={[sectionStyles.statText, { color: colors.textMuted }]}>{post.likeCount}</Text>
          <MessageSquare size={13} color="#a78bfa" />
          <Text style={[sectionStyles.statText, { color: colors.textMuted }]}>{post.commentCount}</Text>
        </View>
      </View>
      {post.media?.[0] && (
        <Image source={{ uri: post.media[0] }} style={sectionStyles.thumb} />
      )}
    </TouchableOpacity>
  );
}

function TopUserCard({ user, rank, colors }: { user: TopUser; rank: number; colors: any }) {
  const rankIcon = rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : `#${rank}`;
  return (
    <View style={[sectionStyles.card, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
      <Text style={sectionStyles.rankEmoji}>{rankIcon}</Text>
      {user.avatarUrl ? (
        <Image source={{ uri: user.avatarUrl }} style={sectionStyles.avatar} />
      ) : (
        <LinearGradient colors={["#2563eb", "#7c3aed"]} style={sectionStyles.avatar} />
      )}
      <View style={{ flex: 1 }}>
        <Text style={[sectionStyles.userName, { color: colors.textPrimary, fontWeight: "700" }]}>{user.fullName}</Text>
        <View style={sectionStyles.statsRow}>
          <Star size={12} color="#fbbf24" />
          <Text style={[sectionStyles.statText, { color: colors.textMuted }]}>Lv.{user.level}</Text>
          <Flame size={12} color="#f97316" />
          <Text style={[sectionStyles.statText, { color: colors.textMuted }]}>{user.points} pts</Text>
        </View>
      </View>
    </View>
  );
}

function GroupSuggestCard({ group, colors }: { group: SuggestedGroup; colors: any }) {
  const [joined, setJoined] = useState(false);
  const join = async () => {
    try {
      await communityApi.joinGroup(group._id);
      setJoined(true);
    } catch {}
  };
  return (
    <TouchableOpacity
      style={[sectionStyles.card, { backgroundColor: colors.bgCard, borderColor: colors.border }]}
      onPress={() => router.push({ pathname: "/(tabs)/(community)/groups/[id]", params: { id: group._id } } as any)}
      activeOpacity={0.85}
    >
      {group.avatarUrl ? (
        <Image source={{ uri: group.avatarUrl }} style={sectionStyles.groupAvatar} />
      ) : (
        <LinearGradient colors={["#7c3aed", "#4f46e5"]} style={sectionStyles.groupAvatar}>
          <Text style={{ color: "white", fontWeight: "bold", fontSize: sf(16) }}>{group.name.charAt(0)}</Text>
        </LinearGradient>
      )}
      <View style={{ flex: 1 }}>
        <Text style={[sectionStyles.userName, { color: colors.textPrimary, fontWeight: "700" }]}>{group.name}</Text>
        {group.description ? (
          <Text style={[sectionStyles.postContent, { color: colors.textSecondary }]} numberOfLines={1}>{group.description}</Text>
        ) : null}
        <View style={sectionStyles.statsRow}>
          <Users size={12} color={colors.textMuted} />
          <Text style={[sectionStyles.statText, { color: colors.textMuted }]}>{group.memberCount} thành viên</Text>
        </View>
      </View>
      {!joined ? (
        <TouchableOpacity onPress={(e) => { e.stopPropagation?.(); join(); }} style={sectionStyles.joinBtn}>
          <LinearGradient colors={["#2563eb", "#7c3aed"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={sectionStyles.joinGrad}>
            <Text style={sectionStyles.joinText}>Tham gia</Text>
          </LinearGradient>
        </TouchableOpacity>
      ) : (
        <View style={sectionStyles.joinedBadge}>
          <Text style={sectionStyles.joinedText}>Đã tham gia</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

function MiniPostCard({ post, colors }: { post: TrendingPost; colors: any }) {
  return (
    <TouchableOpacity
      style={[sectionStyles.card, { backgroundColor: colors.bgCard, borderColor: colors.border, marginHorizontal: Spacing.base }]}
      onPress={() => router.push({ pathname: "/(tabs)/(community)/posts/[id]", params: { id: post._id } } as any)}
    >
      <View style={{ flex: 1 }}>
        <View style={sectionStyles.userRow}>
          {post.user?.avatar ? (
            <Image source={{ uri: post.user.avatar }} style={sectionStyles.avatar} />
          ) : (
            <LinearGradient colors={["#2563eb", "#7c3aed"]} style={sectionStyles.avatar} />
          )}
          <Text style={[sectionStyles.userName, { color: colors.textSecondary }]}>{post.user?.name}</Text>
        </View>
        <Text style={[sectionStyles.postContent, { color: colors.textPrimary }]} numberOfLines={3}>{post.content}</Text>
        <View style={sectionStyles.statsRow}>
          <Heart size={13} color="#f87171" />
          <Text style={[sectionStyles.statText, { color: colors.textMuted }]}>{post.likeCount}</Text>
          <MessageSquare size={13} color="#a78bfa" />
          <Text style={[sectionStyles.statText, { color: colors.textMuted }]}>{post.commentCount}</Text>
        </View>
      </View>
      {post.media?.[0] && <Image source={{ uri: post.media[0] }} style={sectionStyles.thumb} />}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: "center", alignItems: "center", padding: 40 },
  header: { paddingHorizontal: Spacing.base, paddingTop: sw(52), paddingBottom: Spacing.md, gap: Spacing.sm },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  iconWrap: { width: 36, height: 36, borderRadius: 10, backgroundColor: "rgba(96,165,250,0.15)", alignItems: "center", justifyContent: "center" },
  title: { fontSize: sf(22), fontWeight: "800" },
  searchBar: { flexDirection: "row", alignItems: "center", borderRadius: Radius.full, paddingHorizontal: Spacing.md, borderWidth: 1, gap: Spacing.sm },
  searchInput: { flex: 1, paddingVertical: sw(11), fontSize: sf(14) },
  emptyText: { textAlign: "center", padding: Spacing.base, fontSize: sf(14) },
});

const sectionStyles = StyleSheet.create({
  wrap: { paddingHorizontal: Spacing.base, marginTop: Spacing.lg },
  header: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: Spacing.sm },
  iconBg: { width: 28, height: 28, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  title: { fontSize: sf(16), fontWeight: "800" },
  card: {
    flexDirection: "row", alignItems: "center",
    padding: Spacing.md, borderRadius: Radius.xl, borderWidth: 1,
    marginBottom: Spacing.sm, gap: 10,
  },
  rankBadge: { width: 32, height: 32, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  rankText: { fontSize: sf(13), fontWeight: "800" },
  rankEmoji: { fontSize: sf(20), width: 32, textAlign: "center" },
  userRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 },
  avatar: { width: sw(28), height: sw(28), borderRadius: sw(14) },
  groupAvatar: { width: sw(44), height: sw(44), borderRadius: sw(12), alignItems: "center", justifyContent: "center" },
  userName: { fontSize: sf(13) },
  postContent: { fontSize: sf(13), lineHeight: 18 },
  statsRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 },
  statText: { fontSize: sf(12) },
  thumb: { width: sw(60), height: sw(60), borderRadius: Radius.md },
  joinBtn: { alignSelf: "center" },
  joinGrad: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: Radius.full },
  joinText: { color: "white", fontSize: sf(12), fontWeight: "700" },
  joinedBadge: { backgroundColor: "rgba(74,222,128,0.12)", paddingHorizontal: 10, paddingVertical: 5, borderRadius: Radius.full },
  joinedText: { color: "#4ade80", fontSize: sf(12), fontWeight: "600" },
});
