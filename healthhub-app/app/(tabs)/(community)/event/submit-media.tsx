import React, { useState } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet, TextInput,
  ScrollView, Alert, ActivityIndicator, Image,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { ArrowLeft, Upload, Video, Image as ImageIcon, CheckCircle } from "lucide-react-native";
import { useColors, Spacing, Radius, sw, sf } from "@/src/theme";
import eventsApi from "@/src/api/eventsApi";
import axiosClient from "@/src/api/axiosClient";

export default function SubmitMediaScreen() {
  const { eventId, eventTitle } = useLocalSearchParams<{ eventId: string; eventTitle: string }>();
  const colors = useColors();

  const [mediaUri, setMediaUri] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<"video" | "image">("video");
  const [userNote, setUserNote] = useState("");
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);

  const numericEventId = Number(Array.isArray(eventId) ? eventId[0] : eventId);

  const pickMedia = async (type: "video" | "image") => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: type === "video"
        ? ImagePicker.MediaTypeOptions.Videos
        : ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      videoMaxDuration: 120,
      allowsEditing: false,
    });
    if (!result.canceled && result.assets[0]) {
      setMediaUri(result.assets[0].uri);
      setMediaType(type);
      setUploadedUrl(null);
    }
  };

  const uploadToBackend = async (): Promise<string> => {
    if (!mediaUri) throw new Error("Chưa chọn file");
    setUploading(true);
    try {
      const filename = mediaUri.split("/").pop() ?? "upload";
      const ext = filename.split(".").pop() ?? (mediaType === "video" ? "mp4" : "jpg");
      const mime = mediaType === "video" ? `video/${ext}` : `image/${ext}`;

      const formData = new FormData();
      formData.append("file", { uri: mediaUri, name: filename, type: mime } as any);

      const res = await axiosClient.post("/media/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const url = (res.data as any)?.secure_url;
      if (!url) throw new Error("Upload thất bại");
      return url;
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (isNaN(numericEventId)) {
      Alert.alert("Lỗi", "ID sự kiện không hợp lệ");
      router.back();
      return;
    }
    if (!mediaUri) {
      Alert.alert("Chưa chọn file", "Vui lòng chọn video hoặc ảnh minh chứng");
      return;
    }
    setSubmitting(true);
    try {
      let url = uploadedUrl;
      if (!url) {
        url = await uploadToBackend();
        setUploadedUrl(url);
      }
      await eventsApi.submitMedia(numericEventId, {
        mediaUrl: url,
        mediaType,
        userNote: userNote.trim() || undefined,
      });
      Alert.alert(
        "Nộp thành công! 🎬",
        "Minh chứng của bạn đã được gửi và đang chờ admin duyệt. Bạn sẽ nhận được thông báo khi có kết quả.",
        [{ text: "Đã hiểu", onPress: () => router.back() }],
      );
    } catch (e: any) {
      Alert.alert("Lỗi", e?.response?.data?.message ?? e?.message ?? "Không thể nộp minh chứng");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bgSecondary }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.bgPrimary, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.backBtn, { backgroundColor: colors.bgCardElevated, borderColor: colors.border }]}
        >
          <ArrowLeft size={20} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]} numberOfLines={1}>
          Nộp minh chứng
        </Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: Spacing.base, gap: sw(16), paddingBottom: 120 }}>
        {/* Event info */}
        <View style={[styles.eventBanner, { backgroundColor: colors.primaryBg, borderColor: colors.borderAccent }]}>
          <Text style={[styles.eventBannerTitle, { color: colors.primary }]} numberOfLines={2}>{eventTitle}</Text>
          <Text style={[styles.eventBannerSub, { color: colors.textSecondary }]}>
            Nộp minh chứng cho ngày hôm nay. Admin sẽ xem xét và phản hồi sớm nhất có thể.
          </Text>
        </View>

        {/* Chọn loại media */}
        <View style={[styles.card, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Loại minh chứng</Text>
          <View style={styles.typeRow}>
            {(["video", "image"] as const).map((t) => (
              <TouchableOpacity
                key={t}
                style={[
                  styles.typeBtn,
                  { borderColor: colors.border, backgroundColor: colors.bgSecondary },
                  mediaType === t && { borderColor: colors.primary, backgroundColor: colors.primaryBg },
                ]}
                onPress={() => setMediaType(t)}
              >
                {t === "video"
                  ? <Video size={22} color={mediaType === t ? colors.primary : colors.textMuted} />
                  : <ImageIcon size={22} color={mediaType === t ? colors.primary : colors.textMuted} />
                }
                <Text style={[styles.typeBtnText, { color: mediaType === t ? colors.primary : colors.textSecondary }]}>
                  {t === "video" ? "🎬 Video" : "🖼️ Ảnh"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Upload area */}
        <View style={[styles.card, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
            {mediaUri ? "Xem trước" : "Chọn file minh chứng"}
          </Text>

          {mediaUri && mediaType === "image" ? (
            <Image source={{ uri: mediaUri }} style={styles.previewImg} resizeMode="cover" />
          ) : mediaUri && mediaType === "video" ? (
            <View style={[styles.videoPreview, { backgroundColor: colors.bgSecondary }]}>
              <Video size={40} color={colors.primary} />
              <Text style={[styles.videoPreviewText, { color: colors.textSecondary }]}>Video đã chọn</Text>
              <Text style={[styles.videoPreviewSub, { color: colors.textMuted }]} numberOfLines={1}>
                {mediaUri.split("/").pop()}
              </Text>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.uploadBox, { borderColor: colors.border, backgroundColor: colors.bgSecondary }]}
              onPress={() => pickMedia(mediaType)}
            >
              <Upload size={32} color={colors.textMuted} />
              <Text style={[styles.uploadBoxText, { color: colors.textSecondary }]}>
                Chọn {mediaType === "video" ? "video" : "ảnh"} từ thư viện
              </Text>
              <Text style={[styles.uploadBoxSub, { color: colors.textMuted }]}>
                {mediaType === "video" ? "Tối đa 2 phút" : "JPG, PNG"}
              </Text>
            </TouchableOpacity>
          )}

          {mediaUri && (
            <TouchableOpacity
              style={[styles.rePickBtn, { borderColor: colors.border }]}
              onPress={() => pickMedia(mediaType)}
            >
              <Text style={[styles.rePickBtnText, { color: colors.textSecondary }]}>Chọn lại</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Ghi chú */}
        <View style={[styles.card, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Ghi chú (tuỳ chọn)</Text>
          <TextInput
            style={[styles.noteInput, { backgroundColor: colors.bgSecondary, borderColor: colors.border, color: colors.textPrimary }]}
            value={userNote}
            onChangeText={setUserNote}
            placeholder="VD: Tôi đã plank được 2 phút, có thể thấy timer trong video..."
            placeholderTextColor={colors.textMuted}
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Hướng dẫn */}
        <View style={[styles.tipBox, { backgroundColor: colors.warningBg, borderColor: colors.warning + "50" }]}>
          <Text style={[styles.tipTitle, { color: colors.warning }]}>💡 Lưu ý khi quay minh chứng</Text>
          <Text style={[styles.tipText, { color: colors.textSecondary }]}>
            • Quay rõ ràng toàn bộ động tác, không bị che khuất{"\n"}
            • Nên có đồng hồ hoặc timer để xác nhận thời gian{"\n"}
            • Video đủ dài để admin có thể xác minh{"\n"}
            • Không dùng video cũ hoặc video của người khác
          </Text>
        </View>
      </ScrollView>

      {/* Bottom action */}
      <View style={[styles.bottomBar, { backgroundColor: colors.bgPrimary, borderTopColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.submitBtn, (!mediaUri || submitting || uploading) && { opacity: 0.5 }]}
          onPress={handleSubmit}
          disabled={!mediaUri || submitting || uploading}
        >
          {submitting || uploading ? (
            <>
              <ActivityIndicator color="white" size="small" />
              <Text style={styles.submitBtnText}>{uploading ? "Đang upload..." : "Đang gửi..."}</Text>
            </>
          ) : (
            <>
              <CheckCircle size={20} color="white" />
              <Text style={styles.submitBtnText}>Nộp minh chứng</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: Spacing.base, paddingTop: sw(52), paddingBottom: sw(12),
    borderBottomWidth: 1,
  },
  backBtn: {
    width: sw(38), height: sw(38), borderRadius: Radius.full,
    alignItems: "center", justifyContent: "center", borderWidth: 1,
  },
  headerTitle: { fontSize: sf(17), fontWeight: "700", flex: 1, textAlign: "center", paddingHorizontal: 8 },

  eventBanner: {
    padding: Spacing.md, borderRadius: Radius.xl, borderWidth: 1.5, gap: 4,
  },
  eventBannerTitle: { fontSize: sf(15), fontWeight: "800" },
  eventBannerSub: { fontSize: sf(12) },

  card: {
    borderRadius: Radius.xl, borderWidth: 1, padding: Spacing.base, gap: sw(12),
  },
  cardTitle: { fontSize: sf(14), fontWeight: "700" },

  typeRow: { flexDirection: "row", gap: sw(10) },
  typeBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, paddingVertical: sw(12), borderRadius: Radius.lg, borderWidth: 1.5,
  },
  typeBtnText: { fontSize: sf(14), fontWeight: "700" },

  uploadBox: {
    alignItems: "center", justifyContent: "center", gap: sw(8),
    paddingVertical: sw(36), borderRadius: Radius.xl, borderWidth: 1.5, borderStyle: "dashed",
  },
  uploadBoxText: { fontSize: sf(14), fontWeight: "600" },
  uploadBoxSub: { fontSize: sf(12) },

  previewImg: {
    width: "100%", height: sw(220), borderRadius: Radius.lg, resizeMode: "cover",
  },
  videoPreview: {
    height: sw(140), borderRadius: Radius.xl,
    alignItems: "center", justifyContent: "center", gap: 8,
  },
  videoPreviewText: { fontSize: sf(14), fontWeight: "600" },
  videoPreviewSub: { fontSize: sf(12), maxWidth: "80%" },

  rePickBtn: {
    alignItems: "center", paddingVertical: sw(8), borderRadius: Radius.lg, borderWidth: 1,
  },
  rePickBtnText: { fontSize: sf(13), fontWeight: "600" },

  noteInput: {
    borderWidth: 1, borderRadius: Radius.lg, padding: Spacing.md,
    fontSize: sf(14), minHeight: sw(80), textAlignVertical: "top",
  },

  tipBox: { padding: Spacing.md, borderRadius: Radius.xl, borderWidth: 1, gap: sw(6) },
  tipTitle: { fontSize: sf(13), fontWeight: "700" },
  tipText: { fontSize: sf(12), lineHeight: 20 },

  bottomBar: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    padding: Spacing.base, paddingBottom: sw(28), borderTopWidth: 1,
  },
  submitBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, backgroundColor: "#4C8EF8", borderRadius: Radius.xl, paddingVertical: sw(15),
  },
  submitBtnText: { color: "white", fontWeight: "800", fontSize: sf(16) },
});
