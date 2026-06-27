import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Mail, ArrowLeft } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { TextInputField } from "@/components/auth/TextInputField";
import { PrimaryButton } from "@/components/auth/PrimaryButton";
import authApi from "@/src/api/authApi";
import { useColors, Colors, Radius, Spacing, Shadow, sw, sf, SCREEN_W } from "@/src/theme";
import { useTheme } from "@/src/context/ThemeContext";

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const colors = useColors();
  const { isDark } = useTheme();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSend = async () => {
    setError("");
    if (!email.trim()) { setError("Vui lòng nhập email của bạn."); return; }
    setLoading(true);
    try {
      await authApi.forgotPassword(email.trim());
      Alert.alert("Đã gửi OTP", "Kiểm tra email để lấy mã OTP.", [
        { text: "Tiếp tục", onPress: () => router.push({ pathname: "/(auth)/reset-password" as any, params: { email: email.trim() } }) },
      ]);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Không thể gửi OTP.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      contentContainerStyle={[styles.container, { backgroundColor: colors.bgPrimary }]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {!isDark && <View style={styles.blob} />}

      <View style={styles.inner}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <ArrowLeft size={20} color={colors.textSecondary} />
          <Text style={[styles.backText, { color: colors.textSecondary }]}>Quay lại</Text>
        </TouchableOpacity>

        {/* Icon */}
        <View style={styles.iconWrap}>
          <LinearGradient colors={Colors.gradientPrimary} style={styles.iconBox}>
            <Text style={styles.iconEmoji}>🔑</Text>
          </LinearGradient>
        </View>

        <View style={[styles.card, { backgroundColor: colors.bgCard, borderColor: colors.border }, isDark ? {} : Shadow.md]}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>Quên mật khẩu</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            Nhập email và chúng tôi sẽ gửi mã OTP để đặt lại mật khẩu.
          </Text>

          <TextInputField
            label="Email"
            placeholder="your@email.com"
            value={email}
            onChange={(v) => { setEmail(v); if (error) setError(""); }}
            icon={<Mail color={colors.textMuted} size={17} />}
            keyboardType="email-address"
          />

          {!!error && (
            <View style={[styles.errorBox, { backgroundColor: colors.dangerBg, borderColor: colors.danger + "40" }]}>
              <Text style={[styles.errorText, { color: colors.danger }]}>{error}</Text>
            </View>
          )}

          <PrimaryButton onPress={handleSend} loading={loading}>
            Gửi OTP
          </PrimaryButton>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1 },
  blob: { position: "absolute", top: -sw(60), left: -sw(60), width: SCREEN_W * 0.7, height: SCREEN_W * 0.7, borderRadius: SCREEN_W * 0.35, backgroundColor: "rgba(59,130,246,0.07)" },
  inner: { flex: 1, paddingHorizontal: Spacing.base, paddingTop: sw(56), paddingBottom: sw(40) },
  backBtn: { flexDirection: "row", alignItems: "center", gap: sw(6), marginBottom: sw(28) },
  backText: { fontSize: sf(14), fontWeight: "500" },
  iconWrap: { alignItems: "center", marginBottom: Spacing.xl },
  iconBox: { width: sw(64), height: sw(64), borderRadius: sw(20), justifyContent: "center", alignItems: "center" },
  iconEmoji: { fontSize: sf(30) },
  card: { borderRadius: Radius.xxl, padding: Spacing.xl, borderWidth: 1 },
  title: { fontSize: sf(22), fontWeight: "800", marginBottom: sw(6) },
  subtitle: { fontSize: sf(13), lineHeight: sf(20), marginBottom: Spacing.lg },
  errorBox: { borderRadius: Radius.md, padding: sw(10), marginBottom: sw(12), borderWidth: 1 },
  errorText: { fontSize: sf(13) },
});
