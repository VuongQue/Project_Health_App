import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Image } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, Flame, Dumbbell } from "lucide-react-native";
import fitnessApi from "@/src/api/fitnessApi";

export default function ExerciseDetailScreen() {
  const { id } = useLocalSearchParams();     // lấy ID từ URL
  const router = useRouter();

  const [exercise, setExercise] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadDetail = async () => {
    try {
      const res = await fitnessApi.getWorkoutById(id);
      setExercise(res.data);
    } catch (err) {
      console.log("Load detail error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDetail();
  }, [id]);

  if (loading || !exercise) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header Back */}
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={22} color="white" />
        </TouchableOpacity>
        <Text style={styles.title}>{exercise.title}</Text>
        <View style={{ width: 22 }} />
      </View>

      {/* Thumbnail / Video Placeholder */}
      <View style={styles.thumbnail}>
        {exercise.videoUrl ? (
          <Image
            source={{ uri: exercise.videoUrl }}
            style={{ width: "100%", height: "100%", borderRadius: 16 }}
          />
        ) : (
          <View style={styles.noVideo}>
            <Dumbbell size={48} color="#38bdf8" />
            <Text style={{ color: "#94a3b8" }}>No video available</Text>
          </View>
        )}
      </View>

      {/* Info */}
      <View style={styles.card}>
        <Text style={styles.exerciseName}>{exercise.title}</Text>

        <Text style={styles.infoText}>
          {exercise.muscleGroup} · {exercise.level}
        </Text>

        <View style={[styles.row, { marginTop: 12 }]}>
          <Flame size={20} color="#f97316" />
          <Text style={styles.calText}>{exercise.kcalPerMin} kcal/min</Text>
        </View>
      </View>

      {/* Start Workout Button */}
      <TouchableOpacity
        style={styles.startBtn}
        onPress={() =>
            router.push({
            pathname: "/workout/start/[id]",
            params: { id: String(id) },
            })
        }
      >
        <Text style={styles.startText}>Start Workout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f172a", padding: 16 },
  loading: {
    flex: 1,
    backgroundColor: "#0f172a",
    justifyContent: "center",
    alignItems: "center",
  },

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  backBtn: {
    padding: 6,
  },

  title: { color: "white", fontSize: 20, fontWeight: "600" },

  thumbnail: {
    width: "100%",
    height: 200,
    backgroundColor: "#1e293b",
    borderRadius: 16,
    marginBottom: 20,
    overflow: "hidden",
  },
  noVideo: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },

  card: {
    backgroundColor: "#1e293b",
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#334155",
  },

  exerciseName: { color: "white", fontSize: 22, fontWeight: "700" },
  infoText: { color: "#94a3b8", fontSize: 14, marginTop: 4 },

  calText: { color: "#f97316", fontSize: 14, marginLeft: 6 },
  row: { flexDirection: "row", alignItems: "center" },

  startBtn: {
    backgroundColor: "#2563eb",
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: "center",
  },
  startText: { color: "white", fontSize: 16, fontWeight: "600" },
});
