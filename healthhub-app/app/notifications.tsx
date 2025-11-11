import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from "react-native";
import {
  X,
  Award,
  Users,
  Target,
  TrendingUp,
  Heart,
  LucideIcon,
} from "lucide-react-native";
import { useRouter, Stack } from "expo-router";

interface NotificationItem {
  id: number;
  icon: LucideIcon;
  color: string;
  title: string;
  message: string;
  time: string;
  unread: boolean;
}

const NotificationsScreen: React.FC = () => {
  const router = useRouter();

  const notifications: NotificationItem[] = [
    {
      id: 1,
      icon: Award,
      color: "#facc15",
      title: "Achievement Unlocked!",
      message: 'You earned the "Week Warrior" badge',
      time: "5 minutes ago",
      unread: true,
    },
    {
      id: 2,
      icon: Users,
      color: "#3b82f6",
      title: "Sarah joined your challenge",
      message: "30-Day Cardio Challenge",
      time: "1 hour ago",
      unread: true,
    },
    {
      id: 3,
      icon: Target,
      color: "#22c55e",
      title: "Goal Milestone Reached",
      message: "You completed 75% of your weekly goal!",
      time: "3 hours ago",
      unread: true,
    },
    {
      id: 4,
      icon: TrendingUp,
      color: "#a855f7",
      title: "New Personal Record",
      message: "Longest workout streak: 12 days!",
      time: "1 day ago",
      unread: false,
    },
    {
      id: 5,
      icon: Heart,
      color: "#ef4444",
      title: "Mike liked your post",
      message: '"Just completed my morning run!"',
      time: "1 day ago",
      unread: false,
    },
  ];

  return (
 
    <ScrollView style={styles.container}>
      
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Notifications</Text>
          <Text style={styles.subtitle}>3 new updates</Text>
        </View>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
          <X color="#cbd5e1" size={20} />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabRow}>
        <TouchableOpacity style={styles.tabActive}>
          <Text style={styles.tabTextActive}>All</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tab}>
          <Text style={styles.tabText}>Achievements</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tab}>
          <Text style={styles.tabText}>Social</Text>
        </TouchableOpacity>
      </View>

      {/* List */}
      <View style={{ marginTop: 16 }}>
        {notifications.map((item) => {
          const Icon = item.icon;
          return (
            <View
              key={item.id}
              style={[
                styles.notificationCard,
                item.unread && {
                  borderColor: "rgba(37,99,235,0.5)",
                  backgroundColor: "rgba(37,99,235,0.05)",
                },
              ]}
            >
              <View style={styles.rowStart}>
                <View
                  style={[
                    styles.iconCircle,
                    { backgroundColor: `${item.color}20` },
                  ]}
                >
                  <Icon color={item.color} size={18} />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={styles.rowBetween}>
                    <Text style={styles.textWhite}>{item.title}</Text>
                    {item.unread && <View style={styles.unreadDot} />}
                  </View>
                  <Text style={styles.textMuted}>{item.message}</Text>
                  <Text style={styles.textTime}>{item.time}</Text>
                </View>
              </View>
            </View>
          );
        })}
      </View>

      {/* Clear All */}
      <TouchableOpacity style={styles.clearBtn}>
        <Text style={styles.clearText}>Clear All Notifications</Text>
      </TouchableOpacity>
    </ScrollView>
    
  );
};

export default NotificationsScreen;

const styles = StyleSheet.create({
  container: { backgroundColor: "#0f172a", flex: 1, padding: 16 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: { color: "white", fontSize: 24, fontWeight: "bold" },
  subtitle: { color: "#94a3b8", fontSize: 13 },
  closeBtn: {
    backgroundColor: "#1e293b",
    borderRadius: 12,
    padding: 8,
  },
  tabRow: { flexDirection: "row", marginTop: 16, gap: 8 },
  tabActive: {
    backgroundColor: "#2563eb",
    borderRadius: 12,
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  tabTextActive: { color: "white", fontSize: 13 },
  tab: {
    backgroundColor: "#1e293b",
    borderRadius: 12,
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  tabText: { color: "#94a3b8", fontSize: 13 },
  notificationCard: {
    backgroundColor: "#1e293b",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#334155",
    padding: 12,
    marginBottom: 10,
  },
  rowStart: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  iconCircle: {
    padding: 8,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  rowBetween: { flexDirection: "row", justifyContent: "space-between" },
  textWhite: { color: "white", fontWeight: "500" },
  textMuted: { color: "#94a3b8", fontSize: 13, marginVertical: 2 },
  textTime: { color: "#64748b", fontSize: 11 },
  unreadDot: {
    width: 8,
    height: 8,
    backgroundColor: "#2563eb",
    borderRadius: 4,
    marginTop: 4,
  },
  clearBtn: {
    marginTop: 10,
    backgroundColor: "#1e293b",
    padding: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  clearText: { color: "#cbd5e1" },
});
