import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Dimensions,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft, ChevronRight, X, CheckCircle2 } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTour } from '@/src/context/TourContext';
import { useColors, Colors, Radius, sf, sw } from '@/src/theme';

const { width: SW, height: SH } = Dimensions.get('window');

export default function TourOverlay() {
  const colors = useColors();
  const router = useRouter();
  const { t } = useTranslation();
  const { isActive, currentStep, currentStepIndex, totalSteps, nextStep, prevStep, skipTour } = useTour();

  const slideAnim = useRef(new Animated.Value(300)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    if (!isActive || !currentStep) return;

    slideAnim.setValue(300);
    fadeAnim.setValue(0);
    scaleAnim.setValue(0.95);

    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 70, friction: 10 }),
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 80, friction: 9 }),
    ]).start();
  }, [currentStepIndex, isActive]);

  if (!isActive || !currentStep) return null;

  const isFirst = currentStepIndex === 0;
  const isLast = currentStepIndex === totalSteps - 1;
  const progress = ((currentStepIndex + 1) / totalSteps) * 100;

  const handleAction = () => {
    if (currentStep.actionRoute) {
      skipTour();
      setTimeout(() => router.push(currentStep.actionRoute as any), 100);
    } else {
      nextStep();
    }
  };

  return (
    <Modal visible transparent animationType="none" statusBarTranslucent>
      {/* Backdrop */}
      <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]}>
        <Pressable style={StyleSheet.absoluteFillObject} onPress={() => {}} />
      </Animated.View>

      {/* Card container — bottom sheet style */}
      <View style={styles.cardContainer} pointerEvents="box-none">
        <Animated.View
          style={[
            styles.card,
            { backgroundColor: colors.bgCard },
            {
              transform: [
                { translateY: slideAnim },
                { scale: scaleAnim },
              ],
            },
          ]}
        >
          {/* Top gradient header */}
          <LinearGradient
            colors={currentStep.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.cardHeader}
          >
            {/* Progress bar */}
            <View style={styles.progressBarBg}>
              <Animated.View style={[styles.progressBarFill, { width: `${progress}%` }]} />
            </View>

            <View style={styles.headerRow}>
              <View style={styles.emojiBox}>
                <Text style={styles.emoji}>{currentStep.icon}</Text>
              </View>
              <View style={styles.headerTextBlock}>
                <Text style={styles.stepLabel}>{t("tour.step_label", { current: currentStepIndex + 1, total: totalSteps })}</Text>
                <Text style={styles.headerTitle}>{currentStep.title}</Text>
              </View>
              <TouchableOpacity onPress={skipTour} style={styles.closeBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <X size={18} color="rgba(255,255,255,0.7)" />
              </TouchableOpacity>
            </View>

            <Text style={styles.headerDesc}>{currentStep.description}</Text>
          </LinearGradient>

          {/* Features list */}
          {currentStep.features && currentStep.features.length > 0 && (
            <View style={[styles.featuresList, { backgroundColor: colors.bgSecondary }]}>
              {currentStep.features.map((f, i) => (
                <View key={i} style={styles.featureRow}>
                  <CheckCircle2 size={15} color={Colors.gradientPrimary[0]} />
                  <Text style={[styles.featureText, { color: colors.textPrimary }]}>{f}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Footer */}
          <View style={[styles.footer, { borderTopColor: colors.border }]}>
            {/* Dot indicators */}
            <View style={styles.dots}>
              {Array.from({ length: totalSteps }).map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.dot,
                    {
                      backgroundColor: i === currentStepIndex
                        ? Colors.gradientPrimary[0]
                        : i < currentStepIndex
                          ? Colors.gradientPrimary[0] + '60'
                          : colors.border,
                      width: i === currentStepIndex ? 20 : 6,
                    },
                  ]}
                />
              ))}
            </View>

            {/* Nav buttons */}
            <View style={styles.navRow}>
              {!isFirst ? (
                <TouchableOpacity onPress={prevStep} style={[styles.btnSecondary, { borderColor: colors.border }]}>
                  <ChevronLeft size={16} color={colors.textMuted} />
                  <Text style={[styles.btnSecondaryText, { color: colors.textMuted }]}>{t("tour.prev")}</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity onPress={skipTour} style={[styles.btnSecondary, { borderColor: colors.border }]}>
                  <Text style={[styles.btnSecondaryText, { color: colors.textMuted }]}>{t("tour.skip")}</Text>
                </TouchableOpacity>
              )}

              <View style={styles.rightBtns}>
                {currentStep.actionLabel && (
                  <TouchableOpacity onPress={handleAction} style={styles.btnAction}>
                    <Text style={styles.btnActionText}>{currentStep.actionLabel}</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity onPress={nextStep} style={styles.btnPrimary}>
                  <LinearGradient
                    colors={Colors.gradientPrimary}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.btnPrimaryInner}
                  >
                    {isLast ? (
                      <Text style={styles.btnPrimaryText}>{t("tour.done")}</Text>
                    ) : (
                      <>
                        <Text style={styles.btnPrimaryText}>{t("tour.next")}</Text>
                        <ChevronRight size={15} color="white" />
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  cardContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: 12,
    paddingBottom: 24,
  },
  card: {
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 24,
  },

  // Header gradient section
  cardHeader: {
    padding: 20,
    paddingTop: 16,
    gap: 12,
  },
  progressBarBg: {
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 2,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  emojiBox: {
    width: sw(48),
    height: sw(48),
    borderRadius: sw(14),
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emoji: { fontSize: sf(24) },
  headerTextBlock: { flex: 1, gap: 2 },
  stepLabel: { color: 'rgba(255,255,255,0.65)', fontSize: sf(11), fontWeight: '600' },
  headerTitle: { color: 'white', fontSize: sf(16), fontWeight: '800', lineHeight: 22 },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerDesc: {
    color: 'rgba(255,255,255,0.88)',
    fontSize: sf(13),
    lineHeight: 20,
  },

  // Features list
  featuresList: {
    padding: 16,
    gap: 10,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  featureText: {
    fontSize: sf(13),
    lineHeight: 18,
    flex: 1,
  },

  // Footer
  footer: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
    borderTopWidth: 1,
  },
  dots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    justifyContent: 'center',
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  rightBtns: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  btnSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  btnSecondaryText: { fontSize: sf(13), fontWeight: '600' },
  btnAction: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  btnActionText: {
    color: Colors.gradientPrimary[0],
    fontSize: sf(13),
    fontWeight: '700',
  },
  btnPrimary: {},
  btnPrimaryInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: Radius.full,
  },
  btnPrimaryText: { color: 'white', fontWeight: '700', fontSize: sf(14) },
});
