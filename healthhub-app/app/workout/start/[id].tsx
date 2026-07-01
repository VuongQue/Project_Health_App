import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  StatusBar,
  Alert,
  Modal,
  Vibration,
  Image,
} from "react-native";
import { useVideoPlayer, VideoView } from "expo-video";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import {
  CheckCircle2, SkipForward,
  Clock, Flame, Dumbbell, Trophy, X, ChevronRight,
} from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Circle, Defs, LinearGradient as LG, Stop } from "react-native-svg";
import fitnessApi from "@/src/api/fitnessApi";
import { communityApi } from "@/src/api/communityApi";
import { useColors, Colors, Spacing, Radius, Typography } from "@/src/theme";
import { simpleCache } from "@/src/utils/simpleCache";

/* =====================================================
   TRACKING LOGIC
   - totalSeconds: global workout stopwatch (always runs)
   - restSeconds: countdown shown during rest phase
   - phase: "exercise" | "rest" | "done"
   - currentExerciseIndex: which exercise we're on
===================================================== */

type Phase = "exercise" | "rest" | "done";

function ExerciseVideoNative({ uri, style }: { uri: string; style: any }) {
  const player = useVideoPlayer(uri, (p) => {
    p.loop = true;
    p.muted = true;
    p.play();
  });
  return (
    <VideoView
      player={player}
      style={style}
      contentFit="contain"
      nativeControls={false}
    />
  );
}

function ExerciseVideo({ uri, style }: { uri: string; style: any }) {
  if (typeof window !== "undefined") {
    return (
      <video
        src={uri}
        autoPlay
        muted
        loop
        playsInline
        style={{ width: "100%", height: "100%", objectFit: "contain" }}
      />
    );
  }
  return <ExerciseVideoNative uri={uri} style={style} />;
}

export default function WorkoutTrainingScreen() {
  const router = useRouter();
  const colors = useColors();
  const { t } = useTranslation();
  const { id } = useLocalSearchParams();
  const workoutId = Number(id);

  const [session, setSession] = useState<any>(null);
  const [workout, setWorkout] = useState<any>(null);
  const [exercises, setExercises] = useState<any[]>([]);

  const [exerciseIndex, setExerciseIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>("exercise");
  const [totalSeconds, setTotalSeconds] = useState(0);
  const [restSeconds, setRestSeconds] = useState(0);

  const [showFinishModal, setShowFinishModal] = useState(false);
  const [saving, setSaving] = useState(false);

  const totalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const restRef  = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── GLOBAL TIMER (runs entire workout) ──
  const startTotal = useCallback(() => {
    if (totalRef.current) return;
    totalRef.current = setInterval(() => setTotalSeconds((s) => s + 1), 1000);
  }, []);

  const stopTotal = useCallback(() => {
    if (totalRef.current) { clearInterval(totalRef.current); totalRef.current = null; }
  }, []);

  // ── REST COUNTDOWN ──
  const startRest = useCallback((duration: number) => {
    setRestSeconds(duration);
    if (restRef.current) { clearInterval(restRef.current); restRef.current = null; }
    restRef.current = setInterval(() => {
      setRestSeconds((s) => {
        if (s <= 1) {
          clearInterval(restRef.current!); restRef.current = null;
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  }, []);

  const clearRest = useCallback(() => {
    if (restRef.current) { clearInterval(restRef.current); restRef.current = null; }
    setRestSeconds(0);
  }, []);

  // ── LOAD SESSION + WORKOUT ──
  useEffect(() => {
    (async () => {
      try {
        const [sessionRes, detailRes] = await Promise.all([
          fitnessApi.startSession(workoutId),
          fitnessApi.getWorkoutById(workoutId),
        ]);
        const s = sessionRes.data ?? sessionRes;
        const d = detailRes.data ?? detailRes;
        setSession(s);
        setWorkout(d);
        setExercises(d.exercises ?? []);
        const resumeIdx = s.currentExerciseIndex ?? 0;
        setExerciseIndex(resumeIdx);
        startTotal();
      } catch (e) {
        Alert.alert(t("workout.err_start"), t("workout.err_start"), [{ text: "OK", onPress: () => router.back() }]);
      }
    })();

    return () => { stopTotal(); clearRest(); };
  }, []);

  // ── WHEN PHASE CHANGES TO REST ──
  useEffect(() => {
    if (phase !== "rest") return;
    const currentEx = exercises[exerciseIndex];
    const restDuration = currentEx?.restSec ?? 30;
    Vibration.vibrate(200);
    startRest(restDuration);
  }, [phase, exerciseIndex]);

  // ── AUTO-ADVANCE WHEN REST HITS 0 ──
  useEffect(() => {
    if (phase !== "rest" || restSeconds !== 0) return;
    // small delay so user sees "0"
    const t = setTimeout(() => goToNextExercise(), 800);
    return () => clearTimeout(t);
  }, [restSeconds, phase]);

  // ──────────────────────────────────
  // NAVIGATION
  // ──────────────────────────────────
  const goToNextExercise = useCallback(async () => {
    const nextIdx = exerciseIndex + 1;
    if (nextIdx >= exercises.length) {
      // last exercise done → show finish
      setPhase("done");
      stopTotal();
      setShowFinishModal(true);
      Vibration.vibrate([0, 100, 100, 200]);
      return;
    }
    clearRest();
    setExerciseIndex(nextIdx);
    setPhase("exercise");
    try { await fitnessApi.updateSessionIndex(session.id, nextIdx); } catch {}
  }, [exerciseIndex, exercises.length, session]);

  const onCompleteExercise = () => {
    if (phase !== "exercise") return;
    const currentEx = exercises[exerciseIndex];
    if (currentEx?.restSec) {
      setPhase("rest");
    } else {
      goToNextExercise();
    }
  };

  const skipRest = () => {
    clearRest();
    goToNextExercise();
  };

  // ──────────────────────────────────
  // SAVE WORKOUT
  // ──────────────────────────────────
  const saveWorkout = async () => {
    if (!session || saving) return;
    setSaving(true);
    const calories = Math.round((workout?.kcalPerMin ?? 5) * (totalSeconds / 60));
    try {
      await fitnessApi.completeSession(session.id, { seconds: totalSeconds, calories });
      setShowFinishModal(false);
      // Clear fitness cache so the weekly stats refresh after workout completion
      simpleCache.deleteByPrefix("fitness:");
      // Navigate first, then offer share so user lands on fitness page
      router.replace("/(tabs)/(personal)/fitness" as any);
      // Small delay so navigation completes before Alert appears
      setTimeout(() => {
        Alert.alert(
          "🎉 Hoàn thành buổi tập!",
          `Bạn vừa tập ${workout?.title ?? "workout"} trong ${Math.floor(totalSeconds / 60)} phút, đốt ${calories} kcal. Chia sẻ thành tích lên cộng đồng?`,
          [
            { text: "Bỏ qua", style: "cancel" },
            {
              text: "Chia sẻ",
              onPress: async () => {
                try {
                  await communityApi.createPost({
                    content: `💪 Vừa hoàn thành buổi tập "${workout?.title ?? "Workout"}"!\n⏱ Thời gian: ${Math.floor(totalSeconds / 60)} phút\n🔥 Calories: ${calories} kcal\n#HealthHub #Fitness #Workout`,
                  });
                } catch {}
              },
            },
          ]
        );
      }, 400);
    } catch {
      Alert.alert("Lỗi", "Không thể lưu buổi tập.");
      setSaving(false);
    }
  };

  const confirmExit = () => {
    Alert.alert("Thoát buổi tập?", "Tiến trình sẽ không được lưu.", [
      { text: "Tiếp tục tập", style: "cancel" },
      { text: "Thoát", style: "destructive", onPress: () => { stopTotal(); clearRest(); router.back(); } },
    ]);
  };

  // ──────────────────────────────────
  // LOADING
  // ──────────────────────────────────
  if (!session || !workout || exercises.length === 0) {
    return (
      <View style={[styles.loading, { backgroundColor: colors.bgPrimary }]}>
        <LinearGradient colors={colors.gradientPrimary} style={styles.loadingIcon}>
          <Dumbbell size={32} color="white" />
        </LinearGradient>
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Đang chuẩn bị buổi tập...</Text>
      </View>
    );
  }

  const currentEx = exercises[exerciseIndex];
  const progress  = exerciseIndex / exercises.length;
  const progressPct = Math.round(progress * 100);
  const R = 36;
  const circumference = 2 * Math.PI * R;
  const strokeOffset = circumference - progress * circumference;

  const fmt = (s: number) => `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  return (
    <View style={[styles.root, { backgroundColor: colors.bgPrimary }]}>
      <StatusBar barStyle="light-content" />

      {/* ── HEADER ── */}
      <LinearGradient colors={["#1e293b", colors.bgPrimary]} style={styles.header}>
        <TouchableOpacity style={[styles.iconBtn, { backgroundColor: colors.bgCard, borderColor: colors.border }]} onPress={confirmExit}>
          <X size={20} color={colors.textSecondary} />
        </TouchableOpacity>
        <View style={{ alignItems: "center" }}>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>{workout.title}</Text>
          <Text style={[styles.headerSub, { color: colors.textMuted }]}>
            Bài {exerciseIndex + 1}/{exercises.length}
            {phase === "rest" ? " · Nghỉ ngơi" : ""}
          </Text>
        </View>
        <View style={styles.timerBox}>
          <Clock size={12} color={colors.textMuted} />
          <Text style={[styles.timerText, { color: colors.textSecondary }]}>{fmt(totalSeconds)}</Text>
        </View>
      </LinearGradient>

      {/* ── Video / ảnh bài tập hiện tại ── */}
      <View style={[styles.gifBox, { backgroundColor: colors.bgCard }]}>
        {currentEx.gifUrl ? (
          <>
            {currentEx.gifUrl.endsWith('.mp4') ? (
              <ExerciseVideo uri={currentEx.gifUrl} style={styles.gifImage} />
            ) : (
              <Image
                source={{ uri: currentEx.gifUrl }}
                style={styles.gifImage}
                resizeMode="contain"
              />
            )}
            <LinearGradient
              colors={["transparent", "rgba(10,15,31,0.7)"]}
              style={styles.gifGrad}
              pointerEvents="none"
            />
          </>
        ) : (
          <LinearGradient colors={["#1e293b", colors.bgPrimary]} style={styles.noGif}>
            <Dumbbell size={40} color={colors.primary} />
          </LinearGradient>
        )}
        {/* progress bar */}
        <View style={[styles.vidProgressBg, { backgroundColor: colors.border }]}>
          <LinearGradient
            colors={colors.gradientPrimary}
            style={[styles.vidProgressFill, { width: `${progressPct}%` }]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          />
        </View>
      </View>

      {/* ── REST OVERLAY ── */}
      {phase === "rest" && (
        <View style={styles.restOverlay}>
          <LinearGradient colors={["#0f172a", "#0d1f2d", "#0a1628"]} style={styles.restBox}>
            <Text style={[styles.restTitle, { color: "#22d3ee" }]}>Nghỉ ngơi</Text>
            <View style={styles.restCircleWrap}>
              <Svg height="160" width="160">
                <Defs>
                  <LG id="restGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <Stop offset="0%" stopColor="#22d3ee" />
                    <Stop offset="100%" stopColor="#6366f1" />
                  </LG>
                </Defs>
                <Circle cx="80" cy="80" r={64} stroke="#1e3a4a" strokeWidth="10" fill="none" />
                <Circle
                  cx="80" cy="80" r={64}
                  stroke="url(#restGrad)" strokeWidth="10"
                  strokeDasharray={2 * Math.PI * 64}
                  strokeDashoffset={2 * Math.PI * 64 * (restSeconds / (exercises[exerciseIndex]?.restSec ?? 30))}
                  strokeLinecap="round" fill="none" rotation="-90" origin="80,80"
                />
              </Svg>
              <View style={styles.restInner}>
                <Text style={[styles.restSeconds, { color: "#ffffff" }]}>{restSeconds}</Text>
                <Text style={[styles.restSecLabel, { color: "#94a3b8" }]}>giây</Text>
              </View>
            </View>
            <Text style={[styles.restNext, { color: "#cbd5e1" }]}>
              Tiếp theo: {exercises[exerciseIndex + 1]?.name ?? "Hoàn thành 🎉"}
            </Text>
            <TouchableOpacity onPress={skipRest} style={[styles.skipBtn, { borderColor: "#1e3a4a", backgroundColor: "#0f2433" }]}>
              <SkipForward size={16} color="#22d3ee" />
              <Text style={[styles.skipText, { color: "#22d3ee" }]}>Bỏ qua nghỉ</Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>
      )}

      {/* ── BODY ── */}
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.bodyContent}>

        {/* Current exercise card */}
        <View style={[styles.currentCard, { borderColor: colors.primary + "44" }]}>
          <LinearGradient
            colors={[colors.primary + "30", colors.primary + "08"]}
            style={styles.currentCardInner}
          >
            <View style={styles.currentTop}>
              <LinearGradient colors={colors.gradientPrimary} style={styles.activeIdx}>
                <Text style={styles.activeIdxText}>{exerciseIndex + 1}</Text>
              </LinearGradient>
              <View style={{ flex: 1 }}>
                <Text style={[styles.currentName, { color: colors.textPrimary }]}>{currentEx.name}</Text>
                <View style={styles.currentMeta}>
                  {currentEx.sets && (
                    <Text style={[styles.metaChip, { color: colors.primary, backgroundColor: colors.primaryBg }]}>{currentEx.sets} hiệp</Text>
                  )}
                  {currentEx.reps && (
                    <Text style={[styles.metaChip, { backgroundColor: colors.successBg, color: colors.success }]}>
                      {currentEx.reps} reps
                    </Text>
                  )}
                  {currentEx.durationSec && (
                    <Text style={[styles.metaChip, { backgroundColor: colors.orangeBg, color: colors.orange }]}>
                      {currentEx.durationSec}s
                    </Text>
                  )}
                </View>
              </View>
              {/* SVG progress ring */}
              <View style={styles.ring}>
                <Svg height="80" width="80">
                  <Defs>
                    <LG id="g1" x1="0%" y1="0%" x2="100%" y2="100%">
                      <Stop offset="0%" stopColor="#3b82f6" />
                      <Stop offset="100%" stopColor="#8b5cf6" />
                    </LG>
                  </Defs>
                  <Circle cx="40" cy="40" r={R} stroke={colors.border} strokeWidth="5" fill="none" />
                  <Circle
                    cx="40" cy="40" r={R}
                    stroke="url(#g1)" strokeWidth="5"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeOffset}
                    strokeLinecap="round" fill="none"
                    rotation="-90" origin="40,40"
                  />
                </Svg>
                <Text style={[styles.ringText, { color: colors.textPrimary }]}>{progressPct}%</Text>
              </View>
            </View>
            {currentEx.description && (
              <Text style={[styles.currentDesc, { color: colors.textMuted }]}>{currentEx.description}</Text>
            )}
          </LinearGradient>
        </View>

        {/* Stats row */}
        <View style={[styles.statsRow, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
          <View style={styles.statBox}>
            <Flame size={16} color={colors.orange} />
            <Text style={[styles.statVal, { color: colors.textPrimary }]}>{Math.round((workout.kcalPerMin ?? 5) * (totalSeconds / 60))}</Text>
            <Text style={[styles.statLbl, { color: colors.textMuted }]}>kcal</Text>
          </View>
          <View style={styles.statBox}>
            <CheckCircle2 size={16} color={colors.success} />
            <Text style={[styles.statVal, { color: colors.textPrimary }]}>{exerciseIndex}</Text>
            <Text style={[styles.statLbl, { color: colors.textMuted }]}>hoàn thành</Text>
          </View>
          <View style={styles.statBox}>
            <Clock size={16} color={colors.primary} />
            <Text style={[styles.statVal, { color: colors.textPrimary }]}>{fmt(totalSeconds)}</Text>
            <Text style={[styles.statLbl, { color: colors.textMuted }]}>thời gian</Text>
          </View>
        </View>

        {/* Exercise list */}
        <Text style={[styles.listTitle, { color: colors.textSecondary }]}>Tất cả bài tập</Text>
        {exercises.map((ex, i) => {
          const isDone   = i < exerciseIndex;
          const isActive = i === exerciseIndex;
          return (
            <View
              key={i}
              style={[
                styles.exItem,
                { backgroundColor: colors.bgCard, borderColor: colors.border },
                isActive && styles.exItemActive,
                isActive && { borderColor: colors.primary, backgroundColor: colors.primaryBg },
                isDone   && styles.exItemDone,
              ]}
            >
              <View style={[styles.exBullet, { backgroundColor: colors.bgSecondary, borderColor: colors.border }, isActive && { backgroundColor: colors.primaryBg, borderColor: colors.primary }, isDone && { backgroundColor: colors.successBg, borderColor: colors.success }]}>
                {isDone
                  ? <CheckCircle2 size={16} color={colors.success} />
                  : <Text style={[styles.exBulletText, { color: colors.textMuted }, isActive && { color: colors.primary }]}>{i + 1}</Text>
                }
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.exItemName, { color: colors.textSecondary }, isDone && styles.exItemNameDone, isDone && { color: colors.textMuted }, isActive && { color: colors.textPrimary, fontWeight: "700" }]}>
                  {ex.name}
                </Text>
                <Text style={[styles.exItemMeta, { color: colors.textMuted }]}>
                  {[
                    ex.sets ? `${ex.sets} hiệp` : null,
                    ex.reps ? `${ex.reps} reps` : null,
                    ex.durationSec ? `${ex.durationSec}s` : null,
                  ].filter(Boolean).join(" · ")}
                </Text>
              </View>
              {isActive && <View style={[styles.activeDot, { backgroundColor: colors.primary }]} />}
            </View>
          );
        })}

        <View style={{ height: 140 }} />
      </ScrollView>

      {/* ── CTA BUTTON ── */}
      {phase !== "rest" && phase !== "done" && (
        <View style={[styles.ctaWrap, { backgroundColor: colors.bgPrimary, borderTopColor: colors.border }]}>
          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.ctaTouchable}
            onPress={onCompleteExercise}
          >
            <LinearGradient
              colors={exerciseIndex >= exercises.length - 1 ? [colors.success, "#16a34a"] : colors.gradientPrimary}
              style={styles.ctaBtn}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            >
              {exerciseIndex >= exercises.length - 1 ? (
                <>
                  <Trophy size={22} color="white" />
                  <Text style={styles.ctaText}>Hoàn thành buổi tập</Text>
                </>
              ) : (
                <>
                  <CheckCircle2 size={22} color="white" />
                  <Text style={styles.ctaText}>Xong bài · Tiếp theo</Text>
                  <ChevronRight size={20} color="white" />
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}

      {/* ── FINISH MODAL ── */}
      <Modal visible={showFinishModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
            <LinearGradient colors={colors.gradientSuccess} style={styles.modalIconWrap}>
              <Trophy size={40} color="white" />
            </LinearGradient>
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Xuất sắc! 🎉</Text>
            <Text style={[styles.modalSub, { color: colors.textMuted }]}>Bạn đã hoàn thành toàn bộ bài tập</Text>

            <View style={styles.modalStats}>
              <View style={styles.modalStat}>
                <Text style={[styles.modalStatVal, { color: colors.textPrimary }]}>{fmt(totalSeconds)}</Text>
                <Text style={[styles.modalStatLbl, { color: colors.textMuted }]}>Thời gian</Text>
              </View>
              <View style={styles.modalStat}>
                <Text style={[styles.modalStatVal, { color: colors.textPrimary }]}>{exercises.length}</Text>
                <Text style={[styles.modalStatLbl, { color: colors.textMuted }]}>Bài tập</Text>
              </View>
              <View style={styles.modalStat}>
                <Text style={[styles.modalStatVal, { color: colors.textPrimary }]}>
                  {Math.round((workout.kcalPerMin ?? 5) * (totalSeconds / 60))}
                </Text>
                <Text style={[styles.modalStatLbl, { color: colors.textMuted }]}>kcal</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.modalSaveWrap}
              onPress={saveWorkout}
              disabled={saving}
            >
              <LinearGradient colors={colors.gradientPrimary} style={styles.modalSaveBtn}>
                <Text style={styles.modalSaveText}>{saving ? "Đang lưu..." : "Lưu & Hoàn thành"}</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => { stopTotal(); router.back(); }}
              style={styles.modalSkipSave}
            >
              <Text style={[styles.modalSkipSaveText, { color: colors.textMuted }]}>Không lưu</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },

  loading: { flex: 1, justifyContent: "center", alignItems: "center", gap: Spacing.base },
  loadingIcon: { width: 72, height: 72, borderRadius: 36, justifyContent: "center", alignItems: "center" },
  loadingText: { ...Typography.base },

  // HEADER
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingTop: 52, paddingBottom: Spacing.md, paddingHorizontal: Spacing.base,
  },
  iconBtn: {
    width: 40, height: 40, borderRadius: Radius.md,
    borderWidth: 1,
    justifyContent: "center", alignItems: "center",
  },
  headerTitle: { ...Typography.md, fontWeight: "700" },
  headerSub: { ...Typography.xs, textAlign: "center", marginTop: 2 },
  timerBox: { flexDirection: "row", alignItems: "center", gap: 4 },
  timerText: { ...Typography.sm, fontWeight: "600" },

  // GIF
  gifBox: { width: "100%", height: 220 },
  gifImage: { width: "100%", height: "100%" },
  gifGrad: { position: "absolute", bottom: 0, left: 0, right: 0, height: 60 },
  noGif: { flex: 1, justifyContent: "center", alignItems: "center" },
  vidProgressBg: { position: "absolute", bottom: 0, left: 0, right: 0, height: 3 },
  vidProgressFill: { height: "100%" },

  // REST OVERLAY
  restOverlay: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, zIndex: 10 },
  restBox: { flex: 1, justifyContent: "center", alignItems: "center", gap: Spacing.lg },
  restTitle: { ...Typography.xxxl, fontWeight: "800" },
  restCircleWrap: { position: "relative", justifyContent: "center", alignItems: "center" },
  restInner: { position: "absolute", alignItems: "center" },
  restSeconds: { fontSize: 42, fontWeight: "900" },
  restSecLabel: { ...Typography.sm },
  restNext: { ...Typography.base, textAlign: "center", paddingHorizontal: 32 },
  skipBtn: {
    flexDirection: "row", alignItems: "center", gap: Spacing.sm,
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm,
    borderRadius: Radius.full, borderWidth: 1,
  },
  skipText: { ...Typography.sm },

  // BODY
  bodyContent: { paddingHorizontal: Spacing.base, paddingTop: Spacing.base },

  currentCard: { borderRadius: Radius.xl, overflow: "hidden", marginBottom: Spacing.base, borderWidth: 1 },
  currentCardInner: { padding: Spacing.base },
  currentTop: { flexDirection: "row", alignItems: "center", gap: Spacing.md },
  activeIdx: {
    width: 44, height: 44, borderRadius: Radius.md,
    justifyContent: "center", alignItems: "center",
  },
  activeIdxText: { color: "white", fontWeight: "800", fontSize: 18 },
  currentName: { ...Typography.lg, fontWeight: "700" },
  currentMeta: { flexDirection: "row", gap: Spacing.sm, flexWrap: "wrap", marginTop: 4 },
  metaChip: {
    ...Typography.xs, fontWeight: "600",
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: Radius.full,
  },
  ring: { width: 80, height: 80, justifyContent: "center", alignItems: "center" },
  ringText: { position: "absolute", fontWeight: "700", fontSize: 14 },
  currentDesc: { ...Typography.sm, marginTop: Spacing.sm, lineHeight: 18 },

  statsRow: {
    flexDirection: "row", justifyContent: "space-around",
    borderRadius: Radius.xl, borderWidth: 1,
    padding: Spacing.md, marginBottom: Spacing.base,
  },
  statBox: { alignItems: "center", gap: 4 },
  statVal: { ...Typography.xl, fontWeight: "700" },
  statLbl: { ...Typography.xs },

  listTitle: { ...Typography.sm, fontWeight: "600", marginBottom: Spacing.sm, letterSpacing: 0.5 },

  exItem: {
    flexDirection: "row", alignItems: "center", gap: Spacing.md,
    borderRadius: Radius.lg, borderWidth: 1,
    padding: Spacing.md, marginBottom: Spacing.sm,
  },
  exItemActive: {},
  exItemDone: { opacity: 0.5 },
  exBullet: {
    width: 32, height: 32, borderRadius: Radius.sm,
    borderWidth: 1,
    justifyContent: "center", alignItems: "center",
  },
  exBulletActive: {},
  exBulletDone: {},
  exBulletText: { fontWeight: "700", fontSize: 13 },
  exItemName: { ...Typography.base },
  exItemNameDone: { textDecorationLine: "line-through" },
  exItemNameActive: { fontWeight: "700" },
  exItemMeta: { ...Typography.xs, marginTop: 2 },
  activeDot: { width: 8, height: 8, borderRadius: 4 },

  // CTA
  ctaWrap: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    paddingHorizontal: Spacing.base, paddingBottom: 28, paddingTop: Spacing.sm,
    borderTopWidth: 1,
  },
  ctaTouchable: { borderRadius: Radius.xl, overflow: "hidden" },
  ctaBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: Spacing.sm, paddingVertical: 18 },
  ctaText: { color: "white", ...Typography.lg, fontWeight: "700" },

  // FINISH MODAL
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.75)", justifyContent: "center", alignItems: "center", padding: Spacing.lg },
  modalBox: {
    borderRadius: Radius.xxl, borderWidth: 1,
    padding: Spacing.xl, alignItems: "center", width: "100%",
  },
  modalIconWrap: { width: 80, height: 80, borderRadius: 40, justifyContent: "center", alignItems: "center", marginBottom: Spacing.base },
  modalTitle: { ...Typography.xxxl, fontWeight: "800" },
  modalSub: { ...Typography.base, textAlign: "center", marginTop: 4, marginBottom: Spacing.lg },
  modalStats: { flexDirection: "row", gap: Spacing.xl, marginBottom: Spacing.xl },
  modalStat: { alignItems: "center" },
  modalStatVal: { ...Typography.xxl, fontWeight: "700" },
  modalStatLbl: { ...Typography.xs },
  modalSaveWrap: { width: "100%", borderRadius: Radius.xl, overflow: "hidden", marginBottom: Spacing.sm },
  modalSaveBtn: { paddingVertical: 16, alignItems: "center" },
  modalSaveText: { color: "white", ...Typography.lg, fontWeight: "700" },
  modalSkipSave: { paddingVertical: Spacing.sm },
  modalSkipSaveText: { ...Typography.sm },
});
