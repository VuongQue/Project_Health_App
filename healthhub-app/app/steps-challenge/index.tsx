import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { ArrowLeft, Trophy, Crown, Footprints, Users, ChevronRight } from "lucide-react-native";
import { friendApi } from "@/src/api/friendApi";
import { Colors, Spacing, Radius, Typography } from "@/src/theme";

type LeaderEntry = {
  rank: number;
  id: number;
  fullName: string;
  avatarUrl: string | null;
  level: number;
  todaySteps: number;
  goalSteps: number;
  isMe: boolean;
};

const RANK_COLORS = ["#f59e0b", "#94a3b8", "#b45309"];
const RANK_LABELS = ["🥇", "🥈", "🥉"];

function Avatar({ url, name, size = 40 }: { url: string | null; name: string; size?: number }) {
  const initials = name
    .split(" ")
    .slice(-2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
  if (url) {
    return <Image source={{ uri: url }} style={{ width: size, height: size, borderRadius: size / 2 }} />;
  }
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: Colors.primaryBg, justifyContent: "center", alignItems: "center" }}>
      <Text style={{ color: Colors.primary, fontWeight: "700", fontSize: size * 0.38 }}>{initials}</Text>
    </View>
  );
}

export default function StepsChallengeScreen() {
  const router = useRouter();
  const [list, setList] = useState<LeaderEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await friendApi.getStepsLeaderboard();
      setList(data);
    } catch {
      // keep existing
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const me = list.find((e) => e.isMe);
  const top3 = list.slice(0, 3);
  const rest = list.slice(3);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(true); }} tintColor={Colors.primary} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={22} color={Colors.textSecondary} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Thách đấu bước chân</Text>
          <Text style={styles.subtitle}>Hôm nay — bạn và bạn bè</Text>
        </View>
        <Users size={22} color={Colors.primary} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.primary} size="large" />
          <Text style={styles.loadingText}>Đang tải bảng xếp hạng...</Text>
        </View>
      ) : list.length <= 1 ? (
        <View style={styles.emptyCard}>
          <Users size={40} color={Colors.textMuted} />
          <Text style={styles.emptyTitle}>Chưa có bạn bè!</Text>
          <Text style={styles.emptySub}>Thêm bạn để xem thách đấu bước chân hàng ngày.</Text>
          <TouchableOpacity
            style={styles.addFriendBtn}
            onPress={() => router.push("/(tabs)/(community)/friends" as any)}
          >
            <Text style={styles.addFriendText}>Tìm bạn bè →</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          {/* My position card */}
          {me && (
            <View style={styles.myCard}>
              <Footprints size={18} color={Colors.primary} />
              <View style={{ flex: 1 }}>
                <Text style={styles.myLabel}>Vị trí của bạn hôm nay</Text>
                <Text style={styles.mySteps}>
                  #{me.rank} · {me.todaySteps.toLocaleString()} bước
                </Text>
              </View>
              <Text style={styles.myGoalText}>
                {me.goalSteps > 0 ? Math.round((me.todaySteps / me.goalSteps) * 100) : 0}% mục tiêu
              </Text>
            </View>
          )}

          {/* Podium */}
          {top3.length >= 1 && (
            <View style={styles.podiumSection}>
              <Text style={styles.sectionTitle}>Bảng vinh danh</Text>
              <View style={styles.podium}>
                {/* 2nd place left */}
                {top3[1] && (
                  <View style={[styles.podiumItem, { marginTop: 24 }]}>
                    <Text style={styles.podiumEmoji}>{RANK_LABELS[1]}</Text>
                    <Avatar url={top3[1].avatarUrl} name={top3[1].fullName} size={48} />
                    <Text style={styles.podiumName} numberOfLines={1}>{top3[1].fullName.split(" ").pop()}</Text>
                    <Text style={[styles.podiumSteps, { color: RANK_COLORS[1] }]}>{top3[1].todaySteps.toLocaleString()}</Text>
                  </View>
                )}

                {/* 1st place center */}
                <View style={[styles.podiumItem, styles.podiumFirst]}>
                  <Crown size={22} color={RANK_COLORS[0]} />
                  <Avatar url={top3[0].avatarUrl} name={top3[0].fullName} size={60} />
                  <Text style={styles.podiumName} numberOfLines={1}>{top3[0].fullName.split(" ").pop()}</Text>
                  <Text style={[styles.podiumSteps, { color: RANK_COLORS[0] }]}>{top3[0].todaySteps.toLocaleString()}</Text>
                  {top3[0].isMe && (
                    <View style={styles.meChip}>
                      <Text style={styles.meChipText}>Bạn</Text>
                    </View>
                  )}
                </View>

                {/* 3rd place right */}
                {top3[2] && (
                  <View style={[styles.podiumItem, { marginTop: 32 }]}>
                    <Text style={styles.podiumEmoji}>{RANK_LABELS[2]}</Text>
                    <Avatar url={top3[2].avatarUrl} name={top3[2].fullName} size={44} />
                    <Text style={styles.podiumName} numberOfLines={1}>{top3[2].fullName.split(" ").pop()}</Text>
                    <Text style={[styles.podiumSteps, { color: RANK_COLORS[2] }]}>{top3[2].todaySteps.toLocaleString()}</Text>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Full list */}
          {list.length > 0 && (
            <View style={styles.listSection}>
              <Text style={styles.sectionTitle}>Toàn bộ bảng xếp hạng</Text>
              {list.map((entry) => {
                const pct = entry.goalSteps > 0 ? Math.min(100, Math.round((entry.todaySteps / entry.goalSteps) * 100)) : 0;
                return (
                  <View
                    key={entry.id}
                    style={[styles.listCard, entry.isMe && styles.listCardMe]}
                  >
                    <Text style={[styles.rankText, entry.rank <= 3 && { color: RANK_COLORS[entry.rank - 1] }]}>
                      {entry.rank <= 3 ? RANK_LABELS[entry.rank - 1] : `#${entry.rank}`}
                    </Text>
                    <Avatar url={entry.avatarUrl} name={entry.fullName} size={40} />
                    <View style={{ flex: 1 }}>
                      <View style={styles.listNameRow}>
                        <Text style={styles.listName} numberOfLines={1}>{entry.fullName}</Text>
                        {entry.isMe && <View style={styles.meChipSmall}><Text style={styles.meChipText}>Bạn</Text></View>}
                      </View>
                      <View style={styles.progressRow}>
                        <View style={styles.progressTrack}>
                          <View style={[styles.progressFill, { width: `${pct}%` as any }]} />
                        </View>
                        <Text style={styles.progressPct}>{pct}%</Text>
                      </View>
                    </View>
                    <View style={{ alignItems: "flex-end" }}>
                      <Text style={styles.stepsNum}>{entry.todaySteps.toLocaleString()}</Text>
                      <Text style={styles.stepsUnit}>bước</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </>
      )}

      {/* Note */}
      <View style={styles.noteCard}>
        <Text style={styles.noteText}>Bảng xếp hạng dựa trên bước chân hôm nay. Cập nhật theo thời gian thực khi bạn đồng bộ bước chân.</Text>
      </View>

      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgSecondary },
  content: { paddingHorizontal: Spacing.base, paddingTop: Spacing.xl },
  center: { alignItems: "center", paddingVertical: 60, gap: 12 },
  loadingText: { color: Colors.textMuted, ...Typography.sm },

  header: { flexDirection: "row", alignItems: "center", gap: Spacing.md, marginBottom: Spacing.xl },
  backBtn: {
    width: 40, height: 40, backgroundColor: Colors.bgCard, borderRadius: Radius.md,
    justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: Colors.border,
  },
  title: { color: Colors.textPrimary, ...Typography.xxxl, fontWeight: "800" },
  subtitle: { color: Colors.textMuted, ...Typography.xs, marginTop: 2 },

  myCard: {
    flexDirection: "row", alignItems: "center", gap: Spacing.md,
    backgroundColor: Colors.bgCard, borderRadius: Radius.xl, padding: Spacing.base,
    borderWidth: 1, borderColor: Colors.primary + "40", marginBottom: Spacing.md,
  },
  myLabel: { color: Colors.textMuted, fontSize: 11 },
  mySteps: { color: Colors.textPrimary, fontSize: 16, fontWeight: "800" },
  myGoalText: { color: Colors.primary, fontSize: 12, fontWeight: "700" },

  podiumSection: { marginBottom: Spacing.lg },
  sectionTitle: { color: Colors.textSecondary, fontSize: 13, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: Spacing.md },

  podium: { flexDirection: "row", justifyContent: "center", alignItems: "flex-end", gap: Spacing.lg, paddingVertical: Spacing.md },
  podiumItem: { alignItems: "center", gap: 4, flex: 1 },
  podiumFirst: { marginBottom: -4 },
  podiumEmoji: { fontSize: 20 },
  podiumName: { color: Colors.textPrimary, fontSize: 12, fontWeight: "700", textAlign: "center" },
  podiumSteps: { fontSize: 13, fontWeight: "800" },
  meChip: { backgroundColor: Colors.primary, borderRadius: Radius.full, paddingHorizontal: 8, paddingVertical: 2 },
  meChipSmall: { backgroundColor: Colors.primaryBg, borderRadius: Radius.full, paddingHorizontal: 6, paddingVertical: 1 },
  meChipText: { color: "white", fontSize: 9, fontWeight: "700" },

  listSection: { marginBottom: Spacing.md },
  listCard: {
    flexDirection: "row", alignItems: "center", gap: Spacing.md,
    backgroundColor: Colors.bgCard, borderRadius: Radius.xl, padding: Spacing.base,
    marginBottom: Spacing.sm, borderWidth: 1, borderColor: Colors.border,
  },
  listCardMe: { borderColor: Colors.primary + "60", backgroundColor: Colors.primaryBg },
  rankText: { color: Colors.textMuted, fontSize: 14, fontWeight: "700", width: 28, textAlign: "center" },
  listNameRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  listName: { color: Colors.textPrimary, fontSize: 14, fontWeight: "700", flex: 1 },
  progressRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 },
  progressTrack: { flex: 1, height: 5, backgroundColor: Colors.bgSecondary, borderRadius: 3, overflow: "hidden" },
  progressFill: { height: "100%", backgroundColor: Colors.primary, borderRadius: 3 },
  progressPct: { color: Colors.textMuted, fontSize: 10, fontWeight: "600", minWidth: 28 },
  stepsNum: { color: Colors.textPrimary, fontSize: 15, fontWeight: "800" },
  stepsUnit: { color: Colors.textMuted, fontSize: 10 },

  emptyCard: {
    backgroundColor: Colors.bgCard, borderRadius: Radius.xxl, padding: Spacing.xxl,
    alignItems: "center", gap: 12, borderWidth: 1, borderColor: Colors.border, marginVertical: Spacing.xl,
  },
  emptyTitle: { color: Colors.textPrimary, fontSize: 18, fontWeight: "800" },
  emptySub: { color: Colors.textMuted, fontSize: 13, textAlign: "center" },
  addFriendBtn: { backgroundColor: Colors.primary, borderRadius: Radius.lg, paddingHorizontal: 20, paddingVertical: 10, marginTop: 4 },
  addFriendText: { color: "white", fontWeight: "700" },

  noteCard: {
    backgroundColor: Colors.bgCard, borderRadius: Radius.lg, padding: Spacing.md,
    borderWidth: 1, borderColor: Colors.border,
  },
  noteText: { color: Colors.textMuted, fontSize: 11, lineHeight: 16 },
});
