import React, { useEffect } from "react";
import { Modal, View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Trophy } from "lucide-react-native";
import { useRouter } from "expo-router";

type Props = {
  achievement: {
    code: string;
    name: string;
    points?: number;
  } | null;
  onClose: () => void;
};

export default function AchievementPopup({ achievement, onClose }: Props) {
  const router = useRouter();

  useEffect(() => {
    console.log("🪟 [Popup] Achievement data:", achievement);
  }, [achievement]);

  if (!achievement) return null;

  return (
    <Modal transparent visible animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Trophy size={56} color="#facc15" />
          <Text style={styles.title}>Achievement Unlocked!</Text>

          {/* ✅ FIX CHÍNH Ở ĐÂY */}
          <Text style={styles.name}>{achievement.name}</Text>

          {achievement.points !== undefined && (
            <Text style={styles.points}>+{achievement.points} points</Text>
          )}

          <View style={styles.actions}>
            <TouchableOpacity onPress={onClose} style={styles.btnSecondary}>
              <Text style={styles.btnText}>Later</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                onClose();
                router.push("/achievements" as any);
              }}
              style={styles.btnPrimary}
            >
              <Text style={styles.btnText}>View</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    width: "80%",
    backgroundColor: "#1e293b",
    padding: 20,
    borderRadius: 20,
    alignItems: "center",
  },
  title: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
    marginTop: 10,
  },
  name: {
    color: "#facc15",
    fontSize: 16,
    marginVertical: 8,
    fontWeight: "600",
  },
  points: {
    color: "#94a3b8",
    fontSize: 14,
  },
  actions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 16,
  },
  btnPrimary: {
    backgroundColor: "#2563eb",
    padding: 10,
    borderRadius: 10,
  },
  btnSecondary: {
    backgroundColor: "#334155",
    padding: 10,
    borderRadius: 10,
  },
  btnText: {
    color: "white",
    fontWeight: "500",
  },
});
