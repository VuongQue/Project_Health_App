import React from "react";
import { TouchableOpacity, Text, StyleSheet, ViewStyle } from "react-native";

interface PrimaryButtonProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
}

export function PrimaryButton({ children, onPress, style }: PrimaryButtonProps) {
  return (
    <TouchableOpacity onPress={onPress} style={[styles.button, style]}>
      <Text style={styles.text}>{children}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: "#2563eb",
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  text: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
});
