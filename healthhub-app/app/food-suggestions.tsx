import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import axiosClient from "@/src/api/axiosClient";

interface FoodSuggestion {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  emoji: string;
  category: string;
}

interface SuggestionsResponse {
  dailyGoalCal: number;
  consumed: number;
  remaining: number;
  suggestions: FoodSuggestion[];
}

function FoodCard({ item, onAdd }: { item: FoodSuggestion; onAdd: (item: FoodSuggestion) => void }) {
  return (
    <View style={styles.card}>
      <Text style={styles.emoji}>{item.emoji}</Text>
      <View style={styles.cardInfo}>
        <Text style={styles.cardName}>{item.name}</Text>
        <Text style={styles.cardCat}>{item.category}</Text>
        <View style={styles.macroRow}>
          <Text style={styles.macro}>🔥 {item.calories} kcal</Text>
          <Text style={styles.macro}>💪 {item.protein}g P</Text>
          <Text style={styles.macro}>🌾 {item.carbs}g C</Text>
          <Text style={styles.macro}>🫧 {item.fat}g F</Text>
        </View>
      </View>
      <TouchableOpacity style={styles.addBtn} onPress={() => onAdd(item)}>
        <Text style={styles.addBtnText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function FoodSuggestionsScreen() {
  const router = useRouter();
  const [data, setData] = useState<SuggestionsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await axiosClient.get<SuggestionsResponse>("/food-diary/suggestions?goal=2000");
      setData(res.data as SuggestionsResponse);
    } catch {
      // silent
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleAdd = (item: FoodSuggestion) => {
    Alert.alert(
      "Thêm vào nhật ký?",
      `${item.emoji} ${item.name} (${item.calories} kcal)`,
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Thêm vào bữa sáng",
          onPress: () => addLog(item, "BREAKFAST"),
        },
        {
          text: "Thêm vào bữa trưa",
          onPress: () => addLog(item, "LUNCH"),
        },
      ]
    );
  };

  const addLog = async (item: FoodSuggestion, mealType: string) => {
    try {
      await axiosClient.post("/food-diary", {
        foodName: item.name,
        calories: item.calories,
        protein: item.protein,
        carbs: item.carbs,
        fat: item.fat,
        mealType,
        quantity: 1,
        unit: "phần",
      });
      Alert.alert("✅", `Đã thêm ${item.name} vào nhật ký!`);
      load();
    } catch {
      Alert.alert("Lỗi", "Không thể thêm thực phẩm.");
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#3b82f6" size="large" />
      </View>
    );
  }

  const pct = data ? Math.min(data.consumed / data.dailyGoalCal, 1) : 0;
  const color = pct >= 1 ? "#ef4444" : pct >= 0.8 ? "#f59e0b" : "#22c55e";

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.header}>Gợi ý thực phẩm</Text>
        <View style={{ width: 60 }} />
      </View>

      {/* Calories summary */}
      {data && (
        <View style={styles.summaryCard}>
          <View style={styles.calRow}>
            <View>
              <Text style={styles.calLabel}>Đã ăn</Text>
              <Text style={[styles.calVal, { color }]}>{data.consumed} kcal</Text>
            </View>
            <View style={styles.calDivider} />
            <View>
              <Text style={styles.calLabel}>Còn lại</Text>
              <Text style={[styles.calVal, { color: "#22c55e" }]}>{data.remaining} kcal</Text>
            </View>
            <View style={styles.calDivider} />
            <View>
              <Text style={styles.calLabel}>Mục tiêu</Text>
              <Text style={styles.calVal}>{data.dailyGoalCal} kcal</Text>
            </View>
          </View>
          <View style={styles.progressBg}>
            <View style={[styles.progressFill, { width: `${Math.round(pct * 100)}%`, backgroundColor: color }]} />
          </View>
          <Text style={styles.pctText}>{Math.round(pct * 100)}% daily goal</Text>
        </View>
      )}

      <Text style={styles.sectionTitle}>
        Gợi ý phù hợp với {data?.remaining ?? 0} kcal còn lại
      </Text>

      <FlatList
        data={data?.suggestions ?? []}
        keyExtractor={(item) => item.name}
        renderItem={({ item }) => <FoodCard item={item} onAdd={handleAdd} />}
        contentContainerStyle={{ padding: 16, gap: 10 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); load(); }}
            tintColor="#3b82f6"
          />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>Bạn đã đạt mục tiêu calo hôm nay! 🎉</Text>
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
  header: { flex: 1, color: "white", fontSize: 18, fontWeight: "bold", textAlign: "center" },

  summaryCard: {
    marginHorizontal: 16, backgroundColor: "#1e293b", borderRadius: 14,
    padding: 14, borderWidth: 1, borderColor: "#334155", marginBottom: 4,
  },
  calRow: { flexDirection: "row", justifyContent: "space-around", marginBottom: 10 },
  calLabel: { color: "#64748b", fontSize: 11, textAlign: "center" },
  calVal: { color: "white", fontSize: 18, fontWeight: "bold", textAlign: "center" },
  calDivider: { width: 1, backgroundColor: "#334155" },
  progressBg: { height: 6, backgroundColor: "#334155", borderRadius: 3, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 3 },
  pctText: { color: "#64748b", fontSize: 11, textAlign: "right", marginTop: 3 },

  sectionTitle: { color: "#94a3b8", fontSize: 12, paddingHorizontal: 16, marginTop: 8, marginBottom: 0 },

  card: {
    backgroundColor: "#1e293b", borderRadius: 12, padding: 14,
    flexDirection: "row", alignItems: "center", gap: 12,
    borderWidth: 1, borderColor: "#334155",
  },
  emoji: { fontSize: 28 },
  cardInfo: { flex: 1 },
  cardName: { color: "white", fontWeight: "bold", fontSize: 14 },
  cardCat: { color: "#64748b", fontSize: 11, marginBottom: 4 },
  macroRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  macro: { color: "#94a3b8", fontSize: 11 },
  addBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: "#2563eb", justifyContent: "center", alignItems: "center",
  },
  addBtnText: { color: "white", fontSize: 20, fontWeight: "bold", lineHeight: 22 },

  empty: { paddingTop: 40, alignItems: "center" },
  emptyText: { color: "#64748b", fontSize: 14, textAlign: "center" },
});
