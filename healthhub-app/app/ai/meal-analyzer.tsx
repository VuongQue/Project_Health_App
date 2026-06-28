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
import { ArrowLeft, Utensils, Zap, Beef, Wheat, Droplet, Mic, MicOff, Square } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Audio } from "expo-av";
import aiApi, { MealAnalysis } from "@/src/api/aiApi";
import { Colors, Spacing, Radius, Typography } from "@/src/theme";

const MEAL_TYPES = [
  { key: "BREAKFAST", label: "Bữa sáng", emoji: "🌅" },
  { key: "LUNCH", label: "Bữa trưa", emoji: "☀️" },
  { key: "DINNER", label: "Bữa tối", emoji: "🌙" },
  { key: "SNACK", label: "Ăn vặt", emoji: "🍎" },
] as const;

function MacroBar({ label, value, unit, color, icon }: { label: string; value: number; unit: string; color: string; icon: React.ReactNode }) {
  return (
    <View style={macroStyles.row}>
      <View style={[macroStyles.iconBox, { backgroundColor: color + "20" }]}>{icon}</View>
      <View style={macroStyles.info}>
        <Text style={macroStyles.label}>{label}</Text>
        <Text style={[macroStyles.value, { color }]}>{value}{unit}</Text>
      </View>
    </View>
  );
}

const macroStyles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  iconBox: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  info: { flex: 1 },
  label: { color: Colors.textSecondary, fontSize: Typography.xs },
  value: { fontSize: Typography.md, fontWeight: "700" },
});

async function uriToBase64(uri: string): Promise<{ base64: string; mimeType: string }> {
  const response = await fetch(uri);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result as string;
      // dataUrl: "data:audio/m4a;base64,AAAA..."
      const [header, base64] = dataUrl.split(",");
      const mimeMatch = header.match(/data:([^;]+)/);
      const mimeType = mimeMatch ? mimeMatch[1] : "audio/m4a";
      resolve({ base64, mimeType });
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export default function MealAnalyzerScreen() {
  const router = useRouter();
  const [mealType, setMealType] = useState<string>("LUNCH");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<MealAnalysis | null>(null);

  // Voice recording states
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
    ? result.healthScore >= 8 ? Colors.success
    : result.healthScore >= 5 ? Colors.warning
    : Colors.danger
    : Colors.primary;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      {/* Header */}
      <LinearGradient colors={["#0f2d1a", Colors.bgPrimary]} style={styles.header}>
        <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)/(personal)')} style={styles.backBtn}>
          <ArrowLeft size={22} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <LinearGradient colors={["#22c55e", "#16a34a"]} style={styles.headerIcon}>
            <Utensils size={24} color="#fff" />
          </LinearGradient>
          <Text style={styles.headerTitle}>AI Meal Analyzer</Text>
          <Text style={styles.headerSub}>Phân tích dinh dưỡng bữa ăn</Text>
        </View>
      </LinearGradient>

      <View style={styles.body}>
        {/* Meal type selector */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Loại bữa ăn</Text>
          <View style={styles.mealRow}>
            {MEAL_TYPES.map((m) => (
              <TouchableOpacity
                key={m.key}
                style={[styles.mealChip, mealType === m.key && styles.mealChipActive]}
                onPress={() => setMealType(m.key)}
              >
                <Text style={styles.mealEmoji}>{m.emoji}</Text>
                <Text style={[styles.mealLabel, mealType === m.key && styles.mealLabelActive]}>
                  {m.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Voice input */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Nói bữa ăn của bạn</Text>
          <View style={styles.voiceCard}>
            <Text style={styles.voiceHint}>
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
                  isRecording && styles.micBtnActive,
                  isTranscribing && styles.micBtnDisabled,
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
              <View style={styles.recordingBadge}>
                <View style={styles.recordingDot} />
                <Text style={styles.recordingText}>Đang ghi âm</Text>
              </View>
            )}
          </View>
        </View>

        {/* Text input */}
        <View style={styles.section}>
          <View style={styles.labelRow}>
            <Text style={styles.sectionLabel}>Mô tả bữa ăn</Text>
            {description.trim().length > 0 && (
              <TouchableOpacity onPress={() => setDescription("")}>
                <Text style={styles.clearBtn}>Xoá</Text>
              </TouchableOpacity>
            )}
          </View>
          <TextInput
            style={styles.textarea}
            value={description}
            onChangeText={setDescription}
            placeholder="Ví dụ: 1 tô phở bò lớn, 1 ly nước cam, 1 cái bánh mì que..."
            placeholderTextColor={Colors.textMuted}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        {/* Analyze button */}
        <TouchableOpacity onPress={analyze} disabled={!description.trim() || loading}>
          <LinearGradient
            colors={description.trim() && !loading ? ["#22c55e", "#16a34a"] : [Colors.bgCard, Colors.bgCard]}
            style={styles.analyzeBtn}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Utensils size={18} color={description.trim() ? "#fff" : Colors.textMuted} />
            )}
            <Text style={[styles.analyzeBtnText, !description.trim() && styles.analyzeBtnTextDisabled]}>
              {loading ? "Đang phân tích..." : "Phân tích dinh dưỡng"}
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Result */}
        {result && (
          <>
            {/* Health score */}
            <View style={[styles.scoreCard, { borderColor: scoreColor + "40" }]}>
              <Text style={styles.scoreLabel}>Điểm lành mạnh</Text>
              <Text style={[styles.scoreValue, { color: scoreColor }]}>{result.healthScore}/10</Text>
              <Text style={styles.scoreFeedback}>{result.feedback}</Text>
            </View>

            {/* Macros grid */}
            <View style={styles.macroGrid}>
              <View style={styles.macroCard}>
                <MacroBar label="Calo" value={result.estimatedCalories} unit=" kcal" color={Colors.warning} icon={<Zap size={16} color={Colors.warning} />} />
              </View>
              <View style={styles.macroCard}>
                <MacroBar label="Protein" value={result.protein} unit="g" color="#ef4444" icon={<Beef size={16} color="#ef4444" />} />
              </View>
              <View style={styles.macroCard}>
                <MacroBar label="Carbs" value={result.carbs} unit="g" color="#f59e0b" icon={<Wheat size={16} color="#f59e0b" />} />
              </View>
              <View style={styles.macroCard}>
                <MacroBar label="Fat" value={result.fat} unit="g" color="#3b82f6" icon={<Droplet size={16} color="#3b82f6" />} />
              </View>
            </View>

            {/* Suggestions */}
            {result.suggestions.length > 0 && (
              <View style={styles.suggestCard}>
                <Text style={styles.suggestTitle}>Gợi ý</Text>
                {result.suggestions.map((s, i) => (
                  <Text key={i} style={styles.suggestItem}>• {s}</Text>
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
  container: { flex: 1, backgroundColor: Colors.bgPrimary },
  header: { paddingTop: 52, paddingBottom: 24, paddingHorizontal: Spacing.base },
  backBtn: { marginBottom: 16 },
  headerContent: { alignItems: "center", gap: 10 },
  headerIcon: { width: 60, height: 60, borderRadius: 30, alignItems: "center", justifyContent: "center" },
  headerTitle: { color: "#fff", fontSize: Typography.xxl, fontWeight: "800" },
  headerSub: { color: Colors.textSecondary, fontSize: Typography.sm },
  body: { padding: Spacing.base, gap: Spacing.md },
  section: { gap: 8 },
  sectionLabel: { color: Colors.textSecondary, fontSize: Typography.sm, fontWeight: "600" },
  labelRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  clearBtn: { color: Colors.danger, fontSize: Typography.xs, fontWeight: "600" },
  mealRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  mealChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.full,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  mealChipActive: { borderColor: Colors.success, backgroundColor: "rgba(34,197,94,0.12)" },
  mealEmoji: { fontSize: 14 },
  mealLabel: { color: Colors.textSecondary, fontSize: Typography.xs },
  mealLabelActive: { color: Colors.success, fontWeight: "700" },
  // Voice card
  voiceCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.xl,
    padding: Spacing.base,
    alignItems: "center",
    gap: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  voiceHint: {
    color: Colors.textSecondary,
    fontSize: Typography.xs,
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
    backgroundColor: Colors.success,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: Colors.success,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  micBtnActive: {
    backgroundColor: Colors.danger,
    shadowColor: Colors.danger,
  },
  micBtnDisabled: {
    backgroundColor: Colors.bgCard,
    shadowOpacity: 0,
    elevation: 0,
  },
  recordingBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(239,68,68,0.12)",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.danger,
  },
  recordingText: { color: Colors.danger, fontSize: Typography.xs, fontWeight: "600" },
  textarea: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    padding: Spacing.base,
    color: Colors.textPrimary,
    fontSize: Typography.sm,
    minHeight: 100,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  analyzeBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: Radius.lg,
    paddingVertical: 14,
  },
  analyzeBtnText: { color: "#fff", fontSize: Typography.md, fontWeight: "700" },
  analyzeBtnTextDisabled: { color: Colors.textMuted },
  scoreCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.xl,
    padding: Spacing.base,
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
  },
  scoreLabel: { color: Colors.textSecondary, fontSize: Typography.xs, textTransform: "uppercase", letterSpacing: 1 },
  scoreValue: { fontSize: 40, fontWeight: "800" },
  scoreFeedback: { color: Colors.textSecondary, fontSize: Typography.sm, textAlign: "center", lineHeight: 20 },
  macroGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  macroCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    padding: Spacing.sm,
    width: "48%",
  },
  suggestCard: { backgroundColor: Colors.bgCard, borderRadius: Radius.xl, padding: Spacing.base, gap: 8 },
  suggestTitle: { color: Colors.textPrimary, fontSize: Typography.md, fontWeight: "700" },
  suggestItem: { color: Colors.textSecondary, fontSize: Typography.sm, lineHeight: 20 },
});
