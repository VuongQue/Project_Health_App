import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { ReactNode } from "react";

export interface StatCardProps {
  icon: ReactNode;
  label: string;
  value: string | number;
  color: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  icon,
  label,
  value,
  color,
}) => {
  return (
    <View style={styles.card}>
      <View style={[styles.iconBox, { backgroundColor: color + "15" }]}>
        {icon}
      </View>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    width: "47%",
    backgroundColor: "#1e293b",
    borderRadius: 18,
    padding: 14,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  label: {
    color: "#94a3b8",
    fontSize: 12,
  },
  value: {
    color: "white",
    fontSize: 20,
    fontWeight: "700",
  },
});

export default StatCard;
