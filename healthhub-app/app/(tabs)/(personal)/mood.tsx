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
  const [selectedValue, setSelectedValue] = useState<number>(3); // 1–5
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [weekData, setWeekData] = useState<number[]>([]);
  const [weekLabels, setWeekLabels] = useState<string[]>([]);

  const [averageMood, setAverageMood] = useState<number | null>(null);
  const [change, setChange] = useState<number | null>(null);
  const [bestDay, setBestDay] = useState<string | null>(null);
  const [bestDayScore, setBestDayScore] = useState<number | null>(null);
  const [streak, setStreak] = useState<number | null>(null);
  const [todayDateText, setTodayDateText] = useState<string>("Today");

  const moods = [
    { emoji: "😔", label: "Sad", value: 1, color: "#64748b" },
    { emoji: "😐", label: "Okay", value: 2, color: "#94a3b8" },
    { emoji: "🙂", label: "Good", value: 3, color: "#facc15" },
    { emoji: "😊", label: "Happy", value: 4, color: "#4ade80" },
    { emoji: "😄", label: "Great", value: 5, color: "#22c55e" },
  ];

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);

      const res = await moodApi.getDashboard();
      const data = res.data;

      console.log("🔎 RAW DATA FE:", JSON.stringify(data, null, 2));

      const todayScore = data.today?.mood?.score ?? 3;
      setSelectedValue(todayScore);

      if (data.today?.date) {
        const d = new Date(data.today.date);
        setTodayDateText(
          d.toLocaleDateString(undefined, { month: "short", day: "numeric" })
        );
      }

      setAverageMood(data.insights?.averageMood ?? null);
      setChange(data.insights?.change ?? null);
      setBestDay(data.insights?.bestDay ?? null);
      setBestDayScore(data.insights?.bestDayScore ?? null);
      setStreak(data.insights?.streak ?? null);

      if (data.weekTrend) {
        setWeekLabels(data.weekTrend.labels ?? []);
        setWeekData(data.weekTrend.values ?? []);
      }
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Failed to load mood dashboard");
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
          score: selectedValue, // score 1..5
        },
      };

      await moodApi.saveMood(payload);
      await loadDashboard();

      Alert.alert("Success", "Mood saved!");
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Failed to save mood");
    } finally {
      setSaving(false);
    }
  };

  const insights = useMemo(
    () => [
      {
        label: "Average Mood",
        value: averageMood != null ? `${averageMood.toFixed(1)}/5` : "--",
        change:
          change != null ? `${change > 0 ? "+" : ""}${change.toFixed(1)}` : "",
        positive: change != null ? change >= 0 : true,
      },
      {
        label: "Best Day",
        value: bestDay ?? "--",
        emoji: bestDayScore ? moods[bestDayScore - 1]?.emoji : "",
      },
      {
        label: "Streak",
        value: streak != null ? `${streak} days` : "--",
        emoji: "🔥",
      },
    ],
    [averageMood, change, bestDay, bestDayScore, streak]
  );

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Mood Tracker</Text>
      <Text style={styles.subtitle}>How are you feeling today?</Text>

      {/* Today’s Mood */}
      <View style={styles.card}>
        <View style={styles.rowBetween}>
          <Text style={styles.sectionTitle}>Today's Mood</Text>

          <View style={styles.rowGap}>
            <Calendar size={16} color="#94a3b8" />
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
          style={[styles.saveBtn, saving && { opacity: 0.7 }]}
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

            {!!ins.change && (
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
          <TrendingUp size={18} color="#2563eb" />
          <Text style={styles.sectionTitle}>Weekly Trend</Text>
        </View>

        {loading ? (
          <View style={{ padding: 24 }}>
            <ActivityIndicator color="#2563eb" />
          </View>
        ) : (
          <LineChart
            data={{
              labels: weekLabels,
              datasets: [
                {
                  data: weekData,
                  color: () => "#2563eb",
                  strokeWidth: 3,
                },
                {
                  // invisible dataset forcing Y scale 1 → 5
                  data: [1, 5],
                  withDots: false,
                  color: () => "rgba(0,0,0,0)",
                  strokeWidth: 0,
                },
              ],
            }}
            width={Dimensions.get("window").width - 48}
            height={220}
            segments={4}
            yAxisInterval={1}
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
              propsForBackgroundLines: {
                strokeDasharray: "",
                stroke: "#334155",
              },
            }}
            bezier
            withInnerLines
            withOuterLines={false}
            style={{
              marginVertical: 12,
              borderRadius: 16,
            }}
          />
        )}
      </View>
    </ScrollView>
  );
}

/* ----------------------------------------------------------
    STYLES
----------------------------------------------------------- */
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
