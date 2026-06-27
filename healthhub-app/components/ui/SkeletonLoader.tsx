import React, { useEffect, useRef } from 'react';
import { Animated, View, StyleSheet, ViewStyle } from 'react-native';
import { useColors, Radius } from '@/src/theme';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  radius?: number;
  style?: ViewStyle;
}

export function Skeleton({ width = '100%', height = 16, radius = Radius.sm, style }: SkeletonProps) {
  const colors = useColors();
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: 0, duration: 900, useNativeDriver: true }),
      ])
    ).start();
  }, [shimmer]);

  const opacity = shimmer.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0.65] });

  return (
    <Animated.View
      style={[
        { width: width as any, height, borderRadius: radius, backgroundColor: colors.bgCardElevated, opacity },
        style,
      ]}
    />
  );
}

export function CardSkeleton() {
  const colors = useColors();
  return (
    <View style={[skStyles.card, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
      <View style={skStyles.row}>
        <Skeleton width={40} height={40} radius={20} />
        <View style={{ flex: 1, gap: 6 }}>
          <Skeleton width="60%" height={14} />
          <Skeleton width="40%" height={11} />
        </View>
      </View>
      <Skeleton height={10} style={{ marginTop: 14 }} />
      <Skeleton width="80%" height={10} style={{ marginTop: 6 }} />
    </View>
  );
}

export function StatGridSkeleton() {
  const colors = useColors();
  return (
    <View style={skStyles.grid}>
      {[0, 1, 2, 3].map((i) => (
        <View key={i} style={[skStyles.statCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
          <Skeleton width={36} height={36} radius={10} />
          <Skeleton width="70%" height={11} style={{ marginTop: 8 }} />
          <Skeleton width="50%" height={18} style={{ marginTop: 4 }} />
        </View>
      ))}
    </View>
  );
}

const skStyles = StyleSheet.create({
  card: {
    borderRadius: Radius.lg,
    padding: 16,
    borderWidth: 1,
    marginBottom: 10,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statCard: {
    flex: 1,
    minWidth: '45%',
    borderRadius: Radius.lg,
    padding: 14,
    borderWidth: 1,
    alignItems: 'flex-start',
  },
});
