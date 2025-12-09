import React, { useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import authApi from "@/src/api/authApi";

export default function OtpScreen() {
  const router = useRouter();
  const { email } = useLocalSearchParams();

  console.log("📩 EMAIL PARAM RECEIVED:", email);

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const inputs = useRef<Array<TextInput | null>>([]);

  // ==============================
  // HANDLE INPUT CHANGE
  // ==============================
  const handleChange = (value: string, index: number) => {
    // Chỉ lấy 1 ký tự cuối cùng
    const digit = value.slice(-1);

    if (!/^\d*$/.test(digit)) return;

    const updated = [...otp];
    updated[index] = digit;
    setOtp(updated);

    if (digit && index < 5) {
      inputs.current[index + 1]?.focus();
    }
  };

  // ==============================
  // HANDLE BACKSPACE
  // ==============================
  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === "Backspace" && otp[index] === "" && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  // ==============================
  // VERIFY OTP
  // ==============================
  const handleVerify = async () => {
    const otpCode = otp.join("").trim();

    console.log("🔢 OTP ARRAY:", otp);
    console.log("🔢 OTP JOIN:", otpCode);

    if (otp.some((d) => d === "")) {
      alert("Please enter all 6 digits.");
      return;
    }

    try {
      const res = await authApi.verifyOtp({
        email: String(email),
        otp: otpCode,
      });

      console.log("✅ VERIFY RESPONSE:", res);

      alert("Verification successful!");
      router.replace("/(auth)/login" as any);
    } catch (err: any) {
      console.log("❌ VERIFY ERROR:", err.response?.data);
      alert(err.response?.data?.message || "Invalid OTP");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Enter OTP</Text>
      <Text style={styles.subtitle}>A 6-digit code was sent to</Text>
      <Text style={styles.email}>{email}</Text>

      {/* OTP INPUTS */}
      <View style={styles.otpContainer}>
        {otp.map((digit, index) => (
          <TextInput
            key={index}
            ref={(ref: TextInput | null) => {
                    inputs.current[index] = ref;
                }}


            style={[styles.otpInput, digit ? styles.otpFilled : null]}
            value={digit}
            onChangeText={(v) => handleChange(v, index)}
            onKeyPress={(e) => handleKeyPress(e, index)}
            keyboardType="numeric"   // FIX BUG number-pad
            maxLength={1}
          />
        ))}
      </View>

      {/* VERIFY BUTTON */}
      <TouchableOpacity style={styles.button} onPress={handleVerify}>
        <Text style={styles.buttonText}>Verify</Text>
      </TouchableOpacity>

      {/* RESEND */}
      <TouchableOpacity style={styles.resendBtn}>
        <Text style={styles.resendText}>Resend OTP</Text>
      </TouchableOpacity>
    </View>
  );
}

// ==============================
// STYLES
// ==============================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f172a",
    padding: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    color: "white",
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 6,
  },
  subtitle: {
    color: "#94a3b8",
    marginBottom: 4,
  },
  email: {
    color: "#38bdf8",
    fontWeight: "600",
    marginBottom: 30,
  },
  otpContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "90%",
  },
  otpInput: {
    width: 55,
    height: 65,
    borderRadius: 12,
    backgroundColor: "#1e293b",
    textAlign: "center",
    fontSize: 28,
    color: "white",
    borderWidth: 2,
    borderColor: "#334155",
  },
  otpFilled: {
    borderColor: "#3b82f6",
    shadowColor: "#3b82f6",
    shadowOpacity: 0.4,
    shadowRadius: 6,
  },
  button: {
    backgroundColor: "#2563eb",
    paddingVertical: 14,
    paddingHorizontal: 100,
    borderRadius: 12,
    marginTop: 40,
  },
  buttonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  resendBtn: { marginTop: 20 },
  resendText: { color: "#38bdf8", fontSize: 15 },
});
