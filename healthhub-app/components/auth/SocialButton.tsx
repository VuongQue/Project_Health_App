import React from "react";
import { TouchableOpacity, Text, StyleSheet } from "react-native";
import { useColors, Radius, sw, sf } from "@/src/theme";

interface SocialButtonProps {
  provider: "google" | "facebook" | "apple";
  onPress?: () => void;
}

export function SocialButton({ provider, onPress }: SocialButtonProps) {
  const colors = useColors();

  const PROVIDERS: Record<string, { icon: string; label: string; iconColor: string }> = {
    google:   { icon: "G", label: "Google",   iconColor: "#4285f4" },
    facebook: { icon: "f", label: "Facebook", iconColor: "#1877f2" },
    apple:    { icon: "",  label: "Apple",    iconColor: colors.textPrimary },
  };

  const p = PROVIDERS[provider];

  return (
    <TouchableOpacity
      style={[styles.button, { backgroundColor: colors.bgSecondary, borderColor: colors.border }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Text style={[styles.icon, { color: p.iconColor }]}>{p.icon}</Text>
      <Text style={[styles.text, { color: colors.textSecondary }]}>{p.label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flex: 1,
    flexDirection: "row",
    borderWidth: 1,
    borderRadius: Radius.lg,
    paddingVertical: sw(12),
    alignItems: "center",
    justifyContent: "center",
    gap: sw(6),
  },
  icon: {
    fontSize: sf(16),
    fontWeight: "800",
  },
  text: {
    fontSize: sf(14),
    fontWeight: "600",
  },
});
