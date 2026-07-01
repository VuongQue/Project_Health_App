import React, { useState, useCallback } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, Alert, ActivityIndicator, Modal,
} from "react-native";
import { Target, Plus, X, ChevronDown, CheckCircle, Pause, Trash2 } from "lucide-react-native";
import { useFocusEffect } from "expo-router";
import { useTranslation } from "react-i18next";
import { goalsApi, UserGoal, CreateGoalDto, GoalType, GoalStatus } from "@/src/api/goalsApi";
import { useColors, Radius, Spacing, sf } from "@/src/theme";

const GOAL_TYPES: GoalType[] = [
  "WEIGHT_LOSS", "WEIGHT_GAIN", "MUSCLE_GAIN", "IMPROVE_FITNESS",
  "DAILY_STEPS", "DAILY_CALORIES", "DAILY_WATER", "WEEKLY_WORKOUTS", "CUSTOM",
];

const STATUS_COLORS: Record<GoalStatus, string> = {
  ACTIVE: "#3b82f6",
  COMPLETED: "#4ade80",
  PAUSED: "#94a3b8",
};

export default function GoalsScreen() {
  const { t } = useTranslation();
  const colors = useColors();

  const GOAL_TYPE_LABELS: Record<GoalType, string> = {
    WEIGHT_LOSS: t("goals.type_weight_loss"), WEIGHT_GAIN: t("goals.type_weight_gain"),
    MUSCLE_GAIN: t("goals.type_muscle"), IMPROVE_FITNESS: t("goals.type_fitness"),
    DAILY_STEPS: t("goals.type_steps"), DAILY_CALORIES: t("goals.type_calories"),
    DAILY_WATER: t("goals.type_water"), WEEKLY_WORKOUTS: t("goals.type_workouts"),
    CUSTOM: t("goals.type_custom"),
  };

  const STATUS_LABELS: Record<GoalStatus, string> = {
    ACTIVE: t("goals.active"), COMPLETED: t("goals.completed"), PAUSED: t("goals.paused"),
  };

  const [loading, setLoading] = useState(true);
  const [goals, setGoals] = useState<UserGoal[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showTypePicker, setShowTypePicker] = useState(false);
  const [filter, setFilter] = useState<GoalStatus | "ALL">("ALL");
  const [form, setForm] = useState<Partial<CreateGoalDto>>({ type: "IMPROVE_FITNESS" });

  useFocusEffect(useCallback(() => { loadData(); }, []));

  const loadData = async () => {
    try {
      setLoading(true);
      setGoals(await goalsApi.getAll());
    } catch {} finally { setLoading(false); }
  };

  const handleSave = async () => {
    if (!form.type || !form.title) { Alert.alert(t("goals.err_missing"), t("goals.err_type_title")); return; }
    try {
      setSaving(true);
      await goalsApi.create(form as CreateGoalDto);
      setModalVisible(false); setForm({ type: "IMPROVE_FITNESS" }); await loadData();
    } catch { Alert.alert(t("common.error"), t("goals.err_save")); } finally { setSaving(false); }
  };

  const handleStatusChange = async (goal: UserGoal, status: GoalStatus) => {
    try { await goalsApi.updateStatus(goal.id, status); await loadData(); }
    catch { Alert.alert(t("common.error"), t("goals.err_status")); }
  };

  const handleDelete = async (id: number) => {
    Alert.alert(t("goals.delete_title"), t("goals.delete_msg"), [
      { text: t("goals.cancel"), style: "cancel" },
      { text: t("goals.delete"), style: "destructive", onPress: async () => { await goalsApi.delete(id); loadData(); } },
    ]);
  };

  const filtered = filter === "ALL" ? goals : goals.filter((g) => g.status === filter);

  if (loading) return (
    <View style={[styles.centered, { backgroundColor: colors.bgSecondary }]}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.bgSecondary }]} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>{t("goals.title")}</Text>
        <TouchableOpacity style={[styles.addBtn, { backgroundColor: colors.primary }]} onPress={() => setModalVisible(true)}>
          <Plus size={20} color="white" />
        </TouchableOpacity>
      </View>

      <View style={styles.statsRow}>
        <StatBadge colors={colors} label={t("goals.total")} value={goals.length} color="#3b82f6" />
        <StatBadge colors={colors} label={t("goals.in_progress")} value={goals.filter((g) => g.status === "ACTIVE").length} color="#facc15" />
        <StatBadge colors={colors} label={t("goals.completed")} value={goals.filter((g) => g.status === "COMPLETED").length} color="#4ade80" />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
        {(["ALL", "ACTIVE", "COMPLETED", "PAUSED"] as const).map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterTab, { backgroundColor: colors.bgCard, borderColor: colors.border }, filter === f && { backgroundColor: colors.primary, borderColor: colors.primary }]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterTabText, { color: colors.textSecondary }, filter === f && { color: "white", fontWeight: "700" }]}>
              {f === "ALL" ? t("goals.all") : STATUS_LABELS[f]}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {filtered.length === 0 ? (
        <View style={[styles.emptyCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
          <Target size={40} color={colors.textMuted} />
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>{t("goals.no_goals")}</Text>
          <Text style={[styles.emptySubText, { color: colors.textMuted }]}>{t("goals.no_goals_sub")}</Text>
        </View>
      ) : (
        filtered.map((goal) => (
          <GoalCard key={goal.id} goal={goal} colors={colors} goalTypeLabels={GOAL_TYPE_LABELS} statusLabels={STATUS_LABELS} onStatusChange={handleStatusChange} onDelete={handleDelete} />
        ))
      )}

      <View style={{ height: 40 }} />

      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <ScrollView style={[styles.modalContent, { backgroundColor: colors.bgCard }]} showsVerticalScrollIndicator={false}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>{t("goals.create_title")}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X size={22} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>{t("goals.type_label")}</Text>
              <TouchableOpacity style={[styles.picker, { backgroundColor: colors.bgSecondary, borderColor: colors.border }]} onPress={() => setShowTypePicker(!showTypePicker)}>
                <Text style={[styles.pickerText, { color: colors.textPrimary }]}>{GOAL_TYPE_LABELS[form.type ?? "IMPROVE_FITNESS"]}</Text>
                <ChevronDown size={16} color={colors.textMuted} />
              </TouchableOpacity>
              {showTypePicker && (
                <View style={[styles.pickerOptions, { backgroundColor: colors.bgSecondary, borderColor: colors.border }]}>
                  {GOAL_TYPES.map((gt) => (
                    <TouchableOpacity key={gt} style={[styles.pickerOption, { borderBottomColor: colors.border }]} onPress={() => { setForm({ ...form, type: gt }); setShowTypePicker(false); }}>
                      <Text style={[styles.pickerOptionText, { color: colors.textPrimary }]}>{GOAL_TYPE_LABELS[gt]}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            <FormInput colors={colors} label={t("goals.title_label")} placeholder={t("goals.title_placeholder")} value={form.title ?? ""} onChangeText={(v) => setForm({ ...form, title: v })} />
            <FormInput colors={colors} label={t("goals.desc_label")} placeholder={t("goals.desc_placeholder")} value={form.description ?? ""} onChangeText={(v) => setForm({ ...form, description: v })} />
            <FormInput colors={colors} label={t("goals.target_label")} placeholder={t("goals.target_placeholder")} value={form.targetValue?.toString() ?? ""} onChangeText={(v) => setForm({ ...form, targetValue: v ? +v : undefined })} keyboardType="numeric" />
            <FormInput colors={colors} label={t("goals.unit_label")} placeholder={t("goals.unit_placeholder")} value={form.unit ?? ""} onChangeText={(v) => setForm({ ...form, unit: v })} />
            <FormInput colors={colors} label={t("goals.deadline_label")} placeholder={t("goals.deadline_placeholder")} value={form.deadline ?? ""} onChangeText={(v) => setForm({ ...form, deadline: v })} />

            <TouchableOpacity style={[styles.saveBtn, { backgroundColor: colors.primary }, saving && styles.saveBtnDisabled]} onPress={handleSave} disabled={saving}>
              {saving ? <ActivityIndicator color="white" /> : <Text style={styles.saveBtnText}>{t("goals.create_button")}</Text>}
            </TouchableOpacity>
            <View style={{ height: 30 }} />
          </ScrollView>
        </View>
      </Modal>
    </ScrollView>
  );
}

function GoalCard({ goal, colors, goalTypeLabels, statusLabels, onStatusChange, onDelete }: {
  goal: UserGoal; colors: any; goalTypeLabels: Record<GoalType, string>;
  statusLabels: Record<GoalStatus, string>;
  onStatusChange: (g: UserGoal, s: GoalStatus) => void; onDelete: (id: number) => void;
}) {
  const pct = goal.targetValue && goal.currentValue
    ? Math.min(100, Math.round((goal.currentValue / goal.targetValue) * 100)) : 0;
  const statusColor = STATUS_COLORS[goal.status];

  return (
    <View style={[styles.goalCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
      <View style={styles.goalTop}>
        <View style={styles.goalLeft}>
          <View style={[styles.goalTypeBadge, { backgroundColor: statusColor + "22" }]}>
            <Text style={[styles.goalTypeText, { color: statusColor }]}>{goalTypeLabels[goal.type]}</Text>
          </View>
          <Text style={[styles.goalTitle, { color: colors.textPrimary }]}>{goal.title}</Text>
          {goal.description && <Text style={[styles.goalDesc, { color: colors.textMuted }]}>{goal.description}</Text>}
        </View>
        <TouchableOpacity onPress={() => onDelete(goal.id)}>
          <Trash2 size={16} color={colors.textMuted} />
        </TouchableOpacity>
      </View>

      {goal.targetValue != null && (
        <>
          <View style={[styles.progressBar, { backgroundColor: colors.bgSecondary }]}>
            <View style={[styles.progressFill, { width: `${pct}%`, backgroundColor: statusColor }]} />
          </View>
          <Text style={[styles.progressText, { color: colors.textSecondary }]}>
            {goal.currentValue ?? 0} / {goal.targetValue} {goal.unit ?? ""} · {pct}%
          </Text>
        </>
      )}

      {goal.deadline && (
        <Text style={[styles.deadline, { color: colors.textMuted }]}>
          Hạn: {new Date(goal.deadline).toLocaleDateString("vi-VN")}
        </Text>
      )}

      <View style={styles.goalActions}>
        {goal.status === "ACTIVE" && (
          <>
            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.bgSecondary }]} onPress={() => onStatusChange(goal, "COMPLETED")}>
              <CheckCircle size={14} color="#4ade80" />
              <Text style={[styles.actionText, { color: "#4ade80" }]}>Hoàn thành</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.bgSecondary }]} onPress={() => onStatusChange(goal, "PAUSED")}>
              <Pause size={14} color={colors.textMuted} />
              <Text style={[styles.actionText, { color: colors.textMuted }]}>Tạm dừng</Text>
            </TouchableOpacity>
          </>
        )}
        {goal.status === "PAUSED" && (
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.bgSecondary }]} onPress={() => onStatusChange(goal, "ACTIVE")}>
            <Target size={14} color={colors.primary} />
            <Text style={[styles.actionText, { color: colors.primary }]}>Tiếp tục</Text>
          </TouchableOpacity>
        )}
        <View style={[styles.statusChip, { backgroundColor: statusColor + "22", marginLeft: "auto" as any }]}>
          <Text style={[styles.statusChipText, { color: statusColor }]}>{statusLabels[goal.status]}</Text>
        </View>
      </View>
    </View>
  );
}

function StatBadge({ label, value, color, colors }: { label: string; value: number; color: string; colors: any }) {
  return (
    <View style={[styles.statBadge, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.textMuted }]}>{label}</Text>
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
        placeholder={placeholder} placeholderTextColor={colors.textMuted}
        value={value} onChangeText={onChangeText} keyboardType={keyboardType}
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
  statsRow: { flexDirection: "row", gap: 12, marginBottom: 16 },
  statBadge: { flex: 1, borderRadius: Radius.lg, padding: 12, alignItems: "center", borderWidth: 1 },
  statValue: { fontSize: sf(24), fontWeight: "800" },
  statLabel: { fontSize: sf(11), marginTop: 2 },
  filterRow: { marginBottom: 16 },
  filterTab: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, marginRight: 8, borderWidth: 1 },
  filterTabText: { fontSize: sf(13) },
  emptyCard: { borderRadius: Radius.xl, padding: 40, alignItems: "center", gap: 10, borderWidth: 1 },
  emptyText: { fontSize: sf(16), fontWeight: "600" },
  emptySubText: { fontSize: sf(13) },
  goalCard: { borderRadius: Radius.lg, padding: 16, marginBottom: 12, borderWidth: 1 },
  goalTop: { flexDirection: "row", justifyContent: "space-between", marginBottom: 10 },
  goalLeft: { flex: 1, gap: 4 },
  goalTypeBadge: { alignSelf: "flex-start", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 3, marginBottom: 4 },
  goalTypeText: { fontSize: sf(11), fontWeight: "600" },
  goalTitle: { fontSize: sf(16), fontWeight: "700" },
  goalDesc: { fontSize: sf(13) },
  progressBar: { height: 6, borderRadius: 3, overflow: "hidden", marginBottom: 4 },
  progressFill: { height: "100%", borderRadius: 3 },
  progressText: { fontSize: sf(12), marginBottom: 6 },
  deadline: { fontSize: sf(12), marginBottom: 8 },
  goalActions: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 4, flexWrap: "wrap" },
  actionBtn: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  actionText: { fontSize: sf(12), fontWeight: "600" },
  statusChip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  statusChipText: { fontSize: sf(11), fontWeight: "600" },
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
