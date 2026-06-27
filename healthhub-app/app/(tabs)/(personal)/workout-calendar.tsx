import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { ChevronLeft, ChevronRight, Dumbbell, Flame, Clock } from "lucide-react-native";
import { useFocusEffect, useRouter } from "expo-router";
import axiosClient from "@/src/api/axiosClient";

const WEEKDAYS = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
const MONTHS_VI = [
  "Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6",
  "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12",
];

interface WorkoutLog {
  id: number;
  durationMin: number;
  kcal: number;
  startedAt: string;
  note?: string;
  workout?: { id: number; title: string; category: string };
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

export default function WorkoutCalendarScreen() {
  const router = useRouter();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<WorkoutLog[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(now);

  useFocusEffect(
    useCallback(() => {
      loadLogs();
    }, [year, month])
  );

  const loadLogs = async () => {
    try {
      setLoading(true);
      const res = await axiosClient.get("/fitness/logs").catch(() => ({ data: [] }));
      setLogs(res.data ?? []);
    } finally {
      setLoading(false);
    }
  };

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  };

  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  };

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const logsThisMonth = logs.filter((l) => {
    const d = new Date(l.startedAt);
    return d.getFullYear() === year && d.getMonth() === month;
  });

  const workoutDays = new Set(logsThisMonth.map((l) => new Date(l.startedAt).getDate()));

  const selectedDayLogs = selectedDate
    ? logs.filter((l) => isSameDay(new Date(l.startedAt), selectedDate))
    : [];

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
      <Text style={styles.title}>Lịch tập luyện</Text>

      {/* Month navigation */}
      <View style={styles.monthNav}>
        <TouchableOpacity style={styles.navBtn} onPress={prevMonth}>
          <ChevronLeft size={20} color="#94a3b8" />
        </TouchableOpacity>
        <Text style={styles.monthLabel}>{MONTHS_VI[month]} {year}</Text>
        <TouchableOpacity style={styles.navBtn} onPress={nextMonth}>
          <ChevronRight size={20} color="#94a3b8" />
        </TouchableOpacity>
      </View>

      {/* Calendar grid */}
      <View style={styles.calendarCard}>
        {/* Weekday headers */}
        <View style={styles.weekRow}>
          {WEEKDAYS.map((d) => (
            <Text key={d} style={styles.weekDay}>{d}</Text>
          ))}
        </View>

        {/* Days grid */}
        <View style={styles.daysGrid}>
          {/* Empty cells before first day */}
          {Array.from({ length: firstDay }).map((_, i) => (
            <View key={`empty-${i}`} style={styles.dayCell} />
          ))}

          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const hasWorkout = workoutDays.has(day);
            const date = new Date(year, month, day);
            const isSelected = selectedDate ? isSameDay(date, selectedDate) : false;
            const isToday = isSameDay(date, now);

            return (
              <TouchableOpacity
                key={day}
                style={[
                  styles.dayCell,
                  isSelected && styles.dayCellSelected,
                  isToday && !isSelected && styles.dayCellToday,
                ]}
                onPress={() => setSelectedDate(date)}
              >
                <Text style={[
                  styles.dayText,
                  isSelected && styles.dayTextSelected,
                  isToday && !isSelected && styles.dayTextToday,
                ]}>
                  {day}
                </Text>
                {hasWorkout && <View style={[styles.dot, isSelected && styles.dotSelected]} />}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Month summary */}
      <View style={styles.summaryRow}>
        <SummaryCard
          icon={<Dumbbell size={16} color="#3b82f6" />}
          label="Buổi tập"
          value={logsThisMonth.length.toString()}
          color="#3b82f6"
        />
        <SummaryCard
          icon={<Flame size={16} color="#f97316" />}
          label="Calories"
          value={logsThisMonth.reduce((s, l) => s + l.kcal, 0).toString()}
          color="#f97316"
        />
        <SummaryCard
          icon={<Clock size={16} color="#a855f7" />}
          label="Phút tập"
          value={logsThisMonth.reduce((s, l) => s + l.durationMin, 0).toString()}
          color="#a855f7"
        />
      </View>

      {/* Selected day logs */}
      {selectedDate && (
        <>
          <Text style={styles.sectionTitle}>
            {selectedDate.toLocaleDateString("vi-VN", { weekday: "long", day: "numeric", month: "long" })}
          </Text>

          {selectedDayLogs.length === 0 ? (
            <View style={styles.emptyDay}>
              <Text style={styles.emptyDayText}>Không có buổi tập nào hôm này</Text>
              <TouchableOpacity
                style={styles.findWorkoutBtn}
                onPress={() => router.push("/(tabs)/(personal)/fitness" as any)}
              >
                <Text style={styles.findWorkoutText}>Tìm bài tập</Text>
              </TouchableOpacity>
            </View>
          ) : (
            selectedDayLogs.map((log) => (
              <View key={log.id} style={styles.logCard}>
                <View style={styles.logTop}>
                  <Dumbbell size={16} color="#3b82f6" />
                  <Text style={styles.logWorkoutName}>
                    {log.workout?.title ?? "Bài tập tự do"}
                  </Text>
                </View>
                <View style={styles.logStats}>
                  <LogStat icon={<Clock size={13} color="#94a3b8" />} value={`${log.durationMin} phút`} />
                  <LogStat icon={<Flame size={13} color="#f97316" />} value={`${log.kcal} kcal`} />
                </View>
                {log.note && <Text style={styles.logNote}>{log.note}</Text>}
              </View>
            ))
          )}
        </>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

function SummaryCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  return (
    <View style={styles.summaryCard}>
      {icon}
      <Text style={[styles.summaryValue, { color }]}>{value}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
  );
}

function LogStat({ icon, value }: { icon: React.ReactNode; value: string }) {
  return (
    <View style={styles.logStat}>
      {icon}
      <Text style={styles.logStatText}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f172a", padding: 16 },
  centered: { flex: 1, backgroundColor: "#0f172a", justifyContent: "center", alignItems: "center" },

  title: { color: "white", fontSize: 24, fontWeight: "800", marginBottom: 20 },

  monthNav: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 },
  navBtn: { padding: 8, backgroundColor: "#1e293b", borderRadius: 12, borderWidth: 1, borderColor: "#334155" },
  monthLabel: { color: "white", fontSize: 18, fontWeight: "700" },

  calendarCard: { backgroundColor: "#1e293b", borderRadius: 20, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: "#334155" },
  weekRow: { flexDirection: "row", marginBottom: 8 },
  weekDay: { flex: 1, textAlign: "center", color: "#64748b", fontSize: 12, fontWeight: "600" },

  daysGrid: { flexDirection: "row", flexWrap: "wrap" },
  dayCell: { width: `${100 / 7}%`, aspectRatio: 1, alignItems: "center", justifyContent: "center", borderRadius: 10 },
  dayCellSelected: { backgroundColor: "#3b82f6" },
  dayCellToday: { backgroundColor: "#1e3a5f" },
  dayText: { color: "#94a3b8", fontSize: 14 },
  dayTextSelected: { color: "white", fontWeight: "700" },
  dayTextToday: { color: "#60a5fa", fontWeight: "700" },
  dot: { width: 5, height: 5, borderRadius: 3, backgroundColor: "#3b82f6", marginTop: 2 },
  dotSelected: { backgroundColor: "white" },

  summaryRow: { flexDirection: "row", gap: 10, marginBottom: 20 },
  summaryCard: { flex: 1, backgroundColor: "#1e293b", borderRadius: 16, padding: 14, alignItems: "center", gap: 6, borderWidth: 1, borderColor: "#334155" },
  summaryValue: { fontSize: 20, fontWeight: "800" },
  summaryLabel: { color: "#64748b", fontSize: 11 },

  sectionTitle: { color: "white", fontSize: 17, fontWeight: "700", marginBottom: 12 },

  emptyDay: { backgroundColor: "#1e293b", borderRadius: 16, padding: 24, alignItems: "center", gap: 12, borderWidth: 1, borderColor: "#334155" },
  emptyDayText: { color: "#64748b", fontSize: 14 },
  findWorkoutBtn: { backgroundColor: "#3b82f6", borderRadius: 12, paddingHorizontal: 20, paddingVertical: 10 },
  findWorkoutText: { color: "white", fontSize: 14, fontWeight: "700" },

  logCard: { backgroundColor: "#1e293b", borderRadius: 16, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: "#334155" },
  logTop: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  logWorkoutName: { color: "white", fontSize: 15, fontWeight: "700", flex: 1 },
  logStats: { flexDirection: "row", gap: 16 },
  logStat: { flexDirection: "row", alignItems: "center", gap: 4 },
  logStatText: { color: "#94a3b8", fontSize: 13 },
  logNote: { color: "#64748b", fontSize: 12, marginTop: 6 },
});
