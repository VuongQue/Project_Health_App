import React, { useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axiosClient from "@/src/api/axiosClient";
import { getUserFromToken } from "@/src/utils/tokenStorage";
import { useTranslation } from "react-i18next";
import { Colors, Spacing, Radius } from "@/src/theme";

const { width: SCREEN_W } = Dimensions.get("window");

const SLIDE_KEYS = [
  { emoji: "💪", titleKey: "onboarding.slide_1_title", subtitleKey: "onboarding.slide_1_subtitle", gradient: ["#2563eb", "#7c3aed"] as [string, string] },
  { emoji: "🏃", titleKey: "onboarding.slide_2_title", subtitleKey: "onboarding.slide_2_subtitle", gradient: ["#059669", "#10b981"] as [string, string] },
  { emoji: "🧠", titleKey: "onboarding.slide_3_title", subtitleKey: "onboarding.slide_3_subtitle", gradient: ["#7c3aed", "#a855f7"] as [string, string] },
  { emoji: "🤖", titleKey: "onboarding.slide_4_title", subtitleKey: "onboarding.slide_4_subtitle", gradient: ["#ea580c", "#f97316"] as [string, string] },
];

const GOAL_OPTION_KEYS = [
  { key: "lose_weight", labelKey: "onboarding.goal_lose_weight", emoji: "⚖️" },
  { key: "gain_muscle", labelKey: "onboarding.goal_gain_muscle", emoji: "💪" },
  { key: "improve_health", labelKey: "onboarding.goal_improve_health", emoji: "❤️" },
  { key: "reduce_stress", labelKey: "onboarding.goal_reduce_stress", emoji: "🧘" },
  { key: "sleep_better", labelKey: "onboarding.goal_sleep_better", emoji: "😴" },
  { key: "stay_active", labelKey: "onboarding.goal_stay_active", emoji: "🏃" },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const scrollRef = useRef<ScrollView>(null);
  const [currentSlide, setCurrentSlide] = useState(0);

  // Setup step state
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [selectedGoal, setSelectedGoal] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const SLIDES = SLIDE_KEYS.map(s => ({ ...s, title: t(s.titleKey), subtitle: t(s.subtitleKey) }));
  const GOAL_OPTIONS = GOAL_OPTION_KEYS.map(g => ({ ...g, label: t(g.labelKey) }));
  const totalSlides = SLIDES.length + 1; // + setup step

  const goNext = () => {
    const next = currentSlide + 1;
    setCurrentSlide(next);
    scrollRef.current?.scrollTo({ x: next * SCREEN_W, animated: true });
  };

  const goPrev = () => {
    const prev = currentSlide - 1;
    if (prev < 0) return;
    setCurrentSlide(prev);
    scrollRef.current?.scrollTo({ x: prev * SCREEN_W, animated: true });
  };

  const handleScroll = (e: any) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_W);
    setCurrentSlide(idx);
  };

  const markOnboardingDone = async () => {
    const userInfo = await getUserFromToken();
    // Always set the generic key so checks using either key format succeed
    await AsyncStorage.setItem("hasSeenOnboarding", "true");
    if (userInfo?.id) {
      await AsyncStorage.setItem(`hasSeenOnboarding_${userInfo.id}`, "true");
    }
    await AsyncStorage.setItem("@tour_pending", "true");
  };

  const handleFinish = async () => {
    setSaving(true);
    try {
      if (weight || height) {
        const body: any = {};
        if (weight) body.weight = parseFloat(weight);
        if (height) body.height = parseFloat(height);
        if (selectedGoal) body.note = `Mục tiêu: ${selectedGoal}`;
        await axiosClient.post("/body-metrics", body).catch(() => {});
      }
      await markOnboardingDone();
      router.replace("/(tabs)/(personal)" as any);
    } catch {
      Alert.alert(t("common.error"), t("onboarding.err_save"));
      await markOnboardingDone();
      router.replace("/(tabs)/(personal)" as any);
    } finally {
      setSaving(false);
    }
  };

  const handleSkip = async () => {
    await markOnboardingDone();
    router.replace("/(tabs)/(personal)" as any);
  };

  const isSetupSlide = currentSlide === SLIDES.length;
  const currentGradient = isSetupSlide
    ? (["#1e40af", "#4338ca"] as [string, string])
    : SLIDES[currentSlide].gradient;

  return (
    <View style={styles.container}>
      <LinearGradient colors={currentGradient} style={StyleSheet.absoluteFillObject} />

      {/* Skip button */}
      {!isSetupSlide && (
        <TouchableOpacity style={styles.skipBtn} onPress={handleSkip}>
          <Text style={styles.skipText}>{t("onboarding.skip_button")}</Text>
        </TouchableOpacity>
      )}

      {/* Slides */}
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        scrollEnabled={false}
        style={styles.scrollView}
      >
        {/* Intro slides */}
        {SLIDES.map((slide, i) => (
          <View key={i} style={[styles.slide, { width: SCREEN_W }]}>
            <View style={styles.emojiBox}>
              <Text style={styles.emoji}>{slide.emoji}</Text>
            </View>
            <Text style={styles.slideTitle}>{slide.title}</Text>
            <Text style={styles.slideSubtitle}>{slide.subtitle}</Text>
          </View>
        ))}

        {/* Setup slide */}
        <View style={[styles.slide, { width: SCREEN_W }]}>
          <Text style={styles.setupTitle}>{t("onboarding.setup_title")}</Text>
          <Text style={styles.setupSub}>{t("onboarding.setup_subtitle")}</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>{t("onboarding.weight_label")}</Text>
            <TextInput
              style={styles.input}
              placeholder={t("onboarding.weight_placeholder")}
              placeholderTextColor="rgba(255,255,255,0.4)"
              keyboardType="numeric"
              value={weight}
              onChangeText={setWeight}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>{t("onboarding.height_label")}</Text>
            <TextInput
              style={styles.input}
              placeholder={t("onboarding.height_placeholder")}
              placeholderTextColor="rgba(255,255,255,0.4)"
              keyboardType="numeric"
              value={height}
              onChangeText={setHeight}
            />
          </View>

          <Text style={styles.inputLabel}>{t("onboarding.health_goal_label")}</Text>
          <View style={styles.goalGrid}>
            {GOAL_OPTIONS.map((g) => (
              <TouchableOpacity
                key={g.key}
                style={[styles.goalChip, selectedGoal === g.key && styles.goalChipActive]}
                onPress={() => setSelectedGoal(selectedGoal === g.key ? null : g.key)}
              >
                <Text style={styles.goalEmoji}>{g.emoji}</Text>
                <Text style={[styles.goalLabel, selectedGoal === g.key && styles.goalLabelActive]}>{g.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Progress dots */}
      <View style={styles.dots}>
        {Array.from({ length: totalSlides }).map((_, i) => (
          <View key={i} style={[styles.dot, currentSlide === i && styles.dotActive]} />
        ))}
      </View>

      {/* Navigation */}
      <View style={styles.navRow}>
        {currentSlide > 0 && (
          <TouchableOpacity style={styles.prevBtn} onPress={goPrev}>
            <Text style={styles.prevText}>{t("onboarding.prev_button")}</Text>
          </TouchableOpacity>
        )}

        <View style={{ flex: 1 }} />

        {isSetupSlide ? (
          <TouchableOpacity
            style={styles.finishBtn}
            onPress={handleFinish}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.finishText}>{t("onboarding.finish_button")}</Text>
            )}
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.nextBtn} onPress={goNext}>
            <Text style={styles.nextText}>{t("onboarding.next_button")}</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={{ height: 40 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  skipBtn: { position: "absolute", top: 56, right: 24, zIndex: 10 },
  skipText: { color: "rgba(255,255,255,0.7)", fontSize: 14, fontWeight: "600" },

  scrollView: { flex: 1 },
  slide: {
    flex: 1, paddingHorizontal: Spacing.xl, paddingTop: 120,
    alignItems: "center",
  },
  emojiBox: {
    width: 120, height: 120, borderRadius: 40,
    backgroundColor: "rgba(255,255,255,0.15)", justifyContent: "center", alignItems: "center",
    marginBottom: Spacing.xl,
  },
  emoji: { fontSize: 60 },
  slideTitle: { color: "white", fontSize: 26, fontWeight: "800", textAlign: "center", marginBottom: 14 },
  slideSubtitle: { color: "rgba(255,255,255,0.8)", fontSize: 15, textAlign: "center", lineHeight: 22 },

  setupTitle: { color: "white", fontSize: 24, fontWeight: "800", marginBottom: 8, alignSelf: "flex-start" },
  setupSub: { color: "rgba(255,255,255,0.7)", fontSize: 13, marginBottom: 24, alignSelf: "flex-start" },

  inputGroup: { width: "100%", marginBottom: 16 },
  inputLabel: { color: "rgba(255,255,255,0.7)", fontSize: 12, fontWeight: "600", marginBottom: 8, alignSelf: "flex-start" },
  input: {
    width: "100%", backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: Radius.lg, paddingHorizontal: 16, paddingVertical: 14,
    color: "white", fontSize: 16, borderWidth: 1, borderColor: "rgba(255,255,255,0.2)",
  },

  goalGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, width: "100%", marginTop: 8 },
  goalChip: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 12, paddingVertical: 8,
    backgroundColor: "rgba(255,255,255,0.12)", borderRadius: Radius.full,
    borderWidth: 1, borderColor: "rgba(255,255,255,0.2)",
  },
  goalChipActive: { backgroundColor: "rgba(255,255,255,0.3)", borderColor: "white" },
  goalEmoji: { fontSize: 14 },
  goalLabel: { color: "rgba(255,255,255,0.8)", fontSize: 12, fontWeight: "600" },
  goalLabelActive: { color: "white" },

  dots: { flexDirection: "row", justifyContent: "center", gap: 6, marginBottom: 20 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "rgba(255,255,255,0.3)" },
  dotActive: { width: 24, backgroundColor: "white" },

  navRow: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: Spacing.xl, marginBottom: 16,
  },
  prevBtn: { padding: 10 },
  prevText: { color: "rgba(255,255,255,0.7)", fontSize: 14, fontWeight: "600" },
  nextBtn: {
    backgroundColor: "rgba(255,255,255,0.2)", borderRadius: Radius.xl,
    paddingHorizontal: 24, paddingVertical: 14,
    borderWidth: 1, borderColor: "rgba(255,255,255,0.3)",
  },
  nextText: { color: "white", fontSize: 15, fontWeight: "700" },
  finishBtn: {
    backgroundColor: "white", borderRadius: Radius.xl,
    paddingHorizontal: 28, paddingVertical: 14,
  },
  finishText: { color: "#1e40af", fontSize: 15, fontWeight: "800" },
});
