import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
} from "react-native";
import { Send, X, CornerDownRight } from "lucide-react-native";
import { communityApi } from "@/src/api/communityApi";
import { useColors, Colors } from "@/src/theme";

interface CommentItem {
  _id: string;
  userId: string;
  user: { name: string; avatar?: string };
  text: string;
  parentId?: string | null;
  createdAt?: string;
}

interface Props {
  postId: string;
  currentUserId?: string;
}

function timeAgo(dateStr?: string) {
  if (!dateStr) return "";
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}

export function PostComments({ postId, currentUserId }: Props) {
  const colors = useColors();
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [text, setText] = useState("");
  const [replyTo, setReplyTo] = useState<CommentItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const load = async () => {
    try {
      const res = await communityApi.getComments(postId);
      setComments(res);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [postId]);

  const sendComment = async () => {
    if (!text.trim() || sending) return;
    setSending(true);
    try {
      await communityApi.addComment(postId, text.trim(), replyTo?._id);
      setText("");
      setReplyTo(null);
      load();
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  }

  const topComments = comments.filter((c) => !c.parentId);
  const repliesMap: Record<string, CommentItem[]> = {};
  comments.forEach((c) => {
    if (c.parentId) {
      if (!repliesMap[c.parentId]) repliesMap[c.parentId] = [];
      repliesMap[c.parentId].push(c);
    }
  });

  const renderComment = (c: CommentItem, isReply = false) => {
    const initials = (c.user?.name ?? "U").charAt(0).toUpperCase();
    return (
      <View key={c._id} style={[styles.commentRow, isReply && styles.replyRow]}>
        {isReply && <CornerDownRight size={14} color={colors.textMuted} style={styles.replyIcon} />}

        {c.user?.avatar ? (
          <Image source={{ uri: c.user.avatar }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarFallback]}>
            <Text style={styles.avatarInitial}>{initials}</Text>
          </View>
        )}

        <View style={[styles.bubble, { backgroundColor: colors.bgPrimary }]}>
          <View style={styles.bubbleHeader}>
            <Text style={[styles.name, { color: colors.textPrimary }]}>{c.user?.name ?? "User"}</Text>
            <Text style={[styles.timestamp, { color: colors.textMuted }]}>{timeAgo(c.createdAt)}</Text>
          </View>
          <Text style={[styles.commentText, { color: colors.textSecondary }]}>{c.text}</Text>
          {!isReply && (
            <TouchableOpacity onPress={() => setReplyTo(c)}>
              <Text style={[styles.replyBtn, { color: colors.primary }]}>Reply</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { borderTopColor: colors.border }]}>
      {topComments.length === 0 ? (
        <Text style={[styles.emptyText, { color: colors.textMuted }]}>No comments yet. Be the first!</Text>
      ) : (
        topComments.map((c) => (
          <View key={c._id}>
            {renderComment(c)}
            {(repliesMap[c._id] ?? []).map((r) => renderComment(r, true))}
          </View>
        ))
      )}

      {replyTo && (
        <View style={[styles.replyIndicator, { backgroundColor: colors.bgPrimary }]}>
          <Text style={[styles.replyIndicatorText, { color: colors.textSecondary }]}>
            Replying to <Text style={{ color: colors.primary }}>{replyTo.user?.name}</Text>
          </Text>
          <TouchableOpacity onPress={() => setReplyTo(null)}>
            <X size={14} color={colors.textMuted} />
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.inputRow}>
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder={replyTo ? `Reply to ${replyTo.user?.name}…` : "Write a comment…"}
          placeholderTextColor={colors.textMuted}
          style={[styles.input, { backgroundColor: colors.bgPrimary, color: colors.textPrimary, borderColor: colors.border }]}
          multiline
          maxLength={500}
          returnKeyType="send"
          onSubmitEditing={sendComment}
        />
        <TouchableOpacity
          onPress={sendComment}
          disabled={!text.trim() || sending}
          style={[styles.sendBtn, (!text.trim() || sending) && { backgroundColor: colors.bgCardElevated }]}
        >
          {sending ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Send size={16} color="white" />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderTopWidth: 1,
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 4,
  },

  center: {
    padding: 16,
    alignItems: "center",
  },

  emptyText: {
    textAlign: "center",
    marginBottom: 12,
    fontSize: 13,
  },

  commentRow: {
    flexDirection: "row",
    marginBottom: 12,
    gap: 8,
  },

  replyRow: {
    marginLeft: 28,
  },

  replyIcon: {
    marginTop: 6,
  },

  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#334155",
    flexShrink: 0,
  },

  avatarFallback: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#3b82f6",
  },

  avatarInitial: {
    color: "white",
    fontWeight: "bold",
    fontSize: 13,
  },

  bubble: {
    flex: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },

  bubbleHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },

  name: {
    fontWeight: "600",
    fontSize: 13,
  },

  timestamp: {
    fontSize: 11,
  },

  commentText: {
    fontSize: 14,
    lineHeight: 20,
  },

  replyBtn: {
    fontSize: 12,
    marginTop: 6,
    fontWeight: "600",
  },

  replyIndicator: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 8,
  },

  replyIndicatorText: {
    fontSize: 12,
  },

  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    marginTop: 4,
    marginBottom: 4,
  },

  input: {
    flex: 1,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    maxHeight: 100,
    borderWidth: 1,
    fontSize: 14,
  },

  sendBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
});
