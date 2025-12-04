import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";

import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, Flame, Dumbbell, Clock, Play } from "lucide-react-native";
import { VideoView, useVideoPlayer } from "expo-video";
import fitnessApi from "@/src/api/fitnessApi";

export default function WorkoutDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const workoutId = Array.isArray(id) ? id[0] : id;

  const [workout, setWorkout] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // =============================
  // LOAD WORKOUT DETAIL
  // =============================
  const loadWorkout = async () => {
    console.log("🚀 LOAD WORKOUT ID =", workoutId);
    try {
      const res = await fitnessApi.getWorkoutById(workoutId);
      console.log("📌 WORKOUT LOADED:", res.data);
      setWorkout(res.data);
    } catch (e) {
      console.log("❌ loadWorkout ERROR:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWorkout();
  }, []);

  // =============================
  // VIDEO PREVIEW (KHÔNG PLAY)
  // =============================
  const player = useVideoPlayer(workout?.videoUrl ?? null, (p) => {
    if (!p) return;
    p.pause();        // đứng im như thumbnail
    p.muted = true;   // tắt âm
    p.loop = false;
  });

  // =============================
  // LOADING UI
  // =============================
  if (loading || !workout) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      
      {/* HEADER */}
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={22} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{workout.title}</Text>
        <View style={{ width: 22 }} />
      </View>

      {/* VIDEO PREVIEW THUMBNAIL */}
      <View style={styles.thumbBox}>
        {workout.videoUrl ? (
          <>
            <VideoView
              style={styles.video}
              player={player}
              nativeControls={false}
              allowsFullscreen={false}
              allowsPictureInPicture={false}
            />

            {/* Màn che */}
            <View style={styles.thumbOverlay} />

            {/* Icon Play */}
            <View style={styles.playOverlay}>
              <Play size={48} color="rgba(255,255,255,0.8)" />
            </View>
          </>
        ) : (
          <View style={styles.noVideoBox}>
            <Dumbbell size={40} color="#38bdf8" />
            <Text style={{ color: "#94a3b8" }}>No video</Text>
          </View>
        )}
      </View>

      {/* DESCRIPTION */}
      <View style={styles.videoDescriptionBox}>
        <Text style={styles.videoTitle}>{workout.title}</Text>
        <Text style={styles.videoMeta}>
          {workout.muscleGroup} • {workout.level}
        </Text>

        <Text style={styles.videoDescription}>
          {workout.description || "No description"}
        </Text>
      </View>

      {/* EXERCISES */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Exercises</Text>

        {workout.exercises.map((ex: any, idx: number) => (
          <View key={idx} style={styles.exerciseItem}>
            <Text style={styles.exerciseName}>
              {idx + 1}. {ex.name}
            </Text>

            <View style={styles.row}>
              {ex.durationSec && (
                <>
                  <Clock size={16} color="#38bdf8" />
                  <Text style={styles.exerciseMeta}>{ex.durationSec}s</Text>
                </>
              )}

              {ex.reps && (
                <>
                  <Dumbbell size={16} color="#4ade80" />
                  <Text style={styles.exerciseMeta}>{ex.reps} reps</Text>
                </>
              )}
            </View>
          </View>
        ))}
      </View>

      {/* START WORKOUT BUTTON */}
      <TouchableOpacity
        style={styles.startBtn}
        onPress={() =>
          router.push({
            pathname: "/workout/start/[id]",
            params: { id: workoutId },
          })
        }
      >
        <Text style={styles.startText}>Start Workout</Text>
      </TouchableOpacity>

    </ScrollView>
  );
}

/* =============================
   🎨 STYLES
============================= */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f172a", padding: 16 },

  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0f172a",
  },

  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },

  backBtn: { padding: 6 },

  headerTitle: { color: "white", fontSize: 20, fontWeight: "600" },

  /* THUMBNAIL */
  thumbBox: {
    width: "100%",
    height: 220,
    backgroundColor: "#1e293b",
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 16,
  },

  video: {
    width: "100%",
    height: "100%",
  },

  thumbOverlay: {
    position: "absolute",
    inset: 0,
    backgroundColor: "rgba(0,0,0,0.28)",
  },

  playOverlay: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: [{ translateX: -24 }, { translateY: -24 }],
  },

  noVideoBox: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  /* DESCRIPTION */
  videoDescriptionBox: {
    backgroundColor: "#1e293b",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#334155",
    marginBottom: 20,
  },

  videoTitle: { color: "white", fontSize: 20, fontWeight: "700" },
  videoMeta: { color: "#94a3b8", marginBottom: 10 },
  videoDescription: { color: "#cbd5e1", lineHeight: 20 },

  /* EXERCISES */
  card: {
    backgroundColor: "#1e293b",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#334155",
    marginBottom: 20,
  },

  sectionTitle: { color: "white", fontSize: 18, fontWeight: "600" },

  row: { flexDirection: "row", alignItems: "center", gap: 6 },

  exerciseItem: {
    marginTop: 14,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#334155",
  },

  exerciseName: { color: "white", fontSize: 15, fontWeight: "600" },
  exerciseMeta: { color: "#94a3b8", fontSize: 13 },

  /* BUTTON */
  startBtn: {
    backgroundColor: "#2563eb",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 40,
  },

  startText: { color: "white", fontSize: 18, fontWeight: "700" },
});
