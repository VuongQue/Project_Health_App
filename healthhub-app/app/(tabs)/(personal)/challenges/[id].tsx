import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import challengeApi from "@/src/api/challengeApi";
import { ArrowLeft } from "lucide-react-native";

export default function ChallengeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      setLoading(true);
      const res = await challengeApi.getAll();
      const found = res.data.find(
        (c: any) => String(c.id) === String(id)
      );
      setData(found);
    } catch (err) {
      console.log("❌ load challenge detail error", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  const onJoin = async () => {
    try {
      await challengeApi.join(Number(id));
      await load();
    } catch (e: any) {
      Alert.alert("Error", e?.response?.data?.message ?? "Join failed");
    }
  };

  const onLeave = async () => {
    if (!data?.userChallenge?.id) return;

    Alert.alert(
      "Leave Challenge",
      "Are you sure you want to leave this challenge?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Leave",
          style: "destructive",
          onPress: async () => {
            await challengeApi.leave(data.userChallenge.id);
            router.back();
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color="#22c55e" />
      </View>
    );
  }

  if (!data) {
    return (
      <View style={styles.loading}>
        <Text style={{ color: "#94a3b8" }}>Challenge not found</Text>
      </View>
    );
  }

  const joined = data.joined;
  const percent = Math.round(
    (data.userChallenge?.progress || 0) * 100
  );

  return (
    <ScrollView style={styles.container}>
      {/* ===== HEADER ===== */}
    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
        <ArrowLeft size={22} color="#e5e7eb" />
    </TouchableOpacity>
      <Text style={styles.title}>{data.name}</Text>
      <Text style={styles.desc}>{data.description}</Text>

      {/* ===== PROGRESS ===== */}
      {joined && (
        <View style={styles.progressBox}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>Progress</Text>
            <Text style={styles.percent}>{percent}%</Text>
          </View>

          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${percent}%` },
              ]}
            />
          </View>

          <Text style={styles.sub}>
            {data.userChallenge.completedCount} /{" "}
            {data.targetCount} completed
          </Text>
        </View>
      )}

      {/* ===== STREAK ===== */}
      {joined && (
        <View style={styles.streakBox}>
          <View>
            <Text style={styles.streakValue}>
              {data.userChallenge.currentStreak}
            </Text>
            <Text style={styles.streakLabel}>Current streak</Text>
          </View>
          <View>
            <Text style={styles.streakValue}>
              {data.userChallenge.maxStreak}
            </Text>
            <Text style={styles.streakLabel}>Best streak</Text>
          </View>
        </View>
      )}

      {/* ===== ACTION ===== */}
      {!joined ? (
        <TouchableOpacity style={styles.joinBtn} onPress={onJoin}>
          <Text style={styles.joinText}>Join Challenge</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity style={styles.leaveBtn} onPress={onLeave}>
          <Text style={styles.leaveText}>Leave Challenge</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f172a", padding: 16 },
    
  backBtn: {
    padding: 6,},
    
  loading: {
    flex: 1,
    backgroundColor: "#0f172a",
    justifyContent: "center",
    alignItems: "center",
  },

  title: {
    color: "white",
    fontSize: 26,
    fontWeight: "700",
    marginBottom: 6,
  },
  desc: {
    color: "#94a3b8",
    fontSize: 15,
    marginBottom: 20,
  },

  progressBox: {
    backgroundColor: "#1e293b",
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "#334155",
    marginBottom: 16,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  progressLabel: { color: "#94a3b8" },
  percent: { color: "#22c55e", fontWeight: "700" },

  progressBar: {
    height: 8,
    backgroundColor: "#0f172a",
    borderRadius: 6,
    overflow: "hidden",
    marginBottom: 6,
  },
  progressFill: { height: "100%", backgroundColor: "#22c55e" },

  sub: { color: "#94a3b8", fontSize: 12 },

  streakBox: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: "#1e293b",
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: "#334155",
    marginBottom: 24,
  },
  streakValue: {
    color: "white",
    fontSize: 28,
    fontWeight: "700",
    textAlign: "center",
  },
  streakLabel: {
    color: "#94a3b8",
    fontSize: 12,
    textAlign: "center",
  },

  joinBtn: {
    backgroundColor: "#22c55e",
    paddingVertical: 14,
    borderRadius: 18,
    alignItems: "center",
  },
  joinText: { color: "#052e16", fontWeight: "700", fontSize: 16 },

  leaveBtn: {
    borderWidth: 1,
    borderColor: "#ef4444",
    paddingVertical: 14,
    borderRadius: 18,
    alignItems: "center",
  },
  leaveText: { color: "#ef4444", fontWeight: "700", fontSize: 16 },
});
