import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useColors, Colors, Radius } from '@/src/theme';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'gradient';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps {
  onPress?: () => void;
  children: React.ReactNode;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
}

const SIZE_STYLES: Record<Size, { paddingVertical: number; paddingHorizontal: number; fontSize: number }> = {
  sm: { paddingVertical: 8,  paddingHorizontal: 14, fontSize: 13 },
  md: { paddingVertical: 12, paddingHorizontal: 20, fontSize: 14 },
  lg: { paddingVertical: 15, paddingHorizontal: 24, fontSize: 15 },
};

export default function Button({
  onPress,
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  iconRight,
  style,
  textStyle,
  fullWidth = false,
}: ButtonProps) {
  const colors = useColors();
  const sizeStyle = SIZE_STYLES[size];
  const isDisabled = disabled || loading;

  const inner = (
    <View style={[styles.inner, icon && styles.innerWithIcon]}>
      {icon && !loading && <View style={styles.iconLeft}>{icon}</View>}
      {loading ? (
        <ActivityIndicator color={variant === 'secondary' || variant === 'ghost' ? colors.primary : 'white'} size="small" />
      ) : (
        <Text style={[
          styles.text,
          { fontSize: sizeStyle.fontSize },
          variant === 'secondary' && { color: colors.textSecondary },
          variant === 'ghost'     && { color: colors.primary },
          variant === 'danger'    && { color: colors.danger },
          isDisabled              && { color: colors.textDisabled },
          textStyle,
        ]}>
          {children}
        </Text>
      )}
      {iconRight && !loading && <View style={styles.iconRight}>{iconRight}</View>}
    </View>
  );

  if (variant === 'gradient' && !isDisabled) {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={isDisabled}
        activeOpacity={0.8}
        style={[fullWidth && styles.fullWidth, style]}
      >
        <LinearGradient
          colors={Colors.gradientPrimary}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          style={[styles.base, { paddingVertical: sizeStyle.paddingVertical, paddingHorizontal: sizeStyle.paddingHorizontal }]}
        >
          {inner}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.75}
      style={[
        styles.base,
        { paddingVertical: sizeStyle.paddingVertical, paddingHorizontal: sizeStyle.paddingHorizontal },
        variant === 'primary'  && { backgroundColor: Colors.primaryDark },
        variant === 'gradient' && { backgroundColor: Colors.primaryDark },
        variant === 'secondary' && { backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border },
        variant === 'ghost'    && styles.ghost,
        variant === 'danger'   && { backgroundColor: Colors.dangerBg, borderWidth: 1, borderColor: Colors.danger },
        isDisabled && styles.disabled,
        fullWidth && styles.fullWidth,
        style,
      ]}
    >
      {inner}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullWidth: { width: '100%' },
  ghost: { backgroundColor: 'transparent' },
  disabled: { opacity: 0.45 },

  inner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  innerWithIcon: { gap: 8 },
  iconLeft: {},
  iconRight: {},

  text: { color: 'white', fontWeight: '600' },
});
