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
import { useColors, Radius, Spacing, sf } from "@/src/theme";

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
  const colors = useColors();
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
      <View style={[styles.centered, { backgroundColor: colors.bgSecondary }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const bmiInfo = latest?.bmi ? getBmiCategory(latest.bmi, t) : null;

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.bgSecondary }]} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>{t("body.title")}</Text>
        <TouchableOpacity style={[styles.addBtn, { backgroundColor: colors.primary }]} onPress={() => setModalVisible(true)}>
          <Plus size={20} color="white" />
        </TouchableOpacity>
      </View>

      {/* Latest metrics */}
      {latest ? (
        <View style={[styles.latestCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.textSecondary }]}>{t("body.latest")}</Text>
          <Text style={[styles.cardDate, { color: colors.textMuted }]}>{formatDate(latest.recordedAt)}</Text>
          <View style={styles.metricsGrid}>
            {latest.weight && (
              <MetricItem colors={colors} icon={<Weight size={16} color={colors.primary} />} label={t("body.weight")} value={`${latest.weight} kg`} />
            )}
            {latest.height && (
              <MetricItem colors={colors} icon={<Activity size={16} color="#a855f7" />} label={t("body.height")} value={`${latest.height} cm`} />
            )}
            {latest.bmi && (
              <MetricItem
                colors={colors}
                icon={<TrendingUp size={16} color={bmiInfo?.color ?? "#facc15"} />}
                label={t("body.bmi")}
                value={`${latest.bmi}`}
                sub={bmiInfo?.label}
                subColor={bmiInfo?.color}
              />
            )}
            {latest.bloodPressureSystolic && (
              <MetricItem
                colors={colors}
                icon={<Heart size={16} color="#f87171" />}
                label={t("body.blood_pressure")}
                value={`${latest.bloodPressureSystolic}/${latest.bloodPressureDiastolic}`}
                sub="mmHg"
              />
            )}
            {latest.heartRate && (
              <MetricItem colors={colors} icon={<Heart size={16} color="#f43f5e" />} label={t("body.heart_rate")} value={`${latest.heartRate} bpm`} />
            )}
          </View>
        </View>
      ) : (
        <View style={[styles.emptyCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
          <Activity size={40} color={colors.textMuted} />
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>{t("body.no_metrics")}</Text>
          <Text style={[styles.emptySubText, { color: colors.textMuted }]}>{t("body.no_metrics_sub")}</Text>
        </View>
      )}

      {/* History */}
      {history.length > 0 && (
        <>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>{t("body.history", { count: history.length })}</Text>
          {history.map((m) => (
            <View key={m.id} style={[styles.historyItem, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
              <Text style={[styles.historyDate, { color: colors.textMuted }]}>{formatDate(m.recordedAt)}</Text>
              <View style={styles.historyRow}>
                {m.weight && <Text style={[styles.historyValue, { color: colors.textPrimary }]}>{m.weight} kg</Text>}
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
          <View style={[styles.modalContent, { backgroundColor: colors.bgCard }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>{t("body.add_title")}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X size={22} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <FormInput colors={colors} label={t("body.weight_label")} placeholder={t("body.weight_placeholder")} value={form.weight?.toString() ?? ""} onChangeText={(v) => setForm({ ...form, weight: v ? +v : undefined })} keyboardType="numeric" />
            <FormInput colors={colors} label={t("body.height_label")} placeholder={t("body.height_placeholder")} value={form.height?.toString() ?? ""} onChangeText={(v) => setForm({ ...form, height: v ? +v : undefined })} keyboardType="numeric" />
            <FormInput colors={colors} label={t("body.systolic_label")} placeholder={t("body.systolic_placeholder")} value={form.bloodPressureSystolic?.toString() ?? ""} onChangeText={(v) => setForm({ ...form, bloodPressureSystolic: v ? +v : undefined })} keyboardType="numeric" />
            <FormInput colors={colors} label={t("body.diastolic_label")} placeholder={t("body.diastolic_placeholder")} value={form.bloodPressureDiastolic?.toString() ?? ""} onChangeText={(v) => setForm({ ...form, bloodPressureDiastolic: v ? +v : undefined })} keyboardType="numeric" />
            <FormInput colors={colors} label={t("body.heart_rate_label")} placeholder={t("body.heart_rate_placeholder")} value={form.heartRate?.toString() ?? ""} onChangeText={(v) => setForm({ ...form, heartRate: v ? +v : undefined })} keyboardType="numeric" />
            <FormInput colors={colors} label={t("body.note_label")} placeholder={t("body.note_placeholder")} value={form.note ?? ""} onChangeText={(v) => setForm({ ...form, note: v || undefined })} />

            <TouchableOpacity
              style={[styles.saveBtn, { backgroundColor: colors.primary }, saving && styles.saveBtnDisabled]}
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

function MetricItem({ icon, label, value, sub, subColor, colors }: {
  icon: React.ReactNode; label: string; value: string;
  sub?: string; subColor?: string; colors: any;
}) {
  return (
    <View style={[styles.metricItem, { backgroundColor: colors.bgSecondary }]}>
      <View style={styles.metricIcon}>{icon}</View>
      <Text style={[styles.metricLabel, { color: colors.textMuted }]}>{label}</Text>
      <Text style={[styles.metricValue, { color: colors.textPrimary }]}>{value}</Text>
      {sub && <Text style={[styles.metricSub, { color: subColor ?? colors.textSecondary }]}>{sub}</Text>}
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

  latestCard: { borderRadius: Radius.xl, padding: 18, marginBottom: 24, borderWidth: 1 },
  cardTitle: { fontSize: sf(13), marginBottom: 2 },
  cardDate: { fontSize: sf(12), marginBottom: 14 },
  metricsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },

  metricItem: { width: "47%", borderRadius: Radius.lg, padding: 12 },
  metricIcon: { marginBottom: 6 },
  metricLabel: { fontSize: sf(11), marginBottom: 2 },
  metricValue: { fontSize: sf(18), fontWeight: "700" },
  metricSub: { fontSize: sf(11), marginTop: 2 },

  emptyCard: { borderRadius: Radius.xl, padding: 40, alignItems: "center", gap: 10, marginBottom: 24, borderWidth: 1 },
  emptyText: { fontSize: sf(16), fontWeight: "600" },
  emptySubText: { fontSize: sf(13) },

  sectionTitle: { fontSize: sf(17), fontWeight: "700", marginBottom: 12 },
  historyItem: { borderRadius: Radius.lg, padding: 14, marginBottom: 8, borderWidth: 1 },
  historyDate: { fontSize: sf(12), marginBottom: 6 },
  historyRow: { flexDirection: "row", gap: 12, flexWrap: "wrap" },
  historyValue: { fontSize: sf(14), fontWeight: "600" },
  historyBmi: { color: "#facc15", fontSize: sf(14), fontWeight: "600" },
  historyBp: { color: "#f87171", fontSize: sf(14), fontWeight: "600" },

  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "flex-end" },
  modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: "90%" },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  modalTitle: { fontSize: sf(20), fontWeight: "700" },

  inputGroup: { marginBottom: 14 },
  inputLabel: { fontSize: sf(13), marginBottom: 6 },
  input: { borderRadius: Radius.md, padding: 12, fontSize: sf(15), borderWidth: 1 },

  saveBtn: { borderRadius: Radius.lg, padding: 16, alignItems: "center", marginTop: 8 },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { color: "white", fontSize: sf(16), fontWeight: "700" },
});
