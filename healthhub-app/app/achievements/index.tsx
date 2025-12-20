import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { Lock, ChevronLeft } from "lucide-react-native";
import { useRouter } from "expo-router";
import { achievementApi } from "@/src/api/achievementApi";
import { ACHIEVEMENT_ICONS } from "@/src/icons/achievementIcons";
import { Award } from "lucide-react-native";

export default function AchievementsScreen() {
  const [list, setList] = useState<any[]>([]);
  const router = useRouter();

  useEffect(() => {
    achievementApi.myAchievements().then((res) => setList(res.data));
  }, []);

  return (
    <View style={styles.container}>
      {/* ===== HEADER ===== */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ChevronLeft size={28} color="#e5e7eb" />
        </TouchableOpacity>

        <View style={styles.headerTitle}>
          <Award size={20} color="#facc15" />
          <Text style={styles.headerText}>Achievements</Text>
        </View>

        <View style={{ width: 28 }} />
      </View>

      {/* ===== LIST ===== */}
      <FlatList
        data={list}
        keyExtractor={(i) => i.code}
        renderItem={({ item }) => {
          const unlocked = item.unlocked === true;
          const code = item.code ?? "";
          const Icon = ACHIEVEMENT_ICONS[code] || Award;

          return (
            <View style={styles.card}>
              {unlocked ? (
                <Icon size={32} color="#facc15" />
              ) : (
                <Icon size={32} color="#64748b" />
              )}

              <View style={{ flex: 1 }}>
                <Text style={styles.name}>
                  {unlocked ? item.name : item.displayName}
                </Text>

                {unlocked ? (
                  <>
                    <Text style={styles.desc}>{item.description}</Text>
                    <Text style={styles.date}>
                      Earned on{" "}
                      {new Date(item.earnedAt).toLocaleDateString()}
                    </Text>
                  </>
                ) : (
                  <Text style={styles.hint}>{item.hint}</Text>
                )}
              </View>

              {/* Optional: lock overlay */}
              {!unlocked && <Lock size={18} color="#475569" />}
            </View>
          );
        }}
      />
    </View>
  );
}



const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f172a",
  },

  /* ===== HEADER ===== */
  header: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderColor: "#1e293b",
  },

  headerTitle: {
    flex: 1,
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    alignItems: "center",
  },

  headerText: {
    color: "white",
    fontSize: 18,
    fontWeight: "700",
  },

  /* ===== CARD ===== */
  card: {
    flexDirection: "row",
    gap: 12,
    padding: 16,
    borderBottomWidth: 1,
    borderColor: "#334155",
    alignItems: "center",
  },

  name: { color: "white", fontSize: 15, fontWeight: "600" },
  desc: { color: "#94a3b8", fontSize: 13 },
  hint: { color: "#64748b", fontSize: 13, fontStyle: "italic" },
  date: { color: "#64748b", fontSize: 11 },
});
