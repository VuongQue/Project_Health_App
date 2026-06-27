import React from 'react';
import { View, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { useColors, Radius, Spacing } from '@/src/theme';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
  activeOpacity?: number;
  variant?: 'default' | 'elevated' | 'outline';
}

export default function Card({ children, style, onPress, activeOpacity = 0.8, variant = 'default' }: CardProps) {
  const colors = useColors();

  const cardStyle = [
    styles.base,
    { backgroundColor: colors.bgCard, borderColor: colors.border },
    variant === 'elevated' && { backgroundColor: colors.bgCardElevated, borderColor: colors.borderLight },
    variant === 'outline'  && { backgroundColor: 'transparent', borderColor: colors.borderLight },
    style,
  ];

  if (onPress) {
    return (
      <TouchableOpacity style={cardStyle} onPress={onPress} activeOpacity={activeOpacity}>
        {children}
      </TouchableOpacity>
    );
  }
  return <View style={cardStyle}>{children}</View>;
}

const styles = StyleSheet.create({
  base: {
    borderRadius: Radius.lg,
    padding: Spacing.base,
    borderWidth: 1,
    // shadow kept here as it's purely decorative/layout
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
});
