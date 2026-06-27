import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { useColors, Radius, Spacing } from '@/src/theme';

interface StatCardProps {
  icon: React.ReactNode;
  iconBg: string;
  label: string;
  value: string | number;
  sub?: string;
  trend?: { value: number; positive?: boolean };
  onPress?: () => void;
}

export default function StatCard({ icon, iconBg, label, value, sub, trend, onPress }: StatCardProps) {
  const colors = useColors();

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.bgCard, borderColor: colors.border }]}
      onPress={onPress}
      activeOpacity={onPress ? 0.75 : 1}
      disabled={!onPress}
    >
      <View style={[styles.iconWrap, { backgroundColor: iconBg }]}>{icon}</View>
      <Text style={[styles.label, { color: colors.textMuted }]} numberOfLines={1}>{label}</Text>
      <Text style={[styles.value, { color: colors.textPrimary }]} numberOfLines={1}>{value}</Text>
      {sub && <Text style={[styles.sub, { color: colors.textSecondary }]} numberOfLines={1}>{sub}</Text>}
      {trend && (
        <View style={styles.trendRow}>
          <Text style={[styles.trend, { color: trend.positive ? colors.success : colors.danger }]}>
            {trend.positive ? '▲' : '▼'} {Math.abs(trend.value)}%
          </Text>
        </View>
      )}
      {onPress && (
        <View style={styles.chevron}>
          <ChevronRight size={12} color={colors.textMuted} />
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: '45%',
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    position: 'relative',
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  label: { fontSize: 11, fontWeight: '500', marginBottom: 2 },
  value: { fontSize: 20, fontWeight: '700', marginBottom: 2 },
  sub: { fontSize: 11 },
  trendRow: { flexDirection: 'row', marginTop: 4 },
  trend: { fontSize: 11, fontWeight: '600' },
  chevron: { position: 'absolute', top: 10, right: 10 },
});
