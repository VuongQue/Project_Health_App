import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import challengeApi from "@/src/api/challengeApi";
import { ArrowLeft } from "lucide-react-native";
import { useColors, Radius, Spacing, sf } from "@/src/theme";

export default function ChallengeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colors = useColors();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      setLoading(true);
      const res = await challengeApi.getAll();
      setData((res.data ?? []).find((c: any) => String(c.id) === String(id)));
    } catch (err) {
      console.log("❌ load challenge detail error", err);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [id]);

  const onJoin = async () => {
    try { await challengeApi.join(Number(id)); await load(); }
    catch (e: any) { Alert.alert("Lỗi", e?.response?.data?.message ?? "Không thể tham gia thử thách"); }
  };

  const onLeave = async () => {
    if (!data?.userChallenge?.id) return;
    Alert.alert("Rời thử thách", "Bạn có chắc muốn rời thử thách này không?", [
      { text: "Huỷ", style: "cancel" },
      { text: "Rời", style: "destructive", onPress: async () => {
        try { await challengeApi.leave(data.userChallenge.id); router.back(); }
        catch (e: any) { Alert.alert("Lỗi", e?.response?.data?.message ?? "Không thể rời thử thách"); }
      }},
    ]);
  };

  if (loading) return (
    <View style={[styles.loading, { backgroundColor: colors.bgSecondary }]}>
      <ActivityIndicator color={colors.success} />
    </View>
  );

  if (!data) return (
    <View style={[styles.loading, { backgroundColor: colors.bgSecondary }]}>
      <Text style={{ color: colors.textMuted }}>Challenge not found</Text>
    </View>
  );

  const joined = data.joined;
  const percent = Math.round((data.userChallenge?.progress || 0) * 100);

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.bgSecondary }]}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
        <ArrowLeft size={22} color={colors.textSecondary} />
      </TouchableOpacity>
      <Text style={[styles.title, { color: colors.textPrimary }]}>{data.name}</Text>
      <Text style={[styles.desc, { color: colors.textSecondary }]}>{data.description}</Text>

      {joined && (
        <View style={[styles.progressBox, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
          <View style={styles.progressHeader}>
            <Text style={[styles.progressLabel, { color: colors.textSecondary }]}>Progress</Text>
            <Text style={[styles.percent, { color: colors.success }]}>{percent}%</Text>
          </View>
          <View style={[styles.progressBar, { backgroundColor: colors.bgSecondary }]}>
            <View style={[styles.progressFill, { width: `${percent}%` }]} />
          </View>
          <Text style={[styles.sub, { color: colors.textSecondary }]}>
            {data.userChallenge.completedCount} / {data.targetCount} completed
          </Text>
        </View>
      )}

      {joined && (
        <View style={[styles.streakBox, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
          <View>
            <Text style={[styles.streakValue, { color: colors.textPrimary }]}>{data.userChallenge.currentStreak}</Text>
            <Text style={[styles.streakLabel, { color: colors.textSecondary }]}>Current streak</Text>
          </View>
          <View>
            <Text style={[styles.streakValue, { color: colors.textPrimary }]}>{data.userChallenge.maxStreak}</Text>
            <Text style={[styles.streakLabel, { color: colors.textSecondary }]}>Best streak</Text>
          </View>
        </View>
      )}

      {!joined ? (
        <TouchableOpacity style={[styles.joinBtn, { backgroundColor: colors.success }]} onPress={onJoin}>
          <Text style={styles.joinText}>Join Challenge</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity style={[styles.leaveBtn, { borderColor: colors.danger }]} onPress={onLeave}>
          <Text style={[styles.leaveText, { color: colors.danger }]}>Leave Challenge</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: Spacing.base },
  loading: { flex: 1, justifyContent: "center", alignItems: "center" },
  backBtn: { padding: 6, marginBottom: 8, paddingTop: 52 },
  title: { fontSize: sf(26), fontWeight: "700", marginBottom: 6 },
  desc: { fontSize: sf(15), marginBottom: 20 },
  progressBox: { borderRadius: Radius.xl, padding: 16, borderWidth: 1, marginBottom: 16 },
  progressHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  progressLabel: { fontSize: sf(14) },
  percent: { fontWeight: "700", fontSize: sf(14) },
  progressBar: { height: 8, borderRadius: 6, overflow: "hidden", marginBottom: 6 },
  progressFill: { height: "100%", backgroundColor: "#22c55e" },
  sub: { fontSize: sf(12) },
  streakBox: { flexDirection: "row", justifyContent: "space-around", borderRadius: Radius.xl, padding: 18, borderWidth: 1, marginBottom: 24 },
  streakValue: { fontSize: sf(28), fontWeight: "700", textAlign: "center" },
  streakLabel: { fontSize: sf(12), textAlign: "center" },
  joinBtn: { paddingVertical: 14, borderRadius: Radius.lg, alignItems: "center" },
  joinText: { color: "#052e16", fontWeight: "700", fontSize: sf(16) },
  leaveBtn: { borderWidth: 1, paddingVertical: 14, borderRadius: Radius.lg, alignItems: "center" },
  leaveText: { fontWeight: "700", fontSize: sf(16) },
});
