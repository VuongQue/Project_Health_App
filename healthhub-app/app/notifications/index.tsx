// app/notifications.tsx (hoặc đường dẫn bạn đang dùng)
import React from "react";
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
  Target,
  TrendingUp,
  Heart,
  LucideIcon,
} from "lucide-react-native";
import { useRouter } from "expo-router";
import { useNotifications } from "./NotificationContext";

interface NotificationItemUI {
  id: number;
  icon: LucideIcon;
  color: string;
  title: string;
  message: string;
  time: string;
  unread: boolean;
}

const mapNotiToUI = (item: any): NotificationItemUI => {
  const type = item.type;
  const base: NotificationItemUI = {
    id: item.id,
    icon: Heart,
    color: "#ef4444",
    title: type,
    message: item.message,
    time: new Date(item.createdAt).toLocaleString(),
    unread: !item.isRead,
  };

  if (type === "ACHIEVEMENT") {
    return { ...base, icon: Award, color: "#facc15" };
  }
  if (type === "CHALLENGE") {
    return { ...base, icon: Target, color: "#22c55e" };
  }
  if (type === "EVENT" || type === "PLAN" || type === "WORKOUT") {
    return { ...base, icon: TrendingUp, color: "#3b82f6" };
  }

  return base;
};

const NotificationsScreen: React.FC = () => {
  const router = useRouter();
  const { notifications, loading, clearAll, markAllAsRead } = useNotifications();

  const mapped: NotificationItemUI[] = notifications.map(mapNotiToUI);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Notifications</Text>
          <Text style={styles.subtitle}>
            {mapped.filter((n) => n.unread).length} new updates
          </Text>
        </View>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
          <X color="#cbd5e1" size={20} />
        </TouchableOpacity>
      </View>

      <View style={{ flexDirection: "row", gap: 10, marginTop: 10 }}>
        <TouchableOpacity
          style={[styles.chipBtn]}
          onPress={markAllAsRead}
        >
          <Text style={styles.chipText}>Mark all as read</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.chipBtn]}
          onPress={clearAll}
        >
          <Text style={styles.chipText}>Clear all</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator color="#2563eb" style={{ marginTop: 30 }} />
      ) : (
        <View style={{ marginTop: 16 }}>
          {mapped.length === 0 ? (
            <Text style={{ color: "#94a3b8", textAlign: "center" }}>
              No notifications yet.
            </Text>
          ) : (
            mapped.map((item) => {
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
  chipBtn: {
    backgroundColor: "#1e293b",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  chipText: { color: "#cbd5e1", fontSize: 12 },
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
});
