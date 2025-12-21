import React, { useEffect, useState, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Calendar } from "lucide-react-native";
import { useRouter } from "expo-router";

import moodApi from "@/src/api/moodApi";
import fitnessApi from "@/src/api/fitnessApi";
import { getRandomMoodMessage } from "@/src/utils/moodMessages";

export default function MoodTrackerScreen() {
  const router = useRouter();

  const [selectedValue, setSelectedValue] = useState(3);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [averageMood, setAverageMood] = useState<number | null>(null);
  const [bestDay, setBestDay] = useState<string | null>(null);
  const [bestDayScore, setBestDayScore] = useState<number | null>(null);
  const [streak, setStreak] = useState<number | null>(null);
  const [todayDateText, setTodayDateText] = useState("Today");

  const [suggestedWorkouts, setSuggestedWorkouts] = useState<any[]>([]);
  const [loadingWorkout, setLoadingWorkout] = useState(false);

  const [moodMessage, setMoodMessage] = useState("");

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

      const score = data.today?.mood?.score ?? 3;
      setSelectedValue(score);

      setMoodMessage(getRandomMoodMessage(score));

      if (data.today?.date) {
        const d = new Date(data.today.date);
        setTodayDateText(
          d.toLocaleDateString(undefined, { month: "short", day: "numeric" })
        );
      }

      setAverageMood(data.insights?.averageMood ?? null);
      setBestDay(data.insights?.bestDay ?? null);
      setBestDayScore(data.insights?.bestDayScore ?? null);
      setStreak(data.insights?.streak ?? null);

      await loadMoodWorkouts(score);
    } catch {
      Alert.alert("Error", "Failed to load mood dashboard");
    } finally {
      setLoading(false);
    }
  };

  const loadMoodWorkouts = async (score: number) => {
    try {
      setLoadingWorkout(true);
      const res = await fitnessApi.getMoodWorkouts(score);
      setSuggestedWorkouts(res.data.slice(0, 3));
    } catch {
      setSuggestedWorkouts([]);
    } finally {
      setLoadingWorkout(false);
    }
  };

  const handleSelectMood = (value: number) => {
    setSelectedValue(value);
  };

  const handleSaveMood = async () => {
    try {
      setSaving(true);
      const mood = moods.find((m) => m.value === selectedValue)!;

      await moodApi.saveMood({
        date: new Date().toISOString(),
        mood: {
          emoji: mood.emoji,
          color: mood.color,
          score: selectedValue,
        },
      });

      setMoodMessage(getRandomMoodMessage(selectedValue, moodMessage));
      await loadMoodWorkouts(selectedValue);
      Alert.alert("Saved", "Your mood has been recorded 💙");
    } catch {
      Alert.alert("Error", "Failed to save mood");
    } finally {
      setSaving(false);
    }
  };

  const insights = useMemo(
    () => [
      {
        label: "Average",
        value: averageMood != null ? `${averageMood.toFixed(1)}/5` : "--",
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
    [averageMood, bestDay, bestDayScore, streak]
  );

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Mood Tracker</Text>
      <Text style={styles.subtitle}>How are you feeling today?</Text>

      {/* TODAY MOOD */}
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
              onPress={() => handleSelectMood(m.value)}
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
          onPress={handleSaveMood}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveBtnText}>Save Mood</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* MESSAGE */}
      <View style={styles.messageCard}>
        <Text style={styles.messageText}>{moodMessage}</Text>
        <Text style={styles.messageHint}>
          Những bài tập bên dưới có thể giúp tâm trạng bạn tốt hơn 
          Hãy thử nhé !!💙
        </Text>
      </View>

      {/* INSIGHTS */}
      <View style={styles.rowWrap}>
        {insights.map((ins, i) => (
          <View key={i} style={styles.insightBox}>
            <Text style={styles.textSmall}>{ins.label}</Text>
            <View style={styles.rowGap}>
              <Text style={styles.textWhite}>{ins.value}</Text>
              {ins.emoji && <Text>{ins.emoji}</Text>}
            </View>
          </View>
        ))}
      </View>

      {/* WORKOUT SUGGESTION */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Recommended for You</Text>

        {loadingWorkout ? (
          <ActivityIndicator style={{ marginTop: 12 }} />
        ) : suggestedWorkouts.length === 0 ? (
          <Text style={styles.textMuted}>No suitable workout found</Text>
        ) : (
          suggestedWorkouts.map((w) => (
            <TouchableOpacity
              key={w.id}
              style={styles.workoutItem}
              onPress={() =>
                router.push(`/workout/${w.id}` as any)
              }
            >
              <Text style={styles.workoutTitle}>{w.title}</Text>
              <Text style={styles.textMuted}>
                {w.focusType} · {w.level}
              </Text>
            </TouchableOpacity>
          ))
        )}
      </View>
    </ScrollView>
  );
}


/* ========================= STYLES ========================= */

const styles = StyleSheet.create({
  container: { backgroundColor: "#0f172a", flex: 1, padding: 16 },
  title: { color: "white", fontSize: 24, fontWeight: "bold" },
  subtitle: { color: "#94a3b8", fontSize: 13, marginBottom: 16 },

  card: {
    backgroundColor: "#1e293b",
    borderRadius: 20,
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
    borderRadius: 14,
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
    marginBottom: 16,
  },
  insightBox: {
    width: "31%",
    backgroundColor: "#1e293b",
    borderRadius: 14,
    padding: 10,
    borderWidth: 1,
    borderColor: "#334155",
  },

  textSmall: { color: "#94a3b8", fontSize: 12 },
  textWhite: { color: "white", fontWeight: "500" },

  workoutItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: "#334155",
  },
  workoutTitle: { color: "white", fontWeight: "600" },

  messageCard: {
    backgroundColor: "#1e293b",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#334155",
    marginBottom: 16,
  },

  messageText: {
    color: "#e5e7eb",
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 6,
  },

  messageHint: {
    color: "#93c5fd",
    fontSize: 12,
  },

});
