import React, { useState } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { ArrowLeft, ImageIcon, Send } from "lucide-react-native";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { communityApi } from "@/src/api/communityApi";

export default function CreatePostScreen() {
  const router = useRouter();
  const [text, setText] = useState("");
  const [images, setImages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  /** PICK IMAGE (multi) */
  const pickImage = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      allowsMultipleSelection: true,
      selectionLimit: 10,
      quality: 1,
    });

    if (res.canceled) return;

    setImages((prev) => [...prev, ...res.assets]);
  };

  /** POST */
  const handlePost = async () => {
    if (!text && images.length === 0) return;
    setLoading(true);

    try {
      let media: string[] = [];
      if (images.length) {
        media = await communityApi.uploadMultiple(
          images.map((i) => i.uri)
        );
      }
      await communityApi.createPost({ content: text, media });
      router.back();
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <ArrowLeft color="white" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handlePost}
            disabled={!text && images.length === 0}
            style={[
              styles.postBtn,
              (!text && images.length === 0) && { opacity: 0.5 },
            ]}
          >
            <Send size={16} color="white" />
            <Text style={styles.postText}>
              {loading ? "Posting..." : "Post"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* INPUT */}
        <TextInput
          placeholder="What's on your mind?"
          placeholderTextColor="#94a3b8"
          multiline
          value={text}
          onChangeText={setText}
          style={styles.input}
        />

        {/* ADD IMAGE — LUÔN NGAY DƯỚI INPUT */}
        <TouchableOpacity onPress={pickImage} style={styles.imageBtn}>
          <ImageIcon color="#60a5fa" />
          <Text style={styles.imageText}>Add Image</Text>
        </TouchableOpacity>

        {/* IMAGE GRID — TỰ XUỐNG DÒNG */}
        {images.length > 0 && (
          <View style={styles.imageGrid}>
            {images.map((img, i) => (
              <Image
                key={i}
                source={{ uri: img.uri }}
                style={styles.preview}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#020617",
    padding: 16,
    paddingBottom: 40,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },

  postBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#2563eb",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
  },

  postText: {
    color: "white",
    fontWeight: "600",
  },

  input: {
    color: "white",
    fontSize: 16,
    minHeight: 120,
    textAlignVertical: "top",
    marginBottom: 12,
  },

  imageBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 12,
  },

  imageText: {
    color: "#60a5fa",
    fontWeight: "500",
  },

  /** GRID ẢNH */
  imageGrid: {
    flexDirection: "row",
    flexWrap: "wrap", // 👈 QUAN TRỌNG
    gap: 8,
  },

  preview: {
    width: "32%", // 3 ảnh / hàng
    aspectRatio: 1,
    borderRadius: 12,
  },
});
