import React, { useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator,
} from "react-native";
import { Mail, Lock, Eye, EyeOff, AlertCircle } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";

import { TextInputField } from "@/components/auth/TextInputField";
import authApi from "@/src/api/authApi";
import { saveToken, getUserFromToken } from "@/src/utils/tokenStorage";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTranslation } from "react-i18next";
import { useColors, Colors, Radius, Spacing, Shadow, sw, sf, SCREEN_W, SCREEN_H } from "@/src/theme";
import { useTheme } from "@/src/context/ThemeContext";
import { openGoogleLogin } from "@/src/utils/googleAuth";

export default function LoginScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const colors = useColors();
  const { isDark } = useTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const extractMessage = (errOrRes: any) => {
    const data = errOrRes?.response?.data;
    if (typeof data?.message === "string") return data.message;
    if (Array.isArray(data?.message)) return data.message.join("\n");
    return t("auth.err_login_failed");
  };

  const handleLogin = async () => {
    setError("");
    if (!email.trim()) { setError(t("auth.err_empty_email")); return; }
    if (!password) { setError(t("auth.err_empty_password")); return; }
    setLoading(true);
    try {
      const res = await authApi.login({ email: email.trim(), password });
      const { accessToken } = res.data as any;
      if (!accessToken) { setError(res?.data?.message || t("auth.err_login_failed")); return; }
      await saveToken(accessToken);
      const saved = await AsyncStorage.getItem("auth_token");
      if (!saved) { setError(t("auth.err_save_session")); return; }
      const userInfo = await getUserFromToken();
      const genericSeen = await AsyncStorage.getItem("hasSeenOnboarding");
      const userSeen = userInfo?.id ? await AsyncStorage.getItem(`hasSeenOnboarding_${userInfo.id}`) : null;
      const seen = userSeen || genericSeen;
      router.replace(seen ? "/(tabs)/(personal)" : "/onboarding" as any);
    } catch (err: any) {
      setError(extractMessage(err));
    } finally { setLoading(false); }
  };

  return (
    <ScrollView
      contentContainerStyle={[styles.container, { backgroundColor: colors.bgPrimary }]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {/* Light decorative blobs */}
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
          <Text style={[styles.brandSub, { color: colors.textMuted }]}>{t("auth.app_tagline")}</Text>
        </View>

        {/* Card */}
        <View style={[styles.card, { backgroundColor: colors.bgCard, borderColor: colors.border }, isDark ? {} : Shadow.md]}>
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>{t("auth.login_title")}</Text>
          <Text style={[styles.cardSub, { color: colors.textMuted }]}>{t("auth.login_subtitle")}</Text>

          <View style={styles.fields}>
            <TextInputField
              label={t("auth.email_label")}
              placeholder={t("auth.email_placeholder")}
              value={email}
              onChange={(v: string) => { setEmail(v); if (error) setError(""); }}
              icon={<Mail color={colors.textMuted} size={17} />}
              keyboardType="email-address"
            />
            <TextInputField
              label={t("auth.password_label")}
              placeholder={t("auth.password_placeholder")}
              value={password}
              onChange={(v: string) => { setPassword(v); if (error) setError(""); }}
              icon={<Lock color={colors.textMuted} size={17} />}
              secureTextEntry={!showPw}
              rightElement={
                <TouchableOpacity onPress={() => setShowPw((p) => !p)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  {showPw ? <EyeOff size={17} color={colors.textMuted} /> : <Eye size={17} color={colors.textMuted} />}
                </TouchableOpacity>
              }
            />
          </View>

          {!!error && (
            <View style={styles.errorBox}>
              <AlertCircle size={14} color={Colors.danger} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <TouchableOpacity onPress={() => router.push("/(auth)/forgot-password" as any)} style={styles.forgotBtn}>
            <Text style={styles.forgotText}>{t("auth.forgot_password")}</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleLogin} disabled={loading} activeOpacity={0.85} style={{ borderRadius: Radius.xl, overflow: "hidden" }}>
            <LinearGradient colors={[Colors.primary, "#6366F1"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[styles.loginBtn, loading && { opacity: 0.65 }]}>
              {loading
                ? <ActivityIndicator color="white" size="small" />
                : <Text style={styles.loginBtnText}>{t("auth.login_button")}</Text>}
            </LinearGradient>
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
            <Text style={[styles.dividerText, { color: colors.textMuted }]}>{t("common.or")}</Text>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
          </View>

          <TouchableOpacity style={[styles.googleBtn, { borderColor: colors.border, backgroundColor: colors.bgSecondary }]} activeOpacity={0.8} onPress={openGoogleLogin}>
            <Text style={styles.googleG}>G</Text>
            <Text style={[styles.googleText, { color: colors.textSecondary }]}>{t("auth.google_button")}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.textSecondary }]}>{t("auth.no_account")}</Text>
          <TouchableOpacity onPress={() => router.push("/(auth)/register")}>
            <Text style={styles.footerLink}>{t("auth.register_link")}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, minHeight: "100%" },
  blob1: { position: "absolute", top: -sw(50), left: -sw(60), width: SCREEN_W * 0.65, height: SCREEN_W * 0.65, borderRadius: SCREEN_W * 0.325, backgroundColor: "rgba(59,130,246,0.07)" },
  blob2: { position: "absolute", bottom: SCREEN_H * 0.1, right: -sw(80), width: SCREEN_W * 0.75, height: SCREEN_W * 0.75, borderRadius: SCREEN_W * 0.375, backgroundColor: "rgba(99,102,241,0.05)" },

  inner: { flex: 1, paddingHorizontal: Spacing.base, paddingTop: sw(72), paddingBottom: sw(40) },

  brandWrap: { alignItems: "center", marginBottom: Spacing.xl },
  logoBox: { width: sw(72), height: sw(72), borderRadius: sw(22), justifyContent: "center", alignItems: "center", marginBottom: sw(14) },
  logoEmoji: { fontSize: sf(36) },
  brandName: { fontSize: sf(32), fontWeight: "800", letterSpacing: -0.5 },
  brandSub: { fontSize: sf(13), marginTop: sw(3) },

  card: {
    borderRadius: Radius.xxl, padding: Spacing.xl,
    borderWidth: 1,
  },
  cardTitle: { fontSize: sf(22), fontWeight: "800", marginBottom: 4 },
  cardSub: { fontSize: sf(13), marginBottom: Spacing.lg },
  fields: { gap: 4 },

  errorBox: {
    flexDirection: "row", alignItems: "center", gap: 7,
    backgroundColor: Colors.dangerBg,
    borderRadius: Radius.md, padding: sw(10), marginTop: sw(10),
    borderWidth: 1, borderColor: Colors.danger + "40",
  },
  errorText: { color: Colors.danger, fontSize: sf(13), flex: 1 },

  forgotBtn: { alignSelf: "flex-end", marginTop: sw(10), marginBottom: sw(16) },
  forgotText: { color: Colors.primary, fontSize: sf(13), fontWeight: "600" },

  loginBtn: { paddingVertical: sw(15), alignItems: "center", borderRadius: Radius.xl },
  loginBtnText: { color: "white", fontSize: sf(15), fontWeight: "700", letterSpacing: 0.3 },

  divider: { flexDirection: "row", alignItems: "center", marginVertical: sw(18), gap: sw(10) },
  dividerLine: { flex: 1, height: 1 },
  dividerText: { fontSize: sf(12) },

  googleBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: sw(10),
    borderWidth: 1,
    borderRadius: Radius.xl, paddingVertical: sw(13),
  },
  googleG: { color: "#4285f4", fontSize: sf(17), fontWeight: "800" },
  googleText: { fontSize: sf(14), fontWeight: "600" },

  footer: { flexDirection: "row", justifyContent: "center", marginTop: Spacing.xl },
  footerText: { fontSize: sf(14) },
  footerLink: { color: Colors.primary, fontSize: sf(14), fontWeight: "700" },
});
