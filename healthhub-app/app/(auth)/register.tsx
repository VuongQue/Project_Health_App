import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { User, Mail, Lock, CheckSquare, Square } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";

import authApi from "@/src/api/authApi";
import { PrimaryButton } from "@/components/auth/PrimaryButton";
import { TextInputField } from "@/components/auth/TextInputField";
import { SocialButton } from "@/components/auth/SocialButton";

export default function RegisterScreen() {
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreed, setAgreed] = useState(false);

  const handleRegister = async () => {
    if (!fullName || !email || !password || !confirmPassword) {
      alert("Please fill all fields");
      return;
    }
    if (password !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }
    if (!agreed) {
      alert("You must agree to terms");
      return;
    }

    try {
      const res = await authApi.register({
        fullName,
        email,
        password,
      });

      alert("OTP sent to your email!");

      // Điều hướng sang màn hình nhập OTP
      router.push({
        pathname: "/(auth)/otpScreen" as any,
        params: { email },
      });
    } catch (err: any) {
      alert(err.response?.data?.message || "Register failed");
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <LinearGradient
        colors={[
          "rgba(37,99,235,0.25)",
          "rgba(147,51,234,0.15)",
          "transparent",
        ]}
        style={styles.gradient}
      />

      <View style={styles.inner}>
        <Text style={styles.title}>Create Your Account</Text>
        <Text style={styles.subtitle}>
          Track your fitness, mood, and progress.
        </Text>

        <TextInputField
          label="Full Name"
          placeholder="Nguyen Van A"
          value={fullName}
          onChange={setFullName}
          icon={<User color="#94a3b8" size={20} />}
        />

        <TextInputField
          label="Email Address"
          placeholder="your@email.com"
          value={email}
          onChange={setEmail}
          icon={<Mail color="#94a3b8" size={20} />}
          keyboardType="email-address"
        />

        <TextInputField
          label="Password"
          placeholder="Create password"
          value={password}
          onChange={setPassword}
          icon={<Lock color="#94a3b8" size={20} />}
          secureTextEntry
        />

        <TextInputField
          label="Confirm Password"
          placeholder="Re-enter password"
          value={confirmPassword}
          onChange={setConfirmPassword}
          icon={<Lock color="#94a3b8" size={20} />}
          secureTextEntry
        />

        <TouchableOpacity
          style={styles.termsRow}
          onPress={() => setAgreed(!agreed)}
        >
          {agreed ? (
            <CheckSquare size={22} color="#2563eb" />
          ) : (
            <Square size={22} color="#64748b" />
          )}
          <Text style={styles.termsText}>
            I agree to the{" "}
            <Text style={styles.termsLink}>Terms & Privacy Policy</Text>
          </Text>
        </TouchableOpacity>

        <PrimaryButton onPress={handleRegister}>Sign Up</PrimaryButton>

        <View style={styles.dividerRow}>
          <View style={styles.divider} />
          <Text style={styles.dividerText}>or continue with</Text>
          <View style={styles.divider} />
        </View>

        

        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => router.push("/login")}>
            <Text style={styles.footerLink}>Sign in</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: "#0f172a", padding: 20 },
  gradient: { position: "absolute", top: 0, height: 260, right: 0, left: 0 },
  inner: { zIndex: 1 },
  title: { color: "white", fontSize: 26, fontWeight: "bold", marginBottom: 6 },
  subtitle: { color: "#94a3b8", marginBottom: 20 },
  termsRow: { flexDirection: "row", alignItems: "center", marginVertical: 12 },
  termsText: { color: "#cbd5e1", marginLeft: 10, flex: 1 },
  termsLink: { color: "#2563eb" },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 26,
    gap: 10,
  },
  divider: { flex: 1, height: 1, backgroundColor: "#334155" },
  dividerText: { color: "#64748b", fontSize: 13 },
  socialRow: { flexDirection: "row", gap: 10 },
  footer: { flexDirection: "row", justifyContent: "center", marginTop: 20 },
  footerText: { color: "#94a3b8" },
  footerLink: { color: "#2563eb", fontWeight: "600" },
});
