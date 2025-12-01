import React, { useEffect, useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { communityApi } from "@/src/api/communityApi";

export function PostComments({ postId }: { postId: string }) {
  const [comments, setComments] = useState<any[]>([]);
  const [text, setText] = useState("");
  const [replyTo, setReplyTo] = useState<any>(null);

  // Build tree comment chuẩn
  const buildTree = (items: any[]) => {
    const map: Record<string, any> = {};
    const roots: any[] = [];

    items.forEach((c) => {
      const id = c._id.toString();
      map[id] = { ...c, children: [] };
    });

    items.forEach((c) => {
      const id = c._id.toString();
      const parentId = c.parentId?.toString();

      if (parentId && map[parentId]) {
        map[parentId].children.push(map[id]);
      } else {
        roots.push(map[id]);
      }
    });

    return roots;
  };

  const load = async () => {
    const res = await communityApi.getComments(postId);
    const tree = buildTree(res);
    setComments(tree);
  };

  const sendComment = async () => {
    if (!text.trim()) return;

    const content = text.trim();
    setText("");

    try {
      await communityApi.addComment(postId, content, replyTo?._id);
      setReplyTo(null);
      await load();
    } catch (err) {
      console.log("Comment error:", err);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const formatTime = (date: string) => {
    const d = new Date(date);
    const diff = (Date.now() - d.getTime()) / 1000;

    if (diff < 60) return `${Math.floor(diff)}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  const renderComment = (c: any, level = 0) => (
    <View key={c._id} style={{ paddingLeft: level * 20, marginBottom: 10 }}>
      <Text style={styles.name}>{c.user.name}</Text>
      <Text style={styles.comment}>{c.text}</Text>

      <View style={styles.metaRow}>
        <Text style={styles.time}>{formatTime(c.createdAt)}</Text>

        <TouchableOpacity onPress={() => setReplyTo(c)}>
          <Text style={styles.reply}>Reply</Text>
        </TouchableOpacity>
      </View>

      {c.children.map((child: any) => renderComment(child, level + 1))}
    </View>
  );

  return (
    <View style={{ marginTop: 12 }}>
      {replyTo && (
        <Text style={styles.replying}>
          Replying to <Text style={{ color: "#3b82f6" }}>{replyTo.user.name}</Text>
        </Text>
      )}

      <View style={styles.row}>
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder={replyTo ? "Write a reply..." : "Write a comment..."}
          placeholderTextColor="#64748b"
          style={styles.input}
        />
        <TouchableOpacity onPress={sendComment}>
          <Text style={styles.send}>Send</Text>
        </TouchableOpacity>
      </View>

      {comments.map((c) => renderComment(c))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  input: {
    flex: 1,
    backgroundColor: "#0f172a",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: "white",
  },
  send: {
    color: "#3b82f6",
    fontWeight: "bold",
  },
  comment: {
    color: "#cbd5e1",
  },
  name: {
    color: "white",
    fontWeight: "600",
  },
  metaRow: {
    flexDirection: "row",
    gap: 16,
    marginTop: 4,
  },
  time: {
    color: "#64748b",
    fontSize: 12,
  },
  reply: {
    color: "#3b82f6",
    fontSize: 12,
    fontWeight: "bold",
  },
  replying: {
    color: "#eab308",
    marginBottom: 6,
  },
});
