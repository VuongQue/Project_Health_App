import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  Image,
} from "react-native";
import { Video, ResizeMode } from "expo-av";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import {
  ArrowLeft, Flame, Dumbbell, Clock, Play,
  ChevronRight, Target, Zap,
} from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import fitnessApi from "@/src/api/fitnessApi";
import { useColors, Colors, Spacing, Radius, Typography } from "@/src/theme";

const LEVEL_COLORS: Record<string, { bg: string; fg: string }> = {
  Beginner:     { bg: Colors.successBg, fg: Colors.success },
  Intermediate: { bg: Colors.warningBg, fg: Colors.warning },
  Advanced:     { bg: Colors.dangerBg,  fg: Colors.danger },
};

export default function WorkoutDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const colors = useColors();
  const { t } = useTranslation();
  const workoutId = Array.isArray(id) ? id[0] : id;

  const [workout, setWorkout] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadWorkout = async () => {
    try {
      const res = await fitnessApi.getWorkoutById(workoutId);
      setWorkout(res.data);
    } catch {
      // empty state
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadWorkout(); }, []);

  if (loading) {
    return (
      <View style={[styles.loadingBox, { backgroundColor: colors.bgPrimary }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!workout) {
    return (
      <View style={[styles.loadingBox, { backgroundColor: colors.bgPrimary }]}>
        <Text style={{ color: colors.textMuted }}>{t("workout.not_found")}</Text>
      </View>
    );
  }

  const lvCol = LEVEL_COLORS[workout.level] ?? LEVEL_COLORS.Beginner;
  const totalExercises = workout.exercises?.length ?? 0;
  const estimatedMin = Math.round(totalExercises * 2.5);

  return (
    <View style={[styles.root, { backgroundColor: colors.bgPrimary }]}>
      <StatusBar barStyle="light-content" />

      {/* HEADER với video/ảnh preview bài tập đầu tiên */}
      <View style={styles.videoContainer}>
        {workout.exercises?.[0]?.gifUrl ? (
          <>
            {workout.exercises[0].gifUrl.endsWith('.mp4') ? (
              <Video
                source={{ uri: workout.exercises[0].gifUrl }}
                style={styles.video}
                resizeMode={ResizeMode.COVER}
                shouldPlay
                isLooping
                isMuted
              />
            ) : (
              <Image
                source={{ uri: workout.exercises[0].gifUrl }}
                style={styles.video}
                resizeMode="cover"
              />
            )}
            <LinearGradient
              colors={["rgba(10,15,31,0.5)", "transparent", "rgba(10,15,31,0.95)"]}
              style={styles.videoGradient}
              pointerEvents="none"
            />
          </>
        ) : (
          <View style={styles.noVideoBox}>
            <LinearGradient colors={Colors.gradientPrimary} style={styles.noVideoGradient}>
              <Dumbbell size={48} color="white" />
            </LinearGradient>
          </View>
        )}
        {/* Top bar luôn hiển thị */}
        <View style={styles.videoTopBar}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <ArrowLeft size={22} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.body}>
        {/* TITLE + BADGES */}
        <Text style={[styles.workoutTitle, { color: colors.textPrimary }]}>{workout.title}</Text>

        <View style={styles.badgeRow}>
          <View style={[styles.badge, { backgroundColor: lvCol.bg }]}>
            <Text style={[styles.badgeText, { color: lvCol.fg }]}>{workout.level}</Text>
          </View>
          <View style={[styles.badge, { backgroundColor: colors.primaryBg }]}>
            <Target size={11} color={colors.primary} />
            <Text style={[styles.badgeText, { color: colors.primary }]}>{workout.muscleGroup}</Text>
          </View>
          {workout.category && (
            <View style={[styles.badge, { backgroundColor: colors.purpleBg }]}>
              <Text style={[styles.badgeText, { color: colors.purple }]}>{workout.category}</Text>
            </View>
          )}
        </View>

        {/* STATS ROW */}
        <View style={[styles.statsCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
          <StatItem icon={<Flame size={18} color={colors.orange} />} value={`${workout.kcalPerMin}`} label={t("workout.kcal_per_min")} textPrimary={colors.textPrimary} textMuted={colors.textMuted} />
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <StatItem icon={<Dumbbell size={18} color={colors.primary} />} value={`${totalExercises}`} label={t("workout.exercises_count")} textPrimary={colors.textPrimary} textMuted={colors.textMuted} />
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <StatItem icon={<Clock size={18} color={colors.success} />} value={`~${estimatedMin}`} label={t("workout.duration")} textPrimary={colors.textPrimary} textMuted={colors.textMuted} />
        </View>

        {/* DESCRIPTION */}
        {workout.description && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>{t("workout.description")}</Text>
            <Text style={[styles.description, { color: colors.textSecondary }]}>{workout.description}</Text>
          </View>
        )}

        {/* EXERCISE LIST */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>{t("workout.exercise_list")}</Text>
            <View style={[styles.badge, { backgroundColor: colors.primaryBg }]}>
              <Text style={[styles.badgeText, { color: colors.primary }]}>{totalExercises} {t("workout.total_exercises")}</Text>
            </View>
          </View>

          {workout.exercises?.map((ex: any, i: number) => (
            <View key={i} style={[styles.exRow, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
              {/* GIF thumbnail hoặc số thứ tự */}
              {ex.gifUrl ? (
                <View style={styles.exGifWrap}>
                  {ex.gifUrl.endsWith('.mp4') ? (
                    <Video
                      source={{ uri: ex.gifUrl }}
                      style={styles.exGif}
                      resizeMode={ResizeMode.COVER}
                      shouldPlay
                      isLooping
                      isMuted
                    />
                  ) : (
                    <Image
                      source={{ uri: ex.gifUrl }}
                      style={styles.exGif}
                      resizeMode="cover"
                    />
                  )}
                  <View style={[styles.exGifBadge, { backgroundColor: colors.primary }]}>
                    <Text style={styles.exGifBadgeText}>{i + 1}</Text>
                  </View>
                </View>
              ) : (
                <LinearGradient
                  colors={[colors.primary + "30", colors.primary + "10"]}
                  style={styles.exNum}
                >
                  <Text style={[styles.exNumText, { color: colors.primary }]}>{i + 1}</Text>
                </LinearGradient>
              )}

              <View style={{ flex: 1 }}>
                <Text style={[styles.exName, { color: colors.textPrimary }]}>{ex.name}</Text>
                <View style={styles.exMeta}>
                  {ex.sets && (
                    <View style={[styles.exTag, { backgroundColor: colors.primaryBg }]}>
                      <Zap size={10} color={colors.primary} />
                      <Text style={[styles.exTagText, { color: colors.primary }]}>{ex.sets} {t("workout.sets")}</Text>
                    </View>
                  )}
                  {ex.reps && (
                    <View style={[styles.exTag, { backgroundColor: colors.successBg }]}>
                      <Text style={[styles.exTagText, { color: colors.success }]}>{ex.reps} {t("workout.reps")}</Text>
                    </View>
                  )}
                  {ex.durationSec && (
                    <View style={[styles.exTag, { backgroundColor: colors.orangeBg }]}>
                      <Clock size={10} color={colors.orange} />
                      <Text style={[styles.exTagText, { color: colors.orange }]}>{ex.durationSec}s</Text>
                    </View>
                  )}
                  {ex.restSec && (
                    <View style={[styles.exTag, { backgroundColor: colors.bgSecondary }]}>
                      <Text style={[styles.exTagText, { color: colors.textMuted }]}>{t("workout.rest")} {ex.restSec}s</Text>
                    </View>
                  )}
                </View>
                {ex.description && (
                  <Text style={[styles.exDesc, { color: colors.textMuted }]} numberOfLines={2}>{ex.description}</Text>
                )}
              </View>
            </View>
          ))}
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* START BUTTON */}
      <View style={[styles.ctaArea, { backgroundColor: colors.bgPrimary, borderTopColor: colors.border }]}>
        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.ctaWrap}
          onPress={() => router.push({ pathname: "/workout/start/[id]", params: { id: workoutId } })}
        >
          <LinearGradient colors={colors.gradientPrimary} style={styles.ctaBtn}>
            <Play size={20} color="white" fill="white" />
            <Text style={styles.ctaText}>{t("workout.start_button")}</Text>
            <ChevronRight size={20} color="white" />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function StatItem({ icon, value, label, textPrimary, textMuted }: { icon: React.ReactNode; value: string; label: string; textPrimary: string; textMuted: string }) {
  return (
    <View style={styles.statItem}>
      {icon}
      <Text style={[styles.statValue, { color: textPrimary }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: textMuted }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },

  loadingBox: {
    flex: 1, justifyContent: "center", alignItems: "center",
  },

  // ── HEADER / GIF PREVIEW ──
  videoContainer: { width: "100%", height: 280, backgroundColor: "#141E30" },
  video: { width: "100%", height: "100%" },
  videoGradient: { position: "absolute", inset: 0 },
  videoTopBar: {
    position: "absolute", top: 48, left: Spacing.base, right: Spacing.base,
    flexDirection: "row",
  },
  backBtn: {
    width: 40, height: 40, borderRadius: Radius.md,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center", alignItems: "center",
  },
  noVideoBox: {
    flex: 1, justifyContent: "center", alignItems: "center",
    backgroundColor: "#141E30",
  },
  noVideoGradient: {
    width: 80, height: 80, borderRadius: 40,
    justifyContent: "center", alignItems: "center",
  },

  // ── BODY ──
  body: { paddingHorizontal: Spacing.base, paddingTop: Spacing.lg },

  workoutTitle: { ...Typography.display, fontWeight: "800", marginBottom: Spacing.sm },

  badgeRow: { flexDirection: "row", gap: Spacing.sm, flexWrap: "wrap", marginBottom: Spacing.base },
  badge: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: Radius.full,
  },
  badgeText: { ...Typography.xs, fontWeight: "700" },

  statsCard: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-around",
    borderRadius: Radius.xl, borderWidth: 1,
    padding: Spacing.base, marginBottom: Spacing.lg,
  },
  statItem: { alignItems: "center", gap: 4 },
  statValue: { ...Typography.xl, fontWeight: "700" },
  statLabel: { ...Typography.xs },
  statDivider: { width: 1, height: 36 },

  section: { marginBottom: Spacing.lg },
  sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: Spacing.sm },
  sectionTitle: { ...Typography.lg, fontWeight: "700" },
  description: { ...Typography.base, lineHeight: 22 },

  exRow: {
    flexDirection: "row", alignItems: "flex-start", gap: Spacing.md,
    borderRadius: Radius.lg, borderWidth: 1,
    padding: Spacing.md, marginBottom: Spacing.sm,
  },
  exGifWrap: {
    width: 60, height: 60, borderRadius: Radius.md,
    overflow: "hidden", position: "relative",
  },
  exGif: { width: "100%", height: "100%" },
  exGifBadge: {
    position: "absolute", bottom: 2, right: 2,
    width: 18, height: 18, borderRadius: 9,
    justifyContent: "center", alignItems: "center",
  },
  exGifBadgeText: { color: "white", fontSize: 10, fontWeight: "800" },
  exNum: {
    width: 36, height: 36, borderRadius: Radius.md,
    justifyContent: "center", alignItems: "center",
  },
  exNumText: { fontWeight: "700", fontSize: 14 },
  exName: { ...Typography.md, fontWeight: "600" },
  exMeta: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 5 },
  exTag: {
    flexDirection: "row", alignItems: "center", gap: 3,
    paddingHorizontal: 7, paddingVertical: 3,
    borderRadius: Radius.full,
  },
  exTagText: { ...Typography.xs, fontWeight: "600" },
  exDesc: { ...Typography.sm, marginTop: 4, lineHeight: 18 },

  ctaArea: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    paddingHorizontal: Spacing.base,
    paddingBottom: 28,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
  },
  ctaWrap: { borderRadius: Radius.xl, overflow: "hidden" },
  ctaBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: Spacing.sm, paddingVertical: 18,
  },
  ctaText: { color: "white", ...Typography.lg, fontWeight: "700" },
});
