import React from "react";
import { TouchableOpacity, Text, StyleSheet, ViewStyle, ActivityIndicator } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Colors, Radius, sw, sf } from "@/src/theme";

interface PrimaryButtonProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  loading?: boolean;
  disabled?: boolean;
}

export function PrimaryButton({ children, onPress, style, loading, disabled }: PrimaryButtonProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.85}
      style={[{ borderRadius: Radius.xl, overflow: "hidden" }, style]}
    >
      <LinearGradient
        colors={Colors.gradientPrimary}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
        style={[styles.btn, (disabled || loading) && { opacity: 0.65 }]}
      >
        {loading
          ? <ActivityIndicator color="white" size="small" />
          : <Text style={styles.text}>{children}</Text>}
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    paddingVertical: sw(15),
    alignItems: "center",
    justifyContent: "center",
    borderRadius: Radius.xl,
  },
  text: {
    color: "white",
    fontSize: sf(15),
    fontWeight: "700",
    letterSpacing: 0.3,
  },
});
