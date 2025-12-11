import React, { useEffect, useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Image, ActivityIndicator, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { ArrowLeft, Camera, User } from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";

import { profileApi } from "@/src/api/profileApi";
import { UserProfile, UpdateProfileDto } from "@/src/types/profile";

export default function EditProfileScreen() {
  const router = useRouter();
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

    // preview local image
    setForm((prev) => ({ ...prev, avatarUrl: picked.uri }));

    try {
      setUploading(true);

      const uploadUrl = await profileApi.uploadAvatar(picked.uri);

      console.log("Uploaded URL:", uploadUrl);
      updateField("avatarUrl", uploadUrl);
    } catch (err) {
      console.log("Upload avatar error:", err);
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
    } catch (err) {
      console.log("Load profile failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const save = async () => {
    try {
      setSaving(true);
      await profileApi.updateMe(form);
      router.back();
    } catch (err) {
      console.log("Save failed:", err);
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* AVATAR */}
      <View style={styles.avatarWrapper}>
        <TouchableOpacity onPress={pickAvatar}>
          {form.avatarUrl ? (
            <Image source={{ uri: form.avatarUrl }} style={styles.avatarImg} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <User size={40} color="white" />
            </View>
          )}

          {/* icon camera overlay */}
          <View style={styles.cameraBtn}>
            {uploading ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Camera size={18} color="white" />
            )}
          </View>
        </TouchableOpacity>
      </View>

      {/* FORM */}
      <View style={styles.form}>
        <Text style={styles.label}>Full Name</Text>
        <TextInput
          style={styles.input}
          value={form.fullName}
          onChangeText={(v) => updateField("fullName", v)}
        />

        <Text style={styles.label}>Username</Text>
        <TextInput
          style={styles.input}
          value={form.username}
          onChangeText={(v) => updateField("username", v)}
        />

        <Text style={styles.label}>Daily Goal</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={form.dailyGoal}
          onChangeText={(v) => updateField("dailyGoal", v)}
          multiline
        />
      </View>

      {/* SAVE BUTTON */}
      <TouchableOpacity style={styles.saveBtn} onPress={save} disabled={saving}>
        {saving ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={styles.saveText}>Save Changes</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

/* ------------------- STYLES ------------------- */

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f172a", padding: 16 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
    alignItems: "center",
  },

  headerTitle: { color: "white", fontSize: 18, fontWeight: "600" },

  avatarWrapper: { alignItems: "center", marginBottom: 20 },

  avatarImg: {
    width: 110,
    height: 110,
    borderRadius: 55,
  },

  avatarPlaceholder: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: "#1e293b",
    justifyContent: "center",
    alignItems: "center",
  },

  cameraBtn: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#2563eb",
    padding: 8,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "#0f172a",
  },

  form: { gap: 10 },

  label: { color: "#94a3b8", fontSize: 14 },

  input: {
    backgroundColor: "#1e293b",
    padding: 12,
    borderRadius: 12,
    fontSize: 14,
    color: "white",
    borderWidth: 1,
    borderColor: "#334155",
  },

  textArea: {
    height: 80,
    textAlignVertical: "top",
  },

  saveBtn: {
    backgroundColor: "#3b82f6",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 20,
  },

  saveText: { color: "white", fontSize: 16, fontWeight: "600" },
});
