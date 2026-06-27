import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useColors, Colors, Radius } from '@/src/theme';

interface ProgressBarProps {
  value: number;
  max?: number;        // defaults to 100; pct = (value/max)*100
  color?: string;
  height?: number;
  showLabel?: boolean;
  label?: string;
  style?: object;
}

export default function ProgressBar({
  value,
  max = 100,
  color = Colors.primary,
  height = 6,
  showLabel = false,
  label,
  style,
}: ProgressBarProps) {
  const colors = useColors();
  const pct = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <View style={style}>
      {(showLabel || label) && (
        <View style={styles.labelRow}>
          {label && <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>}
          {showLabel && <Text style={[styles.pct, { color }]}>{Math.round(pct)}%</Text>}
        </View>
      )}
      <View style={[styles.track, { height, backgroundColor: colors.border }]}>
        <View
          style={[
            styles.fill,
            { width: `${pct}%`, backgroundColor: color, height },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    borderRadius: Radius.full,
    overflow: 'hidden',
  },
  fill: {
    borderRadius: Radius.full,
    minWidth: 4,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  label: { fontSize: 12 },
  pct: { fontSize: 12, fontWeight: '600' },
});
