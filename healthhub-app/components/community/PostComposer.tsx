import React, { useState } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  Image,
  ScrollView,
} from "react-native";
import { ImageIcon, Send } from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";

import { communityApi } from "@/src/api/communityApi";

interface Props {
  onPosted: () => void;
}

export function PostComposer({ onPosted }: Props) {
  const [text, setText] = useState("");
  const [images, setImages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Pick MULTIPLE images
  const pickImage = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 1,
    });

    if (!res.canceled) {
      setImages([...images, ...res.assets]);
    }
  };

  // Upload + Create Post
  const handlePost = async () => {
    if (loading) return;
    if (!text.trim() && images.length === 0) return;

    setLoading(true);
    try {
      let mediaUrls: string[] = [];

      // UPLOAD IF ANY IMAGE
      if (images.length > 0) {
        const uris = images.map((img) => img.uri);
        mediaUrls = await communityApi.uploadMultiple(uris);
      }

      // CREATE POST
      await communityApi.createPost({
        content: text,
        media: mediaUrls,
      });

      // RESET
      setText("");
      setImages([]);
      onPosted();
    } catch (error) {
      console.log("Create post error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.card}>
      {/* Input */}
      <TextInput
        placeholder="Share your thoughts..."
        placeholderTextColor="#64748b"
        style={styles.input}
        multiline
        value={text}
        onChangeText={setText}
      />

      {/* Image Preview */}
      {images.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {images.map((img, idx) => (
            <Image
              key={idx}
              source={{ uri: img.uri }}
              style={styles.preview}
            />
          ))}
        </ScrollView>
      )}

      {/* Actions */}
      <View style={styles.row}>
        <TouchableOpacity style={styles.action} onPress={pickImage}>
          <ImageIcon size={18} color="#94a3b8" />
          <Text style={styles.actionText}>Image</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.postBtn} onPress={handlePost}>
          <Send size={18} color="white" />
          <Text style={{ color: "white", marginLeft: 6 }}>
            {loading ? "Posting..." : "Share"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#1e293b",
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#334155",
    marginBottom: 16,
  },
  input: {
    backgroundColor: "#0f172a",
    color: "white",
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
    minHeight: 60,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  action: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  actionText: {
    color: "#94a3b8",
  },
  postBtn: {
    flexDirection: "row",
    backgroundColor: "#2563eb",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: "center",
  },
  preview: {
    width: 120,
    height: 120,
    borderRadius: 12,
    marginRight: 10,
  },
});
