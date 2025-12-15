import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { Bell, Flame, TrendingUp, Award, Target } from "lucide-react-native";
import { useRouter } from "expo-router";

import axiosClient from "@/src/api/axiosClient";
import { profileApi } from "@/src/api/profileApi";
import { IUserChallenge } from "@/src/types/challenge";
import { useNotifications } from "@/app/notifications/NotificationContext";
import ChallengeMiniCard from "@/components/challenge/ChallengeMiniCard";

export default function DashboardScreen() {
  const router = useRouter();
  const { unreadCount } = useNotifications();

  const [userName, setUserName] = useState("User");

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

  const MOOD_EMOJIS = ["😔", "😐", "🙂", "😊", "😄"];

  const normalizeMoodScore = (raw?: number | null) => {
    if (!raw) return 3;
    return Math.min(5, Math.max(1, raw));
  };

  useEffect(() => {
    fetchUserInfo();
    fetchDashboard();
  }, []);

  // ================= USER INFO =================
  const fetchUserInfo = async () => {
    try {
      const res = await profileApi.getMe();
      setUserName(res.data.user?.fullName || "User");
    } catch (err) {
      console.log("⚠️ Error loading user info:", err);
    }
  };

  // ================= DASHBOARD =================
  const fetchDashboard = async () => {
    try {
      const moodDash = await axiosClient.get("/moods/dashboard");
      const todayScore = normalizeMoodScore(
        moodDash.data?.today?.mood?.score
      );
      const todayEmoji = MOOD_EMOJIS[todayScore - 1];
      const streak = moodDash.data?.insights?.streak ?? 0;

      const workoutRes = await axiosClient.get("/fitness/logs/week");
      const challengeRes = await axiosClient.get("/challenges/me");
      const achRes = await axiosClient.get("/achievements/me");

      setSummary({
        mood: todayEmoji,
        streak,
        workoutsCompleted: workoutRes.data?.completed ?? 0,
        workoutsTarget: workoutRes.data?.target ?? 12,
        challenges: challengeRes.data ?? [],
        achievements: achRes.data ?? [],
      });
    } catch (err) {
      console.log("⚠️ Dashboard error:", err);
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* ================= HEADER ================= */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>HealthHub</Text>
          <Text style={styles.subtitle}>Welcome back, {userName}</Text>
        </View>

        <TouchableOpacity
          onPress={() => router.push("/notifications" as any)}
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

      {/* ================= MOOD ================= */}
      <View style={styles.moodCard}>
        <Text style={styles.cardTitle}>Today's Mood</Text>
        <View style={styles.moodRow}>
          <Text style={styles.moodEmoji}>{summary.mood}</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.moodStatus}>
              How are you feeling today?
            </Text>
            <View style={styles.moodOptions}>
              {MOOD_EMOJIS.map((emoji, idx) => (
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

      {/* ================= QUICK STATS ================= */}
      <Text style={styles.sectionTitle}>Quick Stats</Text>
      <View style={styles.statsGrid}>
        <StatCard icon={<Flame size={18} color="#fb923c" />} label="Streak" value={summary.streak} sub="days" />
        <StatCard
          icon={<TrendingUp size={18} color="#3b82f6" />}
          label="Workouts"
          value={`${summary.workoutsCompleted}/${summary.workoutsTarget}`}
          sub="this week"
        />
        <StatCard
          icon={<Award size={18} color="#a855f7" />}
          label="Achievements"
          value={summary.achievements.length}
          sub="earned"
        />
        <StatCard
          icon={<Target size={18} color="#22c55e" />}
          label="Challenges"
          value={summary.challenges.length}
          sub="ongoing"
        />
      </View>

      {/* ================= CHALLENGES ================= */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Challenges</Text>
        <TouchableOpacity onPress={() => router.push("/challenges" as any)}>
          <Text style={styles.seeAll}>View all</Text>
        </TouchableOpacity>
      </View>

      {summary.challenges.length > 0 ? (
        summary.challenges.slice(0, 2).map((c) => (
          <ChallengeMiniCard key={c.id} challenge={c} />
        ))
      ) : (
        <TouchableOpacity
          style={styles.emptyCard}
          onPress={() => router.push("/challenges" as any)}
        >
          <Text style={{ color: "#94a3b8" }}>
            🚀 Join your first challenge
          </Text>
        </TouchableOpacity>
      )}

    </ScrollView>
  );
}

/* ================= REUSABLE CARD ================= */

function StatCard({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: any;
  sub: string;
}) {
  return (
    <View style={styles.statCard}>
      <View style={styles.iconRow}>
        <View style={styles.iconBg}>{icon}</View>
        <Text style={styles.statLabel}>{label}</Text>
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statSub}>{sub}</Text>
    </View>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f172a", padding: 16 },

  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 22 },
  title: { color: "white", fontSize: 26, fontWeight: "700" },
  subtitle: { color: "#94a3b8", fontSize: 14 },

  notifButton: { padding: 10, backgroundColor: "#1e293b", borderRadius: 16 },
  badge: { position: "absolute", top: 2, right: 2, width: 18, height: 18, backgroundColor: "#2563eb", borderRadius: 9, justifyContent: "center", alignItems: "center" },
  badgeText: { color: "white", fontSize: 10, fontWeight: "bold" },

  moodCard: { backgroundColor: "#1e293b", borderRadius: 24, padding: 20, marginBottom: 20, borderWidth: 1, borderColor: "#334155" },
  moodRow: { flexDirection: "row", marginTop: 16 },
  moodEmoji: { fontSize: 56 },
  cardTitle: { color: "white", fontSize: 18, fontWeight: "600" },
  moodStatus: { color: "#cbd5e1", fontSize: 16, marginBottom: 10 },
  moodOptions: { flexDirection: "row", gap: 6 },
  moodItem: { padding: 8, borderRadius: 14 },
  moodItemActive: { backgroundColor: "#2563eb40" },
  moodItemText: { fontSize: 22, opacity: 0.7 },

  sectionTitle: { color: "white", fontSize: 20, fontWeight: "700", marginBottom: 10 },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },

  statCard: { width: "47%", backgroundColor: "#1e293b", borderRadius: 22, padding: 18, borderWidth: 1, borderColor: "#334155" },
  iconRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 },
  iconBg: { padding: 6, borderRadius: 12 },
  statLabel: { color: "#94a3b8", fontSize: 13 },
  statValue: { color: "white", fontSize: 32, fontWeight: "700" },
  statSub: { color: "#94a3b8", fontSize: 12 },

  challengeCard: {
    backgroundColor: "#1e293b",
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "#334155",
  },
  challengeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  challengeTitle: {
    color: "white",
    fontSize: 15,
    fontWeight: "600",
    flex: 1,
    paddingRight: 8,
  },
  challengePercent: {
    color: "#22c55e",
    fontWeight: "700",
  },
  progressBar: {
    height: 8,
    backgroundColor: "#0f172a",
    borderRadius: 6,
    overflow: "hidden",
    marginBottom: 6,
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#22c55e",
  },
  challengeSub: {
    color: "#94a3b8",
    fontSize: 12,
  },

  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 22,
    marginBottom: 10,
  },
  seeAll: {
    color: "#3b82f6",
    fontWeight: "600",
  },
  emptyCard: {
    backgroundColor: "#1e293b",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#334155",
    alignItems: "center",
  },

});
