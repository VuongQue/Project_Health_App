import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Switch,
  Alert,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { ArrowLeft, Users } from "lucide-react-native";
import { communityApi } from "@/src/api/communityApi";
import { useColors, Spacing, Radius, sw, sf } from "@/src/theme";

export default function CreateGroupScreen() {
  const colors = useColors();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) {
      Alert.alert("Lỗi", "Tên nhóm không được để trống.");
      return;
    }
    setLoading(true);
    try {
      const group = await communityApi.createGroup({
        name: name.trim(),
        description: description.trim(),
        type: isPrivate ? "private" : "public",
      });
      router.replace({
        pathname: "/(tabs)/(community)/groups/[id]",
        params: { id: group._id ?? group.id },
      } as any);
    } catch {
      Alert.alert("Lỗi", "Không thể tạo nhóm. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bgSecondary }]}>
      {/* HEADER */}
      <View style={[styles.header, { backgroundColor: colors.bgPrimary, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.backBtn, { backgroundColor: colors.bgCardElevated, borderColor: colors.border }]}
        >
          <ArrowLeft size={20} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Tạo nhóm mới</Text>
      </View>

      <ScrollView style={styles.scroll} keyboardShouldPersistTaps="handled">
        {/* AVATAR PLACEHOLDER */}
        <View style={styles.avatarSection}>
          <View style={[styles.avatarPlaceholder, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
            <Users size={40} color={colors.textMuted} />
          </View>
          <Text style={[styles.avatarHint, { color: colors.textMuted }]}>Ảnh đại diện nhóm (sắp có)</Text>
        </View>

        {/* FORM */}
        <View style={styles.form}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Tên nhóm *</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="VD: Câu lạc bộ chạy bộ sáng"
            placeholderTextColor={colors.textMuted}
            style={[styles.input, { backgroundColor: colors.bgCard, borderColor: colors.border, color: colors.textPrimary }]}
            maxLength={100}
          />

          <Text style={[styles.label, { color: colors.textSecondary }]}>Mô tả</Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="Nhóm này về chủ đề gì?"
            placeholderTextColor={colors.textMuted}
            style={[styles.input, styles.textarea, { backgroundColor: colors.bgCard, borderColor: colors.border, color: colors.textPrimary }]}
            multiline
            numberOfLines={4}
            maxLength={500}
          />

          <View style={[styles.switchRow, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
            <View>
              <Text style={[styles.label, { color: colors.textSecondary, marginTop: 0 }]}>Nhóm riêng tư</Text>
              <Text style={[styles.switchSub, { color: colors.textMuted }]}>
                {isPrivate ? "Chỉ thành viên mới xem được bài viết" : "Ai cũng có thể xem và tham gia"}
              </Text>
            </View>
            <Switch
              value={isPrivate}
              onValueChange={setIsPrivate}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="white"
            />
          </View>

          <TouchableOpacity
            style={[styles.createBtn, { backgroundColor: colors.primary }, loading && { opacity: 0.6 }]}
            onPress={handleCreate}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.createText}>Tạo nhóm</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.base,
    paddingTop: 52,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    gap: 10,
  },
  backBtn: {
    width: 38, height: 38,
    borderRadius: Radius.md,
    justifyContent: "center", alignItems: "center",
    borderWidth: 1,
  },
  title: { fontSize: sf(18), fontWeight: "800" },

  scroll: { flex: 1 },

  avatarSection: {
    alignItems: "center",
    paddingVertical: 28,
    gap: 8,
  },
  avatarPlaceholder: {
    width: sw(90), height: sw(90),
    borderRadius: Radius.xl,
    borderWidth: 2,
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarHint: { fontSize: sf(12) },

  form: { paddingHorizontal: Spacing.base, gap: 6 },

  label: {
    fontSize: sf(13),
    fontWeight: "600",
    marginBottom: 4,
    marginTop: Spacing.md,
  },

  input: {
    borderWidth: 1,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontSize: sf(15),
  },

  textarea: {
    height: 100,
    textAlignVertical: "top",
  },

  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    marginTop: Spacing.md,
  },
  switchSub: { fontSize: sf(12), marginTop: 2 },

  createBtn: {
    borderRadius: Radius.lg,
    paddingVertical: Spacing.md,
    alignItems: "center",
    marginTop: Spacing.xl,
  },
  createText: { color: "white", fontWeight: "800", fontSize: sf(16) },
});
