import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
} from "react-native";
import { communityApi } from "@/src/api/communityApi";

export function PostComments({ postId }: { postId: string }) {
  const [comments, setComments] = useState<any[]>([]);
  const [text, setText] = useState("");
  const [replyTo, setReplyTo] = useState<any>(null);

  const load = async () => {
    const res = await communityApi.getComments(postId);
    setComments(res);
  };

  const sendComment = async () => {
    if (!text.trim()) return;
    await communityApi.addComment(postId, text, replyTo?._id);
    setText("");
    setReplyTo(null);
    load();
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <View style={{ marginTop: 12 }}>
      {comments.map((c) => {
        const avatar =
          c.user.avatar ||
          `https://ui-avatars.com/api/?name=${encodeURIComponent(
            c.user.name
          )}`;

        return (
          <View key={c._id} style={styles.comment}>
            <Image source={{ uri: avatar }} style={styles.avatar} />
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{c.user.name}</Text>
              <Text style={styles.text}>{c.text}</Text>
              <TouchableOpacity onPress={() => setReplyTo(c)}>
                <Text style={styles.reply}>Reply</Text>
              </TouchableOpacity>
            </View>
          </View>
        );
      })}

      <View style={styles.inputRow}>
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="Write a comment..."
          placeholderTextColor="#64748b"
          style={styles.input}
        />
        <TouchableOpacity onPress={sendComment}>
          <Text style={styles.send}>Send</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  comment: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 12,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 999,
    backgroundColor: "#0f172a",
  },
  name: {
    color: "white",
    fontWeight: "600",
  },
  text: {
    color: "#cbd5e1",
  },
  reply: {
    color: "#3b82f6",
    fontSize: 12,
    marginTop: 4,
  },
  inputRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 8,
  },
  input: {
    flex: 1,
    backgroundColor: "#0f172a",
    borderRadius: 10,
    paddingHorizontal: 12,
    color: "white",
  },
  send: {
    color: "#3b82f6",
    fontWeight: "bold",
  },
});
