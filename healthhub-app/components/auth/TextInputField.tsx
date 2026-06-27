import React from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ViewStyle,
  TextStyle,
  KeyboardTypeOptions,
} from "react-native";
import { useColors, Radius, sf, sw } from "@/src/theme";

interface TextInputFieldProps {
  label: string;
  placeholder?: string;
  value: string;
  onChange: (text: string) => void;
  icon?: React.ReactNode;
  rightElement?: React.ReactNode;
  secureTextEntry?: boolean;
  keyboardType?: KeyboardTypeOptions;
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
}

export function TextInputField({
  label,
  placeholder,
  value,
  onChange,
  icon,
  rightElement,
  secureTextEntry,
  keyboardType,
  containerStyle,
  inputStyle,
}: TextInputFieldProps) {
  const colors = useColors();

  return (
    <View style={[styles.container, containerStyle]}>
      <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>

      <View style={[styles.inputWrapper, { backgroundColor: colors.bgSecondary, borderColor: colors.border }]}>
        {icon && <View style={styles.iconWrap}>{icon}</View>}
        <TextInput
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          value={value}
          onChangeText={onChange}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          style={[styles.input, { color: colors.textPrimary }, inputStyle]}
        />
        {rightElement && <View style={styles.rightWrap}>{rightElement}</View>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: sw(14),
  },
  label: {
    fontSize: sf(13),
    fontWeight: "600",
    marginBottom: sw(6),
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    paddingHorizontal: sw(14),
    paddingVertical: sw(12),
    borderRadius: Radius.lg,
    gap: sw(8),
  },
  iconWrap: {
    opacity: 0.7,
  },
  input: {
    flex: 1,
    fontSize: sf(15),
  },
  rightWrap: {
    paddingLeft: sw(4),
  },
});
