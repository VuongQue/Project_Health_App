import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
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
  LucideIcon,
} from "lucide-react-native";

interface StatItem {
  label: string;
  value: string;
  icon: LucideIcon;
  color: string;
}

interface ChallengeItem {
  name: string;
  progress: number;
  days: string;
}

interface BadgeItem {
  emoji: string;
  name: string;
  date: string;
}

const ProfileScreen: React.FC = () => {
  const badges: BadgeItem[] = [
    { emoji: "🏆", name: "Week Warrior", date: "Nov 7" },
    { emoji: "⭐", name: "Mood Master", date: "Nov 4" },
    { emoji: "💪", name: "Strength Pro", date: "Oct 28" },
    { emoji: "🔥", name: "10-Day Streak", date: "Oct 25" },
    { emoji: "🎯", name: "Goal Crusher", date: "Oct 20" },
    { emoji: "❤️", name: "Heart Hero", date: "Oct 15" },
  ];

  const stats: StatItem[] = [
    { label: "Total Workouts", value: "124", icon: TrendingUp, color: "#3b82f6" },
    { label: "Badges Earned", value: "23", icon: Award, color: "#a855f7" },
    { label: "Current Streak", value: "12", icon: Flame, color: "#f97316" },
    { label: "Goals Hit", value: "18", icon: Target, color: "#22c55e" },
  ];

  const challenges: ChallengeItem[] = [
    { name: "30-Day Cardio", progress: 40, days: "12/30" },
    { name: "Mindful November", progress: 75, days: "22/30" },
    { name: "Strength Builder", progress: 60, days: "18/30" },
  ];

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.row}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>👤</Text>
          </View>
          <View>
            <Text style={styles.title}>Alex Martinez</Text>
            <Text style={styles.subtitle}>@alexfitness</Text>
            <View style={styles.row}>
              <View style={styles.levelTag}>
                <Star size={12} color="#60a5fa" />
                <Text style={styles.levelText}>Level 8</Text>
              </View>
              <Text style={styles.points}>2,840 pts</Text>
            </View>
          </View>
        </View>
        <TouchableOpacity style={styles.iconBtn}>
          <Settings color="#cbd5e1" size={20} />
        </TouchableOpacity>
      </View>

      {/* Stats */}
      <View style={styles.rowWrap}>
        {stats.map((stat, i) => {
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

      {/* Challenges */}
      <Text style={styles.sectionTitle}>Active Challenges</Text>
      {challenges.map((ch, i) => (
        <View key={i} style={styles.challengeCard}>
          <View style={styles.rowBetween}>
            <Text style={styles.textWhite}>{ch.name}</Text>
            <Text style={styles.textMuted}>{ch.days}</Text>
          </View>
          <View style={styles.progressBg}>
            <View style={[styles.progressFill, { width: `${ch.progress}%` }]} />
          </View>
        </View>
      ))}

      {/* Badges */}
      <View style={styles.badgeHeader}>
        <Text style={styles.sectionTitle}>Badges</Text>
        <Text style={styles.linkText}>View All</Text>
      </View>
      <View style={styles.badgeGrid}>
        {badges.map((b, i) => (
          <View key={i} style={styles.badgeCard}>
            <View style={styles.badgeIcon}>
              <Text style={styles.badgeEmoji}>{b.emoji}</Text>
            </View>
            <Text style={styles.badgeName}>{b.name}</Text>
            <Text style={styles.badgeDate}>{b.date}</Text>
          </View>
        ))}
      </View>

      {/* Menu */}
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

      <TouchableOpacity style={styles.menuBtn}>
        <View style={styles.row}>
          <Settings color="#94a3b8" size={20} />
          <Text style={styles.menuText}>Settings</Text>
        </View>
        <ChevronRight color="#94a3b8" size={20} />
      </TouchableOpacity>
    </ScrollView>
  );
};

export default ProfileScreen;

const styles = StyleSheet.create({
  container: { backgroundColor: "#0f172a", flex: 1, padding: 16 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#3b82f6",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: { fontSize: 32 },
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
  rowWrap: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", rowGap: 10 },
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
  sectionTitle: { color: "white", fontSize: 16, fontWeight: "600", marginVertical: 12 },
  challengeCard: {
    backgroundColor: "#1e293b",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#334155",
    padding: 12,
    marginBottom: 10,
  },
  rowBetween: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  textWhite: { color: "white" },
  textMuted: { color: "#94a3b8", fontSize: 13 },
  progressBg: { backgroundColor: "#334155", borderRadius: 4, height: 8, marginTop: 6 },
  progressFill: { height: "100%", borderRadius: 4, backgroundColor: "#2563eb" },
  badgeHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  linkText: { color: "#3b82f6", fontSize: 13 },
  badgeGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
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
  badgeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#facc15",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 6,
  },
  badgeEmoji: { fontSize: 20 },
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
