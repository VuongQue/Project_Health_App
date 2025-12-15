import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { IUserChallenge } from "@/src/types/challenge";

export default function ChallengeMiniCard({
  challenge,
}: {
  challenge: IUserChallenge;
}) {
  const percent = Math.round((challenge.progress || 0) * 100);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title} numberOfLines={1}>
          {challenge.name}
        </Text>
        <Text style={styles.percent}>{percent}%</Text>
      </View>

      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${percent}%` }]} />
      </View>

      <Text style={styles.sub}>
        {Math.round(percent)}% completed
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#1e293b",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#334155",
    marginBottom: 10,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  title: { color: "white", fontWeight: "600", flex: 1 },
  percent: { color: "#22c55e", fontWeight: "700" },
  progressBar: {
    height: 6,
    backgroundColor: "#0f172a",
    borderRadius: 6,
    overflow: "hidden",
    marginBottom: 4,
  },
  progressFill: { height: "100%", backgroundColor: "#22c55e" },
  sub: { color: "#94a3b8", fontSize: 12 },
});
