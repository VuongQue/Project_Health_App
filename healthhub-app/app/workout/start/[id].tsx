import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from "react-native";

import { useLocalSearchParams, useRouter } from "expo-router";
import { Pause, Play, RotateCcw, Flame, ArrowLeft } from "lucide-react-native";
import fitnessApi from "@/src/api/fitnessApi";

import { VideoView, useVideoPlayer } from "expo-video";

const screenHeight = Dimensions.get("window").height;

export default function StartWorkoutScreen() {
  const { id: _id } = useLocalSearchParams();
  const router = useRouter();

  const [exercise, setExercise] = useState<any>(null);

  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef<any>(null);

  const id = Array.isArray(_id) ? _id[0] : _id;

  const player = useVideoPlayer(null, (p) => {
    p.loop = false;
  });

  // Load workout detail
  const loadWorkout = async () => {
    try {
      const workoutId = Number(id);
      if (!workoutId) return;

      const res = await fitnessApi.getWorkoutById(workoutId);
      setExercise(res.data);

      if (res.data.videoUrl) {
        player.replace(res.data.videoUrl);
      }
    } catch (e) {
      console.log("Load workout failed:", e);
    }
  };

  useEffect(() => {
    loadWorkout();
  }, []);

  // Timer logic
  const start = () => {
    if (!running) {
      setRunning(true);
      player.play();

      intervalRef.current = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    }
  };

  const pause = () => {
    setRunning(false);
    player.pause();

    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  const reset = () => {
  pause();
  setSeconds(0);

  if (player) {
    player.currentTime = 0;
  }
};


  const finishWorkout = async () => {
    pause();

    const minutes = Math.floor(seconds / 60);
    const kcalBurned = Math.round((exercise?.kcalPerMin ?? 5) * minutes);

    await fitnessApi.logWorkout({
      workoutId: Number(id),
      durationMin: minutes,
      kcal: kcalBurned,
    });

    router.push("/(tabs)/fitness");
  };

  if (!exercise)
    return (
      <View style={styles.center}>
        <Text style={{ color: "white" }}>Loading...</Text>
      </View>
    );

  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");

  const kcalBurned = Math.round((exercise?.kcalPerMin ?? 5) * (seconds / 60));

  return (
    <View style={styles.container}>
      {/* Header */}
      <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
        <ArrowLeft size={26} color="white" />
      </TouchableOpacity>

      {/* VIDEO */}
      <VideoView
        player={player}
        style={styles.video}
        nativeControls={false}
      />

      {/* Overlay text */}
      <View style={styles.overlayTop}>
        <Text style={styles.videoTitle}>{exercise.title}</Text>
        <Text style={styles.videoSubtitle}>
          {exercise.muscleGroup} • {exercise.level}
        </Text>
      </View>

      {/* Timer below video */}
      <Text style={styles.timeText}>
        {mm}:{ss}
      </Text>

      {/* Calories */}
      <View style={styles.row}>
        <Flame size={20} color="#f97316" />
        <Text style={styles.calories}>{kcalBurned} kcal burned</Text>
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        {!running ? (
          <TouchableOpacity style={styles.mainBtn} onPress={start}>
            <Play size={28} color="white" />
            <Text style={styles.mainBtnText}>Start</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.mainBtn} onPress={pause}>
            <Pause size={28} color="white" />
            <Text style={styles.mainBtnText}>Pause</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.resetBtn} onPress={reset}>
          <RotateCcw size={22} color="white" />
        </TouchableOpacity>
      </View>

      {/* Finish */}
      <TouchableOpacity style={styles.finishBtn} onPress={finishWorkout}>
        <Text style={styles.finishText}>Finish Workout</Text>
      </TouchableOpacity>
    </View>
  );
}


// ------------------------- STYLES -------------------------
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f172a" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  backBtn: { padding: 10, position: "absolute", top: 40, left: 20, zIndex: 10 },

  video: {
    width: "100%",
    height: screenHeight * 0.55,
    backgroundColor: "#000",
  },

  overlayTop: {
    position: "absolute",
    top: 70,
    left: 20,
  },

  videoTitle: {
    color: "white",
    fontSize: 26,
    fontWeight: "700",
  },

  videoSubtitle: {
    color: "#cbd5e1",
    fontSize: 15,
    marginTop: 2,
  },

  timeText: {
    color: "white",
    fontSize: 40,
    fontWeight: "700",
    textAlign: "center",
    marginTop: 10,
  },

  row: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    marginTop: 5,
  },

  calories: { color: "#f97316", fontSize: 18 },

  controls: {
    marginTop: 20,
    flexDirection: "row",
    justifyContent: "center",
    gap: 20,
  },

  mainBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#2563eb",
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 50,
  },

  mainBtnText: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
  },

  resetBtn: {
    backgroundColor: "#475569",
    padding: 14,
    borderRadius: 50,
  },

  finishBtn: {
    backgroundColor: "#16a34a",
    paddingVertical: 16,
    marginHorizontal: 20,
    borderRadius: 12,
    marginTop: 30,
  },

  finishText: {
    color: "white",
    textAlign: "center",
    fontSize: 18,
    fontWeight: "700",
  },
});
