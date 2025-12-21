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

const { width } = Dimensions.get("window");

export default function PostDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

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

  useEffect(() => {
    loadPost();
  }, [id]);

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

  const onScrollEnd = (
    e: NativeSyntheticEvent<NativeScrollEvent>
  ) => {
    const index = Math.round(
      e.nativeEvent.contentOffset.x / width
    );
    setActiveIndex(index);
  };

  if (loading || !post) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color="#60a5fa" />
      </View>
    );
  }

  const avatarUrl =
    post.userId?.avatar ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(
      post.userId?.name ?? "User"
    )}`;

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft color="white" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Post</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView>
        {/* AUTHOR */}
        <View style={styles.authorRow}>
          <Image source={{ uri: avatarUrl }} style={styles.avatar} />
          <View>
            <Text style={styles.author}>{post.userId?.name}</Text>
            <Text style={styles.time}>
              {new Date(post.createdAt).toDateString()}
            </Text>
          </View>
        </View>

        {/* CONTENT */}
        {post.content && (
          <Text style={styles.content}>{post.content}</Text>
        )}

        {/* MEDIA – STACK SLIDER */}
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
                  <Image
                    source={{ uri }}
                    style={styles.slideImage}
                  />
                </View>
              ))}
            </ScrollView>

            {/* DOT INDICATOR */}
            <View style={styles.dots}>
              {post.media.map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.dot,
                    i === activeIndex && styles.dotActive,
                  ]}
                />
              ))}
            </View>
          </View>
        )}

        {/* ACTIONS */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={handleLike}
          >
            <Heart size={20} color="#94a3b8" />
            <Text style={styles.actionText}>
              {post.likeCount}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => setShowComments(!showComments)}
          >
            <MessageSquare size={20} color="#94a3b8" />
            <Text style={styles.actionText}>
              {post.commentCount}
            </Text>
          </TouchableOpacity>

          <Share2 size={20} color="#94a3b8" />
        </View>

        {/* COMMENTS */}
        {showComments && (
          <PostComments postId={post._id} />
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#020617",
  },

  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#020617",
  },

  /* HEADER */
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#334155",
  },

  headerTitle: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },

  /* AUTHOR */
  authorRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 12,
  },

  avatar: {
    width: 48,
    height: 48,
    borderRadius: 999,
  },

  author: {
    color: "white",
    fontWeight: "600",
    fontSize: 16,
  },

  time: {
    color: "#94a3b8",
    fontSize: 12,
  },

  /* CONTENT */
  content: {
    color: "white",
    fontSize: 16,
    lineHeight: 22,
    paddingHorizontal: 16,
    marginBottom: 12,
  },

  /* SLIDER */
  sliderWrapper: {
    marginVertical: 8,
  },

  slide: {
    width: width,
    alignItems: "center",
  },

  slideImage: {
    width: width - 32,
    height: width - 32,
    borderRadius: 20,
  },

  dots: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 8,
    gap: 6,
  },

  dot: {
    width: 6,
    height: 6,
    borderRadius: 99,
    backgroundColor: "#334155",
  },

  dotActive: {
    backgroundColor: "#60a5fa",
  },

  /* ACTIONS */
  actions: {
    flexDirection: "row",
    gap: 24,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#334155",
  },

  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  actionText: {
    color: "#94a3b8",
    fontSize: 14,
  },
});
