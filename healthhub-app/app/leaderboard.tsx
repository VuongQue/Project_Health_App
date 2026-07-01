import React, { useCallback, useEffect, useState } from "react";
import { View, Text, FlatList, StyleSheet, Image, RefreshControl, ActivityIndicator, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import axiosClient from "@/src/api/axiosClient";
import { Trophy, Medal } from "lucide-react-native";
import { useColors, Radius, Spacing, sf } from "@/src/theme";

interface LeaderEntry {
  rank: number; id: number; fullName: string; avatarUrl?: string;
  level: number; points: number; isMe: boolean;
}

const RANK_COLORS = ["#f59e0b", "#94a3b8", "#b45309"];

function RankBadge({ rank, colors }: { rank: number; colors: any }) {
  if (rank <= 3) {
    return (
      <View style={[styles.rankCircle, { backgroundColor: RANK_COLORS[rank - 1] + "33" }]}>
        <Trophy size={14} color={RANK_COLORS[rank - 1]} />
      </View>
    );
  }
  return (
    <View style={[styles.rankCircle, { backgroundColor: colors.bgSecondary }]}>
      <Text style={[styles.rankNum, { color: colors.textSecondary }]}>#{rank}</Text>
    </View>
  );
}

function LeaderRow({ item, colors }: { item: LeaderEntry; colors: any }) {
  const { t } = useTranslation();
  const initials = item.fullName?.split(" ").slice(-2).map((w) => w[0]).join("").toUpperCase();
  return (
    <View style={[styles.row, { backgroundColor: colors.bgCard, borderColor: colors.border }, item.isMe && { borderColor: colors.primary, backgroundColor: colors.primaryBg }]}>
      <RankBadge rank={item.rank} colors={colors} />
      {item.avatarUrl ? (
        <Image source={{ uri: item.avatarUrl }} style={styles.avatar} />
      ) : (
        <View style={[styles.avatar, styles.avatarFallback, { backgroundColor: colors.border }]}>
          <Text style={[styles.avatarText, { color: colors.textPrimary }]}>{initials}</Text>
        </View>
      )}
      <View style={styles.info}>
        <Text style={[styles.name, { color: item.isMe ? colors.primary : colors.textPrimary }]}>
          {item.fullName} {item.isMe && t("leaderboard.you_label")}
        </Text>
        <Text style={[styles.meta, { color: colors.textMuted }]}>{t("leaderboard.level_prefix")}{item.level}</Text>
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
  const colors = useColors();
  const [data, setData] = useState<LeaderEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await axiosClient.get<LeaderEntry[]>("/friends/leaderboard");
      setData(res.data as LeaderEntry[]);
    } catch {} finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return (
    <View style={[styles.center, { backgroundColor: colors.bgSecondary }]}>
      <ActivityIndicator color={colors.primary} size="large" />
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.bgSecondary }]}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <Text style={[styles.backText, { color: colors.textSecondary }]}>{t("common.back")}</Text>
        </TouchableOpacity>
        <Text style={[styles.header, { color: colors.textPrimary }]}>{t("leaderboard.title")}</Text>
        <View style={{ width: 60 }} />
      </View>
      <FlatList
        data={data} keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => <LeaderRow item={item} colors={colors} />}
        contentContainerStyle={{ padding: Spacing.base, gap: 8 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.primary} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>{t("leaderboard.empty")}</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  headerRow: { flexDirection: "row", alignItems: "center", padding: Spacing.base, paddingBottom: 8, paddingTop: 52 },
  back: { width: 60 },
  backText: { fontSize: sf(14) },
  header: { flex: 1, fontSize: sf(20), fontWeight: "bold", textAlign: "center" },
  row: { flexDirection: "row", alignItems: "center", gap: 12, borderRadius: Radius.md, padding: 12, borderWidth: 1 },
  rankCircle: { width: 36, height: 36, borderRadius: 18, justifyContent: "center", alignItems: "center" },
  rankNum: { fontSize: sf(13), fontWeight: "bold" },
  avatar: { width: 40, height: 40, borderRadius: 20 },
  avatarFallback: { justifyContent: "center", alignItems: "center" },
  avatarText: { fontWeight: "bold", fontSize: sf(14) },
  info: { flex: 1 },
  name: { fontWeight: "bold", fontSize: sf(14) },
  meta: { fontSize: sf(12) },
  pointsWrap: { flexDirection: "row", alignItems: "center", gap: 4 },
  points: { color: "#f59e0b", fontWeight: "bold", fontSize: sf(13) },
  empty: { paddingTop: 60, alignItems: "center" },
  emptyText: { fontSize: sf(14) },
});
