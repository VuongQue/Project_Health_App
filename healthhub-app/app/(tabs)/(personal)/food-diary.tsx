import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Modal,
} from "react-native";
import { UtensilsCrossed, Plus, Flame, X, ChevronDown } from "lucide-react-native";
import { useFocusEffect } from "expo-router";
import { useTranslation } from "react-i18next";
import { foodDiaryApi, DaySummary, CreateFoodLogDto, MealType, FoodLog } from "@/src/api/foodDiaryApi";
const MEAL_EMOJIS: Record<MealType, string> = {
  BREAKFAST: "🌅",
  LUNCH: "☀️",
  DINNER: "🌙",
  SNACK: "🍎",
};
const MEAL_TYPES: MealType[] = ["BREAKFAST", "LUNCH", "DINNER", "SNACK"];
const DAILY_CALORIE_GOAL = 2000;

export default function FoodDiaryScreen() {
  const { t } = useTranslation();

  const MEAL_LABELS: Record<MealType, string> = {
    BREAKFAST: t("food.breakfast"),
    LUNCH: t("food.lunch"),
    DINNER: t("food.dinner"),
    SNACK: t("food.snack"),
  };

  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<DaySummary | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedMealType, setSelectedMealType] = useState<MealType>("LUNCH");
  const [showMealPicker, setShowMealPicker] = useState(false);

  const [form, setForm] = useState<Partial<CreateFoodLogDto>>({
    mealType: "LUNCH",
  });

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await foodDiaryApi.getToday();
      setSummary(data);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!form.foodName || !form.calories) {
      Alert.alert(t("food.err_missing"), t("food.err_required"));
      return;
    }
    try {
      setSaving(true);
      await foodDiaryApi.create(form as CreateFoodLogDto);
      setModalVisible(false);
      setForm({ mealType: "LUNCH" });
      await loadData();
    } catch {
      Alert.alert(t("common.error"), t("food.err_save"));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    Alert.alert(t("food.delete_title"), t("food.delete_msg"), [
      { text: t("food.cancel"), style: "cancel" },
      {
        text: t("food.delete"),
        style: "destructive",
        onPress: async () => {
          await foodDiaryApi.delete(id);
          loadData();
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  const totalCal = summary?.totalCalories ?? 0;
  const pct = Math.min(100, Math.round((totalCal / DAILY_CALORIE_GOAL) * 100));

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{t("food.title")}</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setModalVisible(true)}>
          <Plus size={20} color="white" />
        </TouchableOpacity>
      </View>

      {/* Calorie summary card */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryTop}>
          <View>
            <Text style={styles.summaryLabel}>{t("food.calories_today")}</Text>
            <View style={styles.calorieRow}>
              <Flame size={20} color="#f97316" />
              <Text style={styles.calTotal}>{Math.round(totalCal)}</Text>
              <Text style={styles.calGoal}> / {DAILY_CALORIE_GOAL} kcal</Text>
            </View>
          </View>
          <Text style={styles.pctText}>{pct}%</Text>
        </View>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${pct}%` }]} />
        </View>

        {/* Macros */}
        <View style={styles.macrosRow}>
          <MacroItem label={t("food.protein")} value={summary?.totalProtein ?? 0} color="#3b82f6" unit="g" />
          <MacroItem label={t("food.carbs")} value={summary?.totalCarbs ?? 0} color="#facc15" unit="g" />
          <MacroItem label={t("food.fat")} value={summary?.totalFat ?? 0} color="#f97316" unit="g" />
        </View>
      </View>

      {/* Meals */}
      {MEAL_TYPES.map((mealType) => {
        const logs = summary?.meals[mealType] ?? [];
        const mealCal = logs.reduce((s, l) => s + l.calories, 0);

        return (
          <View key={mealType} style={styles.mealSection}>
            <View style={styles.mealHeader}>
              <Text style={styles.mealEmoji}>{MEAL_EMOJIS[mealType]}</Text>
              <Text style={styles.mealLabel}>{MEAL_LABELS[mealType]}</Text>
              <Text style={styles.mealCal}>{Math.round(mealCal)} kcal</Text>
              <TouchableOpacity
                style={styles.addMealBtn}
                onPress={() => {
                  setForm({ mealType });
                  setModalVisible(true);
                }}
              >
                <Plus size={16} color="#3b82f6" />
              </TouchableOpacity>
            </View>

            {logs.length === 0 ? (
              <Text style={styles.emptyMeal}>Chưa có gì — nhấn + để thêm</Text>
            ) : (
              logs.map((log) => (
                <TouchableOpacity
                  key={log.id}
                  style={styles.foodItem}
                  onLongPress={() => handleDelete(log.id)}
                >
                  <View style={styles.foodLeft}>
                    <Text style={styles.foodName}>{log.foodName}</Text>
                    {(log.protein || log.carbs || log.fat) && (
                      <Text style={styles.foodMacros}>
                        P:{log.protein ?? 0}g · C:{log.carbs ?? 0}g · F:{log.fat ?? 0}g
                      </Text>
                    )}
                  </View>
                  <Text style={styles.foodCal}>{Math.round(log.calories)} kcal</Text>
                </TouchableOpacity>
              ))
            )}
          </View>
        );
      })}

      <View style={{ height: 40 }} />

      {/* Add food modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t("food.add_food_title")}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X size={22} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            {/* Meal type picker */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{t("food.meal_type")}</Text>
              <TouchableOpacity style={styles.picker} onPress={() => setShowMealPicker(!showMealPicker)}>
                <Text style={styles.pickerText}>
                  {MEAL_EMOJIS[form.mealType ?? "LUNCH"]} {MEAL_LABELS[form.mealType ?? "LUNCH"]}
                </Text>
                <ChevronDown size={16} color="#94a3b8" />
              </TouchableOpacity>
              {showMealPicker && (
                <View style={styles.pickerOptions}>
                  {MEAL_TYPES.map((mt) => (
                    <TouchableOpacity
                      key={mt}
                      style={styles.pickerOption}
                      onPress={() => { setForm({ ...form, mealType: mt }); setShowMealPicker(false); }}
                    >
                      <Text style={styles.pickerOptionText}>{MEAL_EMOJIS[mt]} {MEAL_LABELS[mt]}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            <FormInput label={t("food.food_name_label")} placeholder={t("food.food_name_placeholder")} value={form.foodName ?? ""} onChangeText={(v) => setForm({ ...form, foodName: v })} />
            <FormInput label={t("food.calories_label")} placeholder={t("food.calories_placeholder")} value={form.calories?.toString() ?? ""} onChangeText={(v) => setForm({ ...form, calories: v ? +v : undefined })} keyboardType="numeric" />
            <FormInput label={t("food.protein_label")} placeholder={t("food.protein_placeholder")} value={form.protein?.toString() ?? ""} onChangeText={(v) => setForm({ ...form, protein: v ? +v : undefined })} keyboardType="numeric" />
            <FormInput label={t("food.carbs_label")} placeholder={t("food.carbs_placeholder")} value={form.carbs?.toString() ?? ""} onChangeText={(v) => setForm({ ...form, carbs: v ? +v : undefined })} keyboardType="numeric" />
            <FormInput label={t("food.fat_label")} placeholder={t("food.fat_placeholder")} value={form.fat?.toString() ?? ""} onChangeText={(v) => setForm({ ...form, fat: v ? +v : undefined })} keyboardType="numeric" />

            <TouchableOpacity style={[styles.saveBtn, saving && styles.saveBtnDisabled]} onPress={handleSave} disabled={saving}>
              {saving ? <ActivityIndicator color="white" /> : <Text style={styles.saveBtnText}>{t("food.add_button")}</Text>}
            </TouchableOpacity>

            <View style={{ height: 30 }} />
          </ScrollView>
        </View>
      </Modal>
    </ScrollView>
  );
}

function MacroItem({ label, value, color, unit }: { label: string; value: number; color: string; unit: string }) {
  return (
    <View style={styles.macroItem}>
      <Text style={[styles.macroValue, { color }]}>{Math.round(value)}{unit}</Text>
      <Text style={styles.macroLabel}>{label}</Text>
    </View>
  );
}

function FormInput({ label, placeholder, value, onChangeText, keyboardType = "default" }: {
  label: string; placeholder: string; value: string;
  onChangeText: (v: string) => void; keyboardType?: "default" | "numeric";
}) {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput style={styles.input} placeholder={placeholder} placeholderTextColor="#64748b" value={value} onChangeText={onChangeText} keyboardType={keyboardType} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f172a", padding: 16 },
  centered: { flex: 1, backgroundColor: "#0f172a", justifyContent: "center", alignItems: "center" },

  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  title: { color: "white", fontSize: 24, fontWeight: "800" },
  addBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#3b82f6", justifyContent: "center", alignItems: "center" },

  summaryCard: { backgroundColor: "#1e293b", borderRadius: 20, padding: 18, marginBottom: 20, borderWidth: 1, borderColor: "#334155" },
  summaryTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 12 },
  summaryLabel: { color: "#94a3b8", fontSize: 13, marginBottom: 4 },
  calorieRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  calTotal: { color: "white", fontSize: 28, fontWeight: "800" },
  calGoal: { color: "#64748b", fontSize: 14, alignSelf: "flex-end", marginBottom: 2 },
  pctText: { color: "#f97316", fontSize: 18, fontWeight: "700" },

  progressBar: { height: 8, backgroundColor: "#0f172a", borderRadius: 4, overflow: "hidden", marginBottom: 14 },
  progressFill: { height: "100%", backgroundColor: "#f97316", borderRadius: 4 },

  macrosRow: { flexDirection: "row", justifyContent: "space-around" },
  macroItem: { alignItems: "center" },
  macroValue: { fontSize: 16, fontWeight: "700" },
  macroLabel: { color: "#64748b", fontSize: 11, marginTop: 2 },

  mealSection: { backgroundColor: "#1e293b", borderRadius: 18, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: "#334155" },
  mealHeader: { flexDirection: "row", alignItems: "center", marginBottom: 10, gap: 8 },
  mealEmoji: { fontSize: 20 },
  mealLabel: { color: "white", fontSize: 15, fontWeight: "700", flex: 1 },
  mealCal: { color: "#94a3b8", fontSize: 13 },
  addMealBtn: { padding: 4 },
  emptyMeal: { color: "#475569", fontSize: 13, textAlign: "center", paddingVertical: 8 },

  foodItem: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 8, borderTopWidth: 1, borderTopColor: "#1e293b" },
  foodLeft: { flex: 1 },
  foodName: { color: "#cbd5e1", fontSize: 14, fontWeight: "600" },
  foodMacros: { color: "#64748b", fontSize: 11, marginTop: 2 },
  foodCal: { color: "#f97316", fontSize: 14, fontWeight: "700" },

  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "flex-end" },
  modalContent: { backgroundColor: "#1e293b", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: "90%" },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  modalTitle: { color: "white", fontSize: 20, fontWeight: "700" },

  inputGroup: { marginBottom: 14 },
  inputLabel: { color: "#94a3b8", fontSize: 13, marginBottom: 6 },
  input: { backgroundColor: "#0f172a", borderRadius: 12, padding: 12, color: "white", fontSize: 15, borderWidth: 1, borderColor: "#334155" },

  picker: { backgroundColor: "#0f172a", borderRadius: 12, padding: 12, borderWidth: 1, borderColor: "#334155", flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  pickerText: { color: "white", fontSize: 15 },
  pickerOptions: { backgroundColor: "#0f172a", borderRadius: 12, marginTop: 4, borderWidth: 1, borderColor: "#334155" },
  pickerOption: { padding: 12, borderBottomWidth: 1, borderBottomColor: "#1e293b" },
  pickerOptionText: { color: "white", fontSize: 15 },

  saveBtn: { backgroundColor: "#3b82f6", borderRadius: 14, padding: 16, alignItems: "center", marginTop: 8 },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { color: "white", fontSize: 16, fontWeight: "700" },
});
