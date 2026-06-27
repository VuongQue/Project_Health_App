import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Image,
} from "react-native";
import { router, useLocalSearchParams, useFocusEffect } from "expo-router";
import { ArrowLeft, Users, Plus, LogOut } from "lucide-react-native";
import { communityApi } from "@/src/api/communityApi";
import { PostCard } from "@/components/community/PostCard";
import { PostItem } from "@/src/types/community";
import { getUserFromToken } from "@/src/utils/tokenStorage";
import { useColors, Spacing, Radius, sw, sf } from "@/src/theme";

export default function GroupDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const [group, setGroup] = useState<any>(null);
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentUserId, setCurrentUserId] = useState("");

  useFocusEffect(
    useCallback(() => {
      getUserFromToken().then((u) => { if (u?.id) setCurrentUserId(String(u.id)); });
      load();
    }, [id])
  );

  const load = async () => {
    try {
      const [g, p] = await Promise.all([
        communityApi.getGroupById(id),
        communityApi.getGroupPosts(id),
      ]);
      setGroup(g);
      setPosts(p.posts ?? []);
    } catch {}
    finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const isMember = group?.members?.includes(currentUserId);

  const handleJoin = async () => {
    await communityApi.joinGroup(id);
    load();
  };

  const handleLeave = async () => {
    await communityApi.leaveGroup(id);
    load();
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.bgSecondary }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!group) {
    return (
      <View style={[styles.center, { backgroundColor: colors.bgSecondary }]}>
        <Text style={{ color: colors.textMuted }}>Không tìm thấy nhóm.</Text>
      </View>
    );
  }

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
          {group.name}
        </Text>
        {isMember ? (
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: colors.dangerBg, borderColor: "rgba(239,68,68,0.2)" }]}
            onPress={handleLeave}
          >
            <LogOut size={16} color={colors.danger} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.joinBtn, { backgroundColor: colors.primary }]}
            onPress={handleJoin}
          >
            <Text style={styles.joinText}>Tham gia</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.primary} />
        }
      >
        {/* GROUP INFO */}
        <View style={[styles.groupInfo, { borderBottomColor: colors.border }]}>
          {group.avatarUrl ? (
            <Image source={{ uri: group.avatarUrl }} style={styles.groupAvatar} />
          ) : (
            <View style={[styles.groupAvatar, styles.groupAvatarFallback, { backgroundColor: colors.primary }]}>
              <Text style={styles.groupAvatarText}>{group.name.charAt(0).toUpperCase()}</Text>
            </View>
          )}
          <Text style={[styles.groupName, { color: colors.textPrimary }]}>{group.name}</Text>
          {group.description ? (
            <Text style={[styles.groupDesc, { color: colors.textSecondary }]}>{group.description}</Text>
          ) : null}
          <View style={styles.memberRow}>
            <Users size={14} color={colors.textMuted} />
            <Text style={[styles.memberCount, { color: colors.textMuted }]}>{group.memberCount} thành viên</Text>
            <View style={[
              styles.typeBadge,
              { backgroundColor: group.type === "private" ? colors.purpleBg : colors.infoBg }
            ]}>
              <Text style={[styles.typeText, { color: group.type === "private" ? colors.purple : colors.info }]}>
                {group.type === "private" ? "Riêng tư" : "Công khai"}
              </Text>
            </View>
          </View>
        </View>

        {/* CREATE POST button (only members) */}
        {isMember && (
          <TouchableOpacity
            style={[styles.createPostBtn, { backgroundColor: colors.bgCard, borderColor: colors.border }]}
            onPress={() =>
              router.push({
                pathname: "/(tabs)/(community)/create-post",
                params: { groupId: id },
              } as any)
            }
          >
            <Plus size={18} color={colors.textMuted} />
            <Text style={[styles.createPostText, { color: colors.textMuted }]}>Chia sẻ gì đó với nhóm…</Text>
          </TouchableOpacity>
        )}

        {/* POSTS */}
        <View style={styles.postsSection}>
          {posts.length === 0 ? (
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>Chưa có bài viết nào trong nhóm.</Text>
          ) : (
            posts.map((post) => (
              <PostCard
                key={post._id}
                post={post}
                refresh={load}
                currentUserId={currentUserId}
              />
            ))
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.base,
    paddingTop: 52,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    gap: 10,
  },
  backBtn: {
    width: 38, height: 38,
    borderRadius: Radius.md,
    justifyContent: "center", alignItems: "center",
    borderWidth: 1,
  },
  headerTitle: { flex: 1, fontWeight: "700", fontSize: sf(17) },
  actionBtn: {
    width: 38, height: 38,
    borderRadius: Radius.md,
    justifyContent: "center", alignItems: "center",
    borderWidth: 1,
  },
  joinBtn: {
    borderRadius: Radius.lg,
    paddingVertical: 7,
    paddingHorizontal: 14,
  },
  joinText: { color: "white", fontWeight: "700", fontSize: sf(13) },

  groupInfo: {
    alignItems: "center",
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.base,
    borderBottomWidth: 1,
  },
  groupAvatar: {
    width: sw(80), height: sw(80),
    borderRadius: Radius.xl,
    marginBottom: Spacing.md,
  },
  groupAvatarFallback: { justifyContent: "center", alignItems: "center" },
  groupAvatarText: { color: "white", fontWeight: "800", fontSize: sf(32) },
  groupName: { fontSize: sf(20), fontWeight: "800", marginBottom: 6 },
  groupDesc: {
    fontSize: sf(14), textAlign: "center",
    marginBottom: Spacing.md, lineHeight: 20,
  },
  memberRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  memberCount: { fontSize: sf(13) },
  typeBadge: {
    borderRadius: Radius.sm,
    paddingHorizontal: 8, paddingVertical: 2,
  },
  typeText: { fontSize: sf(11), fontWeight: "700" },

  createPostBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    margin: Spacing.md,
    padding: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
  },
  createPostText: { fontSize: sf(14) },

  postsSection: { paddingTop: 4 },
  emptyText: {
    textAlign: "center",
    marginTop: 40,
    fontSize: sf(14),
  },
});
