import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from "react-native";
import { ArrowLeft, Heart, MessageSquare, Share2 } from "lucide-react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { communityApi } from "@/src/api/communityApi";
import { PostItem } from "@/src/types/community";
import { PostComments } from "@/components/community/PostComments";
import { useColors, Spacing, Radius, sf } from "@/src/theme";

const { width } = Dimensions.get("window");

export default function PostDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colors = useColors();

  const [post, setPost] = useState<PostItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [showComments, setShowComments] = useState(true);
  const [liking, setLiking] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const loadPost = async () => {
    try {
      setLoading(true);
      const res = await communityApi.getPostById(id);
      setPost(res);
    } catch (err) {
      console.log("Load post detail error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadPost(); }, [id]);

  const handleLike = async () => {
    if (!post || liking) return;
    setLiking(true);
    try {
      await communityApi.toggleLike(post._id);
      await loadPost();
    } finally {
      setLiking(false);
    }
  };

  const onScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / width);
    setActiveIndex(index);
  };

  if (loading || !post) {
    return (
      <View style={[styles.loading, { backgroundColor: colors.bgSecondary }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  const avatarUrl =
    post.user?.avatar ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(post.user?.name ?? "User")}`;

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
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Bài viết</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView>
        {/* AUTHOR */}
        <View style={styles.authorRow}>
          <Image source={{ uri: avatarUrl }} style={styles.avatar} />
          <View>
            <Text style={[styles.author, { color: colors.textPrimary }]}>{post.user?.name ?? "User"}</Text>
            <Text style={[styles.time, { color: colors.textMuted }]}>
              {new Date(post.createdAt).toDateString()}
            </Text>
          </View>
        </View>

        {/* CONTENT */}
        {post.content && (
          <Text style={[styles.content, { color: colors.textPrimary }]}>{post.content}</Text>
        )}

        {/* MEDIA SLIDER */}
        {post.media?.length > 0 && (
          <View style={styles.sliderWrapper}>
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={onScrollEnd}
            >
              {post.media.map((uri, index) => (
                <View key={index} style={styles.slide}>
                  <Image source={{ uri }} style={styles.slideImage} />
                </View>
              ))}
            </ScrollView>
            <View style={styles.dots}>
              {post.media.map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.dot,
                    { backgroundColor: colors.border },
                    i === activeIndex && { backgroundColor: colors.primary },
                  ]}
                />
              ))}
            </View>
          </View>
        )}

        {/* ACTIONS */}
        <View style={[styles.actions, { borderBottomColor: colors.border }]}>
          <TouchableOpacity style={styles.actionBtn} onPress={handleLike}>
            <Heart size={20} color={colors.textMuted} />
            <Text style={[styles.actionText, { color: colors.textMuted }]}>{post.likeCount}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={() => setShowComments(!showComments)}>
            <MessageSquare size={20} color={colors.textMuted} />
            <Text style={[styles.actionText, { color: colors.textMuted }]}>{post.commentCount}</Text>
          </TouchableOpacity>
          <Share2 size={20} color={colors.textMuted} />
        </View>

        {/* COMMENTS */}
        {showComments && <PostComments postId={post._id} />}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loading: { flex: 1, justifyContent: "center", alignItems: "center" },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.base,
    paddingTop: 52,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 38, height: 38,
    borderRadius: Radius.md,
    justifyContent: "center", alignItems: "center",
    borderWidth: 1,
  },
  headerTitle: { fontSize: sf(17), fontWeight: "700" },

  authorRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.base,
    gap: 12,
  },
  avatar: { width: 48, height: 48, borderRadius: 999 },
  author: { fontWeight: "600", fontSize: sf(15) },
  time: { fontSize: sf(12), marginTop: 2 },

  content: {
    fontSize: sf(16),
    lineHeight: 22,
    paddingHorizontal: Spacing.base,
    marginBottom: Spacing.md,
  },

  sliderWrapper: { marginVertical: 8 },
  slide: { width, alignItems: "center" },
  slideImage: { width: width - 32, height: width - 32, borderRadius: Radius.xl },
  dots: { flexDirection: "row", justifyContent: "center", marginTop: 8, gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 99 },

  actions: {
    flexDirection: "row",
    gap: 24,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  actionBtn: { flexDirection: "row", alignItems: "center", gap: 6 },
  actionText: { fontSize: sf(14) },
});
