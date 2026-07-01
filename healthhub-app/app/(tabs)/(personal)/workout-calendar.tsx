import React, { useState, useCallback } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { ChevronLeft, ChevronRight, Dumbbell, Flame, Clock } from "lucide-react-native";
import { useFocusEffect, useRouter } from "expo-router";
import axiosClient from "@/src/api/axiosClient";
import { useColors, Radius, Spacing, sf } from "@/src/theme";

const WEEKDAYS = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
const MONTHS_VI = [
  "Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6",
  "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12",
];

interface WorkoutLog {
  id: number; durationMin: number; kcal: number; startedAt: string;
  note?: string; workout?: { id: number; title: string; category: string };
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function getDaysInMonth(year: number, month: number) { return new Date(year, month + 1, 0).getDate(); }
function getFirstDayOfMonth(year: number, month: number) { return new Date(year, month, 1).getDay(); }

export default function WorkoutCalendarScreen() {
  const router = useRouter();
  const colors = useColors();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<WorkoutLog[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(now);

  useFocusEffect(useCallback(() => { loadLogs(); }, [year, month]));

  const loadLogs = async () => {
    try {
      setLoading(true);
      const res = await axiosClient.get("/fitness/logs").catch(() => ({ data: [] }));
      setLogs(res.data ?? []);
    } finally { setLoading(false); }
  };

  const prevMonth = () => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); };
  const nextMonth = () => { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); };

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const logsThisMonth = logs.filter((l) => { const d = new Date(l.startedAt); return d.getFullYear() === year && d.getMonth() === month; });
  const workoutDays = new Set(logsThisMonth.map((l) => new Date(l.startedAt).getDate()));
  const selectedDayLogs = selectedDate ? logs.filter((l) => isSameDay(new Date(l.startedAt), selectedDate)) : [];

  if (loading) return (
    <View style={[styles.centered, { backgroundColor: colors.bgSecondary }]}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.bgSecondary }]} showsVerticalScrollIndicator={false}>
      <Text style={[styles.title, { color: colors.textPrimary }]}>Lịch tập luyện</Text>

      <View style={styles.monthNav}>
        <TouchableOpacity style={[styles.navBtn, { backgroundColor: colors.bgCard, borderColor: colors.border }]} onPress={prevMonth}>
          <ChevronLeft size={20} color={colors.textSecondary} />
        </TouchableOpacity>
        <Text style={[styles.monthLabel, { color: colors.textPrimary }]}>{MONTHS_VI[month]} {year}</Text>
        <TouchableOpacity style={[styles.navBtn, { backgroundColor: colors.bgCard, borderColor: colors.border }]} onPress={nextMonth}>
          <ChevronRight size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <View style={[styles.calendarCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
        <View style={styles.weekRow}>
          {WEEKDAYS.map((d) => <Text key={d} style={[styles.weekDay, { color: colors.textMuted }]}>{d}</Text>)}
        </View>
        <View style={styles.daysGrid}>
          {Array.from({ length: firstDay }).map((_, i) => <View key={`empty-${i}`} style={styles.dayCell} />)}
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
                  isSelected && { backgroundColor: colors.primary },
                  isToday && !isSelected && { backgroundColor: colors.primaryBg },
                ]}
                onPress={() => setSelectedDate(date)}
              >
                <Text style={[
                  styles.dayText, { color: colors.textSecondary },
                  isSelected && { color: "white", fontWeight: "700" },
                  isToday && !isSelected && { color: colors.primary, fontWeight: "700" },
                ]}>
                  {day}
                </Text>
                {hasWorkout && <View style={[styles.dot, { backgroundColor: isSelected ? "white" : colors.primary }]} />}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <View style={styles.summaryRow}>
        <SummaryCard colors={colors} icon={<Dumbbell size={16} color={colors.primary} />} label="Buổi tập" value={logsThisMonth.length.toString()} color={colors.primary} />
        <SummaryCard colors={colors} icon={<Flame size={16} color="#f97316" />} label="Calories" value={logsThisMonth.reduce((s, l) => s + l.kcal, 0).toString()} color="#f97316" />
        <SummaryCard colors={colors} icon={<Clock size={16} color="#a855f7" />} label="Phút tập" value={logsThisMonth.reduce((s, l) => s + l.durationMin, 0).toString()} color="#a855f7" />
      </View>

      {selectedDate && (
        <>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            {selectedDate.toLocaleDateString("vi-VN", { weekday: "long", day: "numeric", month: "long" })}
          </Text>
          {selectedDayLogs.length === 0 ? (
            <View style={[styles.emptyDay, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
              <Text style={[styles.emptyDayText, { color: colors.textMuted }]}>Không có buổi tập nào hôm này</Text>
              <TouchableOpacity style={[styles.findWorkoutBtn, { backgroundColor: colors.primary }]} onPress={() => router.push("/(tabs)/(personal)/fitness" as any)}>
                <Text style={styles.findWorkoutText}>Tìm bài tập</Text>
              </TouchableOpacity>
            </View>
          ) : (
            selectedDayLogs.map((log) => (
              <View key={log.id} style={[styles.logCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
                <View style={styles.logTop}>
                  <Dumbbell size={16} color={colors.primary} />
                  <Text style={[styles.logWorkoutName, { color: colors.textPrimary }]}>{log.workout?.title ?? "Bài tập tự do"}</Text>
                </View>
                <View style={styles.logStats}>
                  <LogStat colors={colors} icon={<Clock size={13} color={colors.textMuted} />} value={`${log.durationMin} phút`} />
                  <LogStat colors={colors} icon={<Flame size={13} color="#f97316" />} value={`${log.kcal} kcal`} />
                </View>
                {log.note && <Text style={[styles.logNote, { color: colors.textMuted }]}>{log.note}</Text>}
              </View>
            ))
          )}
        </>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

function SummaryCard({ icon, label, value, color, colors }: { icon: React.ReactNode; label: string; value: string; color: string; colors: any }) {
  return (
    <View style={[styles.summaryCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
      {icon}
      <Text style={[styles.summaryValue, { color }]}>{value}</Text>
      <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>{label}</Text>
    </View>
  );
}

function LogStat({ icon, value, colors }: { icon: React.ReactNode; value: string; colors: any }) {
  return (
    <View style={styles.logStat}>
      {icon}
      <Text style={[styles.logStatText, { color: colors.textSecondary }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: Spacing.base },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  title: { fontSize: sf(24), fontWeight: "800", marginBottom: 20, paddingTop: 52 },
  monthNav: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 },
  navBtn: { padding: 8, borderRadius: Radius.md, borderWidth: 1 },
  monthLabel: { fontSize: sf(18), fontWeight: "700" },
  calendarCard: { borderRadius: Radius.xl, padding: 16, marginBottom: 20, borderWidth: 1 },
  weekRow: { flexDirection: "row", marginBottom: 8 },
  weekDay: { flex: 1, textAlign: "center", fontSize: sf(12), fontWeight: "600" },
  daysGrid: { flexDirection: "row", flexWrap: "wrap" },
  dayCell: { width: `${100 / 7}%` as any, aspectRatio: 1, alignItems: "center", justifyContent: "center", borderRadius: 10 },
  dayText: { fontSize: sf(14) },
  dot: { width: 5, height: 5, borderRadius: 3, marginTop: 2 },
  summaryRow: { flexDirection: "row", gap: 10, marginBottom: 20 },
  summaryCard: { flex: 1, borderRadius: Radius.lg, padding: 14, alignItems: "center", gap: 6, borderWidth: 1 },
  summaryValue: { fontSize: sf(20), fontWeight: "800" },
  summaryLabel: { fontSize: sf(11) },
  sectionTitle: { fontSize: sf(17), fontWeight: "700", marginBottom: 12 },
  emptyDay: { borderRadius: Radius.lg, padding: 24, alignItems: "center", gap: 12, borderWidth: 1 },
  emptyDayText: { fontSize: sf(14) },
  findWorkoutBtn: { borderRadius: Radius.md, paddingHorizontal: 20, paddingVertical: 10 },
  findWorkoutText: { color: "white", fontSize: sf(14), fontWeight: "700" },
  logCard: { borderRadius: Radius.lg, padding: 14, marginBottom: 10, borderWidth: 1 },
  logTop: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  logWorkoutName: { fontSize: sf(15), fontWeight: "700", flex: 1 },
  logStats: { flexDirection: "row", gap: 16 },
  logStat: { flexDirection: "row", alignItems: "center", gap: 4 },
  logStatText: { fontSize: sf(13) },
  logNote: { fontSize: sf(12), marginTop: 6 },
});
