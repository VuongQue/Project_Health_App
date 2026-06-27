import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  StyleSheet,
  Alert,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { ArrowLeft, Camera, User, Check } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as ImagePicker from "expo-image-picker";

import { profileApi } from "@/src/api/profileApi";
import { UserProfile, UpdateProfileDto } from "@/src/types/profile";
import { useTranslation } from "react-i18next";
import { useColors, Radius, Spacing, Typography } from "@/src/theme";
import { simpleCache } from "@/src/utils/simpleCache";

export default function EditProfileScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const colors = useColors();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [form, setForm] = useState<UpdateProfileDto>({
    fullName: "",
    username: "",
    avatarUrl: "",
    dailyGoal: "",
  });

  const updateField = (key: keyof UpdateProfileDto, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const pickAvatar = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (res.canceled) return;
    const picked = res.assets[0];
    setForm((prev) => ({ ...prev, avatarUrl: picked.uri }));

    try {
      setUploading(true);
      const uploadUrl = await profileApi.uploadAvatar(picked.uri);
      updateField("avatarUrl", uploadUrl);
    } catch {
      Alert.alert(t("common.error"), t("profile_edit.err_avatar"));
    } finally {
      setUploading(false);
    }
  };

  const loadProfile = async () => {
    try {
      const res = await profileApi.getMe();
      const user: UserProfile["user"] = res.data.user;
      setForm({
        fullName: user.fullName || "",
        username: user.username || "",
        avatarUrl: user.avatarUrl || "",
        dailyGoal: user.dailyGoal || "",
      });
    } catch {
      Alert.alert(t("common.error"), t("profile_edit.err_load"));
    } finally {
      setLoading(false);
    }
  };

  const save = async () => {
    try {
      setSaving(true);
      await profileApi.updateMe(form);
      simpleCache.delete("profile:me"); // buộc profile screen fetch lại
      router.back();
    } catch {
      Alert.alert(t("common.error"), t("profile_edit.err_save"));
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  if (loading) {
    return (
      <View style={[styles.loadingView, { backgroundColor: colors.bgSecondary }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.bgSecondary }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.bgPrimary, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: colors.bgCardElevated, borderColor: colors.border }]}>
          <ArrowLeft size={20} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>{t("profile_edit.title")}</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Avatar section */}
        <View style={styles.avatarSection}>
          <TouchableOpacity onPress={pickAvatar} activeOpacity={0.85} style={styles.avatarWrap}>
            {form.avatarUrl ? (
              <Image source={{ uri: form.avatarUrl }} style={styles.avatarImg} />
            ) : (
              <LinearGradient colors={colors.gradientPrimary} style={styles.avatarPlaceholder}>
                <User size={44} color="white" />
              </LinearGradient>
            )}
            <View style={styles.cameraBtn}>
              {uploading ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Camera size={16} color="white" />
              )}
            </View>
          </TouchableOpacity>
          <Text style={[styles.avatarHint, { color: colors.textMuted }]}>{t("profile_edit.avatar_hint")}</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>{t("profile_edit.fullname_label")}</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.bgInput, color: colors.textPrimary, borderColor: colors.border }]}
              value={form.fullName}
              onChangeText={(v) => updateField("fullName", v)}
              placeholderTextColor={colors.textDisabled}
              placeholder={t("profile_edit.fullname_placeholder")}
              selectionColor={colors.primary}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>{t("profile_edit.username_label")}</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.bgInput, color: colors.textPrimary, borderColor: colors.border }]}
              value={form.username}
              onChangeText={(v) => updateField("username", v)}
              placeholderTextColor={colors.textDisabled}
              placeholder="@username"
              autoCapitalize="none"
              selectionColor={colors.primary}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>{t("profile_edit.daily_goal_label")}</Text>
            <TextInput
              style={[styles.input, styles.textArea, { backgroundColor: colors.bgInput, color: colors.textPrimary, borderColor: colors.border }]}
              value={form.dailyGoal}
              onChangeText={(v) => updateField("dailyGoal", v)}
              multiline
              placeholderTextColor={colors.textDisabled}
              placeholder={t("profile_edit.daily_goal_placeholder")}
              selectionColor={colors.primary}
              textAlignVertical="top"
            />
          </View>
        </View>

        {/* Save button */}
        <TouchableOpacity
          onPress={save}
          disabled={saving}
          activeOpacity={0.85}
          style={styles.saveBtnWrap}
        >
          <LinearGradient
            colors={colors.gradientPrimary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.saveBtn, saving && { opacity: 0.6 }]}
          >
            {saving ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <>
                <Check size={18} color="white" />
                <Text style={styles.saveBtnText}>{t("profile_edit.save_button")}</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>

        <View style={{ height: 80 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingView: { flex: 1, justifyContent: "center", alignItems: "center" },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.base,
    paddingTop: 52,
    paddingBottom: Spacing.md,
    alignItems: "center",
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 38, height: 38,
    borderRadius: Radius.md,
    justifyContent: "center", alignItems: "center",
    borderWidth: 1,
  },
  headerTitle: { fontSize: 18, fontWeight: "700" },

  scrollContent: { paddingHorizontal: Spacing.base, paddingTop: Spacing.xl },

  avatarSection: { alignItems: "center", marginBottom: Spacing.xl },
  avatarWrap: { position: "relative" },
  avatarImg: { width: 112, height: 112, borderRadius: 56, borderWidth: 3, borderColor: "#4F8EF7" },
  avatarPlaceholder: { width: 112, height: 112, borderRadius: 56, justifyContent: "center", alignItems: "center" },
  cameraBtn: {
    position: "absolute", bottom: 4, right: 4,
    backgroundColor: "#4F8EF7", padding: 8, borderRadius: 20,
    borderWidth: 2, borderColor: "#0D1526",
  },
  avatarHint: { fontSize: 12, marginTop: Spacing.sm },

  form: { gap: Spacing.md },
  inputGroup: { gap: Spacing.xs },
  label: { fontSize: 13, fontWeight: "600", marginLeft: 2 },
  input: {
    paddingVertical: 14, paddingHorizontal: Spacing.md,
    borderRadius: Radius.xl, fontSize: 15,
    borderWidth: 1,
  },
  textArea: { height: 96, textAlignVertical: "top" },

  saveBtnWrap: { borderRadius: Radius.xl, overflow: "hidden", marginTop: Spacing.xl },
  saveBtn: { flexDirection: "row", gap: Spacing.sm, paddingVertical: 15, alignItems: "center", justifyContent: "center", borderRadius: Radius.xl },
  saveBtnText: { color: "white", fontSize: 16, fontWeight: "700" },
});
