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
import { foodDiaryApi, DaySummary, CreateFoodLogDto, MealType } from "@/src/api/foodDiaryApi";
import { useColors, Radius, Spacing, sf } from "@/src/theme";

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
  const colors = useColors();

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
  const [showMealPicker, setShowMealPicker] = useState(false);

  const [form, setForm] = useState<Partial<CreateFoodLogDto>>({ mealType: "LUNCH" });

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
      <View style={[styles.centered, { backgroundColor: colors.bgSecondary }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const totalCal = summary?.totalCalories ?? 0;
  const pct = Math.min(100, Math.round((totalCal / DAILY_CALORIE_GOAL) * 100));

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.bgSecondary }]} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>{t("food.title")}</Text>
        <TouchableOpacity style={[styles.addBtn, { backgroundColor: colors.primary }]} onPress={() => setModalVisible(true)}>
          <Plus size={20} color="white" />
        </TouchableOpacity>
      </View>

      {/* Calorie summary card */}
      <View style={[styles.summaryCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
        <View style={styles.summaryTop}>
          <View>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>{t("food.calories_today")}</Text>
            <View style={styles.calorieRow}>
              <Flame size={20} color="#f97316" />
              <Text style={[styles.calTotal, { color: colors.textPrimary }]}>{Math.round(totalCal)}</Text>
              <Text style={[styles.calGoal, { color: colors.textMuted }]}> / {DAILY_CALORIE_GOAL} kcal</Text>
            </View>
          </View>
          <Text style={[styles.pctText, { color: "#f97316" }]}>{pct}%</Text>
        </View>
        <View style={[styles.progressBar, { backgroundColor: colors.bgSecondary }]}>
          <View style={[styles.progressFill, { width: `${pct}%` }]} />
        </View>

        {/* Macros */}
        <View style={styles.macrosRow}>
          <MacroItem label={t("food.protein")} value={summary?.totalProtein ?? 0} color={colors.primary} unit="g" textMuted={colors.textMuted} />
          <MacroItem label={t("food.carbs")} value={summary?.totalCarbs ?? 0} color="#facc15" unit="g" textMuted={colors.textMuted} />
          <MacroItem label={t("food.fat")} value={summary?.totalFat ?? 0} color="#f97316" unit="g" textMuted={colors.textMuted} />
        </View>
      </View>

      {/* Meals */}
      {MEAL_TYPES.map((mealType) => {
        const logs = summary?.meals[mealType] ?? [];
        const mealCal = logs.reduce((s, l) => s + l.calories, 0);

        return (
          <View key={mealType} style={[styles.mealSection, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
            <View style={styles.mealHeader}>
              <Text style={styles.mealEmoji}>{MEAL_EMOJIS[mealType]}</Text>
              <Text style={[styles.mealLabel, { color: colors.textPrimary }]}>{MEAL_LABELS[mealType]}</Text>
              <Text style={[styles.mealCal, { color: colors.textSecondary }]}>{Math.round(mealCal)} kcal</Text>
              <TouchableOpacity
                style={styles.addMealBtn}
                onPress={() => { setForm({ mealType }); setModalVisible(true); }}
              >
                <Plus size={16} color={colors.primary} />
              </TouchableOpacity>
            </View>

            {logs.length === 0 ? (
              <Text style={[styles.emptyMeal, { color: colors.textMuted }]}>Chưa có gì — nhấn + để thêm</Text>
            ) : (
              logs.map((log) => (
                <TouchableOpacity key={log.id} style={[styles.foodItem, { borderTopColor: colors.border }]} onLongPress={() => handleDelete(log.id)}>
                  <View style={styles.foodLeft}>
                    <Text style={[styles.foodName, { color: colors.textSecondary }]}>{log.foodName}</Text>
                    {(log.protein || log.carbs || log.fat) && (
                      <Text style={[styles.foodMacros, { color: colors.textMuted }]}>
                        P:{log.protein ?? 0}g · C:{log.carbs ?? 0}g · F:{log.fat ?? 0}g
                      </Text>
                    )}
                  </View>
                  <Text style={[styles.foodCal, { color: "#f97316" }]}>{Math.round(log.calories)} kcal</Text>
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
          <ScrollView style={[styles.modalContent, { backgroundColor: colors.bgCard }]} showsVerticalScrollIndicator={false}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>{t("food.add_food_title")}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X size={22} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            {/* Meal type picker */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>{t("food.meal_type")}</Text>
              <TouchableOpacity
                style={[styles.picker, { backgroundColor: colors.bgSecondary, borderColor: colors.border }]}
                onPress={() => setShowMealPicker(!showMealPicker)}
              >
                <Text style={[styles.pickerText, { color: colors.textPrimary }]}>
                  {MEAL_EMOJIS[form.mealType ?? "LUNCH"]} {MEAL_LABELS[form.mealType ?? "LUNCH"]}
                </Text>
                <ChevronDown size={16} color={colors.textMuted} />
              </TouchableOpacity>
              {showMealPicker && (
                <View style={[styles.pickerOptions, { backgroundColor: colors.bgSecondary, borderColor: colors.border }]}>
                  {MEAL_TYPES.map((mt) => (
                    <TouchableOpacity
                      key={mt}
                      style={[styles.pickerOption, { borderBottomColor: colors.border }]}
                      onPress={() => { setForm({ ...form, mealType: mt }); setShowMealPicker(false); }}
                    >
                      <Text style={[styles.pickerOptionText, { color: colors.textPrimary }]}>{MEAL_EMOJIS[mt]} {MEAL_LABELS[mt]}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            <FormInput colors={colors} label={t("food.food_name_label")} placeholder={t("food.food_name_placeholder")} value={form.foodName ?? ""} onChangeText={(v) => setForm({ ...form, foodName: v })} />
            <FormInput colors={colors} label={t("food.calories_label")} placeholder={t("food.calories_placeholder")} value={form.calories?.toString() ?? ""} onChangeText={(v) => setForm({ ...form, calories: v ? +v : undefined })} keyboardType="numeric" />
            <FormInput colors={colors} label={t("food.protein_label")} placeholder={t("food.protein_placeholder")} value={form.protein?.toString() ?? ""} onChangeText={(v) => setForm({ ...form, protein: v ? +v : undefined })} keyboardType="numeric" />
            <FormInput colors={colors} label={t("food.carbs_label")} placeholder={t("food.carbs_placeholder")} value={form.carbs?.toString() ?? ""} onChangeText={(v) => setForm({ ...form, carbs: v ? +v : undefined })} keyboardType="numeric" />
            <FormInput colors={colors} label={t("food.fat_label")} placeholder={t("food.fat_placeholder")} value={form.fat?.toString() ?? ""} onChangeText={(v) => setForm({ ...form, fat: v ? +v : undefined })} keyboardType="numeric" />

            <TouchableOpacity
              style={[styles.saveBtn, { backgroundColor: colors.primary }, saving && styles.saveBtnDisabled]}
              onPress={handleSave}
              disabled={saving}
            >
              {saving ? <ActivityIndicator color="white" /> : <Text style={styles.saveBtnText}>{t("food.add_button")}</Text>}
            </TouchableOpacity>

            <View style={{ height: 30 }} />
          </ScrollView>
        </View>
      </Modal>
    </ScrollView>
  );
}

function MacroItem({ label, value, color, unit, textMuted }: { label: string; value: number; color: string; unit: string; textMuted: string }) {
  return (
    <View style={styles.macroItem}>
      <Text style={[styles.macroValue, { color }]}>{Math.round(value)}{unit}</Text>
      <Text style={[styles.macroLabel, { color: textMuted }]}>{label}</Text>
    </View>
  );
}

function FormInput({ label, placeholder, value, onChangeText, keyboardType = "default", colors }: {
  label: string; placeholder: string; value: string;
  onChangeText: (v: string) => void; keyboardType?: "default" | "numeric"; colors: any;
}) {
  return (
    <View style={styles.inputGroup}>
      <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>{label}</Text>
      <TextInput
        style={[styles.input, { backgroundColor: colors.bgSecondary, color: colors.textPrimary, borderColor: colors.border }]}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: Spacing.base },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },

  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20, paddingTop: 52 },
  title: { fontSize: sf(24), fontWeight: "800" },
  addBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: "center", alignItems: "center" },

  summaryCard: { borderRadius: Radius.xl, padding: 18, marginBottom: 20, borderWidth: 1 },
  summaryTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 12 },
  summaryLabel: { fontSize: sf(13), marginBottom: 4 },
  calorieRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  calTotal: { fontSize: sf(28), fontWeight: "800" },
  calGoal: { fontSize: sf(14), alignSelf: "flex-end", marginBottom: 2 },
  pctText: { fontSize: sf(18), fontWeight: "700" },

  progressBar: { height: 8, borderRadius: 4, overflow: "hidden", marginBottom: 14 },
  progressFill: { height: "100%", backgroundColor: "#f97316", borderRadius: 4 },

  macrosRow: { flexDirection: "row", justifyContent: "space-around" },
  macroItem: { alignItems: "center" },
  macroValue: { fontSize: sf(16), fontWeight: "700" },
  macroLabel: { fontSize: sf(11), marginTop: 2 },

  mealSection: { borderRadius: Radius.lg, padding: 16, marginBottom: 12, borderWidth: 1 },
  mealHeader: { flexDirection: "row", alignItems: "center", marginBottom: 10, gap: 8 },
  mealEmoji: { fontSize: 20 },
  mealLabel: { fontSize: sf(15), fontWeight: "700", flex: 1 },
  mealCal: { fontSize: sf(13) },
  addMealBtn: { padding: 4 },
  emptyMeal: { fontSize: sf(13), textAlign: "center", paddingVertical: 8 },

  foodItem: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 8, borderTopWidth: 1 },
  foodLeft: { flex: 1 },
  foodName: { fontSize: sf(14), fontWeight: "600" },
  foodMacros: { fontSize: sf(11), marginTop: 2 },
  foodCal: { fontSize: sf(14), fontWeight: "700" },

  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "flex-end" },
  modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: "90%" },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  modalTitle: { fontSize: sf(20), fontWeight: "700" },

  inputGroup: { marginBottom: 14 },
  inputLabel: { fontSize: sf(13), marginBottom: 6 },
  input: { borderRadius: Radius.md, padding: 12, fontSize: sf(15), borderWidth: 1 },

  picker: { borderRadius: Radius.md, padding: 12, borderWidth: 1, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  pickerText: { fontSize: sf(15) },
  pickerOptions: { borderRadius: Radius.md, marginTop: 4, borderWidth: 1 },
  pickerOption: { padding: 12, borderBottomWidth: 1 },
  pickerOptionText: { fontSize: sf(15) },

  saveBtn: { borderRadius: Radius.lg, padding: 16, alignItems: "center", marginTop: 8 },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { color: "white", fontSize: sf(16), fontWeight: "700" },
});
