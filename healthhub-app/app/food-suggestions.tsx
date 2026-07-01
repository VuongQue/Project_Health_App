import React, { useCallback, useEffect, useState } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, Alert } from "react-native";
import { useRouter } from "expo-router";
import axiosClient from "@/src/api/axiosClient";
import { useColors, Radius, Spacing, sf } from "@/src/theme";

interface FoodSuggestion { name: string; calories: number; protein: number; carbs: number; fat: number; emoji: string; category: string; }
interface SuggestionsResponse { dailyGoalCal: number; consumed: number; remaining: number; suggestions: FoodSuggestion[]; }

function FoodCard({ item, onAdd, colors }: { item: FoodSuggestion; onAdd: (item: FoodSuggestion) => void; colors: any }) {
  return (
    <View style={[styles.card, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
      <Text style={styles.emoji}>{item.emoji}</Text>
      <View style={styles.cardInfo}>
        <Text style={[styles.cardName, { color: colors.textPrimary }]}>{item.name}</Text>
        <Text style={[styles.cardCat, { color: colors.textMuted }]}>{item.category}</Text>
        <View style={styles.macroRow}>
          <Text style={[styles.macro, { color: colors.textSecondary }]}>🔥 {item.calories} kcal</Text>
          <Text style={[styles.macro, { color: colors.textSecondary }]}>💪 {item.protein}g P</Text>
          <Text style={[styles.macro, { color: colors.textSecondary }]}>🌾 {item.carbs}g C</Text>
          <Text style={[styles.macro, { color: colors.textSecondary }]}>🫧 {item.fat}g F</Text>
        </View>
      </View>
      <TouchableOpacity style={[styles.addBtn, { backgroundColor: colors.primary }]} onPress={() => onAdd(item)}>
        <Text style={styles.addBtnText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function FoodSuggestionsScreen() {
  const router = useRouter();
  const colors = useColors();
  const [data, setData] = useState<SuggestionsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await axiosClient.get<SuggestionsResponse>("/food-diary/suggestions?goal=2000");
      setData(res.data as SuggestionsResponse);
    } catch {} finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleAdd = (item: FoodSuggestion) => {
    Alert.alert("Thêm vào nhật ký?", `${item.emoji} ${item.name} (${item.calories} kcal)`, [
      { text: "Hủy", style: "cancel" },
      { text: "Thêm vào bữa sáng", onPress: () => addLog(item, "BREAKFAST") },
      { text: "Thêm vào bữa trưa", onPress: () => addLog(item, "LUNCH") },
    ]);
  };

  const addLog = async (item: FoodSuggestion, mealType: string) => {
    try {
      await axiosClient.post("/food-diary", { foodName: item.name, calories: item.calories, protein: item.protein, carbs: item.carbs, fat: item.fat, mealType, quantity: 1, unit: "phần" });
      Alert.alert("✅", `Đã thêm ${item.name} vào nhật ký!`);
      load();
    } catch { Alert.alert("Lỗi", "Không thể thêm thực phẩm."); }
  };

  if (loading) return (
    <View style={[styles.center, { backgroundColor: colors.bgSecondary }]}>
      <ActivityIndicator color={colors.primary} size="large" />
    </View>
  );

  const pct = data ? Math.min(data.consumed / data.dailyGoalCal, 1) : 0;
  const barColor = pct >= 1 ? colors.danger : pct >= 0.8 ? colors.warning : colors.success;

  return (
    <View style={[styles.container, { backgroundColor: colors.bgSecondary }]}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <Text style={[styles.backText, { color: colors.textSecondary }]}>← Back</Text>
        </TouchableOpacity>
        <Text style={[styles.header, { color: colors.textPrimary }]}>Gợi ý thực phẩm</Text>
        <View style={{ width: 60 }} />
      </View>

      {data && (
        <View style={[styles.summaryCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
          <View style={styles.calRow}>
            <View>
              <Text style={[styles.calLabel, { color: colors.textMuted }]}>Đã ăn</Text>
              <Text style={[styles.calVal, { color: barColor }]}>{data.consumed} kcal</Text>
            </View>
            <View style={[styles.calDivider, { backgroundColor: colors.border }]} />
            <View>
              <Text style={[styles.calLabel, { color: colors.textMuted }]}>Còn lại</Text>
              <Text style={[styles.calVal, { color: colors.success }]}>{data.remaining} kcal</Text>
            </View>
            <View style={[styles.calDivider, { backgroundColor: colors.border }]} />
            <View>
              <Text style={[styles.calLabel, { color: colors.textMuted }]}>Mục tiêu</Text>
              <Text style={[styles.calVal, { color: colors.textPrimary }]}>{data.dailyGoalCal} kcal</Text>
            </View>
          </View>
          <View style={[styles.progressBg, { backgroundColor: colors.bgSecondary }]}>
            <View style={[styles.progressFill, { width: `${Math.round(pct * 100)}%`, backgroundColor: barColor }]} />
          </View>
          <Text style={[styles.pctText, { color: colors.textMuted }]}>{Math.round(pct * 100)}% daily goal</Text>
        </View>
      )}

      <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Gợi ý phù hợp với {data?.remaining ?? 0} kcal còn lại</Text>

      <FlatList
        data={data?.suggestions ?? []} keyExtractor={(item) => item.name}
        renderItem={({ item }) => <FoodCard item={item} onAdd={handleAdd} colors={colors} />}
        contentContainerStyle={{ padding: Spacing.base, gap: 10 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.primary} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>Bạn đã đạt mục tiêu calo hôm nay! 🎉</Text>
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
  header: { flex: 1, fontSize: sf(18), fontWeight: "bold", textAlign: "center" },
  summaryCard: { marginHorizontal: Spacing.base, borderRadius: Radius.lg, padding: 14, borderWidth: 1, marginBottom: 4 },
  calRow: { flexDirection: "row", justifyContent: "space-around", marginBottom: 10 },
  calLabel: { fontSize: sf(11), textAlign: "center" },
  calVal: { fontSize: sf(18), fontWeight: "bold", textAlign: "center" },
  calDivider: { width: 1 },
  progressBg: { height: 6, borderRadius: 3, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 3 },
  pctText: { fontSize: sf(11), textAlign: "right", marginTop: 3 },
  sectionTitle: { fontSize: sf(12), paddingHorizontal: Spacing.base, marginTop: 8, marginBottom: 0 },
  card: { borderRadius: Radius.md, padding: 14, flexDirection: "row", alignItems: "center", gap: 12, borderWidth: 1 },
  emoji: { fontSize: 28 },
  cardInfo: { flex: 1 },
  cardName: { fontWeight: "bold", fontSize: sf(14) },
  cardCat: { fontSize: sf(11), marginBottom: 4 },
  macroRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  macro: { fontSize: sf(11) },
  addBtn: { width: 32, height: 32, borderRadius: 16, justifyContent: "center", alignItems: "center" },
  addBtnText: { color: "white", fontSize: 20, fontWeight: "bold", lineHeight: 22 },
  empty: { paddingTop: 40, alignItems: "center" },
  emptyText: { fontSize: sf(14), textAlign: "center" },
});
