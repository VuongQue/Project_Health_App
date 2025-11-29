import React from "react";
import { TouchableOpacity, Text, StyleSheet } from "react-native";

interface SocialButtonProps {
  provider: "google" | "facebook" | "apple";
  onPress?: () => void;
}

export function SocialButton({ provider, onPress }: SocialButtonProps) {
  const icons: Record<string, string> = {
    google: "🟦",
    facebook: "📘",
    apple: "",
  };

  const label = provider.charAt(0).toUpperCase() + provider.slice(1);

  return (
    <TouchableOpacity style={styles.button} onPress={onPress}>
      <Text style={styles.icon}>{icons[provider]}</Text>
      <Text style={styles.text}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "#1e293b",
    borderWidth: 1,
    borderColor: "#334155",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  icon: {
    fontSize: 16,
    color: "white",
  },
  text: {
    color: "white",
    fontSize: 14,
  },
});
