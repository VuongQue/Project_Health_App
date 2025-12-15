import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import challengeApi from "@/src/api/challengeApi";
import { ArrowLeft } from "lucide-react-native";


export default function ChallengeListScreen() {
  const router = useRouter();

  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [joiningId, setJoiningId] = useState<number | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      const res = await challengeApi.getAll();
      setList(res.data);
    } catch (e) {
      console.log("❌ load challenges error", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const onJoin = async (challengeId: number) => {
    try {
      setJoiningId(challengeId);
      await challengeApi.join(challengeId);
      await load(); // refresh list
    } catch (e: any) {
      Alert.alert(
        "Join failed",
        e?.response?.data?.message ?? "Something went wrong"
      );
    } finally {
      setJoiningId(null);
    }
  };

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color="#22c55e" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <ArrowLeft size={22} color="#e5e7eb" />
        </TouchableOpacity>
      <Text style={styles.title}>Challenges</Text>

      {list.map((c) => {
        const joined = c.joined;
        const percent = Math.round((c.userChallenge?.progress || 0) * 100);

        return (
          <TouchableOpacity
            key={c.id}
            style={styles.card}
            activeOpacity={0.9}
            onPress={() => router.push(`/challenges/${c.id}` as any)}
          >
            <Text style={styles.name}>{c.name}</Text>
            <Text style={styles.desc}>{c.description}</Text>

            {joined ? (
              <>
                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressFill,
                      { width: `${percent}%` },
                    ]}
                  />
                </View>
                <Text style={styles.sub}>{percent}% completed</Text>
              </>
            ) : (
              <TouchableOpacity
                style={[
                  styles.joinBtn,
                  joiningId === c.id && { opacity: 0.6 },
                ]}
                disabled={joiningId === c.id}
                onPress={(e) => {
                  e.stopPropagation(); // ⭐ QUAN TRỌNG
                  onJoin(c.id);
                }}
              >
                <Text style={styles.joinText}>
                  {joiningId === c.id ? "Joining..." : "Join Challenge"}
                </Text>
              </TouchableOpacity>
            )}
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f172a",
    padding: 16,
  },
  backBtn: {
    padding: 6,
},

  loading: {
    flex: 1,
    backgroundColor: "#0f172a",
    justifyContent: "center",
    alignItems: "center",
  },

  title: {
    color: "white",
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 16,
  },

  card: {
    backgroundColor: "#1e293b",
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "#334155",
    marginBottom: 12,
  },

  name: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },

  desc: {
    color: "#94a3b8",
    marginVertical: 6,
  },

  joinBtn: {
    marginTop: 10,
    backgroundColor: "#22c55e",
    paddingVertical: 10,
    borderRadius: 14,
    alignItems: "center",
  },

  joinText: {
    color: "#052e16",
    fontWeight: "700",
  },

  progressBar: {
    height: 8,
    backgroundColor: "#0f172a",
    borderRadius: 6,
    overflow: "hidden",
    marginTop: 10,
  },

  progressFill: {
    height: "100%",
    backgroundColor: "#22c55e",
  },

  sub: {
    color: "#94a3b8",
    fontSize: 12,
    marginTop: 4,
  },
});
