import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { Bell, TrendingUp, Award, Target, Flame } from "lucide-react-native";
import { useRouter } from "expo-router";

const DashboardScreen: React.FC = () => {
  const router = useRouter();

  // 🔹 state thông báo chưa đọc
  const [unreadCount, setUnreadCount] = useState<number>(3);

  // Giả lập fetch API — sau này bạn có thể thay bằng real backend call
  useEffect(() => {
    // Ví dụ: lấy dữ liệu chưa đọc từ backend
    // axios.get("/notifications/unread-count").then(res => setUnreadCount(res.data.count));
    setTimeout(() => setUnreadCount(3), 500);
  }, []);

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>HealthHub</Text>
          <Text style={styles.subtitle}>Welcome back, Alex</Text>
        </View>

        {/* Nút thông báo */}
        <TouchableOpacity
          onPress={() => {
            router.push("/notifications");
            setUnreadCount(0); // 👉 reset về 0 sau khi xem thông báo
          }}
          style={styles.notifButton}
        >
          <Bell color="#cbd5e1" size={22} />
          {unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {unreadCount > 9 ? "9+" : unreadCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Today's Mood */}
      <View style={styles.card}>
        <View style={styles.rowBetween}>
          <Text style={styles.sectionTitle}>Today's Mood</Text>
          <Text style={styles.mutedSmall}>Nov 9</Text>
        </View>
        <View style={styles.rowGap}>
          <Text style={styles.emoji}>😊</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.textLight}>Feeling Good</Text>
            <View style={styles.rowGap}>
              {["😔", "😐", "🙂", "😊", "😄"].map((emoji, i) => (
                <TouchableOpacity
                  key={i}
                  style={[
                    styles.moodButton,
                    emoji === "😊"
                      ? styles.moodSelected
                      : styles.moodUnselected,
                  ]}
                >
                  <Text
                    style={[
                      styles.moodEmoji,
                      emoji === "😊" && { transform: [{ scale: 1.2 }] },
                    ]}
                  >
                    {emoji}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </View>

      {/* Stats Grid */}
      <View style={styles.grid}>
        {[
          {
            label: "Streak",
            value: "12 days",
            icon: <Flame color="#f97316" size={18} />,
            bg: "rgba(249,115,22,0.1)",
          },
          {
            label: "Workouts",
            value: "8/12",
            icon: <TrendingUp color="#2563eb" size={18} />,
            bg: "rgba(37,99,235,0.1)",
          },
          {
            label: "Badges",
            value: "23",
            icon: <Award color="#a855f7" size={18} />,
            bg: "rgba(168,85,247,0.1)",
          },
          {
            label: "Goals",
            value: "5/7",
            icon: <Target color="#22c55e" size={18} />,
            bg: "rgba(34,197,94,0.1)",
          },
        ].map((item, i) => (
          <View key={i} style={styles.statCard}>
            <View style={styles.rowGap}>
              <View style={[styles.iconBox, { backgroundColor: item.bg }]}>
                {item.icon}
              </View>
              <Text style={styles.statLabel}>{item.label}</Text>
            </View>
            <Text style={styles.statValue}>{item.value}</Text>
          </View>
        ))}
      </View>

      {/* Active Challenge */}
      <View style={styles.challengeCard}>
        <View style={styles.rowBetween}>
          <View>
            <Text style={styles.challengeTitle}>30-Day Challenge</Text>
            <Text style={styles.challengeSub}>Cardio Master</Text>
          </View>
          <View style={styles.challengeBadge}>
            <Text style={styles.challengeBadgeText}>Day 12/30</Text>
          </View>
        </View>
        <View style={styles.progressBarBg}>
          <View style={[styles.progressBarFill, { width: "40%" }]} />
        </View>
        <Text style={styles.challengeText}>18 days remaining</Text>
      </View>

      {/* Recent Achievements */}
      <View style={{ marginTop: 24 }}>
        <Text style={styles.sectionTitle}>Recent Achievements</Text>
        {[
          {
            emoji: "🏆",
            title: "Week Warrior",
            desc: "Completed 7 workouts this week",
            time: "2d ago",
            bg: "#fbbf24",
          },
          {
            emoji: "⭐",
            title: "Mood Master",
            desc: "Logged mood for 30 days straight",
            time: "5d ago",
            bg: "#60a5fa",
          },
        ].map((a, i) => (
          <View key={i} style={styles.achievementCard}>
            <View style={[styles.achievementIcon, { backgroundColor: a.bg }]}>
              <Text style={styles.achievementEmoji}>{a.emoji}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.achievementTitle}>{a.title}</Text>
              <Text style={styles.achievementDesc}>{a.desc}</Text>
            </View>
            <Text style={styles.achievementTime}>{a.time}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

export default DashboardScreen;

const styles = StyleSheet.create({
  container: { backgroundColor: "#0f172a", flex: 1, padding: 16 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  title: { color: "white", fontSize: 24, fontWeight: "bold" },
  subtitle: { color: "#94a3b8", fontSize: 13 },
  notifButton: {
    padding: 10,
    backgroundColor: "#1e293b",
    borderRadius: 14,
    position: "relative",
  },
  badge: {
    position: "absolute",
    top: 2,
    right: 2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#2563eb",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  badgeText: {
    color: "white",
    fontSize: 10,
    fontWeight: "bold",
  },
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
  },
  rowGap: { flexDirection: "row", alignItems: "center", gap: 12 },
  sectionTitle: { color: "white", fontSize: 16, fontWeight: "600" },
  mutedSmall: { color: "#94a3b8", fontSize: 12 },
  emoji: { fontSize: 48 },
  textLight: { color: "#cbd5e1", marginBottom: 8 },
  moodButton: { padding: 6, borderRadius: 12 },
  moodSelected: { backgroundColor: "rgba(37,99,235,0.2)" },
  moodUnselected: { opacity: 0.4 },
  moodEmoji: { fontSize: 24 },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 12,
  },
  statCard: {
    width: "48%",
    backgroundColor: "#1e293b",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#334155",
    padding: 12,
  },
  iconBox: { padding: 8, borderRadius: 12 },
  statLabel: { color: "#94a3b8", fontSize: 12 },
  statValue: { color: "white", fontSize: 20, fontWeight: "600" },
  challengeCard: {
    backgroundColor: "#2563eb",
    borderRadius: 24,
    padding: 16,
    marginTop: 16,
  },
  challengeTitle: { color: "white", fontSize: 16, fontWeight: "600" },
  challengeSub: { color: "#bfdbfe", fontSize: 13 },
  challengeBadge: {
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 16,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  challengeBadgeText: { color: "white", fontSize: 13 },
  progressBarBg: {
    height: 8,
    backgroundColor: "rgba(30,64,175,0.5)",
    borderRadius: 4,
    marginTop: 12,
    marginBottom: 4,
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "white",
    borderRadius: 4,
  },
  challengeText: { color: "#bfdbfe", fontSize: 13 },
  achievementCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1e293b",
    borderWidth: 1,
    borderColor: "#334155",
    borderRadius: 16,
    padding: 12,
    marginTop: 12,
  },
  achievementIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  achievementEmoji: { fontSize: 22 },
  achievementTitle: { color: "white", fontWeight: "600" },
  achievementDesc: { color: "#94a3b8", fontSize: 13 },
  achievementTime: { color: "#64748b", fontSize: 12 },
});
