// src/notifications/NotificationBell.tsx
import React from "react";
import { TouchableOpacity, View, Text, StyleSheet } from "react-native";
import { Bell } from "lucide-react-native";
import { useNotifications } from "./NotificationContext";
import { useRouter } from "expo-router";

export default function NotificationBell() {
  const { unreadCount } = useNotifications();
  const router = useRouter();

  return (
    <TouchableOpacity
      onPress={() => router.push("/notifications" as any)}
      style={styles.container}
    >
      <Bell color="#e5e7eb" size={22} />
      {unreadCount > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {unreadCount > 9 ? "9+" : unreadCount}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { padding: 6 },
  badge: {
    position: "absolute",
    right: 0,
    top: -2,
    backgroundColor: "#ef4444",
    borderRadius: 999,
    minWidth: 16,
    height: 16,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 3,
  },
  badgeText: {
    color: "white",
    fontSize: 10,
    fontWeight: "bold",
  },
});
