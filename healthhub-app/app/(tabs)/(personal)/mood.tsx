import React, { useEffect, useState, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Calendar, TrendingUp } from "lucide-react-native";
import { LineChart } from "react-native-chart-kit";

import moodApi from "@/src/api/moodApi";

export default function MoodTrackerScreen() {
  const [selectedValue, setSelectedValue] = useState<number>(4);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [weekData, setWeekData] = useState<number[]>([0, 0, 0, 0, 0, 0, 0]);
  const [weekLabels, setWeekLabels] = useState<string[]>([
    "Mon",
    "Tue",
    "Wed",
    "Thu",
    "Fri",
    "Sat",
    "Sun",
  ]);

  const [averageMood, setAverageMood] = useState<number | null>(null);
  const [change, setChange] = useState<number | null>(null);
  const [bestDay, setBestDay] = useState<string | null>(null);
  const [bestDayEmoji, setBestDayEmoji] = useState<string | null>(null);
  const [streak, setStreak] = useState<number | null>(null);
  const [todayDateText, setTodayDateText] = useState<string>("Today");

  // TODO: Thay bằng token thật từ auth
  const token = "<JWT_TOKEN>";

  const moods = [
    { emoji: "😔", label: "Sad", value: 1, color: "#64748b" },
    { emoji: "😐", label: "Okay", value: 2, color: "#94a3b8" },
    { emoji: "🙂", label: "Good", value: 3, color: "#facc15" },
    { emoji: "😊", label: "Happy", value: 4, color: "#4ade80" },
    { emoji: "😄", label: "Great", value: 5, color: "#22c55e" },
  ];

  const selectedMood = useMemo(
    () => moods.find((m) => m.value === selectedValue) ?? moods[3],
    [selectedValue]
  );

  const insights = useMemo(
    () => [
      {
        label: "Average Mood",
        value:
          averageMood != null ? `${averageMood.toFixed(1)}/5` : "--",
        change:
          change != null && !Number.isNaN(change)
            ? (change > 0 ? "+" : "") + change.toFixed(1)
            : undefined,
        positive: change != null ? change >= 0 : true,
      },
      {
        label: "Best Day",
        value: bestDay ?? "--",
        emoji: bestDayEmoji ?? undefined,
      },
      {
        label: "Streak",
        value: streak != null ? `${streak} days` : "--",
        emoji: "🔥",
      },
    ],
    [averageMood, change, bestDay, bestDayEmoji, streak]
  );

  // Load Dashboard 1 lần duy nhất
  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);

      const res = await moodApi.getDashboard(); // axios response
      const data = res.data; // ⭐ lấy data thật

      // Now safe:
      setSelectedValue(data.today?.mood ? data.today.mood.score + 3 : 4);

      if (data.today?.date) {
        const d = new Date(data.today.date);
        const text = d.toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
        });
        setTodayDateText(text);
      }

      const ins = data.insights ?? {};
      setAverageMood(ins.averageMood ?? null);
      setChange(ins.change ?? null);
      setBestDay(ins.bestDay ?? null);
      setBestDayEmoji(ins.bestDayEmoji ?? null);
      setStreak(ins.streak ?? null);

      if (data.weekTrend) {
        setWeekLabels(data.weekTrend.labels ?? weekLabels);
        setWeekData(data.weekTrend.values ?? weekData);
      }

    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Failed to load mood data");
    } finally {
      setLoading(false);
    }
  };


  const handleSaveMood = async () => {
    try {
      setSaving(true);

      const mood = moods.find((m) => m.value === selectedValue)!;

      const payload = {
        date: new Date().toISOString(),
        mood: {
          emoji: mood.emoji,
          color: mood.color,
          score: mood.value - 3, // convert 1..5 → -2..2
        },
      };

      await moodApi.saveMood(payload);

      await loadDashboard();
      Alert.alert("Success", "Mood saved!");
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Cannot save mood");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Mood Tracker</Text>
      <Text style={styles.subtitle}>How are you feeling today?</Text>

      {/* Mood Card */}
      <View style={styles.card}>
        <View style={styles.rowBetween}>
          <Text style={styles.sectionTitle}>Today's Mood</Text>
          <View style={styles.rowGap}>
            <Calendar color="#94a3b8" size={16} />
            <Text style={styles.textMuted}>{todayDateText}</Text>
          </View>
        </View>

        <View style={styles.rowBetween}>
          {moods.map((m) => (
            <TouchableOpacity
              key={m.value}
              onPress={() => setSelectedValue(m.value)}
              style={[
                styles.moodButton,
                selectedValue === m.value
                  ? styles.moodActive
                  : styles.moodInactive,
              ]}
            >
              <Text style={styles.moodEmoji}>{m.emoji}</Text>
              <Text style={styles.moodLabel}>{m.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.saveBtn, saving && { opacity: 0.6 }]}
          disabled={saving}
          onPress={handleSaveMood}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveBtnText}>Save Mood</Text>
          )}
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

      {/* Weekly Trend */}
      <View style={styles.card}>
        <View style={styles.rowGap}>
          <TrendingUp color="#2563eb" size={18} />
          <Text style={styles.sectionTitle}>Weekly Trend</Text>
        </View>

        {loading ? (
          <View style={{ paddingVertical: 24 }}>
            <ActivityIndicator color="#2563eb" />
          </View>
        ) : (
          <LineChart
            data={{
              labels: weekLabels,
              datasets: [{ data: weekData }],
            }}
            width={Dimensions.get("window").width - 48}
            height={220}
            chartConfig={{
              backgroundGradientFrom: "#1e293b",
              backgroundGradientTo: "#1e293b",
              decimalPlaces: 0,
              color: () => "#2563eb",
              labelColor: () => "#94a3b8",
              propsForDots: {
                r: "4",
                strokeWidth: "2",
                stroke: "#2563eb",
              },
            }}
            bezier
            style={{ marginVertical: 12, borderRadius: 16 }}
          />
        )}
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
