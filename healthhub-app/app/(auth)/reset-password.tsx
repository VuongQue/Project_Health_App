import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import { Lock, KeyRound, Eye, EyeOff, ArrowLeft } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter, useLocalSearchParams } from "expo-router";
import { TextInputField } from "@/components/auth/TextInputField";
import { PrimaryButton } from "@/components/auth/PrimaryButton";
import authApi from "@/src/api/authApi";
import { useColors, Colors, Radius, Spacing, Shadow, sw, sf, SCREEN_W } from "@/src/theme";
import { useTheme } from "@/src/context/ThemeContext";

export default function ResetPasswordScreen() {
  const router = useRouter();
  const { email: paramEmail } = useLocalSearchParams<{ email: string }>();
  const colors = useColors();
  const { isDark } = useTheme();

  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleReset = async () => {
    setError("");
    if (!otp || !newPassword || !confirmPassword) { setError("Vui lòng điền đầy đủ thông tin."); return; }
    if (newPassword !== confirmPassword) { setError("Mật khẩu không khớp."); return; }
    if (newPassword.length < 6) { setError("Mật khẩu phải có ít nhất 6 ký tự."); return; }
    setLoading(true);
    try {
      await authApi.resetPassword({ email: paramEmail ?? "", otp, newPassword });
      Alert.alert("Thành công", "Mật khẩu đã được đặt lại. Vui lòng đăng nhập.", [
        { text: "Đăng nhập", onPress: () => router.replace("/(auth)/login" as any) },
      ]);
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      setError(Array.isArray(msg) ? msg.join("\n") : msg ?? "Đặt lại mật khẩu thất bại.");
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

        <View style={styles.iconWrap}>
          <LinearGradient colors={Colors.gradientPrimary} style={styles.iconBox}>
            <Text style={styles.iconEmoji}>🔐</Text>
          </LinearGradient>
        </View>

        <View style={[styles.card, { backgroundColor: colors.bgCard, borderColor: colors.border }, isDark ? {} : Shadow.md]}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>Đặt lại mật khẩu</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            Nhập mã OTP đã gửi đến {paramEmail} và chọn mật khẩu mới.
          </Text>

          <TextInputField
            label="Mã OTP"
            placeholder="6 chữ số"
            value={otp}
            onChange={(v) => { setOtp(v); if (error) setError(""); }}
            icon={<KeyRound color={colors.textMuted} size={17} />}
            keyboardType="number-pad"
          />

          <TextInputField
            label="Mật khẩu mới"
            placeholder="Ít nhất 6 ký tự"
            value={newPassword}
            onChange={(v) => { setNewPassword(v); if (error) setError(""); }}
            icon={<Lock color={colors.textMuted} size={17} />}
            secureTextEntry={!showPw}
            rightElement={
              <TouchableOpacity onPress={() => setShowPw(p => !p)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                {showPw ? <EyeOff size={17} color={colors.textMuted} /> : <Eye size={17} color={colors.textMuted} />}
              </TouchableOpacity>
            }
          />

          <TextInputField
            label="Xác nhận mật khẩu"
            placeholder="Nhập lại mật khẩu mới"
            value={confirmPassword}
            onChange={(v) => { setConfirmPassword(v); if (error) setError(""); }}
            icon={<Lock color={colors.textMuted} size={17} />}
            secureTextEntry={!showConfirmPw}
            rightElement={
              <TouchableOpacity onPress={() => setShowConfirmPw(p => !p)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                {showConfirmPw ? <EyeOff size={17} color={colors.textMuted} /> : <Eye size={17} color={colors.textMuted} />}
              </TouchableOpacity>
            }
          />

          {!!error && (
            <View style={[styles.errorBox, { backgroundColor: colors.dangerBg, borderColor: colors.danger + "40" }]}>
              <Text style={[styles.errorText, { color: colors.danger }]}>{error}</Text>
            </View>
          )}

          <PrimaryButton onPress={handleReset} loading={loading}>
            Đặt lại mật khẩu
          </PrimaryButton>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1 },
  blob: { position: "absolute", top: -sw(60), right: -sw(60), width: SCREEN_W * 0.7, height: SCREEN_W * 0.7, borderRadius: SCREEN_W * 0.35, backgroundColor: "rgba(59,130,246,0.07)" },
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
