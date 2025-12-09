import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
} from "react-native";

import {
  Award,
  TrendingUp,
  Target,
  Settings,
  ChevronRight,
  Trophy,
  Flame,
  Star,
  User,
} from "lucide-react-native";

import { profileApi } from "@/src/api/profileApi";
import { UserProfile, BadgeItem, ChallengeItem } from "@/src/types/profile";

export default function ProfileScreen() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = async () => {
    try {
      const res = await profileApi.getMe();
      setProfile(res.data);
    } catch (err) {
      console.log("Profile load error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  if (loading || !profile) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  const { user, stats, badges, challenges } = profile;

  const statItems = [
    { label: "Total Workouts", value: stats.totalWorkouts, icon: TrendingUp, color: "#3b82f6" },
    { label: "Badges Earned", value: stats.badgesEarned, icon: Award, color: "#a855f7" },
    { label: "Current Streak", value: stats.currentStreak, icon: Flame, color: "#f97316" },
  ];

  return (
    <ScrollView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.row}>
          <View style={styles.avatar}>
            {user.avatarUrl ? (
              <Image source={{ uri: user.avatarUrl }} style={styles.avatarImg} />
            ) : (
              <User size={40} color="white" />
            )}
          </View>

          <View>
            <Text style={styles.title}>{user.fullName}</Text>
            <Text style={styles.subtitle}>@{user.username}</Text>

            <View style={styles.row}>
              <View style={styles.levelTag}>
                <Star size={12} color="#60a5fa" />
                <Text style={styles.levelText}>Level {user.level || 1}</Text>
              </View>
              <Text style={styles.points}>{user.points || 0} pts</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity style={styles.iconBtn}>
          <Settings color="#cbd5e1" size={20} />
        </TouchableOpacity>
      </View>

      {/* STATS */}
      <View style={styles.rowWrap}>
        {statItems.map((stat, i: number) => {
          const Icon = stat.icon;
          return (
            <View key={i} style={styles.statBox}>
              <View style={[styles.iconBox, { backgroundColor: stat.color + "20" }]}>
                <Icon color={stat.color} size={18} />
              </View>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          );
        })}
      </View>

      {/* CHALLENGES */}
      <Text style={styles.sectionTitle}>Active Challenges</Text>
      {challenges?.map((ch: ChallengeItem, i: number) => (
        <View key={i} style={styles.challengeCard}>
          <View style={styles.rowBetween}>
            <Text style={styles.textWhite}>{ch.name}</Text>
            <Text style={styles.textMuted}>
              {ch.daysCompleted}/{ch.totalDays}
            </Text>
          </View>

          <View style={styles.progressBg}>
            <View style={[styles.progressFill, { width: `${ch.progress}%` }]} />
          </View>
        </View>
      ))}

      {/* BADGES */}
      <View style={styles.badgeHeader}>
        <Text style={styles.sectionTitle}>Badges</Text>
        <Text style={styles.linkText}>View All</Text>
      </View>

      <View style={styles.badgeGrid}>
        {badges?.map((b: BadgeItem, i: number) => (
          <View key={i} style={styles.badgeCard}>
            {b.iconUrl ? (
              <Image source={{ uri: b.iconUrl }} style={styles.badgeImage} />
            ) : (
              <Award size={32} color="#facc15" />
            )}

            <Text style={styles.badgeName}>{b.name}</Text>
            <Text style={styles.badgeDate}>{b.date}</Text>
          </View>
        ))}
      </View>

      {/* MENU */}
      <TouchableOpacity style={styles.menuBtn}>
        <View style={styles.row}>
          <Trophy color="#94a3b8" size={20} />
          <Text style={styles.menuText}>Achievements</Text>
        </View>
        <ChevronRight color="#94a3b8" size={20} />
      </TouchableOpacity>

      <TouchableOpacity style={styles.menuBtn}>
        <View style={styles.row}>
          <Target color="#94a3b8" size={20} />
          <Text style={styles.menuText}>My Goals</Text>
        </View>
        <ChevronRight color="#94a3b8" size={20} />
      </TouchableOpacity>
    </ScrollView>
  );
}

/* ---------------------- STYLES ---------------------- */

const styles = StyleSheet.create({
  container: { backgroundColor: "#0f172a", flex: 1, padding: 16 },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },

  row: { flexDirection: "row", alignItems: "center", gap: 8 },

  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#3b82f6",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },

  avatarImg: {
    width: "100%",
    height: "100%",
    borderRadius: 36,
  },

  title: { color: "white", fontSize: 20, fontWeight: "bold" },
  subtitle: { color: "#94a3b8", fontSize: 13 },

  levelTag: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(37,99,235,0.2)",
    paddingHorizontal: 6,
    borderRadius: 8,
  },

  levelText: { color: "#60a5fa", fontSize: 11, marginLeft: 4 },
  points: { color: "#64748b", fontSize: 11 },

  iconBtn: { backgroundColor: "#1e293b", padding: 8, borderRadius: 12 },

  rowWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 10,
  },

  statBox: {
    width: "48%",
    backgroundColor: "#1e293b",
    borderWidth: 1,
    borderColor: "#334155",
    borderRadius: 16,
    padding: 12,
  },

  iconBox: { padding: 8, borderRadius: 10, marginBottom: 4 },
  statValue: { color: "white", fontSize: 20, fontWeight: "600" },
  statLabel: { color: "#94a3b8", fontSize: 12 },

  sectionTitle: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    marginVertical: 12,
  },

  challengeCard: {
    backgroundColor: "#1e293b",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#334155",
    padding: 12,
    marginBottom: 10,
  },

  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  textWhite: { color: "white" },
  textMuted: { color: "#94a3b8", fontSize: 13 },

  progressBg: {
    backgroundColor: "#334155",
    borderRadius: 4,
    height: 8,
    marginTop: 6,
  },

  progressFill: {
    height: "100%",
    borderRadius: 4,
    backgroundColor: "#2563eb",
  },

  badgeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  linkText: { color: "#3b82f6", fontSize: 13 },

  badgeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },

  badgeCard: {
    width: "30%",
    backgroundColor: "#1e293b",
    borderWidth: 1,
    borderColor: "#334155",
    borderRadius: 16,
    alignItems: "center",
    padding: 10,
    marginBottom: 10,
  },

  badgeImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginBottom: 6,
  },

  badgeName: { color: "white", fontSize: 12, textAlign: "center" },
  badgeDate: { color: "#64748b", fontSize: 11 },

  menuBtn: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#1e293b",
    borderWidth: 1,
    borderColor: "#334155",
    borderRadius: 16,
    padding: 12,
    marginVertical: 4,
  },

  menuText: { color: "white", fontSize: 15 },
});
