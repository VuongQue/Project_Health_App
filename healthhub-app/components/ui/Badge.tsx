import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useColors, Radius } from '@/src/theme';

type BadgeVariant = 'primary' | 'success' | 'warning' | 'danger' | 'purple' | 'teal' | 'default';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  icon?: React.ReactNode;
  size?: 'sm' | 'md';
}

export default function Badge({ label, variant = 'default', icon, size = 'md' }: BadgeProps) {
  const colors = useColors();
  const isSmall = size === 'sm';

  const VARIANT_STYLES: Record<BadgeVariant, { bg: string; color: string }> = {
    primary: { bg: colors.primaryBg, color: colors.primary },
    success: { bg: colors.successBg, color: colors.success },
    warning: { bg: colors.warningBg, color: colors.warning },
    danger:  { bg: colors.dangerBg,  color: colors.danger },
    purple:  { bg: colors.purpleBg,  color: colors.purple },
    teal:    { bg: colors.tealBg,    color: colors.teal },
    default: { bg: colors.bgCard,    color: colors.textSecondary },
  };

  const { bg, color } = VARIANT_STYLES[variant];

  return (
    <View style={[styles.badge, { backgroundColor: bg }, isSmall && styles.badgeSm]}>
      {icon && <View style={{ marginRight: 3 }}>{icon}</View>}
      <Text style={[styles.text, { color }, isSmall && styles.textSm]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
    alignSelf: 'flex-start',
  },
  badgeSm: { paddingHorizontal: 7, paddingVertical: 2 },
  text: { fontSize: 12, fontWeight: '600' },
  textSm: { fontSize: 10 },
});
