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
    } finally {
      setLiking(false);
    }
  };

  const avatarUrl =
    post.userId?.avatar ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(
      post.userId?.name ?? "User"
    )}`;

  return (
    <View style={styles.card}>
      {/* HEADER */}
      <View style={styles.header}>
        <Image source={{ uri: avatarUrl }} style={styles.avatar} />

        <View>
          <Text style={styles.author}>{post.userId?.name}</Text>
          <Text style={styles.time}>
            {new Date(post.createdAt).toDateString()}
          </Text>
        </View>
      </View>

      {/* CONTENT */}
      {post.content && <Text style={styles.content}>{post.content}</Text>}

      {/* MEDIA */}
      {post.media?.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {post.media.map((url, idx) => (
            <Image key={idx} source={{ uri: url }} style={styles.mediaImage} />
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

        <Share2 size={18} color="#94a3b8" />
      </View>

      {/* COMMENTS */}
      {showComments && <PostComments postId={post._id} />}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#1e293b",
    padding: 16,
    borderRadius: 20,
    marginHorizontal: 16,
    marginBottom: 16,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 999,
    marginRight: 12,
    backgroundColor: "#0f172a",
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
    marginBottom: 12,
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
    gap: 24,
    marginVertical: 8,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  actionText: {
    color: "#94a3b8",
  },
});
