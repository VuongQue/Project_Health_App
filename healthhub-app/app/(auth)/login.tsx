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
import { Mail, Lock } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";

import { PrimaryButton } from "@/components/auth/PrimaryButton";
import { TextInputField } from "@/components/auth/TextInputField";
import { SocialButton } from "@/components/auth/SocialButton";
import authApi from "@/src/api/authApi";
import { saveToken } from "@/src/utils/tokenStorage";
import { getToken } from "@/src/utils/tokenStorage";

export default function LoginScreen() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    console.log("EMAIL:", email);
    console.log("PASSWORD:", password);

    if (!email || !password) {
      Alert.alert("⚠️ Warning", "Please enter both email and password.");
      return;
    }

    setLoading(true);
    try {
      const res = await authApi.login({ email, password });
      console.log("SERVER RESPONSE:", res.data);

      const { accessToken, refreshToken } = res.data;

      if (!accessToken) {
        throw new Error("No token received from server");
      }

      // Save access token
      await saveToken(accessToken);

      Alert.alert("✅ Success", "Login successful!");
      router.replace("(tabs)/(personal)" as any);
    } catch (err: any) {
      console.log("❌ Login error:", err.response?.data || err.message);

      const message =
        err.response?.data?.message || "Invalid email or password";

      Alert.alert("Login failed", message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Background gradient */}
      <LinearGradient
        colors={["rgba(37,99,235,0.2)", "rgba(147,51,234,0.15)", "transparent"]}
        style={styles.gradient}
      />

      <View style={styles.inner}>
        {/* Header */}
        <Text style={styles.title}>Welcome Back 👋</Text>
        <Text style={styles.subtitle}>Log in to continue your journey.</Text>

        {/* Email */}
        <TextInputField
          label="Email Address"
          placeholder="your@email.com"
          value={email}
          onChange={setEmail}
          icon={<Mail color="#94a3b8" size={20} />}
          keyboardType="email-address"
        />

        {/* Password */}
        <TextInputField
          label="Password"
          placeholder="Enter your password"
          value={password}
          onChange={setPassword}
          icon={<Lock color="#94a3b8" size={20} />}
          secureTextEntry
        />

        {/* Forgot password */}
        <View style={{ alignItems: "flex-end", marginBottom: 12 }}>
          <TouchableOpacity>
            <Text style={styles.link}>Forgot Password?</Text>
          </TouchableOpacity>
        </View>

        {/* Login Button */}
        <PrimaryButton onPress={handleLogin}>
          {loading ? <ActivityIndicator color="#fff" /> : "Sign In"}
        </PrimaryButton>

        {/* Divider */}
        <View style={styles.dividerRow}>
          <View style={styles.divider} />
          <Text style={styles.dividerText}>or continue with</Text>
          <View style={styles.divider} />
        </View>

        {/* Social logins */}
        <View style={styles.socialRow}>
          <SocialButton provider="google" />
          <SocialButton provider="facebook" />
          <SocialButton provider="apple" />
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => router.push("/(auth)/register")}>
            <Text style={styles.footerLink}>Sign up</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: "#0f172a", padding: 20 },
  gradient: {
    position: "absolute",
    top: 0,
    height: 260,
    left: 0,
    right: 0,
  },
  inner: { zIndex: 1 },
  title: { color: "white", fontSize: 26, fontWeight: "bold", marginBottom: 6 },
  subtitle: { color: "#94a3b8", marginBottom: 24 },
  link: { color: "#2563eb", fontSize: 13 },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 26,
    gap: 10,
  },
  divider: { flex: 1, height: 1, backgroundColor: "#334155" },
  dividerText: { color: "#64748b", fontSize: 13 },
  socialRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 24,
  },
  footer: { flexDirection: "row", justifyContent: "center" },
  footerText: { color: "#94a3b8", fontSize: 14 },
  footerLink: { color: "#2563eb", fontSize: 14, fontWeight: "600" },
});
