import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
} from "react-native";
import { Heart, MessageSquare, Share2 } from "lucide-react-native";
import { PostItem } from "@/src/types/community";
import { communityApi } from "@/src/api/communityApi";
import { PostComments } from "./PostComments";

interface Props {
  post: PostItem;
  refresh: () => void;
}

export function PostCard({ post, refresh }: Props) {
  const [liking, setLiking] = useState(false);
  const [showComments, setShowComments] = useState(false);

  const handleLike = async () => {
    if (liking) return;
    setLiking(true);

    try {
      await communityApi.toggleLike(post._id);
      refresh();
    } catch (err) {
      console.log("Like error:", err);
    } finally {
      setLiking(false);
    }
  };

  return (
    <View style={styles.card}>
      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.avatar}>{post.userId.avatar}</Text>

        <View>
          <Text style={styles.author}>{post.userId.name}</Text>
          <Text style={styles.time}>
            {new Date(post.createdAt).toDateString()}
          </Text>
        </View>
      </View>

      {/* CONTENT */}
      <Text style={styles.content}>{post.content}</Text>

      {/* MULTI IMAGE SUPPORT */}
      {post.media && post.media.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginBottom: 16 }}
        >
          {post.media.map((url, idx) => (
            <Image
              key={idx}
              source={{ uri: url }}
              style={styles.mediaImage}
              resizeMode="cover"
            />
          ))}
        </ScrollView>
      )}

      {/* ACTIONS */}
      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionBtn} onPress={handleLike}>
          <Heart size={18} color="#94a3b8" />
          <Text style={styles.actionText}>{post.likeCount}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => setShowComments(!showComments)}
        >
          <MessageSquare size={18} color="#94a3b8" />
          <Text style={styles.actionText}>{post.commentCount}</Text>
        </TouchableOpacity>

        <TouchableOpacity>
          <Share2 size={18} color="#94a3b8" />
        </TouchableOpacity>
      </View>

      {/* COMMENT PREVIEW (only if comments collapsed) */}
      {!showComments &&
        post.commentPreview?.map((c) => (
          <Text key={c.id} style={styles.commentPreview}>
            <Text style={{ color: "white" }}>{c.user.name}: </Text>
            {c.text}
          </Text>
        ))}

      {/* FULL COMMENT SECTION */}
      {showComments && <PostComments postId={post._id} />}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#1e293b",
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#334155",
    marginBottom: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  avatar: {
    fontSize: 32,
    marginRight: 12,
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
  content: {
    color: "white",
    marginBottom: 16,
    lineHeight: 20,
  },
  mediaImage: {
    width: 260,
    height: 260,
    borderRadius: 12,
    marginRight: 12,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
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
  commentPreview: {
    color: "#94a3b8",
    marginTop: 4,
    fontSize: 14,
  },
});
