import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { Bell, Flame, TrendingUp, Award, Target } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";

import axiosClient from "@/src/api/axiosClient";
import notificationApi from "@/src/api/notificationApi";
import { IUserChallenge } from "@/src/types/challenge";

export default function DashboardScreen() {
  const router = useRouter();

  const [summary, setSummary] = useState<{
    mood: string;
    streak: number;
    workoutsCompleted: number;
    workoutsTarget: number;
    challenges: IUserChallenge[];
    achievements: any[];
  }>({
    mood: "😊",
    streak: 0,
    workoutsCompleted: 0,
    workoutsTarget: 12,
    challenges: [],
    achievements: [],
  });
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      // ========== Notifications ==========
      const unread = await notificationApi.getUnreadCount();
      setUnreadCount(unread.data.count ?? 0);

      // ========== Mood Latest ==========
      const moodRes = await axiosClient.get("/moods/latest");
      const streakRes = await axiosClient.get("/moods/streak");

      const emoji = moodRes.data?.emoji ?? "😊";

      // ========== Workouts ==========
      const workoutRes = await axiosClient.get("/fitness/logs/week");

      // ========== Challenges ==========
      const challengeRes = await axiosClient.get("/challenges/me");

      // ========== Achievements ==========
      const achRes = await axiosClient.get("/achievements/me");

      setSummary({
        mood: emoji,
        streak: streakRes.data?.streak ?? 0,
        workoutsCompleted: workoutRes.data?.completed ?? 0,
        workoutsTarget: workoutRes.data?.target ?? 12,
        challenges: challengeRes.data ?? [],
        achievements: achRes.data ?? [],
      });
    } catch (err: any) {
      console.log("⚠️ Dashboard error:", err?.response?.data || err);
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>HealthHub</Text>
          <Text style={styles.subtitle}>Welcome back, Alex</Text>
        </View>

        <TouchableOpacity
          onPress={() => router.push("/notifications")}
          style={styles.notifButton}
        >
          <Bell size={22} color="#cbd5e1" />
          {unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {unreadCount > 9 ? "9+" : unreadCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* ==== MOOD CARD ==== */}
      <View style={styles.moodCard}>
        <Text style={styles.cardTitle}>Today's Mood</Text>

        <View style={styles.moodRow}>
          <Text style={styles.moodEmoji}>{summary.mood}</Text>

          <View style={{ flex: 1 }}>
            <Text style={styles.moodStatus}>How are you feeling today?</Text>

            <View style={styles.moodOptions}>
              {["😔", "😐", "🙂", "😊", "😄"].map((emoji, idx) => (
                <View
                  key={idx}
                  style={[
                    styles.moodItem,
                    emoji === summary.mood && styles.moodItemActive,
                  ]}
                >
                  <Text style={styles.moodItemText}>{emoji}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      </View>

      {/* ==== QUICK STATS ==== */}
      <Text style={styles.sectionTitle}>Quick Stats</Text>

      <View style={styles.statsGrid}>
        {/* Streak */}
        <View style={styles.statCard}>
          <View style={styles.iconRow}>
            <View style={[styles.iconBg, { backgroundColor: "#fb923c20" }]}>
              <Flame size={18} color="#fb923c" />
            </View>
            <Text style={styles.statLabel}>Streak</Text>
          </View>

          <Text style={styles.statValue}>{summary.streak}</Text>
          <Text style={styles.statSub}>days</Text>
        </View>

        {/* Workouts */}
        <View style={styles.statCard}>
          <View style={styles.iconRow}>
            <View style={[styles.iconBg, { backgroundColor: "#3b82f620" }]}>
              <TrendingUp size={18} color="#3b82f6" />
            </View>
            <Text style={styles.statLabel}>Workouts</Text>
          </View>

          <Text style={styles.statValue}>
            {summary.workoutsCompleted}/{summary.workoutsTarget}
          </Text>
          <Text style={styles.statSub}>this week</Text>
        </View>

        {/* Achievements */}
        <View style={styles.statCard}>
          <View style={styles.iconRow}>
            <View style={[styles.iconBg, { backgroundColor: "#a855f720" }]}>
              <Award size={18} color="#a855f7" />
            </View>
            <Text style={styles.statLabel}>Achievements</Text>
          </View>

          <Text style={styles.statValue}>{summary.achievements.length}</Text>
          <Text style={styles.statSub}>earned</Text>
        </View>

        {/* Challenges */}
        <View style={styles.statCard}>
          <View style={styles.iconRow}>
            <View style={[styles.iconBg, { backgroundColor: "#22c55e20" }]}>
              <Target size={18} color="#22c55e" />
            </View>
            <Text style={styles.statLabel}>Challenges</Text>
          </View>

          <Text style={styles.statValue}>{summary.challenges.length}</Text>
          <Text style={styles.statSub}>ongoing</Text>
        </View>
      </View>

      {/* ==== ACTIVE CHALLENGE ==== */}
      {summary.challenges.length > 0 && (
        <LinearGradient
          colors={["#2563eb", "#1d4ed8"]}
          style={styles.challengeCard}
        >
          <View style={styles.challengeHeader}>
            <View>
              <Text style={styles.challengeTitle}>
                {summary.challenges[0].name}
              </Text>
              <Text style={styles.challengeSubtitle}>
                Day {summary.challenges[0].completedDays}/
                {summary.challenges[0].durationDays}
              </Text>
            </View>

            <View style={styles.challengeDay}>
              <Text style={{ color: "white", fontSize: 12 }}>
                {summary.challenges[0].daysRemaining} days left
              </Text>
            </View>
          </View>

          <View style={styles.progressBarBg}>
            <View
              style={[
                styles.progressBar,
                {
                  width: `${summary.challenges[0].progress * 100}%`,
                },
              ]}
            />
          </View>
        </LinearGradient>
      )}

      {/* ==== RECENT ACHIEVEMENTS ==== */}
      <Text style={styles.sectionTitle}>Recent Achievements</Text>

      {summary.achievements.slice(0, 3).map((a: any, i) => (
        <View key={i} style={styles.achCard}>
          <Text style={styles.achIcon}>🏆</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.achTitle}>{a.title}</Text>
            <Text style={styles.achDesc}>{a.description}</Text>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

/* ===================== STYLES ======================= */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f172a",
    padding: 16,
  },

  /* HEADER */
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 22,
  },
  title: { color: "white", fontSize: 26, fontWeight: "700" },
  subtitle: { color: "#94a3b8", fontSize: 14 },

  notifButton: {
    padding: 10,
    backgroundColor: "#1e293b",
    borderRadius: 16,
    position: "relative",
  },

  badge: {
    position: "absolute",
    top: 2,
    right: 2,
    width: 18,
    height: 18,
    backgroundColor: "#2563eb",
    borderRadius: 9,
    justifyContent: "center",
    alignItems: "center",
  },
  badgeText: { color: "white", fontSize: 10, fontWeight: "bold" },

  /* Mood card */
  moodCard: {
    backgroundColor: "#1e293b",
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#334155",
  },
  moodRow: { flexDirection: "row", marginTop: 16 },
  moodEmoji: { fontSize: 56 },
  cardTitle: { color: "white", fontSize: 18, fontWeight: "600" },
  moodStatus: { color: "#cbd5e1", fontSize: 16, marginBottom: 10 },

  moodOptions: { flexDirection: "row", gap: 6 },
  moodItem: { padding: 8, borderRadius: 14 },
  moodItemActive: { backgroundColor: "#2563eb40" },
  moodItemText: { fontSize: 22, opacity: 0.7 },

  /* Stats */
  sectionTitle: {
    color: "white",
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 10,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    width: "47%",
    backgroundColor: "#1e293b",
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: "#334155",
  },
  iconRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 },
  iconBg: { padding: 6, borderRadius: 12 },
  statLabel: { color: "#94a3b8", fontSize: 13 },
  statValue: { color: "white", fontSize: 32, fontWeight: "700" },
  statSub: { color: "#94a3b8", fontSize: 12 },

  /* Challenge */
  challengeCard: {
    borderRadius: 26,
    padding: 20,
    marginBottom: 24,
  },
  challengeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  challengeTitle: { color: "white", fontSize: 20, fontWeight: "700" },
  challengeSubtitle: { color: "#dbeafe", fontSize: 14, marginTop: 2 },

  challengeDay: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 14,
  },

  progressBarBg: {
    width: "100%",
    height: 8,
    backgroundColor: "#1e3a8a",
    borderRadius: 4,
    marginBottom: 8,
  },
  progressBar: { height: 8, backgroundColor: "white", borderRadius: 4 },

  /* Achievements */
  achCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1e293b",
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: "#334155",
    marginBottom: 12,
    gap: 12,
  },
  achIcon: { fontSize: 34 },
  achTitle: { color: "white", fontSize: 16, fontWeight: "600" },
  achDesc: { color: "#94a3b8", fontSize: 13 },
});
