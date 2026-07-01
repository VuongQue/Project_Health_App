import React, { useState } from "react";
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput } from "react-native";
import { useRouter } from "expo-router";
import { useColors, Radius, Spacing, sf } from "@/src/theme";

type Sex = "male" | "female";
type Activity = "sedentary" | "light" | "moderate" | "active" | "very_active";

const ACTIVITY_LABELS: Record<Activity, string> = {
  sedentary: "Ít vận động (văn phòng)",
  light: "Nhẹ (1-3 ngày/tuần)",
  moderate: "Vừa phải (3-5 ngày/tuần)",
  active: "Nhiều (6-7 ngày/tuần)",
  very_active: "Rất nhiều (VĐV chuyên nghiệp)",
};

const ACTIVITY_FACTORS: Record<Activity, number> = {
  sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725, very_active: 1.9,
};

function calculateBMR(sex: Sex, weight: number, height: number, age: number) {
  if (sex === "male") return 10 * weight + 6.25 * height - 5 * age + 5;
  return 10 * weight + 6.25 * height - 5 * age - 161;
}

export default function BMRCalculatorScreen() {
  const router = useRouter();
  const colors = useColors();
  const [sex, setSex] = useState<Sex>("male");
  const [weight, setWeight] = useState("70");
  const [height, setHeight] = useState("170");
  const [age, setAge] = useState("25");
  const [activity, setActivity] = useState<Activity>("moderate");
  const [result, setResult] = useState<{ bmr: number; tdee: number } | null>(null);

  const calculate = () => {
    const w = parseFloat(weight), h = parseFloat(height), a = parseInt(age);
    if (!w || !h || !a) return;
    const bmr = calculateBMR(sex, w, h, a);
    setResult({ bmr: Math.round(bmr), tdee: Math.round(bmr * ACTIVITY_FACTORS[activity]) });
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.bgSecondary }]} contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <Text style={[styles.backText, { color: colors.textSecondary }]}>← Back</Text>
        </TouchableOpacity>
        <Text style={[styles.header, { color: colors.textPrimary }]}>BMR / TDEE Calculator</Text>
        <View style={{ width: 60 }} />
      </View>

      <View style={[styles.card, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
        <Text style={[styles.label, { color: colors.textSecondary }]}>Giới tính</Text>
        <View style={styles.segRow}>
          {(["male", "female"] as Sex[]).map((s) => (
            <TouchableOpacity
              key={s}
              style={[styles.seg, { backgroundColor: colors.bgSecondary, borderColor: colors.border }, sex === s && { backgroundColor: colors.primary, borderColor: colors.primary }]}
              onPress={() => setSex(s)}
            >
              <Text style={[styles.segText, { color: colors.textSecondary }, sex === s && { color: "white" }]}>
                {s === "male" ? "Nam" : "Nữ"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[styles.label, { color: colors.textSecondary }]}>Cân nặng (kg)</Text>
        <TextInput style={[styles.input, { backgroundColor: colors.bgSecondary, borderColor: colors.border, color: colors.textPrimary }]} value={weight} onChangeText={setWeight} keyboardType="decimal-pad" placeholderTextColor={colors.textMuted} placeholder="70" />

        <Text style={[styles.label, { color: colors.textSecondary }]}>Chiều cao (cm)</Text>
        <TextInput style={[styles.input, { backgroundColor: colors.bgSecondary, borderColor: colors.border, color: colors.textPrimary }]} value={height} onChangeText={setHeight} keyboardType="decimal-pad" placeholderTextColor={colors.textMuted} placeholder="170" />

        <Text style={[styles.label, { color: colors.textSecondary }]}>Tuổi</Text>
        <TextInput style={[styles.input, { backgroundColor: colors.bgSecondary, borderColor: colors.border, color: colors.textPrimary }]} value={age} onChangeText={setAge} keyboardType="number-pad" placeholderTextColor={colors.textMuted} placeholder="25" />

        <Text style={[styles.label, { color: colors.textSecondary }]}>Mức độ hoạt động</Text>
        {(Object.keys(ACTIVITY_LABELS) as Activity[]).map((a) => (
          <TouchableOpacity
            key={a}
            style={[styles.actBtn, { backgroundColor: colors.bgSecondary, borderColor: colors.border }, activity === a && { backgroundColor: colors.primaryBg, borderColor: colors.primary }]}
            onPress={() => setActivity(a)}
          >
            <Text style={[styles.actText, { color: colors.textSecondary }, activity === a && { color: colors.primary }]}>
              {ACTIVITY_LABELS[a]}
            </Text>
          </TouchableOpacity>
        ))}

        <TouchableOpacity style={[styles.calcBtn, { backgroundColor: colors.primary }]} onPress={calculate}>
          <Text style={styles.calcBtnText}>Tính BMR & TDEE</Text>
        </TouchableOpacity>
      </View>

      {result && (
        <View style={[styles.resultCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
          <Text style={[styles.resultTitle, { color: colors.textPrimary }]}>Kết quả</Text>
          <View style={styles.resultRow}>
            <View style={styles.resultItem}>
              <Text style={[styles.resultVal, { color: "#f59e0b" }]}>{result.bmr}</Text>
              <Text style={[styles.resultLabel, { color: colors.textPrimary }]}>BMR (kcal/ngày)</Text>
              <Text style={[styles.resultSub, { color: colors.textMuted }]}>Năng lượng cơ bản</Text>
            </View>
            <View style={[styles.resultDivider, { backgroundColor: colors.border }]} />
            <View style={styles.resultItem}>
              <Text style={[styles.resultVal, { color: colors.success }]}>{result.tdee}</Text>
              <Text style={[styles.resultLabel, { color: colors.textPrimary }]}>TDEE (kcal/ngày)</Text>
              <Text style={[styles.resultSub, { color: colors.textMuted }]}>Duy trì cân nặng</Text>
            </View>
          </View>
          <View style={styles.goalCards}>
            <View style={[styles.goalCard, { backgroundColor: colors.bgSecondary, borderColor: colors.border }]}>
              <Text style={[styles.goalTitle, { color: colors.textSecondary }]}>Giảm cân</Text>
              <Text style={[styles.goalVal, { color: colors.success }]}>{result.tdee - 500} kcal</Text>
              <Text style={[styles.goalSub, { color: colors.textMuted }]}>Thâm hụt 500 kcal/ngày</Text>
            </View>
            <View style={[styles.goalCard, { backgroundColor: colors.bgSecondary, borderColor: colors.border }]}>
              <Text style={[styles.goalTitle, { color: colors.textSecondary }]}>Tăng cơ</Text>
              <Text style={[styles.goalVal, { color: colors.primary }]}>{result.tdee + 300} kcal</Text>
              <Text style={[styles.goalSub, { color: colors.textMuted }]}>Thặng dư 300 kcal/ngày</Text>
            </View>
          </View>
          <Text style={[styles.note, { color: colors.textMuted }]}>* Công thức Mifflin-St Jeor. Kết quả mang tính tham khảo.</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerRow: { flexDirection: "row", alignItems: "center", padding: Spacing.base, paddingBottom: 8, paddingTop: 52 },
  back: { width: 60 },
  backText: { fontSize: sf(14) },
  header: { flex: 1, fontSize: sf(18), fontWeight: "bold", textAlign: "center" },
  card: { margin: Spacing.base, borderRadius: Radius.lg, padding: Spacing.base, borderWidth: 1 },
  label: { fontSize: sf(12), marginBottom: 6, marginTop: 12 },
  input: { borderRadius: 10, borderWidth: 1, padding: 12, fontSize: sf(16) },
  segRow: { flexDirection: "row", gap: 8 },
  seg: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: "center", borderWidth: 1 },
  segText: { fontWeight: "600", fontSize: sf(14) },
  actBtn: { paddingVertical: 10, paddingHorizontal: 12, borderRadius: 10, marginBottom: 6, borderWidth: 1 },
  actText: { fontSize: sf(13) },
  calcBtn: { borderRadius: Radius.md, paddingVertical: 14, alignItems: "center", marginTop: 16 },
  calcBtnText: { color: "white", fontWeight: "bold", fontSize: sf(15) },
  resultCard: { margin: Spacing.base, marginTop: 0, borderRadius: Radius.lg, padding: 20, borderWidth: 1 },
  resultTitle: { fontSize: sf(16), fontWeight: "bold", marginBottom: 16, textAlign: "center" },
  resultRow: { flexDirection: "row", alignItems: "center" },
  resultItem: { flex: 1, alignItems: "center" },
  resultVal: { fontSize: sf(32), fontWeight: "bold" },
  resultLabel: { fontSize: sf(13), fontWeight: "600", marginTop: 4 },
  resultSub: { fontSize: sf(11), marginTop: 2 },
  resultDivider: { width: 1, height: 60 },
  goalCards: { flexDirection: "row", gap: 10, marginTop: 16 },
  goalCard: { flex: 1, borderRadius: Radius.md, padding: 12, alignItems: "center", borderWidth: 1 },
  goalTitle: { fontSize: sf(11), marginBottom: 4 },
  goalVal: { fontSize: sf(18), fontWeight: "bold" },
  goalSub: { fontSize: sf(10), marginTop: 2, textAlign: "center" },
  note: { fontSize: sf(11), marginTop: 16, textAlign: "center", lineHeight: 16 },
});
