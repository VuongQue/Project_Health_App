import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useColors, Typography, Spacing, Radius } from '@/src/theme';
import Button from './Button';

interface EmptyStateProps {
  emoji?: string;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export default function EmptyState({ emoji = '📭', title, subtitle, actionLabel, onAction }: EmptyStateProps) {
  const colors = useColors();

  return (
    <View style={styles.container}>
      <View style={[styles.emojiWrap, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
        <Text style={styles.emoji}>{emoji}</Text>
      </View>
      <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text>
      {subtitle && <Text style={[styles.subtitle, { color: colors.textMuted }]}>{subtitle}</Text>}
      {actionLabel && onAction && (
        <Button onPress={onAction} size="md" style={styles.btn}>
          {actionLabel}
        </Button>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: Spacing.xxxl,
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  emojiWrap: {
    width: 72,
    height: 72,
    borderRadius: Radius.xxl,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.base,
  },
  emoji: { fontSize: 32 },
  title: {
    ...Typography.lg,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  subtitle: {
    ...Typography.base,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: Spacing.base,
  },
  btn: { marginTop: Spacing.sm, paddingHorizontal: Spacing.xl },
});
