import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
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
import { useRouter } from "expo-router";
import notificationApi from "../src/api/notificationApi";

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
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      const res = await notificationApi.getAll();
      // Backend trả về { id, type, message, isRead, createdAt }
      const mapped = res.data.map((item: any) => ({
        id: item.id,
        icon:
          item.type === "ACHIEVEMENT"
            ? Award
            : item.type === "CHALLENGE"
            ? Target
            : item.type === "EVENT"
            ? TrendingUp
            : Heart,
        color:
          item.type === "ACHIEVEMENT"
            ? "#facc15"
            : item.type === "CHALLENGE"
            ? "#22c55e"
            : item.type === "EVENT"
            ? "#3b82f6"
            : "#ef4444",
        title: item.type,
        message: item.message,
        time: new Date(item.createdAt).toLocaleString(),
        unread: !item.isRead,
      }));
      setNotifications(mapped);
    } catch (err) {
      if (err instanceof Error)
        console.log("⚠️ Lỗi tải notifications:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Notifications</Text>
          <Text style={styles.subtitle}>
            {notifications.filter((n) => n.unread).length} new updates
          </Text>
        </View>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
          <X color="#cbd5e1" size={20} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator color="#2563eb" style={{ marginTop: 30 }} />
      ) : (
        <View style={{ marginTop: 16 }}>
          {notifications.length === 0 ? (
            <Text style={{ color: "#94a3b8", textAlign: "center" }}>
              No notifications yet.
            </Text>
          ) : (
            notifications.map((item) => {
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
            })
          )}
        </View>
      )}

      <TouchableOpacity
        style={styles.clearBtn}
        onPress={() => notificationApi.clearAll().then(fetchNotifications)}
      >
        <Text style={styles.clearText}>Clear All Notifications</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

export default NotificationsScreen;

// 💅 styles giữ nguyên
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
