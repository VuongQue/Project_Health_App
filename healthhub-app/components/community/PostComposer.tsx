import React, { useState } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  Image,
} from "react-native";
import { ImageIcon, Send } from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";

import { communityApi } from "@/src/api/communityApi";
import { mediaApi } from "@/src/api/mediaApi";

interface Props {
  onPosted: () => void;
}

export function PostComposer({ onPosted }: Props) {
  const [text, setText] = useState("");
  const [image, setImage] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Pick image — FIXED for Web + Mobile
  const pickImage = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });

    if (!res.canceled) {
      setImage(res.assets[0]);
    }
  };

  // Upload + Create Post
  const handlePost = async () => {
    if (loading) return;
    setLoading(true);

    try {
      let mediaUrl: string[] = [];

      // UPLOAD IMAGE → Cloudinary via backend
      if (!image?.uri) {
        console.log("NO URI FOUND", image);
        return;
        }

        if (image?.uri) {
            const uploadedUrl = await mediaApi.uploadFile(image.uri);
            console.log("UPLOAD RESPONSE:", uploadedUrl);
            mediaUrl.push(uploadedUrl);
            }



      // CREATE POST
      await communityApi.createPost({
        content: text,
        media: mediaUrl,
      });

      setText("");
      setImage(null);
      onPosted();
    } catch (error) {
      console.log("Post create error:", error);
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
      {image && (
        <Image
          source={{ uri: image.uri }}
          style={{ width: "100%", height: 180, borderRadius: 12 }}
        />
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
});
