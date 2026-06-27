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
import { Activity, Plus, Weight, Heart, TrendingUp, X } from "lucide-react-native";
import { useFocusEffect } from "expo-router";
import { useTranslation } from "react-i18next";
import { bodyMetricsApi, BodyMetric, CreateBodyMetricDto } from "@/src/api/bodyMetricsApi";

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function getBmiCategory(bmi: number, t: (k: string) => string) {
  if (bmi < 18.5) return { label: t("body.bmi_underweight"), color: "#60a5fa" };
  if (bmi < 25) return { label: t("body.bmi_normal"), color: "#4ade80" };
  if (bmi < 30) return { label: t("body.bmi_overweight"), color: "#facc15" };
  return { label: t("body.bmi_obese"), color: "#f87171" };
}

export default function BodyMetricsScreen() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [latest, setLatest] = useState<BodyMetric | null>(null);
  const [history, setHistory] = useState<BodyMetric[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState<CreateBodyMetricDto>({});

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    try {
      setLoading(true);
      const [lat, hist] = await Promise.all([
        bodyMetricsApi.getLatest().catch(() => null),
        bodyMetricsApi.getHistory(10).catch(() => []),
      ]);
      setLatest(lat);
      setHistory(hist);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!form.weight && !form.height && !form.bloodPressureSystolic && !form.heartRate) {
      Alert.alert(t("body.err_missing"), t("body.err_at_least_one"));
      return;
    }
    try {
      setSaving(true);
      await bodyMetricsApi.create(form);
      setModalVisible(false);
      setForm({});
      await loadData();
    } catch {
      Alert.alert(t("common.error"), t("body.err_save"));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  const bmiInfo = latest?.bmi ? getBmiCategory(latest.bmi, t) : null;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{t("body.title")}</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setModalVisible(true)}>
          <Plus size={20} color="white" />
        </TouchableOpacity>
      </View>

      {/* Latest metrics */}
      {latest ? (
        <View style={styles.latestCard}>
          <Text style={styles.cardTitle}>{t("body.latest")}</Text>
          <Text style={styles.cardDate}>{formatDate(latest.recordedAt)}</Text>
          <View style={styles.metricsGrid}>
            {latest.weight && (
              <MetricItem icon={<Weight size={16} color="#3b82f6" />} label={t("body.weight")} value={`${latest.weight} kg`} />
            )}
            {latest.height && (
              <MetricItem icon={<Activity size={16} color="#a855f7" />} label={t("body.height")} value={`${latest.height} cm`} />
            )}
            {latest.bmi && (
              <MetricItem
                icon={<TrendingUp size={16} color={bmiInfo?.color ?? "#facc15"} />}
                label={t("body.bmi")}
                value={`${latest.bmi}`}
                sub={bmiInfo?.label}
                subColor={bmiInfo?.color}
              />
            )}
            {latest.bloodPressureSystolic && (
              <MetricItem
                icon={<Heart size={16} color="#f87171" />}
                label={t("body.blood_pressure")}
                value={`${latest.bloodPressureSystolic}/${latest.bloodPressureDiastolic}`}
                sub="mmHg"
              />
            )}
            {latest.heartRate && (
              <MetricItem icon={<Heart size={16} color="#f43f5e" />} label={t("body.heart_rate")} value={`${latest.heartRate} bpm`} />
            )}
          </View>
        </View>
      ) : (
        <View style={styles.emptyCard}>
          <Activity size={40} color="#475569" />
          <Text style={styles.emptyText}>{t("body.no_metrics")}</Text>
          <Text style={styles.emptySubText}>{t("body.no_metrics_sub")}</Text>
        </View>
      )}

      {/* History */}
      {history.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>{t("body.history", { count: history.length })}</Text>
          {history.map((m) => (
            <View key={m.id} style={styles.historyItem}>
              <Text style={styles.historyDate}>{formatDate(m.recordedAt)}</Text>
              <View style={styles.historyRow}>
                {m.weight && <Text style={styles.historyValue}>{m.weight} kg</Text>}
                {m.bmi && <Text style={styles.historyBmi}>BMI {m.bmi}</Text>}
                {m.bloodPressureSystolic && (
                  <Text style={styles.historyBp}>
                    {m.bloodPressureSystolic}/{m.bloodPressureDiastolic} mmHg
                  </Text>
                )}
              </View>
            </View>
          ))}
        </>
      )}

      <View style={{ height: 40 }} />

      {/* Add metric modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t("body.add_title")}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X size={22} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            <FormInput
              label={t("body.weight_label")}
              placeholder={t("body.weight_placeholder")}
              value={form.weight?.toString() ?? ""}
              onChangeText={(v) => setForm({ ...form, weight: v ? +v : undefined })}
              keyboardType="numeric"
            />
            <FormInput
              label={t("body.height_label")}
              placeholder={t("body.height_placeholder")}
              value={form.height?.toString() ?? ""}
              onChangeText={(v) => setForm({ ...form, height: v ? +v : undefined })}
              keyboardType="numeric"
            />
            <FormInput
              label={t("body.systolic_label")}
              placeholder={t("body.systolic_placeholder")}
              value={form.bloodPressureSystolic?.toString() ?? ""}
              onChangeText={(v) => setForm({ ...form, bloodPressureSystolic: v ? +v : undefined })}
              keyboardType="numeric"
            />
            <FormInput
              label={t("body.diastolic_label")}
              placeholder={t("body.diastolic_placeholder")}
              value={form.bloodPressureDiastolic?.toString() ?? ""}
              onChangeText={(v) => setForm({ ...form, bloodPressureDiastolic: v ? +v : undefined })}
              keyboardType="numeric"
            />
            <FormInput
              label={t("body.heart_rate_label")}
              placeholder={t("body.heart_rate_placeholder")}
              value={form.heartRate?.toString() ?? ""}
              onChangeText={(v) => setForm({ ...form, heartRate: v ? +v : undefined })}
              keyboardType="numeric"
            />
            <FormInput
              label={t("body.note_label")}
              placeholder={t("body.note_placeholder")}
              value={form.note ?? ""}
              onChangeText={(v) => setForm({ ...form, note: v || undefined })}
            />

            <TouchableOpacity
              style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
              onPress={handleSave}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.saveBtnText}>{t("body.save_button")}</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

function MetricItem({
  icon,
  label,
  value,
  sub,
  subColor,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  subColor?: string;
}) {
  return (
    <View style={styles.metricItem}>
      <View style={styles.metricIcon}>{icon}</View>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
      {sub && <Text style={[styles.metricSub, subColor ? { color: subColor } : {}]}>{sub}</Text>}
    </View>
  );
}

function FormInput({
  label,
  placeholder,
  value,
  onChangeText,
  keyboardType = "default",
}: {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (v: string) => void;
  keyboardType?: "default" | "numeric";
}) {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor="#64748b"
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f172a", padding: 16 },
  centered: { flex: 1, backgroundColor: "#0f172a", justifyContent: "center", alignItems: "center" },

  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  title: { color: "white", fontSize: 24, fontWeight: "800" },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#3b82f6",
    justifyContent: "center",
    alignItems: "center",
  },

  latestCard: {
    backgroundColor: "#1e293b",
    borderRadius: 20,
    padding: 18,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#334155",
  },
  cardTitle: { color: "#94a3b8", fontSize: 13, marginBottom: 2 },
  cardDate: { color: "#64748b", fontSize: 12, marginBottom: 14 },
  metricsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },

  metricItem: {
    width: "47%",
    backgroundColor: "#0f172a",
    borderRadius: 14,
    padding: 12,
  },
  metricIcon: { marginBottom: 6 },
  metricLabel: { color: "#64748b", fontSize: 11, marginBottom: 2 },
  metricValue: { color: "white", fontSize: 18, fontWeight: "700" },
  metricSub: { color: "#94a3b8", fontSize: 11, marginTop: 2 },

  emptyCard: {
    backgroundColor: "#1e293b",
    borderRadius: 20,
    padding: 40,
    alignItems: "center",
    gap: 10,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#334155",
  },
  emptyText: { color: "#cbd5e1", fontSize: 16, fontWeight: "600" },
  emptySubText: { color: "#64748b", fontSize: 13 },

  sectionTitle: { color: "white", fontSize: 17, fontWeight: "700", marginBottom: 12 },
  historyItem: {
    backgroundColor: "#1e293b",
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#334155",
  },
  historyDate: { color: "#64748b", fontSize: 12, marginBottom: 6 },
  historyRow: { flexDirection: "row", gap: 12, flexWrap: "wrap" },
  historyValue: { color: "white", fontSize: 14, fontWeight: "600" },
  historyBmi: { color: "#facc15", fontSize: 14, fontWeight: "600" },
  historyBp: { color: "#f87171", fontSize: 14, fontWeight: "600" },

  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "flex-end" },
  modalContent: {
    backgroundColor: "#1e293b",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: "90%",
  },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  modalTitle: { color: "white", fontSize: 20, fontWeight: "700" },

  inputGroup: { marginBottom: 14 },
  inputLabel: { color: "#94a3b8", fontSize: 13, marginBottom: 6 },
  input: {
    backgroundColor: "#0f172a",
    borderRadius: 12,
    padding: 12,
    color: "white",
    fontSize: 15,
    borderWidth: 1,
    borderColor: "#334155",
  },

  saveBtn: {
    backgroundColor: "#3b82f6",
    borderRadius: 14,
    padding: 16,
    alignItems: "center",
    marginTop: 8,
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { color: "white", fontSize: 16, fontWeight: "700" },
});
