import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Image,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import axiosClient from "@/src/api/axiosClient";
import { Trophy, Medal } from "lucide-react-native";

interface LeaderEntry {
  rank: number;
  id: number;
  fullName: string;
  avatarUrl?: string;
  level: number;
  points: number;
  isMe: boolean;
}

const RANK_COLORS = ["#f59e0b", "#94a3b8", "#b45309"];

function RankBadge({ rank }: { rank: number }) {
  if (rank <= 3) {
    return (
      <View style={[styles.rankCircle, { backgroundColor: RANK_COLORS[rank - 1] + "33" }]}>
        <Trophy size={14} color={RANK_COLORS[rank - 1]} />
      </View>
    );
  }
  return (
    <View style={styles.rankCircle}>
      <Text style={styles.rankNum}>#{rank}</Text>
    </View>
  );
}

function LeaderRow({ item }: { item: LeaderEntry }) {
  const { t } = useTranslation();
  const initials = item.fullName?.split(" ").slice(-2).map((w) => w[0]).join("").toUpperCase();

  return (
    <View style={[styles.row, item.isMe && styles.rowMe]}>
      <RankBadge rank={item.rank} />

      {item.avatarUrl ? (
        <Image source={{ uri: item.avatarUrl }} style={styles.avatar} />
      ) : (
        <View style={[styles.avatar, styles.avatarFallback]}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
      )}

      <View style={styles.info}>
        <Text style={[styles.name, item.isMe && styles.nameMe]}>
          {item.fullName} {item.isMe && t("leaderboard.you_label")}
        </Text>
        <Text style={styles.meta}>{t("leaderboard.level_prefix")}{item.level}</Text>
      </View>

      <View style={styles.pointsWrap}>
        <Medal size={12} color="#f59e0b" />
        <Text style={styles.points}>{(item.points ?? 0).toLocaleString()} {t("leaderboard.points_suffix")}</Text>
      </View>
    </View>
  );
}

export default function LeaderboardScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [data, setData] = useState<LeaderEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await axiosClient.get<LeaderEntry[]>("/friends/leaderboard");
      setData(res.data as LeaderEntry[]);
    } catch {
      // silent
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#3b82f6" size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <Text style={styles.backText}>{t("common.back")}</Text>
        </TouchableOpacity>
        <Text style={styles.header}>{t("leaderboard.title")}</Text>
        <View style={{ width: 60 }} />
      </View>

      <FlatList
        data={data}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => <LeaderRow item={item} />}
        contentContainerStyle={{ padding: 16, gap: 8 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); load(); }}
            tintColor="#3b82f6"
          />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>{t("leaderboard.empty")}</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0A0F1F" },
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#0A0F1F" },
  headerRow: { flexDirection: "row", alignItems: "center", padding: 16, paddingBottom: 8 },
  back: { width: 60 },
  backText: { color: "#94a3b8", fontSize: 14 },
  header: { flex: 1, color: "white", fontSize: 20, fontWeight: "bold", textAlign: "center" },
  row: {
    flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: "#1e293b", borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: "#334155",
  },
  rowMe: { borderColor: "#3b82f6", backgroundColor: "#1e3a5f" },
  rankCircle: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: "#334155", justifyContent: "center", alignItems: "center",
  },
  rankNum: { color: "#94a3b8", fontSize: 13, fontWeight: "bold" },
  avatar: { width: 40, height: 40, borderRadius: 20 },
  avatarFallback: { backgroundColor: "#334155", justifyContent: "center", alignItems: "center" },
  avatarText: { color: "white", fontWeight: "bold", fontSize: 14 },
  info: { flex: 1 },
  name: { color: "white", fontWeight: "bold", fontSize: 14 },
  nameMe: { color: "#60a5fa" },
  meta: { color: "#64748b", fontSize: 12 },
  pointsWrap: { flexDirection: "row", alignItems: "center", gap: 4 },
  points: { color: "#f59e0b", fontWeight: "bold", fontSize: 13 },
  empty: { paddingTop: 60, alignItems: "center" },
  emptyText: { color: "#64748b", fontSize: 14 },
});
