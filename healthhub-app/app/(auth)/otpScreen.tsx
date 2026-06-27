import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import authApi from "@/src/api/authApi";
import { useColors, Colors, Radius, Spacing, Shadow, sw, sf } from "@/src/theme";

const RESEND_COOLDOWN = 60;

export default function OtpScreen() {
  const router = useRouter();
  const { email } = useLocalSearchParams();
  const colors = useColors();

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const inputs = useRef<Array<TextInput | null>>([]);
  const [cooldown, setCooldown] = useState(0);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startCooldown = () => {
    setCooldown(RESEND_COOLDOWN);
    cooldownRef.current = setInterval(() => {
      setCooldown((s) => {
        if (s <= 1) { clearInterval(cooldownRef.current!); return 0; }
        return s - 1;
      });
    }, 1000);
  };

  useEffect(() => () => { if (cooldownRef.current) clearInterval(cooldownRef.current); }, []);

  const handleChange = (value: string, index: number) => {
    const digit = value.slice(-1);
    if (!/^\d*$/.test(digit)) return;
    const updated = [...otp];
    updated[index] = digit;
    setOtp(updated);
    if (digit && index < 5) inputs.current[index + 1]?.focus();
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === "Backspace" && otp[index] === "" && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const otpCode = otp.join("").trim();
    if (otp.some((d) => d === "")) {
      alert("Vui lòng nhập đủ 6 chữ số.");
      return;
    }
    try {
      await authApi.verifyOtp({ email: String(email), otp: otpCode });
      alert("Xác minh thành công!");
      router.replace("/(auth)/login" as any);
    } catch (err: any) {
      alert(err.response?.data?.message || "Mã OTP không hợp lệ");
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bgPrimary }]}>
      {/* Logo */}
      <LinearGradient colors={Colors.gradientPrimary} style={styles.logoBox}>
        <Text style={styles.logoEmoji}>💪</Text>
      </LinearGradient>

      <Text style={[styles.title, { color: colors.textPrimary }]}>Xác minh Email</Text>
      <Text style={[styles.subtitle, { color: colors.textMuted }]}>
        Mã 6 chữ số đã được gửi đến
      </Text>
      <Text style={[styles.emailText, { color: colors.primary }]}>{email}</Text>

      {/* OTP inputs */}
      <View style={[styles.card, { backgroundColor: colors.bgCard, borderColor: colors.border }, Shadow.md]}>
        <View style={styles.otpContainer}>
          {otp.map((digit, index) => (
            <TextInput
              key={index}
              ref={(ref: TextInput | null) => { inputs.current[index] = ref; }}
              style={[
                styles.otpInput,
                {
                  backgroundColor: colors.bgSecondary,
                  borderColor: digit ? colors.primary : colors.border,
                  color: colors.textPrimary,
                },
                digit && styles.otpFilled,
              ]}
              value={digit}
              onChangeText={(v) => handleChange(v, index)}
              onKeyPress={(e) => handleKeyPress(e, index)}
              keyboardType="numeric"
              maxLength={1}
            />
          ))}
        </View>

        {/* Verify button */}
        <TouchableOpacity onPress={handleVerify} activeOpacity={0.85} style={{ borderRadius: Radius.xl, overflow: "hidden" }}>
          <LinearGradient
            colors={Colors.gradientPrimary}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={styles.verifyBtn}
          >
            <Text style={styles.verifyBtnText}>Xác minh</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Resend */}
        <TouchableOpacity
          style={[styles.resendBtn, cooldown > 0 && { opacity: 0.4 }]}
          disabled={cooldown > 0}
          onPress={async () => {
            try {
              await authApi.resendOtp(String(email));
              startCooldown();
              alert("OTP mới đã được gửi đến email của bạn.");
            } catch (err: any) {
              alert(err.response?.data?.message || "Không thể gửi lại OTP");
            }
          }}
        >
          <Text style={[styles.resendText, { color: colors.primary }]}>
            {cooldown > 0 ? `Gửi lại sau ${cooldown}s` : "Gửi lại OTP"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Spacing.base,
    justifyContent: "center",
    alignItems: "center",
  },
  logoBox: {
    width: sw(68),
    height: sw(68),
    borderRadius: sw(20),
    justifyContent: "center",
    alignItems: "center",
    marginBottom: sw(20),
  },
  logoEmoji: { fontSize: sf(32) },
  title: {
    fontSize: sf(26),
    fontWeight: "800",
    marginBottom: sw(6),
  },
  subtitle: {
    fontSize: sf(14),
    marginBottom: sw(4),
  },
  emailText: {
    fontSize: sf(14),
    fontWeight: "700",
    marginBottom: sw(28),
  },
  card: {
    width: "100%",
    borderRadius: Radius.xxl,
    padding: Spacing.xl,
    borderWidth: 1,
  },
  otpContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: sw(24),
  },
  otpInput: {
    width: sw(46),
    height: sw(56),
    borderRadius: Radius.lg,
    textAlign: "center",
    fontSize: sf(24),
    fontWeight: "700",
    borderWidth: 1.5,
  },
  otpFilled: {
    shadowColor: "#3B82F6",
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 2,
  },
  verifyBtn: {
    paddingVertical: sw(14),
    alignItems: "center",
    borderRadius: Radius.xl,
  },
  verifyBtnText: {
    color: "white",
    fontSize: sf(15),
    fontWeight: "700",
  },
  resendBtn: { marginTop: sw(16), alignItems: "center" },
  resendText: { fontSize: sf(14), fontWeight: "600" },
});
