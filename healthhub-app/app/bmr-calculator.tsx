import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
} from "react-native";
import { useRouter } from "expo-router";

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
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

function calculateBMR(sex: Sex, weight: number, height: number, age: number) {
  if (sex === "male") {
    return 10 * weight + 6.25 * height - 5 * age + 5;
  }
  return 10 * weight + 6.25 * height - 5 * age - 161;
}

export default function BMRCalculatorScreen() {
  const router = useRouter();
  const [sex, setSex] = useState<Sex>("male");
  const [weight, setWeight] = useState("70");
  const [height, setHeight] = useState("170");
  const [age, setAge] = useState("25");
  const [activity, setActivity] = useState<Activity>("moderate");
  const [result, setResult] = useState<{ bmr: number; tdee: number } | null>(null);

  const calculate = () => {
    const w = parseFloat(weight);
    const h = parseFloat(height);
    const a = parseInt(age);
    if (!w || !h || !a) return;
    const bmr = calculateBMR(sex, w, h, a);
    const tdee = bmr * ACTIVITY_FACTORS[activity];
    setResult({ bmr: Math.round(bmr), tdee: Math.round(tdee) });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.header}>BMR / TDEE Calculator</Text>
        <View style={{ width: 60 }} />
      </View>

      <View style={styles.card}>
        {/* Sex */}
        <Text style={styles.label}>Giới tính</Text>
        <View style={styles.segRow}>
          {(["male", "female"] as Sex[]).map((s) => (
            <TouchableOpacity
              key={s}
              style={[styles.seg, sex === s && styles.segActive]}
              onPress={() => setSex(s)}
            >
              <Text style={[styles.segText, sex === s && styles.segTextActive]}>
                {s === "male" ? "Nam" : "Nữ"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Weight */}
        <Text style={styles.label}>Cân nặng (kg)</Text>
        <TextInput
          style={styles.input}
          value={weight}
          onChangeText={setWeight}
          keyboardType="decimal-pad"
          placeholderTextColor="#64748b"
          placeholder="70"
        />

        {/* Height */}
        <Text style={styles.label}>Chiều cao (cm)</Text>
        <TextInput
          style={styles.input}
          value={height}
          onChangeText={setHeight}
          keyboardType="decimal-pad"
          placeholderTextColor="#64748b"
          placeholder="170"
        />

        {/* Age */}
        <Text style={styles.label}>Tuổi</Text>
        <TextInput
          style={styles.input}
          value={age}
          onChangeText={setAge}
          keyboardType="number-pad"
          placeholderTextColor="#64748b"
          placeholder="25"
        />

        {/* Activity */}
        <Text style={styles.label}>Mức độ hoạt động</Text>
        {(Object.keys(ACTIVITY_LABELS) as Activity[]).map((a) => (
          <TouchableOpacity
            key={a}
            style={[styles.actBtn, activity === a && styles.actBtnActive]}
            onPress={() => setActivity(a)}
          >
            <Text style={[styles.actText, activity === a && styles.actTextActive]}>
              {ACTIVITY_LABELS[a]}
            </Text>
          </TouchableOpacity>
        ))}

        <TouchableOpacity style={styles.calcBtn} onPress={calculate}>
          <Text style={styles.calcBtnText}>Tính BMR & TDEE</Text>
        </TouchableOpacity>
      </View>

      {result && (
        <View style={styles.resultCard}>
          <Text style={styles.resultTitle}>Kết quả</Text>

          <View style={styles.resultRow}>
            <View style={styles.resultItem}>
              <Text style={styles.resultVal}>{result.bmr}</Text>
              <Text style={styles.resultLabel}>BMR (kcal/ngày)</Text>
              <Text style={styles.resultSub}>Năng lượng cơ bản</Text>
            </View>
            <View style={styles.resultDivider} />
            <View style={styles.resultItem}>
              <Text style={[styles.resultVal, { color: "#22c55e" }]}>{result.tdee}</Text>
              <Text style={styles.resultLabel}>TDEE (kcal/ngày)</Text>
              <Text style={styles.resultSub}>Duy trì cân nặng</Text>
            </View>
          </View>

          <View style={styles.goalCards}>
            <View style={styles.goalCard}>
              <Text style={styles.goalTitle}>Giảm cân</Text>
              <Text style={styles.goalVal}>{result.tdee - 500} kcal</Text>
              <Text style={styles.goalSub}>Thâm hụt 500 kcal/ngày</Text>
            </View>
            <View style={styles.goalCard}>
              <Text style={styles.goalTitle}>Tăng cơ</Text>
              <Text style={[styles.goalVal, { color: "#3b82f6" }]}>{result.tdee + 300} kcal</Text>
              <Text style={styles.goalSub}>Thặng dư 300 kcal/ngày</Text>
            </View>
          </View>

          <Text style={styles.note}>
            * Công thức Mifflin-St Jeor. Kết quả mang tính tham khảo.
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0A0F1F" },
  headerRow: { flexDirection: "row", alignItems: "center", padding: 16, paddingBottom: 8 },
  back: { width: 60 },
  backText: { color: "#94a3b8", fontSize: 14 },
  header: { flex: 1, color: "white", fontSize: 18, fontWeight: "bold", textAlign: "center" },

  card: {
    margin: 16, backgroundColor: "#1e293b", borderRadius: 16,
    padding: 16, borderWidth: 1, borderColor: "#334155",
  },
  label: { color: "#94a3b8", fontSize: 12, marginBottom: 6, marginTop: 12 },
  input: {
    backgroundColor: "#0f172a", borderRadius: 10, borderWidth: 1, borderColor: "#334155",
    color: "white", padding: 12, fontSize: 16,
  },
  segRow: { flexDirection: "row", gap: 8 },
  seg: {
    flex: 1, paddingVertical: 10, borderRadius: 10,
    backgroundColor: "#0f172a", alignItems: "center",
    borderWidth: 1, borderColor: "#334155",
  },
  segActive: { backgroundColor: "#2563eb", borderColor: "#2563eb" },
  segText: { color: "#94a3b8", fontWeight: "600" },
  segTextActive: { color: "white" },

  actBtn: {
    paddingVertical: 10, paddingHorizontal: 12, borderRadius: 10,
    backgroundColor: "#0f172a", marginBottom: 6,
    borderWidth: 1, borderColor: "#334155",
  },
  actBtnActive: { backgroundColor: "#1d4ed8", borderColor: "#3b82f6" },
  actText: { color: "#94a3b8", fontSize: 13 },
  actTextActive: { color: "white" },

  calcBtn: {
    backgroundColor: "#2563eb", borderRadius: 12, paddingVertical: 14,
    alignItems: "center", marginTop: 16,
  },
  calcBtnText: { color: "white", fontWeight: "bold", fontSize: 15 },

  resultCard: {
    margin: 16, marginTop: 0, backgroundColor: "#1e293b", borderRadius: 16,
    padding: 20, borderWidth: 1, borderColor: "#334155",
  },
  resultTitle: { color: "white", fontSize: 16, fontWeight: "bold", marginBottom: 16, textAlign: "center" },
  resultRow: { flexDirection: "row", alignItems: "center" },
  resultItem: { flex: 1, alignItems: "center" },
  resultVal: { color: "#f59e0b", fontSize: 32, fontWeight: "bold" },
  resultLabel: { color: "white", fontSize: 13, fontWeight: "600", marginTop: 4 },
  resultSub: { color: "#64748b", fontSize: 11, marginTop: 2 },
  resultDivider: { width: 1, height: 60, backgroundColor: "#334155" },

  goalCards: { flexDirection: "row", gap: 10, marginTop: 16 },
  goalCard: {
    flex: 1, backgroundColor: "#0f172a", borderRadius: 12, padding: 12,
    alignItems: "center", borderWidth: 1, borderColor: "#334155",
  },
  goalTitle: { color: "#94a3b8", fontSize: 11, marginBottom: 4 },
  goalVal: { color: "#22c55e", fontSize: 18, fontWeight: "bold" },
  goalSub: { color: "#64748b", fontSize: 10, marginTop: 2, textAlign: "center" },

  note: { color: "#475569", fontSize: 11, marginTop: 16, textAlign: "center", lineHeight: 16 },
});
