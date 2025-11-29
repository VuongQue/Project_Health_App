import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  TextInput,
} from "react-native";
import {
  Play,
  Clock,
  Flame,
  TrendingUp,
  ChevronRight,
  Dumbbell,
  Filter,
} from "lucide-react-native";

import fitnessApi from "@/src/api/fitnessApi";
import { useRouter } from "expo-router";

const LEVELS = ["Beginner", "Intermediate", "Advanced"];

export default function FitnessScreen() {
  const router = useRouter();
  const [week, setWeek] = useState<any>(null);
  const [plans, setPlans] = useState<any[]>([]);
  const [monthly, setMonthly] = useState<any>(null);

  const [workouts, setWorkouts] = useState<any[]>([]);
  const [showWorkouts, setShowWorkouts] = useState(false);

  // filter state
  const [search, setSearch] = useState("");
  const [muscle, setMuscle] = useState("");
  const [level, setLevel] = useState<string | undefined>();
  const [minKcal, setMinKcal] = useState<string>("");

  const [loading, setLoading] = useState(true);
  const [loadingWorkouts, setLoadingWorkouts] = useState(false);

  useEffect(() => {
    loadData();
    loadWorkouts();

  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      const [weekRes, planRes, monthRes] = await Promise.all([
        fitnessApi.getWeekSummary(),
        fitnessApi.getPlans(),
        fitnessApi.getMonthProgress(),
      ]);

      setWeek(weekRes.data);
      setPlans(planRes.data);
      setMonthly(monthRes.data);
    } catch (err: any) {
      console.log("⚠️ Fitness load error:", err?.response?.data || err);
    } finally {
      setLoading(false);
    }
  };

  const loadWorkouts = async () => {
    try {
      setLoadingWorkouts(true);
      const res = await fitnessApi.getWorkouts({
        search: search || undefined,
        muscleGroup: muscle || undefined,
        level: level || undefined,
        minKcal: minKcal ? Number(minKcal) : undefined,
      });
      setWorkouts(res.data);
    } catch (err: any) {
      console.log("⚠️ Load workouts error:", err?.response?.data || err);
    } finally {
      setLoadingWorkouts(false);
    }
  };

  // const onToggleWorkouts = () => {
  //   const next = !showWorkouts;
  //   setShowWorkouts(next);
  //   if (next && workouts.length === 0) {
  //     // lần đầu mở thì load
  //     loadWorkouts();
  //   }
  // };

  // const onApplyFilter = () => {
  //   loadWorkouts();
  // };

  if (loading || !week || !monthly) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={{ marginBottom: 16 }}>
        <Text style={styles.title}>Fitness</Text>
        <Text style={styles.subtitle}>Track your workouts and progress</Text>
      </View>

      {/* Weekly Progress */}
      <View style={styles.card}>
        <View style={styles.rowBetween}>
          <Text style={styles.sectionTitle}>This Week</Text>
          <Text style={styles.accentText}>
            {week.weekTotal.workouts}/7 days
          </Text>
        </View>

        {/* Day completion */}
        <View style={styles.weekRow}>
          {week.days.map((day: any, i: number) => (
            <View key={i} style={styles.center}>
              <View
                style={[
                  styles.dayCircle,
                  { backgroundColor: day.completed ? "#2563eb" : "#334155" },
                ]}
              >
                {day.completed && <Text style={styles.checkText}>✓</Text>}
              </View>
              <Text style={styles.dayLabel}>{day.day}</Text>
            </View>
          ))}
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View>
            <Text style={styles.statLabel}>Workouts</Text>
            <Text style={styles.statValue}>{week.weekTotal.workouts}</Text>
          </View>

          <View>
            <Text style={styles.statLabel}>Calories</Text>
            <Text style={styles.statValue}>{week.weekTotal.calories}</Text>
          </View>

          <View>
            <Text style={styles.statLabel}>Minutes</Text>
            <Text style={styles.statValue}>{week.weekTotal.minutes}</Text>
          </View>
        </View>
      </View>
      
      <View style={{ marginTop: 24 }}>
        <View style={styles.rowBetween}>
          <Text style={styles.sectionTitle}>Exercises</Text>
          <TouchableOpacity onPress={() => router.push("/exercise/ExerciseList")}>
            <Text style={[styles.accentText, { fontSize: 13 }]}>View all →</Text>
          </TouchableOpacity>
        </View>

        {/* Hiển thị 3 bài đầu */}
        {workouts.slice(0, 3).map((w, idx) => (
          <View key={idx} style={styles.exerciseCard}>
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
          </View>
        ))}
      </View>
      {/* Quick Start */}
      <TouchableOpacity style={styles.quickStart}>
        <View style={styles.rowBetween}>
          <View style={styles.row}>
            <View style={styles.quickIcon}>
              <Play color="white" size={24} />
            </View>
            <View>
              <Text style={styles.quickText}>Start Quick Workout</Text>
              <Text style={styles.quickSubText}>15 min full body</Text>
            </View>
          </View>
          <ChevronRight color="white" size={20} />
        </View>
      </TouchableOpacity>

      {/* Workout Plans */}
      <View style={{ marginTop: 24 }}>
        <Text style={styles.sectionTitle}>Workout Plans</Text>

        {plans.map((plan, i) => (
          <View key={i} style={styles.workoutCard}>
            <View style={styles.rowBetween}>
              <View style={{ flex: 1 }}>
                <View style={styles.row}>
                  <Text style={styles.workoutName}>{plan.name}</Text>
                  {plan.completed && (
                    <Text style={styles.completedTag}>Completed</Text>
                  )}
                </View>
                <Text style={styles.workoutType}>{plan.goalType}</Text>
              </View>

              <TouchableOpacity
                onPress={() => console.log("Start plan:", plan.id)}
                style={[
                  styles.playButton,
                  { backgroundColor: plan.completed ? "#334155" : "#2563eb" },
                ]}
              >
                <Play
                  size={16}
                  color={plan.completed ? "#94a3b8" : "white"}
                />
              </TouchableOpacity>
            </View>

            {/* Nếu sau này có duration/calories cho plan thì show ở đây */}
            <View style={styles.rowGap}>
              <View style={styles.iconText}>
                <Clock size={14} color="#94a3b8" />
                <Text style={styles.iconLabel}>{plan.weeks} weeks</Text>
              </View>
            </View>
          </View>
        ))}
      </View>

      {/* Monthly Progress */}
      <View style={[styles.card, { marginTop: 24 }]}>
        <View style={styles.row}>
          <TrendingUp size={18} color="#2563eb" />
          <Text style={styles.sectionTitle}>Monthly Progress</Text>
        </View>

        {Object.keys(monthly).map((key, i) => (
          <View key={i} style={styles.progressBlock}>
            <View style={styles.rowBetween}>
              <Text style={styles.progressLabel}>{key}</Text>
              <Text style={styles.progressValue}>
                {monthly[key].sessions}/{monthly[key].target} sessions
              </Text>
            </View>

            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${monthly[key].progress}%`,
                    backgroundColor:
                      key === "cardio"
                        ? "#f97316"
                        : key === "strength"
                        ? "#2563eb"
                        : "#8b5cf6",
                  },
                ]}
              />
            </View>
          </View>
        ))}
      </View>

      {/* ====================================================== */}
      {/* NEW: Workout Library + Filters */}
      {/* ====================================================== */}
      
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: "#0f172a",
    justifyContent: "center",
    alignItems: "center",
  },
  container: { backgroundColor: "#0f172a", flex: 1, padding: 16 },
  title: { color: "white", fontSize: 24, fontWeight: "bold" },
  subtitle: { color: "#94a3b8", fontSize: 13, marginTop: 4 },

  card: {
    backgroundColor: "#1e293b",
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: "#334155",
    marginBottom: 16,
  },
  rowBetween: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
  rowGap: { flexDirection: "row", alignItems: "center", gap: 16 },

  center: { alignItems: "center" },

  sectionTitle: { color: "white", fontSize: 16, fontWeight: "600" },
  accentText: { color: "#38bdf8", fontSize: 13 },

  weekRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 12,
  },
  dayCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  checkText: { color: "white", fontSize: 14 },
  dayLabel: { color: "#94a3b8", fontSize: 12, marginTop: 4 },

  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderColor: "#334155",
    paddingTop: 12,
  },
  statLabel: { color: "#94a3b8", fontSize: 12 },
  statValue: { color: "white", fontSize: 16, fontWeight: "500" },

  quickStart: {
    backgroundColor: "#2563eb",
    borderRadius: 20,
    padding: 16,
    marginVertical: 8,
  },
  quickIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  quickText: { color: "white", fontSize: 16 },
  quickSubText: { color: "#dbeafe", fontSize: 13 },

  workoutCard: {
    backgroundColor: "#1e293b",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#334155",
    padding: 12,
    marginVertical: 6,
  },
  workoutName: { color: "white", fontSize: 15, fontWeight: "500" },
  workoutType: { color: "#94a3b8", fontSize: 13 },

  completedTag: {
    color: "#4ade80",
    backgroundColor: "rgba(34,197,94,0.2)",
    fontSize: 11,
    paddingHorizontal: 6,
    borderRadius: 8,
    marginLeft: 6,
  },

  playButton: { padding: 10, borderRadius: 12 },

  iconText: { flexDirection: "row", alignItems: "center", gap: 4 },
  iconLabel: { color: "#94a3b8", fontSize: 13 },

  progressBlock: { marginVertical: 8 },
  progressLabel: { color: "#94a3b8", fontSize: 13 },
  progressValue: { color: "#cbd5e1", fontSize: 13 },
  progressBar: {
    width: "100%",
    height: 8,
    backgroundColor: "#334155",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: { height: "100%", borderRadius: 4 },

  // NEW
  toggleHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#020617",
    borderColor: "#1e293b",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: "white",
    marginBottom: 10,
    fontSize: 13,
  },
  levelChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#1e40af",
    marginRight: 4,
    marginBottom: 4,
  },
  levelChipActive: {
    backgroundColor: "#2563eb",
  },
  filterBtn: {
    backgroundColor: "#2563eb",
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: "center",
    marginBottom: 12,
  },
  filterText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  exerciseCard: {
    backgroundColor: "#020617",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#1e293b",
    padding: 12,
    marginBottom: 8,
  },
  exerciseTitle: { color: "white", fontSize: 15, fontWeight: "600" },
  exerciseMeta: { color: "#94a3b8", fontSize: 12, marginLeft: 4 },
  videoHint: { color: "#38bdf8", fontSize: 12, marginTop: 6 },
});
