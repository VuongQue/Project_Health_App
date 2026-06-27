import React from "react";
import { View, Text, StyleSheet } from "react-native";

export interface AchievementCardProps {
  title: string;
  desc: string;
  icon: string; // emoji
  days: string;
}

export const AchievementCard: React.FC<AchievementCardProps> = ({
  title,
  desc,
  icon,
  days,
}) => {
  return (
    <View style={styles.card}>
      <View style={styles.iconCircle}>
        <Text style={{ fontSize: 26 }}>{icon}</Text>
      </View>

      <View style={{ flex: 1 }}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.desc}>{desc}</Text>
      </View>

      <Text style={styles.days}>{days}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    backgroundColor: "#1e293b",
    padding: 16,
    borderRadius: 18,
    alignItems: "center",
    marginBottom: 12,
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#fbbf24",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  title: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  desc: {
    color: "#94a3b8",
    fontSize: 12,
  },
  days: {
    color: "#64748b",
    fontSize: 12,
  },
});

export default AchievementCard;
