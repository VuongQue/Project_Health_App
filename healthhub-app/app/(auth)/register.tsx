import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { User, Mail, Lock, Eye, EyeOff, CheckSquare, Square } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";

import authApi from "@/src/api/authApi";
import { TextInputField } from "@/components/auth/TextInputField";
import { useColors, Colors, Radius, Spacing, Shadow, sw, sf, SCREEN_W } from "@/src/theme";
import { useTheme } from "@/src/context/ThemeContext";
import { openGoogleLogin } from "@/src/utils/googleAuth";

export default function RegisterScreen() {
  const router = useRouter();
  const colors = useColors();
  const { isDark } = useTheme();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleRegister = async () => {
    setError("");
    if (!fullName.trim()) { setError("Vui lòng nhập họ tên"); return; }
    if (!email.trim()) { setError("Vui lòng nhập email"); return; }
    if (!password) { setError("Vui lòng nhập mật khẩu"); return; }
    if (password !== confirmPassword) { setError("Mật khẩu không khớp"); return; }
    if (!agreed) { setError("Bạn phải đồng ý với điều khoản"); return; }

    setLoading(true);
    try {
      await authApi.register({ fullName: fullName.trim(), email: email.trim(), password });
      router.push({ pathname: "/(auth)/otpScreen" as any, params: { email: email.trim() } });
    } catch (err: any) {
      setError(err.response?.data?.message || "Đăng ký thất bại");
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
      {/* Light blobs */}
      {!isDark && (
        <>
          <View style={styles.blob1} pointerEvents="none" />
          <View style={styles.blob2} pointerEvents="none" />
        </>
      )}

      <View style={styles.inner}>
        {/* Brand */}
        <View style={styles.brandWrap}>
          <LinearGradient colors={Colors.gradientPrimary} style={styles.logoBox}>
            <Text style={styles.logoEmoji}>💪</Text>
          </LinearGradient>
          <Text style={[styles.brandName, { color: colors.textPrimary }]}>HealthHub</Text>
        </View>

        {/* Card */}
        <View style={[styles.card, { backgroundColor: colors.bgCard, borderColor: colors.border }, isDark ? {} : Shadow.md]}>
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Tạo tài khoản</Text>
          <Text style={[styles.cardSub, { color: colors.textMuted }]}>
            Theo dõi sức khỏe, tâm trạng và tiến trình của bạn
          </Text>

          {!!error && (
            <View style={[styles.errorBox, { backgroundColor: colors.dangerBg, borderColor: colors.danger + "40" }]}>
              <Text style={[styles.errorText, { color: colors.danger }]}>{error}</Text>
            </View>
          )}

          <TextInputField
            label="Họ và tên"
            placeholder="Nguyễn Văn A"
            value={fullName}
            onChange={(v) => { setFullName(v); if (error) setError(""); }}
            icon={<User color={colors.textMuted} size={17} />}
          />

          <TextInputField
            label="Email"
            placeholder="your@email.com"
            value={email}
            onChange={(v) => { setEmail(v); if (error) setError(""); }}
            icon={<Mail color={colors.textMuted} size={17} />}
            keyboardType="email-address"
          />

          <TextInputField
            label="Mật khẩu"
            placeholder="Tạo mật khẩu"
            value={password}
            onChange={(v) => { setPassword(v); if (error) setError(""); }}
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
            placeholder="Nhập lại mật khẩu"
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

          {/* Terms */}
          <TouchableOpacity style={styles.termsRow} onPress={() => setAgreed(!agreed)} activeOpacity={0.7}>
            {agreed
              ? <CheckSquare size={20} color={colors.primary} />
              : <Square size={20} color={colors.textMuted} />}
            <Text style={[styles.termsText, { color: colors.textSecondary }]}>
              Tôi đồng ý với{" "}
              <Text style={[styles.termsLink, { color: colors.primary }]}>Điều khoản & Chính sách</Text>
            </Text>
          </TouchableOpacity>

          {/* Sign Up button */}
          <TouchableOpacity
            onPress={handleRegister}
            disabled={loading}
            activeOpacity={0.85}
            style={{ borderRadius: Radius.xl, overflow: "hidden" }}
          >
            <LinearGradient
              colors={Colors.gradientPrimary}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={[styles.signUpBtn, loading && { opacity: 0.65 }]}
            >
              {loading
                ? <ActivityIndicator color="white" size="small" />
                : <Text style={styles.signUpBtnText}>Đăng ký</Text>}
            </LinearGradient>
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
            <Text style={[styles.dividerText, { color: colors.textMuted }]}>hoặc</Text>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
          </View>

          {/* Google */}
          <TouchableOpacity
            style={[styles.googleBtn, { borderColor: colors.border, backgroundColor: colors.bgSecondary }]}
            activeOpacity={0.8}
            onPress={openGoogleLogin}
          >
            <Text style={styles.googleG}>G</Text>
            <Text style={[styles.googleText, { color: colors.textSecondary }]}>Tiếp tục với Google</Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.textSecondary }]}>Đã có tài khoản? </Text>
          <TouchableOpacity onPress={() => router.push("/(auth)/login" as any)}>
            <Text style={[styles.footerLink, { color: colors.primary }]}>Đăng nhập</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1 },
  blob1: { position: "absolute", top: -sw(40), right: -sw(60), width: SCREEN_W * 0.6, height: SCREEN_W * 0.6, borderRadius: SCREEN_W * 0.3, backgroundColor: "rgba(59,130,246,0.07)" },
  blob2: { position: "absolute", bottom: sw(80), left: -sw(80), width: SCREEN_W * 0.7, height: SCREEN_W * 0.7, borderRadius: SCREEN_W * 0.35, backgroundColor: "rgba(99,102,241,0.05)" },

  inner: { flex: 1, paddingHorizontal: Spacing.base, paddingTop: sw(60), paddingBottom: sw(40) },

  brandWrap: { alignItems: "center", marginBottom: Spacing.xl },
  logoBox: { width: sw(64), height: sw(64), borderRadius: sw(20), justifyContent: "center", alignItems: "center", marginBottom: sw(12) },
  logoEmoji: { fontSize: sf(32) },
  brandName: { fontSize: sf(28), fontWeight: "800", letterSpacing: -0.5 },

  card: { borderRadius: Radius.xxl, padding: Spacing.xl, borderWidth: 1 },
  cardTitle: { fontSize: sf(22), fontWeight: "800", marginBottom: sw(4) },
  cardSub: { fontSize: sf(13), marginBottom: Spacing.lg },

  errorBox: { borderRadius: Radius.md, padding: sw(10), marginBottom: sw(12), borderWidth: 1 },
  errorText: { fontSize: sf(13) },

  termsRow: { flexDirection: "row", alignItems: "center", marginTop: sw(4), marginBottom: sw(16), gap: sw(8) },
  termsText: { fontSize: sf(13), flex: 1 },
  termsLink: { fontWeight: "600" },

  signUpBtn: { paddingVertical: sw(15), alignItems: "center", borderRadius: Radius.xl },
  signUpBtnText: { color: "white", fontSize: sf(15), fontWeight: "700", letterSpacing: 0.3 },

  divider: { flexDirection: "row", alignItems: "center", marginVertical: sw(18), gap: sw(10) },
  dividerLine: { flex: 1, height: 1 },
  dividerText: { fontSize: sf(12) },

  googleBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: sw(10), borderWidth: 1, borderRadius: Radius.xl, paddingVertical: sw(13) },
  googleG: { color: "#4285f4", fontSize: sf(17), fontWeight: "800" },
  googleText: { fontSize: sf(14), fontWeight: "600" },

  footer: { flexDirection: "row", justifyContent: "center", marginTop: Spacing.xl },
  footerText: { fontSize: sf(14) },
  footerLink: { fontSize: sf(14), fontWeight: "700" },
});
