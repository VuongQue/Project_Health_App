import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { Flame, Dumbbell, Filter } from "lucide-react-native";
import fitnessApi from "@/src/api/fitnessApi";
import { Workout } from "@/src/types/workout";
import { ArrowLeft } from "lucide-react-native";
import { useRouter } from "expo-router";


const LEVELS = ["Beginner", "Intermediate", "Advanced"];

export default function ExerciseListScreen() {
    const router = useRouter();
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [muscle, setMuscle] = useState("");
  const [level, setLevel] = useState("");
  const [minKcal, setMinKcal] = useState("");

  const load = async () => {
    setLoading(true);
    const res = await fitnessApi.getWorkouts({
      search: search || undefined,
      muscleGroup: muscle || undefined,
      level: level || undefined,
      minKcal: minKcal ? Number(minKcal) : undefined,
    });
    setWorkouts(res.data);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <ScrollView style={styles.container}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <ArrowLeft size={22} color="white" />
        </TouchableOpacity>
      <Text style={styles.title}>All Exercises</Text>

      {/* Filters */}
      <View style={styles.card}>
        <TextInput
          placeholder="Search name..."
          placeholderTextColor="#64748b"
          style={styles.input}
          value={search}
          onChangeText={setSearch}
        />

        <TextInput
          placeholder="Muscle group (Chest, Legs...)"
          placeholderTextColor="#64748b"
          style={styles.input}
          value={muscle}
          onChangeText={setMuscle}
        />

        <View style={[styles.row, { flexWrap: "wrap", marginBottom: 12 }]}>
          {LEVELS.map((lv) => {
            const active = level === lv;
            return (
              <TouchableOpacity
                key={lv}
                onPress={() => setLevel(active ? "" : lv)}
                style={[styles.levelChip, active && styles.levelChipActive]}
              >
                <Text style={{ color: active ? "white" : "#cbd5f5" }}>{lv}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <TextInput
          placeholder="Min kcal/min..."
          placeholderTextColor="#64748b"
          style={styles.input}
          value={minKcal}
          onChangeText={setMinKcal}
          keyboardType="numeric"
        />

        <TouchableOpacity style={styles.filterBtn} onPress={load}>
          <Text style={styles.filterText}>Apply Filters</Text>
        </TouchableOpacity>
      </View>

      {/* Exercise list */}
      {loading ? (
        <ActivityIndicator color="#3b82f6" />
      ) : (
        workouts.map((w, i) => (
          <TouchableOpacity
              key={i}
              style={styles.exerciseCard}
              onPress={() =>
                router.push({
                  pathname: "/exercise/[id]",
                  params: { id: String(w.id) },
                })
              }
            >
            <View style={styles.rowBetween}>
              <View style={{ flex: 1 }}>
                <Text style={styles.exerciseTitle}>{w.title}</Text>
                <Text style={styles.exerciseMeta}>
                  {w.muscleGroup} · {w.level}
                </Text>
              </View>
              <Dumbbell size={20} color="#38bdf8" />
            </View>

            <View style={[styles.row, { marginTop: 8 }]}>
              <Flame size={14} color="#f97316" />
              <Text style={styles.exerciseMeta}>{w.kcalPerMin} kcal/min</Text>
            </View>
          </TouchableOpacity>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f172a", padding: 16 },
  title: { color: "white", fontSize: 22, fontWeight: "600", marginBottom: 8 },

  card: {
    backgroundColor: "#1e293b",
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#334155",
  },

  input: {
    backgroundColor: "#020617",
    borderWidth: 1,
    borderColor: "#334155",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: "white",
    marginBottom: 12,
  },

  row: { flexDirection: "row", alignItems: "center", gap: 8 },
  rowBetween: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },

  // Chips
  levelChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#1e40af",
    marginRight: 6,
    marginBottom: 6,
  },
  levelChipActive: { backgroundColor: "#2563eb" },

  filterBtn: {
    backgroundColor: "#2563eb",
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: "center",
  },
  filterText: { color: "white", fontWeight: "600" },

  exerciseCard: {
    backgroundColor: "#1e293b",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#334155",
    padding: 12,
    marginBottom: 12,
  },
  exerciseTitle: { color: "white", fontSize: 16, fontWeight: "600" },
  exerciseMeta: { color: "#94a3b8", fontSize: 12 },
    headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
    },

    backBtn: {
    padding: 6,
    borderRadius: 8,
    },

});
