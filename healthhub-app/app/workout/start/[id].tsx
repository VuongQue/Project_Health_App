import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from "react-native";

import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, Share2, CheckCircle2, Flame } from "lucide-react-native";

import { LinearGradient } from "expo-linear-gradient";
import Svg, { Circle, Defs, LinearGradient as LG, Stop } from "react-native-svg";

import fitnessApi from "@/src/api/fitnessApi";
import { VideoView, useVideoPlayer } from "expo-video";

export default function WorkoutTrainingScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();

  const [session, setSession] = useState<any>(null);
  const [workout, setWorkout] = useState<any>(null);
  const [exerciseIndex, setExerciseIndex] = useState(0);

  // Timer
  const [seconds, setSeconds] = useState(0);
  const timerRef = useRef<any>(null);

  // Auto-hide controls
  const [showControls, setShowControls] = useState(false);

  const calories = Math.round(
    (workout?.kcalPerMin ?? 5) * (seconds / 60)
  );

  // Video player
  const player = useVideoPlayer(null, (p) => {
    p.loop = false;
  });

  const [isPlaying, setIsPlaying] = useState(false);

  // Listen playing state
  useEffect(() => {
    const sub = player.addListener("playingChange", (event) => {
      const playing = event.isPlaying;
      setIsPlaying(playing);

      if (playing) startTimer();
      else stopTimer();
    });

    return () => sub.remove();
  }, []);

  // START TIMER
  const startTimer = () => {
    if (timerRef.current) return;
    timerRef.current = setInterval(() => {
      setSeconds((s) => s + 1);
    }, 1000);
  };

  // STOP TIMER
  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  // Cleanup timer + video
  useEffect(() => {
    return () => {
      stopTimer();
      try {
        player.pause();
        player.replace(null);
      } catch {}
    };
  }, []);

  // LOAD SESSION + WORKOUT
  const loadSessionData = async () => {
    try {
      const wid = Number(id);

      const sessionRes = await fitnessApi.startSession(wid);
      setSession(sessionRes.data);

      const detail = await fitnessApi.getWorkoutById(wid);
      setWorkout(detail.data);

      setExerciseIndex(sessionRes.data.currentExerciseIndex);

      if (detail.data.videoUrl) {
        player.replace(detail.data.videoUrl);
      }
    } catch (e) {
      console.log("Load session failed:", e);
    }
  };

  useEffect(() => {
    loadSessionData();
  }, []);

  if (!session || !workout)
    return (
      <View style={styles.center}>
        <Text style={{ color: "white" }}>Loading...</Text>
      </View>
    );

  const exercises = workout.exercises;
  const completed = exercises.filter((_: any, i: number) => i < exerciseIndex).length;
  const progress = Math.floor((exerciseIndex / exercises.length) * 100);

  // UPDATE index
  const updateIndex = async (i: number) => {
    setExerciseIndex(i);
    await fitnessApi.updateSessionIndex(session.id, i);
  };

  const onPressCTA = async () => {
    if (exerciseIndex < exercises.length - 1) {
      const next = exerciseIndex + 1;
      await updateIndex(next);
      return;
    }

    try {
      player.pause();
      player.replace(null);
    } catch {}

    await fitnessApi.completeSession(session.id, {
      seconds,
      calories,
    });

    router.push("(tabs)/fitness" as any);
  };

  // Tap video → show controls for 2s
  const handleTapVideo = () => {
    if (!isPlaying) return; // play state sẽ tự hiển thị play button

    setShowControls(true);
    setTimeout(() => setShowControls(false), 2000);
  };

  // Format time
  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
          <ArrowLeft size={22} color="white" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Today's Workout</Text>

        <TouchableOpacity style={styles.iconBtn}>
          <Share2 size={20} color="white" />
        </TouchableOpacity>
      </View>

      {/* VIDEO */}
      <View style={styles.videoWrapper}>
        <VideoView player={player} style={styles.video} nativeControls={false} />

        {/* TAP AREA */}
        <TouchableOpacity
          activeOpacity={1}
          style={styles.videoOverlay}
          onPress={handleTapVideo}
        >
          {/* PLAY BUTTON */}
          {!isPlaying && (
            <TouchableOpacity onPress={() => player.play()} style={styles.playButton}>
              <Text style={{ color: "white", fontSize: 34 }}>▶</Text>
            </TouchableOpacity>
          )}

          {/* PAUSE BUTTON (auto-hide) */}
          {isPlaying && showControls && (
            <TouchableOpacity onPress={() => player.pause()} style={styles.playButton}>
              <Text style={{ color: "white", fontSize: 34 }}>⏸</Text>
            </TouchableOpacity>
          )}
        </TouchableOpacity>

        {/* PROGRESS BAR */}
        <View style={styles.videoProgressBar}>
          <LinearGradient
            colors={["#3B82F6", "#8B5CF6"]}
            style={[styles.videoProgressFill, { width: `${progress}%` }]}
          />
        </View>
      </View>

      {/* TIMER + CALORIES */}
      <View style={styles.timerBox}>
        <Text style={styles.timerText}>{mm}:{ss}</Text>
        <View style={styles.calorieRow}>
          <Flame size={20} color="#fb923c" />
          <Text style={styles.calorieText}>{calories} kcal burned</Text>
        </View>
      </View>

      {/* BODY */}
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 140 }}>
        {/* INFO */}
        <View style={styles.infoBox}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>{workout.title}</Text>
            <Text style={styles.sub}>{workout.description}</Text>

            <View style={styles.tagRow}>
              <Text style={styles.tagGreen}>{workout.level}</Text>
              <Text style={styles.tagBlue}>{exercises.length} moves</Text>
              <Text style={styles.tagOrange}>{workout.kcalPerMin} kcal/min</Text>
            </View>
          </View>

          {/* CIRCLE */}
          <View style={styles.circleBox}>
            <Svg height="80" width="80">
              <Defs>
                <LG id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <Stop offset="0%" stopColor="#3B82F6" />
                  <Stop offset="100%" stopColor="#8B5CF6" />
                </LG>
              </Defs>

              <Circle cx="40" cy="40" r={36} stroke="#1e293b" strokeWidth="6" fill="none" />

              <Circle
                cx="40"
                cy="40"
                r={36}
                stroke="url(#grad)"
                strokeWidth="6"
                strokeDasharray={2 * Math.PI * 36}
                strokeDashoffset={2 * Math.PI * 36 - (progress / 100) * (2 * Math.PI * 36)}
                strokeLinecap="round"
                fill="none"
              />
            </Svg>

            <View style={styles.circleTextWrapper}>
              <Text style={styles.circleText}>{progress}%</Text>
            </View>
          </View>
        </View>

        {/* EXERCISES */}
        <View style={{ paddingHorizontal: 20 }}>
          <View style={styles.exerciseHeader}>
            <Text style={styles.exerciseTitle}>Exercises</Text>
            <Text style={styles.exerciseCount}>
              {completed} of {exercises.length} complete
            </Text>
          </View>

          {exercises.map((ex: any, i: number) => {
            const isActive = i === exerciseIndex;
            const isDone = i < exerciseIndex;

            return (
              <TouchableOpacity
                key={i}
                onPress={() => updateIndex(i)}
                style={[
                  styles.exerciseItem,
                  isActive && styles.exerciseActive,
                  isDone && styles.exerciseDone,
                ]}
              >
                <View style={[styles.exerciseIcon, isActive && styles.exerciseIconActive]}>
                  <Text style={{ fontSize: 22 }}>🏋️</Text>
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={[styles.exerciseName, isDone && styles.exerciseNameDone]}>
                    {ex.name}
                  </Text>

                  <Text style={styles.exerciseDetail}>
                    {ex.durationSec ? `${ex.durationSec}s` : `${ex.reps} reps`}
                  </Text>
                </View>

                {isDone && <CheckCircle2 size={22} color="#4ade80" />}
                {isActive && !isDone && <View style={styles.activeDot} />}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* CTA */}
      <View style={styles.ctaWrapper}>
        <LinearGradient colors={["#3B82F6", "#8B5CF6"]} style={styles.ctaBtn}>
          <TouchableOpacity onPress={onPressCTA}>
            <Text style={styles.ctaText}>
              {exerciseIndex >= exercises.length - 1 ? "Finish Workout" : "Continue Workout"}
            </Text>
          </TouchableOpacity>
        </LinearGradient>
      </View>
    </View>
  );
}

// =============== STYLES ===============
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f172a" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 28,
    paddingBottom: 10,
    backgroundColor: "#1e293b",
  },
  iconBtn: { padding: 4 },
  headerTitle: { color: "white", fontSize: 17, fontWeight: "600" },

  videoWrapper: { width: "100%", height: 220, backgroundColor: "#1e293b" },
  video: { width: "100%", height: "100%" },

  videoOverlay: {
    position: "absolute",
    inset: 0,
    justifyContent: "center",
    alignItems: "center",
  },

  playButton: {
    width: 70,
    height: 70,
    backgroundColor: "rgba(0,0,0,0.3)",
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.5)",
  },

  videoProgressBar: {
    width: "100%",
    height: 4,
    backgroundColor: "rgba(255,255,255,0.2)",
    position: "absolute",
    bottom: 0,
  },
  videoProgressFill: { height: "100%" },

  timerBox: {
    paddingTop: 12,
    alignItems: "center",
    gap: 4,
    backgroundColor: "#0f172a",
  },
  timerText: { color: "white", fontSize: 34, fontWeight: "700" },
  calorieRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  calorieText: { color: "#fb923c", fontSize: 18 },

  infoBox: { flexDirection: "row", padding: 20, gap: 20 },
  title: { color: "white", fontSize: 22, fontWeight: "700" },
  sub: { color: "#94a3b8", marginTop: 4 },

  tagRow: { flexDirection: "row", marginTop: 8, gap: 8 },
  tagGreen: {
    backgroundColor: "#16a34a33",
    color: "#22c55e",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  tagBlue: {
    backgroundColor: "#3b82f633",
    color: "#60a5fa",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  tagOrange: {
    backgroundColor: "#f9731633",
    color: "#fb923c",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },

  circleBox: { width: 80, height: 80, justifyContent: "center", alignItems: "center" },
  circleTextWrapper: { position: "absolute" },
  circleText: { color: "white", fontSize: 16 },

  exerciseHeader: {
    marginTop: 10,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  exerciseTitle: { color: "white", fontSize: 18, fontWeight: "600" },
  exerciseCount: { color: "#94a3b8", fontSize: 14 },

  exerciseItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1e293b",
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#334155",
    gap: 12,
    marginTop: 12,
  },
  exerciseActive: {
    backgroundColor: "rgba(59,130,246,0.2)",
    borderColor: "#3b82f6",
    shadowColor: "#3b82f6",
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  exerciseDone: { opacity: 0.5 },

  exerciseIcon: {
    width: 50,
    height: 50,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0f172a",
  },
  exerciseIconActive: { backgroundColor: "#3b82f6" },

  exerciseName: { color: "white", fontSize: 16 },
  exerciseNameDone: { textDecorationLine: "line-through", color: "#94a3b8" },

  exerciseDetail: { color: "#94a3b8", fontSize: 14 },

  activeDot: {
    width: 10,
    height: 10,
    backgroundColor: "#3b82f6",
    borderRadius: 10,
  },

  ctaWrapper: {
    position: "absolute",
    bottom: 20,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
  },
  ctaBtn: { paddingVertical: 18, borderRadius: 20 },
  ctaText: {
    textAlign: "center",
    color: "white",
    fontSize: 18,
    fontWeight: "700",
  },
});
