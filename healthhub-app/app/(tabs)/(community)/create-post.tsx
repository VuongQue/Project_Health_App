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
import { useRouter, useLocalSearchParams } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { communityApi } from "@/src/api/communityApi";
import { useColors, Spacing, Radius } from "@/src/theme";

export default function CreatePostScreen() {
  const router = useRouter();
  const { groupId } = useLocalSearchParams<{ groupId?: string }>();
  const colors = useColors();
  const [text, setText] = useState("");
  const [images, setImages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      allowsMultipleSelection: true,
      selectionLimit: 10,
      quality: 1,
    });
    if (res.canceled) return;
    setImages((prev) => [...prev, ...res.assets]);
  };

  const handlePost = async () => {
    if (!text && images.length === 0) return;
    setLoading(true);
    try {
      let media: string[] = [];
      if (images.length) {
        media = await communityApi.uploadMultiple(images.map((i) => i.uri));
      }
      if (groupId) {
        await communityApi.createGroupPost(groupId, { content: text, media });
      } else {
        await communityApi.createPost({ content: text, media });
      }
      router.back();
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.bgSecondary }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={[styles.container, { backgroundColor: colors.bgSecondary }]}
        keyboardShouldPersistTaps="handled"
      >
        {/* HEADER */}
        <View style={[styles.header, { backgroundColor: colors.bgPrimary, borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: colors.bgCardElevated, borderColor: colors.border }]}>
            <ArrowLeft size={20} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
            {groupId ? "Đăng vào nhóm" : "Tạo bài viết"}
          </Text>
          <TouchableOpacity
            onPress={handlePost}
            disabled={!text && images.length === 0}
            style={[styles.postBtn, { backgroundColor: colors.primary }, (!text && images.length === 0) && { opacity: 0.4 }]}
          >
            <Send size={15} color="white" />
            <Text style={styles.postText}>{loading ? "Đang đăng..." : "Đăng"}</Text>
          </TouchableOpacity>
        </View>

        {/* INPUT */}
        <TextInput
          placeholder="Bạn đang nghĩ gì?"
          placeholderTextColor={colors.textMuted}
          multiline
          value={text}
          onChangeText={setText}
          style={[styles.input, { color: colors.textPrimary }]}
        />

        {/* ADD IMAGE */}
        <TouchableOpacity onPress={pickImage} style={styles.imageBtn}>
          <ImageIcon size={20} color={colors.primary} />
          <Text style={[styles.imageText, { color: colors.primary }]}>Thêm ảnh</Text>
        </TouchableOpacity>

        {/* IMAGE GRID */}
        {images.length > 0 && (
          <View style={styles.imageGrid}>
            {images.map((img, i) => (
              <Image key={i} source={{ uri: img.uri }} style={styles.preview} />
            ))}
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.base,
    paddingTop: 52,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    gap: 10,
    marginBottom: Spacing.md,
  },
  backBtn: {
    width: 38, height: 38,
    borderRadius: Radius.md,
    justifyContent: "center", alignItems: "center",
    borderWidth: 1,
  },
  headerTitle: { flex: 1, fontSize: 17, fontWeight: "700" },
  postBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
  },
  postText: { color: "white", fontWeight: "600", fontSize: 13 },

  input: {
    fontSize: 16,
    minHeight: 120,
    textAlignVertical: "top",
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
  },

  imageBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
  },
  imageText: { fontWeight: "600", fontSize: 14 },

  imageGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    paddingHorizontal: Spacing.base,
    marginTop: Spacing.sm,
  },
  preview: {
    width: "32%",
    aspectRatio: 1,
    borderRadius: Radius.lg,
  },
});
