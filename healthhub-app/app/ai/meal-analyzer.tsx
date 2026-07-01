import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Animated,
  Easing,
} from "react-native";
import { useRouter } from "expo-router";
import { ArrowLeft, Utensils, Zap, Beef, Wheat, Droplet, Mic, Square } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Audio } from "expo-av";
import aiApi, { MealAnalysis } from "@/src/api/aiApi";
import { useColors, Spacing, Radius, Typography } from "@/src/theme";

const MEAL_TYPES = [
  { key: "BREAKFAST", label: "Bữa sáng", emoji: "🌅" },
  { key: "LUNCH", label: "Bữa trưa", emoji: "☀️" },
  { key: "DINNER", label: "Bữa tối", emoji: "🌙" },
  { key: "SNACK", label: "Ăn vặt", emoji: "🍎" },
] as const;

function MacroBar({ label, value, unit, color, labelColor, icon }: { label: string; value: number; unit: string; color: string; labelColor: string; icon: React.ReactNode }) {
  return (
    <View style={macroStyles.row}>
      <View style={[macroStyles.iconBox, { backgroundColor: color + "20" }]}>{icon}</View>
      <View style={macroStyles.info}>
        <Text style={[macroStyles.label, { color: labelColor }]}>{label}</Text>
        <Text style={[macroStyles.value, { color }]}>{value}{unit}</Text>
      </View>
    </View>
  );
}

const macroStyles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  iconBox: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  info: { flex: 1 },
  label: { ...Typography.xs },
  value: { ...Typography.md, fontWeight: "700" },
});

async function uriToBase64(uri: string): Promise<{ base64: string; mimeType: string }> {
  const response = await fetch(uri);
  const arrayBuffer = await response.arrayBuffer();
  const uint8Array = new Uint8Array(arrayBuffer);
  let binary = "";
  for (let i = 0; i < uint8Array.length; i++) {
    binary += String.fromCharCode(uint8Array[i]);
  }
  const base64 = btoa(binary);
  const contentType = response.headers.get("content-type");
  const mimeType = contentType ?? "audio/m4a";
  return { base64, mimeType };
}

export default function MealAnalyzerScreen() {
  const router = useRouter();
  const colors = useColors();
  const [mealType, setMealType] = useState<string>("LUNCH");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<MealAnalysis | null>(null);

  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const startPulse = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.3, duration: 600, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
      ])
    ).start();
  };

  const stopPulse = () => {
    pulseAnim.stopAnimation();
    pulseAnim.setValue(1);
  };

  const startRecording = async () => {
    try {
      const { granted } = await Audio.requestPermissionsAsync();
      if (!granted) return;

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      recordingRef.current = recording;
      setIsRecording(true);
      startPulse();
    } catch {}
  };

  const stopRecording = async () => {
    if (!recordingRef.current) return;
    setIsRecording(false);
    stopPulse();
    setIsTranscribing(true);

    try {
      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      recordingRef.current = null;

      if (!uri) return;

      const { base64, mimeType } = await uriToBase64(uri);
      const res = await aiApi.transcribeMealVoice(base64, mimeType);
      if (res.data.transcript) {
        setDescription(res.data.transcript);
      }
    } catch {
    } finally {
      setIsTranscribing(false);
    }
  };

  const analyze = async () => {
    if (!description.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await aiApi.analyzeMeal(description.trim(), mealType);
      setResult(res.data);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const scoreColor = result
    ? result.healthScore >= 8 ? colors.success
    : result.healthScore >= 5 ? colors.warning
    : colors.danger
    : colors.primary;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.bgPrimary }]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {/* Header */}
      <LinearGradient colors={["#0f2d1a", colors.bgPrimary]} style={styles.header}>
        <TouchableOpacity
          onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)/(personal)')}
          style={styles.backBtn}
        >
          <ArrowLeft size={22} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <LinearGradient colors={["#22c55e", "#16a34a"]} style={styles.headerIcon}>
            <Utensils size={24} color="#fff" />
          </LinearGradient>
          <Text style={styles.headerTitle}>AI Meal Analyzer</Text>
          <Text style={[styles.headerSub, { color: colors.textSecondary }]}>Phân tích dinh dưỡng bữa ăn</Text>
        </View>
      </LinearGradient>

      <View style={styles.body}>
        {/* Meal type selector */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Loại bữa ăn</Text>
          <View style={styles.mealRow}>
            {MEAL_TYPES.map((m) => (
              <TouchableOpacity
                key={m.key}
                style={[
                  styles.mealChip,
                  { backgroundColor: colors.bgCard, borderColor: colors.border },
                  mealType === m.key && { borderColor: colors.success, backgroundColor: colors.successBg },
                ]}
                onPress={() => setMealType(m.key)}
              >
                <Text style={styles.mealEmoji}>{m.emoji}</Text>
                <Text style={[
                  styles.mealLabel,
                  { color: colors.textSecondary },
                  mealType === m.key && { color: colors.success, fontWeight: "700" },
                ]}>
                  {m.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Voice input */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Nói bữa ăn của bạn</Text>
          <View style={[styles.voiceCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
            <Text style={[styles.voiceHint, { color: colors.textSecondary }]}>
              {isRecording
                ? "Đang nghe... Hãy mô tả bữa ăn của bạn"
                : isTranscribing
                ? "Đang xử lý giọng nói..."
                : "Nhấn mic và nói: \"Tôi ăn 1 tô phở bò, 1 ly nước cam\""}
            </Text>
            <Animated.View style={[styles.micWrapper, { transform: [{ scale: pulseAnim }] }]}>
              <TouchableOpacity
                onPress={isRecording ? stopRecording : startRecording}
                disabled={isTranscribing}
                style={[
                  styles.micBtn,
                  { backgroundColor: colors.success, shadowColor: colors.success },
                  isRecording && { backgroundColor: colors.danger, shadowColor: colors.danger },
                  isTranscribing && { backgroundColor: colors.bgCard, shadowOpacity: 0, elevation: 0 },
                ]}
                activeOpacity={0.8}
              >
                {isTranscribing ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : isRecording ? (
                  <Square size={22} color="#fff" fill="#fff" />
                ) : (
                  <Mic size={22} color="#fff" />
                )}
              </TouchableOpacity>
            </Animated.View>
            {isRecording && (
              <View style={[styles.recordingBadge, { backgroundColor: colors.dangerBg }]}>
                <View style={[styles.recordingDot, { backgroundColor: colors.danger }]} />
                <Text style={[styles.recordingText, { color: colors.danger }]}>Đang ghi âm</Text>
              </View>
            )}
          </View>
        </View>

        {/* Text input */}
        <View style={styles.section}>
          <View style={styles.labelRow}>
            <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Mô tả bữa ăn</Text>
            {description.trim().length > 0 && (
              <TouchableOpacity onPress={() => setDescription("")}>
                <Text style={[styles.clearBtn, { color: colors.danger }]}>Xoá</Text>
              </TouchableOpacity>
            )}
          </View>
          <TextInput
            style={[styles.textarea, { backgroundColor: colors.bgCard, borderColor: colors.border, color: colors.textPrimary }]}
            value={description}
            onChangeText={setDescription}
            placeholder="Ví dụ: 1 tô phở bò lớn, 1 ly nước cam, 1 cái bánh mì que..."
            placeholderTextColor={colors.textMuted}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        {/* Analyze button */}
        <TouchableOpacity onPress={analyze} disabled={!description.trim() || loading}>
          <LinearGradient
            colors={description.trim() && !loading ? ["#22c55e", "#16a34a"] : [colors.bgCard, colors.bgCard]}
            style={styles.analyzeBtn}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Utensils size={18} color={description.trim() ? "#fff" : colors.textMuted} />
            )}
            <Text style={[styles.analyzeBtnText, !description.trim() && { color: colors.textMuted }]}>
              {loading ? "Đang phân tích..." : "Phân tích dinh dưỡng"}
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Result */}
        {result && (
          <>
            {/* Health score */}
            <View style={[styles.scoreCard, { backgroundColor: colors.bgCard, borderColor: scoreColor + "40" }]}>
              <Text style={[styles.scoreLabel, { color: colors.textSecondary }]}>Điểm lành mạnh</Text>
              <Text style={[styles.scoreValue, { color: scoreColor }]}>{result.healthScore}/10</Text>
              <Text style={[styles.scoreFeedback, { color: colors.textSecondary }]}>{result.feedback}</Text>
            </View>

            {/* Macros grid */}
            <View style={styles.macroGrid}>
              <View style={[styles.macroCard, { backgroundColor: colors.bgCard }]}>
                <MacroBar label="Calo" value={result.estimatedCalories} unit=" kcal" color={colors.warning} labelColor={colors.textSecondary} icon={<Zap size={16} color={colors.warning} />} />
              </View>
              <View style={[styles.macroCard, { backgroundColor: colors.bgCard }]}>
                <MacroBar label="Protein" value={result.protein} unit="g" color="#ef4444" labelColor={colors.textSecondary} icon={<Beef size={16} color="#ef4444" />} />
              </View>
              <View style={[styles.macroCard, { backgroundColor: colors.bgCard }]}>
                <MacroBar label="Carbs" value={result.carbs} unit="g" color="#f59e0b" labelColor={colors.textSecondary} icon={<Wheat size={16} color="#f59e0b" />} />
              </View>
              <View style={[styles.macroCard, { backgroundColor: colors.bgCard }]}>
                <MacroBar label="Fat" value={result.fat} unit="g" color="#3b82f6" labelColor={colors.textSecondary} icon={<Droplet size={16} color="#3b82f6" />} />
              </View>
            </View>

            {/* Suggestions */}
            {(result.suggestions ?? []).length > 0 && (
              <View style={[styles.suggestCard, { backgroundColor: colors.bgCard }]}>
                <Text style={[styles.suggestTitle, { color: colors.textPrimary }]}>Gợi ý</Text>
                {(result.suggestions ?? []).map((s, i) => (
                  <Text key={i} style={[styles.suggestItem, { color: colors.textSecondary }]}>• {s}</Text>
                ))}
              </View>
            )}
          </>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingTop: 52, paddingBottom: 24, paddingHorizontal: Spacing.base },
  backBtn: { marginBottom: 16 },
  headerContent: { alignItems: "center", gap: 10 },
  headerIcon: { width: 60, height: 60, borderRadius: 30, alignItems: "center", justifyContent: "center" },
  headerTitle: { color: "#fff", ...Typography.xxl, fontWeight: "800" },
  headerSub: { ...Typography.sm },
  body: { padding: Spacing.base, gap: Spacing.md },
  section: { gap: 8 },
  sectionLabel: { ...Typography.sm, fontWeight: "600" },
  labelRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  clearBtn: { ...Typography.xs, fontWeight: "600" },
  mealRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  mealChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: Radius.full,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
  },
  mealEmoji: { fontSize: 14 },
  mealLabel: { ...Typography.xs },
  voiceCard: {
    borderRadius: Radius.xl,
    padding: Spacing.base,
    alignItems: "center",
    gap: 14,
    borderWidth: 1,
  },
  voiceHint: {
    ...Typography.xs,
    textAlign: "center",
    lineHeight: 18,
  },
  micWrapper: {
    alignItems: "center",
    justifyContent: "center",
  },
  micBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  recordingBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  recordingText: { ...Typography.xs, fontWeight: "600" },
  textarea: {
    borderRadius: Radius.lg,
    padding: Spacing.base,
    ...Typography.sm,
    minHeight: 100,
    borderWidth: 1,
  },
  analyzeBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: Radius.lg,
    paddingVertical: 14,
  },
  analyzeBtnText: { color: "#fff", ...Typography.md, fontWeight: "700" },
  scoreCard: {
    borderRadius: Radius.xl,
    padding: Spacing.base,
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
  },
  scoreLabel: { ...Typography.xs, textTransform: "uppercase", letterSpacing: 1 },
  scoreValue: { fontSize: 40, fontWeight: "800" },
  scoreFeedback: { ...Typography.sm, textAlign: "center", lineHeight: 20 },
  macroGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  macroCard: {
    borderRadius: Radius.lg,
    padding: Spacing.sm,
    width: "48%",
  },
  suggestCard: { borderRadius: Radius.xl, padding: Spacing.base, gap: 8 },
  suggestTitle: { ...Typography.md, fontWeight: "700" },
  suggestItem: { ...Typography.sm, lineHeight: 20 },
});
