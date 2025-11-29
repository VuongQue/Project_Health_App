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

interface TextInputFieldProps {
  label: string;
  placeholder?: string;
  value: string;
  onChange: (text: string) => void;
  icon?: React.ReactNode;
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
  secureTextEntry,
  keyboardType,
  containerStyle,
  inputStyle,
}: TextInputFieldProps) {
  return (
    <View style={[styles.container, containerStyle]}>
      <Text style={styles.label}>{label}</Text>

      <View style={styles.inputWrapper}>
        {icon}
        <TextInput
          placeholder={placeholder}
          placeholderTextColor="#64748b"
          value={value}
          onChangeText={onChange}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          style={[styles.input, inputStyle]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    color: "#cbd5e1",
    fontSize: 14,
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1e293b",
    borderWidth: 1,
    borderColor: "#334155",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    gap: 8,
  },
  input: {
    flex: 1,
    color: "white",
    fontSize: 15,
  },
});
