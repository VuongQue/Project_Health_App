import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import {
  Play,
  Clock,
  Flame,
  TrendingUp,
  ChevronRight,
} from "lucide-react-native";

interface WorkoutPlan {
  name: string;
  duration: string;
  calories: number;
  type: string;
  completed: boolean;
}

interface WeekProgress {
  day: string;
  completed: boolean;
}

const FitnessScreen: React.FC = () => {
  const workoutPlans: WorkoutPlan[] = [
    { name: "Morning Cardio", duration: "30 min", calories: 250, type: "Cardio", completed: false },
    { name: "Strength Training", duration: "45 min", calories: 350, type: "Strength", completed: true },
    { name: "Yoga Flow", duration: "20 min", calories: 120, type: "Flexibility", completed: false },
    { name: "HIIT Session", duration: "25 min", calories: 300, type: "HIIT", completed: false },
  ];

  const weekProgress: WeekProgress[] = [
    { day: "Mon", completed: true },
    { day: "Tue", completed: true },
    { day: "Wed", completed: false },
    { day: "Thu", completed: true },
    { day: "Fri", completed: true },
    { day: "Sat", completed: false },
    { day: "Sun", completed: false },
  ];

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
          <Text style={styles.accentText}>4/7 days</Text>
        </View>

        <View style={styles.weekRow}>
          {weekProgress.map((day, i) => (
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

        <View style={styles.statsRow}>
          {[
            { label: "Workouts", value: "8" },
            { label: "Calories", value: "2,450" },
            { label: "Minutes", value: "240" },
          ].map((s, i) => (
            <View key={i}>
              <Text style={styles.statLabel}>{s.label}</Text>
              <Text style={styles.statValue}>{s.value}</Text>
            </View>
          ))}
        </View>
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
        {workoutPlans.map((workout, i) => (
          <View key={i} style={styles.workoutCard}>
            <View style={styles.rowBetween}>
              <View style={{ flex: 1 }}>
                <View style={styles.row}>
                  <Text style={styles.workoutName}>{workout.name}</Text>
                  {workout.completed && (
                    <Text style={styles.completedTag}>Completed</Text>
                  )}
                </View>
                <Text style={styles.workoutType}>{workout.type}</Text>
              </View>
              <TouchableOpacity
                style={[
                  styles.playButton,
                  { backgroundColor: workout.completed ? "#334155" : "#2563eb" },
                ]}
              >
                <Play
                  size={16}
                  color={workout.completed ? "#94a3b8" : "white"}
                />
              </TouchableOpacity>
            </View>

            <View style={styles.rowGap}>
              <View style={styles.iconText}>
                <Clock size={14} color="#94a3b8" />
                <Text style={styles.iconLabel}>{workout.duration}</Text>
              </View>
              <View style={styles.iconText}>
                <Flame size={14} color="#94a3b8" />
                <Text style={styles.iconLabel}>{workout.calories} cal</Text>
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

        {[
          { label: "Cardio", progress: 80, color: "#f97316", text: "12/15 sessions" },
          { label: "Strength", progress: 67, color: "#2563eb", text: "8/12 sessions" },
          { label: "Flexibility", progress: 60, color: "#8b5cf6", text: "6/10 sessions" },
        ].map((p, i) => (
          <View key={i} style={styles.progressBlock}>
            <View style={styles.rowBetween}>
              <Text style={styles.progressLabel}>{p.label}</Text>
              <Text style={styles.progressValue}>{p.text}</Text>
            </View>
            <View style={styles.progressBar}>
              <View
                style={[styles.progressFill, { width: `${p.progress}%`, backgroundColor: p.color }]}
              />
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

export default FitnessScreen;

const styles = StyleSheet.create({
  container: { backgroundColor: "#0f172a", flex: 1, padding: 16 },
  title: { color: "white", fontSize: 24, fontWeight: "bold" },
  subtitle: { color: "#94a3b8", fontSize: 13, marginTop: 4 },
  card: { backgroundColor: "#1e293b", borderRadius: 24, padding: 16, borderWidth: 1, borderColor: "#334155", marginBottom: 16 },
  rowBetween: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
  rowGap: { flexDirection: "row", alignItems: "center", gap: 16 },
  center: { alignItems: "center" },
  sectionTitle: { color: "white", fontSize: 16, fontWeight: "600" },
  accentText: { color: "#2563eb", fontSize: 13 },
  weekRow: { flexDirection: "row", justifyContent: "space-between", marginVertical: 12 },
  dayCircle: { width: 32, height: 32, borderRadius: 16, justifyContent: "center", alignItems: "center" },
  checkText: { color: "white", fontSize: 14 },
  dayLabel: { color: "#94a3b8", fontSize: 12, marginTop: 4 },
  statsRow: { flexDirection: "row", justifyContent: "space-between", borderTopWidth: 1, borderColor: "#334155", paddingTop: 12 },
  statLabel: { color: "#94a3b8", fontSize: 12 },
  statValue: { color: "white", fontSize: 16, fontWeight: "500" },
  quickStart: { backgroundColor: "#2563eb", borderRadius: 20, padding: 16, marginVertical: 8 },
  quickIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: "rgba(255,255,255,0.2)", justifyContent: "center", alignItems: "center", marginRight: 12 },
  quickText: { color: "white", fontSize: 16 },
  quickSubText: { color: "#dbeafe", fontSize: 13 },
  workoutCard: { backgroundColor: "#1e293b", borderRadius: 16, borderWidth: 1, borderColor: "#334155", padding: 12, marginVertical: 6 },
  workoutName: { color: "white", fontSize: 15, fontWeight: "500" },
  workoutType: { color: "#94a3b8", fontSize: 13 },
  completedTag: { color: "#4ade80", backgroundColor: "rgba(34,197,94,0.2)", fontSize: 11, marginLeft: 6, paddingHorizontal: 6, borderRadius: 8 },
  playButton: { padding: 10, borderRadius: 12 },
  iconText: { flexDirection: "row", alignItems: "center", gap: 4 },
  iconLabel: { color: "#94a3b8", fontSize: 13 },
  progressBlock: { marginVertical: 8 },
  progressLabel: { color: "#94a3b8", fontSize: 13 },
  progressValue: { color: "#cbd5e1", fontSize: 13 },
  progressBar: { width: "100%", height: 8, backgroundColor: "#334155", borderRadius: 4, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 4 },
});
