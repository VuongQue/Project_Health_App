import React, { useEffect, useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { communityApi } from "@/src/api/communityApi";

export function PostComments({ postId }: { postId: string }) {
  const [comments, setComments] = useState<any[]>([]);
  const [text, setText] = useState("");

  const load = async () => {
    const res = await communityApi.getComments(postId);
    setComments(res);
  };

  const sendComment = async () => {
    if (!text.trim()) return;
    await communityApi.addComment(postId, text);
    setText("");
    load();
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <View style={{ marginTop: 12 }}>
      {/* Input */}
      <View style={styles.row}>
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
    color: "#94a3b8",
    marginTop: 6,
  },
  name: {
    color: "white",
    fontWeight: "600",
  },
});
