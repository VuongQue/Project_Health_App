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
import { Target, Plus, X, ChevronDown, CheckCircle, Pause, Trash2 } from "lucide-react-native";
import { useFocusEffect } from "expo-router";
import { useTranslation } from "react-i18next";
import { goalsApi, UserGoal, CreateGoalDto, GoalType, GoalStatus } from "@/src/api/goalsApi";

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

  const GOAL_TYPE_LABELS: Record<GoalType, string> = {
    WEIGHT_LOSS: t("goals.type_weight_loss"),
    WEIGHT_GAIN: t("goals.type_weight_gain"),
    MUSCLE_GAIN: t("goals.type_muscle"),
    IMPROVE_FITNESS: t("goals.type_fitness"),
    DAILY_STEPS: t("goals.type_steps"),
    DAILY_CALORIES: t("goals.type_calories"),
    DAILY_WATER: t("goals.type_water"),
    WEEKLY_WORKOUTS: t("goals.type_workouts"),
    CUSTOM: t("goals.type_custom"),
  };

  const STATUS_LABELS: Record<GoalStatus, string> = {
    ACTIVE: t("goals.active"),
    COMPLETED: t("goals.completed"),
    PAUSED: t("goals.paused"),
  };

  const [loading, setLoading] = useState(true);
  const [goals, setGoals] = useState<UserGoal[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showTypePicker, setShowTypePicker] = useState(false);
  const [filter, setFilter] = useState<GoalStatus | "ALL">("ALL");

  const [form, setForm] = useState<Partial<CreateGoalDto>>({
    type: "IMPROVE_FITNESS",
  });

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await goalsApi.getAll();
      setGoals(data);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!form.type || !form.title) {
      Alert.alert(t("goals.err_missing"), t("goals.err_type_title"));
      return;
    }
    try {
      setSaving(true);
      await goalsApi.create(form as CreateGoalDto);
      setModalVisible(false);
      setForm({ type: "IMPROVE_FITNESS" });
      await loadData();
    } catch {
      Alert.alert(t("common.error"), t("goals.err_save"));
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (goal: UserGoal, status: GoalStatus) => {
    try {
      await goalsApi.updateStatus(goal.id, status);
      await loadData();
    } catch {
      Alert.alert(t("common.error"), t("goals.err_status"));
    }
  };

  const handleDelete = async (id: number) => {
    Alert.alert(t("goals.delete_title"), t("goals.delete_msg"), [
      { text: t("goals.cancel"), style: "cancel" },
      {
        text: t("goals.delete"),
        style: "destructive",
        onPress: async () => {
          await goalsApi.delete(id);
          loadData();
        },
      },
    ]);
  };

  const filtered =
    filter === "ALL" ? goals : goals.filter((g) => g.status === filter);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{t("goals.title")}</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setModalVisible(true)}>
          <Plus size={20} color="white" />
        </TouchableOpacity>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <StatBadge label={t("goals.total")} value={goals.length} color="#3b82f6" />
        <StatBadge label={t("goals.in_progress")} value={goals.filter((g) => g.status === "ACTIVE").length} color="#facc15" />
        <StatBadge label={t("goals.completed")} value={goals.filter((g) => g.status === "COMPLETED").length} color="#4ade80" />
      </View>

      {/* Filter tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
        {(["ALL", "ACTIVE", "COMPLETED", "PAUSED"] as const).map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterTab, filter === f && styles.filterTabActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterTabText, filter === f && styles.filterTabTextActive]}>
              {f === "ALL" ? t("goals.all") : STATUS_LABELS[f]}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Goals list */}
      {filtered.length === 0 ? (
        <View style={styles.emptyCard}>
          <Target size={40} color="#475569" />
          <Text style={styles.emptyText}>{t("goals.no_goals")}</Text>
          <Text style={styles.emptySubText}>{t("goals.no_goals_sub")}</Text>
        </View>
      ) : (
        filtered.map((goal) => <GoalCard key={goal.id} goal={goal} onStatusChange={handleStatusChange} onDelete={handleDelete} />)
      )}

      <View style={{ height: 40 }} />

      {/* Add goal modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t("goals.create_title")}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X size={22} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            {/* Type picker */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{t("goals.type_label")}</Text>
              <TouchableOpacity style={styles.picker} onPress={() => setShowTypePicker(!showTypePicker)}>
                <Text style={styles.pickerText}>{GOAL_TYPE_LABELS[form.type ?? "IMPROVE_FITNESS"]}</Text>
                <ChevronDown size={16} color="#94a3b8" />
              </TouchableOpacity>
              {showTypePicker && (
                <View style={styles.pickerOptions}>
                  {GOAL_TYPES.map((gt) => (
                    <TouchableOpacity
                      key={gt}
                      style={styles.pickerOption}
                      onPress={() => { setForm({ ...form, type: gt }); setShowTypePicker(false); }}
                    >
                      <Text style={styles.pickerOptionText}>{GOAL_TYPE_LABELS[gt]}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            <FormInput label={t("goals.title_label")} placeholder={t("goals.title_placeholder")} value={form.title ?? ""} onChangeText={(v) => setForm({ ...form, title: v })} />
            <FormInput label={t("goals.desc_label")} placeholder={t("goals.desc_placeholder")} value={form.description ?? ""} onChangeText={(v) => setForm({ ...form, description: v })} />
            <FormInput label={t("goals.target_label")} placeholder={t("goals.target_placeholder")} value={form.targetValue?.toString() ?? ""} onChangeText={(v) => setForm({ ...form, targetValue: v ? +v : undefined })} keyboardType="numeric" />
            <FormInput label={t("goals.unit_label")} placeholder={t("goals.unit_placeholder")} value={form.unit ?? ""} onChangeText={(v) => setForm({ ...form, unit: v })} />
            <FormInput label={t("goals.deadline_label")} placeholder={t("goals.deadline_placeholder")} value={form.deadline ?? ""} onChangeText={(v) => setForm({ ...form, deadline: v })} />

            <TouchableOpacity style={[styles.saveBtn, saving && styles.saveBtnDisabled]} onPress={handleSave} disabled={saving}>
              {saving ? <ActivityIndicator color="white" /> : <Text style={styles.saveBtnText}>{t("goals.create_button")}</Text>}
            </TouchableOpacity>
            <View style={{ height: 30 }} />
          </ScrollView>
        </View>
      </Modal>
    </ScrollView>
  );
}

function GoalCard({
  goal,
  onStatusChange,
  onDelete,
}: {
  goal: UserGoal;
  onStatusChange: (g: UserGoal, s: GoalStatus) => void;
  onDelete: (id: number) => void;
}) {
  const { t } = useTranslation();

  const GOAL_TYPE_LABELS: Record<GoalType, string> = {
    WEIGHT_LOSS: t("goals.type_weight_loss"), WEIGHT_GAIN: t("goals.type_weight_gain"),
    MUSCLE_GAIN: t("goals.type_muscle"), IMPROVE_FITNESS: t("goals.type_fitness"),
    DAILY_STEPS: t("goals.type_steps"), DAILY_CALORIES: t("goals.type_calories"),
    DAILY_WATER: t("goals.type_water"), WEEKLY_WORKOUTS: t("goals.type_workouts"), CUSTOM: t("goals.type_custom"),
  };
  const STATUS_LABELS: Record<GoalStatus, string> = {
    ACTIVE: t("goals.active"), COMPLETED: t("goals.completed"), PAUSED: t("goals.paused"),
  };

  const pct =
    goal.targetValue && goal.currentValue
      ? Math.min(100, Math.round((goal.currentValue / goal.targetValue) * 100))
      : 0;

  const statusColor = STATUS_COLORS[goal.status];

  return (
    <View style={styles.goalCard}>
      <View style={styles.goalTop}>
        <View style={styles.goalLeft}>
          <View style={[styles.goalTypeBadge, { backgroundColor: statusColor + "22" }]}>
            <Text style={[styles.goalTypeText, { color: statusColor }]}>
              {GOAL_TYPE_LABELS[goal.type]}
            </Text>
          </View>
          <Text style={styles.goalTitle}>{goal.title}</Text>
          {goal.description && <Text style={styles.goalDesc}>{goal.description}</Text>}
        </View>
        <TouchableOpacity onPress={() => onDelete(goal.id)}>
          <Trash2 size={16} color="#475569" />
        </TouchableOpacity>
      </View>

      {goal.targetValue != null && (
        <>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${pct}%`, backgroundColor: statusColor }]} />
          </View>
          <Text style={styles.progressText}>
            {goal.currentValue ?? 0} / {goal.targetValue} {goal.unit ?? ""} · {pct}%
          </Text>
        </>
      )}

      {goal.deadline && (
        <Text style={styles.deadline}>
          Hạn: {new Date(goal.deadline).toLocaleDateString("vi-VN")}
        </Text>
      )}

      {/* Action buttons */}
      <View style={styles.goalActions}>
        {goal.status === "ACTIVE" && (
          <>
            <TouchableOpacity style={styles.actionBtn} onPress={() => onStatusChange(goal, "COMPLETED")}>
              <CheckCircle size={14} color="#4ade80" />
              <Text style={[styles.actionText, { color: "#4ade80" }]}>{t("goals.btn_complete")}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn} onPress={() => onStatusChange(goal, "PAUSED")}>
              <Pause size={14} color="#94a3b8" />
              <Text style={[styles.actionText, { color: "#94a3b8" }]}>{t("goals.btn_pause")}</Text>
            </TouchableOpacity>
          </>
        )}
        {goal.status === "PAUSED" && (
          <TouchableOpacity style={styles.actionBtn} onPress={() => onStatusChange(goal, "ACTIVE")}>
            <Target size={14} color="#3b82f6" />
            <Text style={[styles.actionText, { color: "#3b82f6" }]}>{t("goals.btn_resume")}</Text>
          </TouchableOpacity>
        )}
        <View style={[styles.statusChip, { backgroundColor: statusColor + "22" }]}>
          <Text style={[styles.statusChipText, { color: statusColor }]}>{STATUS_LABELS[goal.status]}</Text>
        </View>
      </View>
    </View>
  );
}

function StatBadge({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View style={styles.statBadge}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
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

  statsRow: { flexDirection: "row", gap: 12, marginBottom: 16 },
  statBadge: { flex: 1, backgroundColor: "#1e293b", borderRadius: 14, padding: 12, alignItems: "center", borderWidth: 1, borderColor: "#334155" },
  statValue: { fontSize: 24, fontWeight: "800" },
  statLabel: { color: "#64748b", fontSize: 11, marginTop: 2 },

  filterRow: { marginBottom: 16 },
  filterTab: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: "#1e293b", marginRight: 8, borderWidth: 1, borderColor: "#334155" },
  filterTabActive: { backgroundColor: "#3b82f6", borderColor: "#3b82f6" },
  filterTabText: { color: "#94a3b8", fontSize: 13 },
  filterTabTextActive: { color: "white", fontWeight: "700" },

  emptyCard: { backgroundColor: "#1e293b", borderRadius: 20, padding: 40, alignItems: "center", gap: 10, borderWidth: 1, borderColor: "#334155" },
  emptyText: { color: "#cbd5e1", fontSize: 16, fontWeight: "600" },
  emptySubText: { color: "#64748b", fontSize: 13 },

  goalCard: { backgroundColor: "#1e293b", borderRadius: 18, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: "#334155" },
  goalTop: { flexDirection: "row", justifyContent: "space-between", marginBottom: 10 },
  goalLeft: { flex: 1, gap: 4 },
  goalTypeBadge: { alignSelf: "flex-start", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 3, marginBottom: 4 },
  goalTypeText: { fontSize: 11, fontWeight: "600" },
  goalTitle: { color: "white", fontSize: 16, fontWeight: "700" },
  goalDesc: { color: "#64748b", fontSize: 13 },

  progressBar: { height: 6, backgroundColor: "#0f172a", borderRadius: 3, overflow: "hidden", marginBottom: 4 },
  progressFill: { height: "100%", borderRadius: 3 },
  progressText: { color: "#94a3b8", fontSize: 12, marginBottom: 6 },

  deadline: { color: "#64748b", fontSize: 12, marginBottom: 8 },

  goalActions: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 4, flexWrap: "wrap" },
  actionBtn: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, backgroundColor: "#0f172a" },
  actionText: { fontSize: 12, fontWeight: "600" },
  statusChip: { marginLeft: "auto", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  statusChipText: { fontSize: 11, fontWeight: "600" },

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
