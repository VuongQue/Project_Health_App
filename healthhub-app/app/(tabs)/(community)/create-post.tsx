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
import { ArrowLeft, ImageIcon, Send } from "lucide-react-native";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { communityApi } from "@/src/api/communityApi";

export default function CreatePostScreen() {
  const router = useRouter();
  const [text, setText] = useState("");
  const [images, setImages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      allowsMultipleSelection: true,
      quality: 1,
    });
    if (!res.canceled) setImages(res.assets);
  };

  const handlePost = async () => {
    if (!text && images.length === 0) return;
    setLoading(true);

    try {
      let media: string[] = [];
      if (images.length) {
        media = await communityApi.uploadMultiple(images.map((i) => i.uri));
      }
      await communityApi.createPost({ content: text, media });
      router.back();
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
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
          <Text style={styles.postText}>Post</Text>
        </TouchableOpacity>
      </View>

      {/* Input */}
      <TextInput
        placeholder="What's on your mind?"
        placeholderTextColor="#94a3b8"
        multiline
        value={text}
        onChangeText={setText}
        style={styles.input}
      />

      {/* Images */}
      {images.length > 0 && (
        <ScrollView horizontal>
          {images.map((img, i) => (
            <Image key={i} source={{ uri: img.uri }} style={styles.preview} />
          ))}
        </ScrollView>
      )}

      {/* Actions */}
      <TouchableOpacity onPress={pickImage} style={styles.imageBtn}>
        <ImageIcon color="#60a5fa" />
        <Text style={{ color: "#60a5fa" }}>Add Image</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#020617",
    padding: 16,
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

  preview: {
    width: 140,
    height: 140,
    borderRadius: 14,
    marginRight: 10,
  },

  imageBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 16,
  },

  imageText: {
    color: "#60a5fa",
    fontWeight: "500",
  },
});
