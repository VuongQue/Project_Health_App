import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
} from "react-native";
import { Calendar, TrendingUp } from "lucide-react-native";
import { LineChart } from "react-native-chart-kit";

export default function MoodTrackerScreen() {
  const [selectedMood, setSelectedMood] = useState("😊");

  const moods = [
    { emoji: "😔", label: "Sad", value: 1 },
    { emoji: "😐", label: "Okay", value: 2 },
    { emoji: "🙂", label: "Good", value: 3 },
    { emoji: "😊", label: "Happy", value: 4 },
    { emoji: "😄", label: "Great", value: 5 },
  ];

  const moodData = [4, 3, 4, 5, 4, 3, 4];

  const insights = [
    { label: "Average Mood", value: "4.2/5", change: "+0.3", positive: true },
    { label: "Best Day", value: "Thursday", emoji: "😄" },
    { label: "Streak", value: "30 days", emoji: "🔥" },
  ];

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Mood Tracker</Text>
      <Text style={styles.subtitle}>How are you feeling today?</Text>

      {/* Mood Picker */}
      <View style={styles.card}>
        <View style={styles.rowBetween}>
          <Text style={styles.sectionTitle}>Today's Mood</Text>
          <View style={styles.rowGap}>
            <Calendar color="#94a3b8" size={16} />
            <Text style={styles.textMuted}>Nov 9</Text>
          </View>
        </View>

        <View style={styles.rowBetween}>
          {moods.map((m) => (
            <TouchableOpacity
              key={m.value}
              onPress={() => setSelectedMood(m.emoji)}
              style={[
                styles.moodButton,
                selectedMood === m.emoji ? styles.moodActive : styles.moodInactive,
              ]}
            >
              <Text style={styles.moodEmoji}>{m.emoji}</Text>
              <Text style={styles.moodLabel}>{m.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.saveBtn}>
          <Text style={styles.saveBtnText}>Save Mood</Text>
        </TouchableOpacity>
      </View>

      {/* Insights */}
      <View style={styles.rowWrap}>
        {insights.map((ins, i) => (
          <View key={i} style={styles.insightBox}>
            <Text style={styles.textSmall}>{ins.label}</Text>
            <View style={styles.rowGap}>
              <Text style={styles.textWhite}>{ins.value}</Text>
              {ins.emoji && <Text>{ins.emoji}</Text>}
            </View>
            {ins.change && (
              <Text
                style={[
                  styles.textSmall,
                  { color: ins.positive ? "#4ade80" : "#f87171" },
                ]}
              >
                {ins.change}
              </Text>
            )}
          </View>
        ))}
      </View>

      {/* Chart */}
      <View style={styles.card}>
        <View style={styles.rowGap}>
          <TrendingUp color="#2563eb" size={18} />
          <Text style={styles.sectionTitle}>Weekly Trend</Text>
        </View>

        <LineChart
          data={{
            labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
            datasets: [{ data: moodData }],
          }}
          width={Dimensions.get("window").width - 48}
          height={220}
          chartConfig={{
            backgroundGradientFrom: "#1e293b",
            backgroundGradientTo: "#1e293b",
            decimalPlaces: 0,
            color: () => "#2563eb",
            labelColor: () => "#94a3b8",
            style: {
              borderRadius: 16,
            },
            propsForDots: {
              r: "4",
              strokeWidth: "2",
              stroke: "#2563eb",
            },
          }}
          bezier
          style={{
            marginVertical: 12,
            borderRadius: 16,
          }}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: "#0f172a", flex: 1, padding: 16 },
  title: { color: "white", fontSize: 24, fontWeight: "bold" },
  subtitle: { color: "#94a3b8", fontSize: 13, marginBottom: 16 },
  card: {
    backgroundColor: "#1e293b",
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: "#334155",
    marginBottom: 16,
  },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  rowGap: { flexDirection: "row", alignItems: "center", gap: 6 },
  textMuted: { color: "#94a3b8", fontSize: 12 },
  sectionTitle: { color: "white", fontSize: 16, fontWeight: "600" },
  moodButton: {
    flex: 1,
    alignItems: "center",
    padding: 8,
    borderRadius: 16,
  },
  moodActive: { backgroundColor: "rgba(37,99,235,0.3)" },
  moodInactive: { backgroundColor: "rgba(51,65,85,0.6)" },
  moodEmoji: { fontSize: 28 },
  moodLabel: { color: "#cbd5e1", fontSize: 12, marginTop: 4 },
  saveBtn: {
    backgroundColor: "#2563eb",
    paddingVertical: 10,
    borderRadius: 12,
    marginTop: 16,
  },
  saveBtnText: { textAlign: "center", color: "white", fontWeight: "600" },
  rowWrap: {
    flexDirection: "row",
    justifyContent: "space-between",
    flexWrap: "wrap",
    marginBottom: 16,
  },
  insightBox: {
    width: "31%",
    backgroundColor: "#1e293b",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#334155",
    padding: 10,
  },
  textSmall: { color: "#94a3b8", fontSize: 12 },
  textWhite: { color: "white", fontWeight: "500" },
});
