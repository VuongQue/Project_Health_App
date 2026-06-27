import React, { useEffect, useRef } from 'react';
import {
  Animated, Dimensions, Modal, StyleSheet, Text,
  TouchableOpacity, View,
} from 'react-native';
import { useScreenTour } from '@/src/context/ScreenTourContext';
import { useColors, sf, sw } from '@/src/theme';

const { width: SW, height: SH } = Dimensions.get('window');

const TOOLTIP_W = SW - 48;
const TOOLTIP_MAX_H = 200;
const ARROW_SIZE = 10;
const HIGHLIGHT_PAD = 6;

export default function ScreenTourOverlay() {
  const { state, next, skip } = useScreenTour();
  const colors = useColors();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    if (!state || !state.layout) {
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.9);
      return;
    }
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 220, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 90, friction: 8 }),
    ]).start();
  }, [state?.stepIndex, state?.layout]);

  if (!state || !state.layout) return null;

  const { layout, steps, stepIndex } = state;
  const step = steps[stepIndex];
  const isLast = stepIndex === steps.length - 1;
  const totalSteps = steps.length;

  const hl = {
    x: layout.x - HIGHLIGHT_PAD,
    y: layout.y - HIGHLIGHT_PAD,
    width: layout.width + HIGHLIGHT_PAD * 2,
    height: layout.height + HIGHLIGHT_PAD * 2,
  };

  // Determine tooltip position based on placement
  let tooltipTop: number;
  let arrowStyle: any;
  let arrowContainerStyle: any;

  const centeredLeft = Math.max(12, Math.min(layout.x + layout.width / 2 - TOOLTIP_W / 2, SW - TOOLTIP_W - 12));

  if (step.placement === 'bottom') {
    // Tooltip below the element
    tooltipTop = hl.y + hl.height + ARROW_SIZE + 8;
    arrowStyle = { top: -ARROW_SIZE * 2 };
    arrowContainerStyle = {
      position: 'absolute' as const,
      top: -ARROW_SIZE,
      left: Math.max(16, layout.x + layout.width / 2 - centeredLeft - ARROW_SIZE),
    };
  } else {
    // Tooltip above the element (default)
    const estimatedHeight = 120;
    tooltipTop = hl.y - estimatedHeight - ARROW_SIZE - 8;
    tooltipTop = Math.max(60, tooltipTop);
    arrowStyle = { bottom: -ARROW_SIZE * 2 };
    arrowContainerStyle = {
      position: 'absolute' as const,
      bottom: -ARROW_SIZE,
      left: Math.max(16, layout.x + layout.width / 2 - centeredLeft - ARROW_SIZE),
    };
  }

  // Clamp tooltip within screen bounds
  tooltipTop = Math.max(60, Math.min(tooltipTop, SH - TOOLTIP_MAX_H - 80));

  return (
    <Modal visible transparent animationType="none" statusBarTranslucent>
      {/* Dark overlay with hole */}
      <View style={StyleSheet.absoluteFillObject} pointerEvents="box-none">
        {/* Top dark region */}
        <View style={[styles.darken, { top: 0, height: Math.max(0, hl.y) }]} />
        {/* Bottom dark region */}
        <View style={[styles.darken, { top: hl.y + hl.height, bottom: 0 }]} />
        {/* Left dark region */}
        <View style={[styles.darken, { top: hl.y, height: hl.height, left: 0, width: Math.max(0, hl.x) }]} />
        {/* Right dark region */}
        <View style={[styles.darken, { top: hl.y, height: hl.height, left: hl.x + hl.width, right: 0 }]} />

        {/* Highlight border */}
        <View
          style={[
            styles.highlight,
            {
              left: hl.x,
              top: hl.y,
              width: hl.width,
              height: hl.height,
            },
          ]}
        />
      </View>

      {/* Tooltip */}
      <Animated.View
        style={[
          styles.tooltip,
          {
            backgroundColor: colors.bgCard,
            left: centeredLeft,
            top: tooltipTop,
            width: TOOLTIP_W,
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
            borderColor: colors.border,
          },
        ]}
      >
        {/* Arrow */}
        <View style={arrowContainerStyle}>
          {step.placement === 'bottom' ? (
            <ArrowUp color={colors.bgCard} borderColor={colors.border} />
          ) : (
            <ArrowDown color={colors.bgCard} borderColor={colors.border} />
          )}
        </View>

        {/* Header */}
        <View style={styles.header}>
          {step.icon ? <Text style={styles.icon}>{step.icon}</Text> : null}
          <Text style={[styles.title, { color: colors.textPrimary }]}>{step.title}</Text>
          <TouchableOpacity onPress={skip} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Text style={[styles.skipX, { color: colors.textMuted }]}>✕</Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.body, { color: colors.textSecondary }]}>{step.body}</Text>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.dotsRow}>
            {Array.from({ length: totalSteps }).map((_, i) => (
              <View
                key={i}
                style={[
                  styles.dot,
                  {
                    backgroundColor: i === stepIndex ? '#3b82f6' : colors.border,
                    width: i === stepIndex ? 16 : 6,
                  },
                ]}
              />
            ))}
          </View>

          <View style={styles.btnRow}>
            <TouchableOpacity onPress={skip} style={[styles.btnSkip, { borderColor: colors.border }]}>
              <Text style={[styles.btnSkipText, { color: colors.textMuted }]}>Bỏ qua</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={next} style={styles.btnNext}>
              <Text style={styles.btnNextText}>{isLast ? 'Xong ✓' : 'Tiếp →'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>
    </Modal>
  );
}

function ArrowUp({ color, borderColor }: { color: string; borderColor: string }) {
  return (
    <View style={{ alignItems: 'center' }}>
      <View style={[styles.arrowBorder, styles.arrowUpBorder, { borderBottomColor: borderColor }]} />
      <View style={[styles.arrowFill, styles.arrowUpFill, { borderBottomColor: color, marginTop: -ARROW_SIZE }]} />
    </View>
  );
}

function ArrowDown({ color, borderColor }: { color: string; borderColor: string }) {
  return (
    <View style={{ alignItems: 'center' }}>
      <View style={[styles.arrowBorder, styles.arrowDownBorder, { borderTopColor: borderColor }]} />
      <View style={[styles.arrowFill, styles.arrowDownFill, { borderTopColor: color, marginTop: -ARROW_SIZE }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  darken: {
    position: 'absolute',
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.72)',
  },
  highlight: {
    position: 'absolute',
    borderRadius: 12,
    borderWidth: 2.5,
    borderColor: '#3b82f6',
  },
  tooltip: {
    position: 'absolute',
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  icon: { fontSize: sf(20) },
  title: { flex: 1, fontSize: sf(14), fontWeight: '700', lineHeight: 20 },
  skipX: { fontSize: sf(16), fontWeight: '600', paddingHorizontal: 2 },
  body: { fontSize: sf(13), lineHeight: 20, marginBottom: 14 },
  footer: { gap: 10 },
  dotsRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  dot: { height: 6, borderRadius: 3 },
  btnRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 8 },
  btnSkip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  btnSkipText: { fontSize: sf(13), fontWeight: '600' },
  btnNext: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#3b82f6',
  },
  btnNextText: { color: 'white', fontSize: sf(13), fontWeight: '700' },

  // Arrow shapes
  arrowBorder: { width: 0, height: 0, borderLeftWidth: ARROW_SIZE + 2, borderRightWidth: ARROW_SIZE + 2, borderLeftColor: 'transparent', borderRightColor: 'transparent' },
  arrowUpBorder: { borderBottomWidth: ARROW_SIZE + 2 },
  arrowDownBorder: { borderTopWidth: ARROW_SIZE + 2 },
  arrowFill: { width: 0, height: 0, borderLeftWidth: ARROW_SIZE, borderRightWidth: ARROW_SIZE, borderLeftColor: 'transparent', borderRightColor: 'transparent' },
  arrowUpFill: { borderBottomWidth: ARROW_SIZE },
  arrowDownFill: { borderTopWidth: ARROW_SIZE },
});
