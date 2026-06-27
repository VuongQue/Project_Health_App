import React from "react";
import { TouchableOpacity, View, Text, StyleSheet } from "react-native";
import { Bell } from "lucide-react-native";
import { useNotifications } from "./NotificationContext";
import { useRouter } from "expo-router";
import { useColors, sw, sf } from "@/src/theme";

export default function NotificationBell() {
  const { unreadCount } = useNotifications();
  const router = useRouter();
  const colors = useColors();

  return (
    <TouchableOpacity
      onPress={() => router.push("/notifications" as any)}
      style={[styles.container, { backgroundColor: colors.bgCardElevated, borderColor: colors.border }]}
    >
      <Bell color={unreadCount > 0 ? colors.primary : colors.textSecondary} size={20} />
      {unreadCount > 0 && (
        <View style={[styles.badge, { backgroundColor: colors.danger, borderColor: colors.bgPrimary }]}>
          <Text style={styles.badgeText}>
            {unreadCount > 9 ? "9+" : unreadCount}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: sw(38), height: sw(38),
    borderRadius: sw(10),
    justifyContent: "center", alignItems: "center",
    borderWidth: 1,
  },
  badge: {
    position: "absolute",
    right: -4, top: -4,
    borderRadius: sw(9),
    minWidth: sw(16), height: sw(16),
    justifyContent: "center", alignItems: "center",
    paddingHorizontal: sw(3),
    borderWidth: 1.5,
  },
  badgeText: { color: "white", fontSize: sf(9), fontWeight: "bold" },
});
