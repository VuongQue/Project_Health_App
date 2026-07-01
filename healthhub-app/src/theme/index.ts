// HealthHub Design System — single source of truth for all UI tokens
export { sw, sh, sf, SCREEN_W, SCREEN_H, isTablet } from "@/src/utils/responsive";
import { useContext } from 'react';
import { ThemeContext } from '@/src/context/ThemeContext';

// ── Dark palette ──────────────────────────────────────────────────────────────
export const Colors = {
  bgPrimary:       '#0F1117',
  bgSecondary:     '#161B26',
  bgCard:          '#1C2333',
  bgCardElevated:  '#232D42',
  bgInput:         '#1A2236',
  bgGlass:         'rgba(255,255,255,0.06)',

  border:          'rgba(255,255,255,0.08)',
  borderLight:     'rgba(255,255,255,0.13)',
  borderAccent:    'rgba(99,179,237,0.22)',

  textPrimary:     '#F2F6FF',
  textSecondary:   '#9BAAC0',
  textMuted:       '#5A6B84',
  textDisabled:    '#374357',

  primary:         '#4C8EF8',
  primaryDark:     '#2563EB',
  primaryLight:    '#7AB3FF',
  primaryBg:       'rgba(76,142,248,0.14)',

  success:         '#22C55E',
  successBg:       'rgba(34,197,94,0.13)',
  warning:         '#F59E0B',
  warningBg:       'rgba(245,158,11,0.13)',
  danger:          '#EF4444',
  dangerBg:        'rgba(239,68,68,0.13)',
  info:            '#06B6D4',
  infoBg:          'rgba(6,182,212,0.13)',

  purple:          '#8B5CF6',
  purpleBg:        'rgba(139,92,246,0.13)',
  orange:          '#F97316',
  orangeBg:        'rgba(249,115,22,0.13)',
  pink:            '#EC4899',
  pinkBg:          'rgba(236,72,153,0.13)',
  teal:            '#14B8A6',
  tealBg:          'rgba(20,184,166,0.13)',

  gradientPrimary: ['#4C8EF8', '#6366F1'] as const,
  gradientSuccess: ['#22C55E', '#16A34A'] as const,
  gradientWarm:    ['#F97316', '#EF4444'] as const,
  gradientPurple:  ['#8B5CF6', '#6366F1'] as const,
  gradientTeal:    ['#14B8A6', '#06B6D4'] as const,
  gradientGold:    ['#F59E0B', '#D97706'] as const,
  gradientPink:    ['#EC4899', '#DB2777'] as const,
  gradientHero:    ['#111827', '#161B26'] as const,
} as const;

// Widened color record — token string được nới rộng thành `string` (không narrow
// về literal của dark palette), gradient giữ nguyên kiểu tuple.
type WidenToken<T> = T extends readonly string[] ? T : string;
type ColorTokens = { [K in keyof typeof Colors]: WidenToken<(typeof Colors)[K]> };

// ── Light palette — trắng chủ đạo, hiện đại như Headspace/Apple Health ────────
export const LightColors: Partial<ColorTokens> = {
  bgPrimary:       '#FFFFFF',
  bgSecondary:     '#F5F7FB',
  bgCard:          '#FFFFFF',
  bgCardElevated:  '#EEF1F8',
  bgInput:         '#F0F3FA',
  bgGlass:         'rgba(0,0,0,0.025)',

  border:          'rgba(0,0,0,0.07)',
  borderLight:     'rgba(0,0,0,0.11)',
  borderAccent:    'rgba(76,142,248,0.18)',

  textPrimary:     '#0D1117',
  textSecondary:   '#4A5568',
  textMuted:       '#8A96A8',
  textDisabled:    '#BFC9D6',

  primary:         '#3B82F6',
  primaryDark:     '#1D4ED8',
  primaryLight:    '#60A5FA',
  primaryBg:       'rgba(59,130,246,0.08)',

  success:         '#10B981',
  successBg:       'rgba(16,185,129,0.09)',
  warning:         '#D97706',
  warningBg:       'rgba(217,119,6,0.09)',
  danger:          '#DC2626',
  dangerBg:        'rgba(220,38,38,0.08)',
  info:            '#0891B2',
  infoBg:          'rgba(8,145,178,0.08)',

  purple:          '#7C3AED',
  purpleBg:        'rgba(124,58,237,0.08)',
  orange:          '#EA580C',
  orangeBg:        'rgba(234,88,12,0.08)',
  teal:            '#0D9488',
  tealBg:          'rgba(13,148,136,0.08)',
};

export function getColors(theme: 'dark' | 'light'): typeof Colors {
  if (theme === 'light') return { ...Colors, ...LightColors } as typeof Colors;
  return Colors;
}

export function useColors(): typeof Colors {
  const ctx = useContext(ThemeContext);
  return ctx.isDark ? Colors : (getColors('light'));
}

// ── Spacing ───────────────────────────────────────────────────────────────────
export const Spacing = {
  xs:   4,
  sm:   8,
  md:   12,
  base: 16,
  lg:   20,
  xl:   24,
  xxl:  32,
  xxxl: 40,
} as const;

// ── Radius ────────────────────────────────────────────────────────────────────
export const Radius = {
  sm:   6,
  md:   10,
  lg:   14,
  xl:   18,
  xxl:  24,
  full: 9999,
} as const;

// ── Typography ────────────────────────────────────────────────────────────────
export const Typography = {
  xs:      { fontSize: 11, lineHeight: 16 },
  sm:      { fontSize: 12, lineHeight: 18 },
  base:    { fontSize: 14, lineHeight: 20 },
  md:      { fontSize: 15, lineHeight: 22 },
  lg:      { fontSize: 16, lineHeight: 24 },
  xl:      { fontSize: 18, lineHeight: 26 },
  xxl:     { fontSize: 20, lineHeight: 28 },
  xxxl:    { fontSize: 24, lineHeight: 32 },
  display: { fontSize: 28, lineHeight: 36 },
} as const;

// ── Shadow — tinh tế cho light mode ──────────────────────────────────────────
export const Shadow = {
  xs: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 16,
    elevation: 6,
  },
  lg: {
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 10,
  },
  colored: (color: string) => ({
    shadowColor: color,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.20,
    shadowRadius: 12,
    elevation: 6,
  }),
} as const;
