import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  StatusBar,
} from "react-native";
import { Flame, Dumbbell, ArrowLeft, Search, X, ChevronRight, Clock } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import fitnessApi from "@/src/api/fitnessApi";
import { Workout } from "@/src/types/workout";
import { useRouter } from "expo-router";
import { useColors, Colors, Spacing, Radius, Typography } from "@/src/theme";
import EmptyState from "@/components/ui/EmptyState";

const LEVELS = ["Beginner", "Intermediate", "Advanced"];
const CATEGORIES = [
  { label: "Tất cả",    value: "All" },
  { label: "Full Body", value: "full_body" },
  { label: "Upper",     value: "upper_body" },
  { label: "Lower",     value: "lower_body" },
  { label: "Core",      value: "core" },
];

const CATEGORY_COLORS: Record<string, { bg: string; fg: string }> = {
  full_body:  { bg: Colors.orangeBg,  fg: Colors.orange },
  upper_body: { bg: Colors.primaryBg, fg: Colors.primary },
  lower_body: { bg: Colors.dangerBg,  fg: Colors.danger },
  core:       { bg: Colors.tealBg,    fg: Colors.teal },
  All:        { bg: Colors.primaryBg, fg: Colors.primary },
};

const LEVEL_COLORS: Record<string, { bg: string; fg: string }> = {
  Beginner:     { bg: Colors.successBg, fg: Colors.success },
  Intermediate: { bg: Colors.warningBg, fg: Colors.warning },
  Advanced:     { bg: Colors.dangerBg,  fg: Colors.danger },
};

export default function ExerciseListScreen() {
  const router = useRouter();
  const colors = useColors();

  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All"); // "All" | "full_body" | "upper_body" | "lower_body" | "core"
  const [level, setLevel] = useState("");

  const debounceRef = useRef<any>(null);

  const load = async (params?: { search?: string; level?: string }) => {
    setLoading(true);
    try {
      const res = await fitnessApi.getWorkouts({
        search: params?.search || undefined,
        muscleGroup: category !== "All" ? category : undefined,
        level: params?.level || level || undefined,
      });
      setWorkouts(res.data);
    } catch {
      // keep stale
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => load({ search, level }), 350);
    return () => clearTimeout(debounceRef.current);
  }, [search, category, level]);

  useEffect(() => { load(); }, []);

  const filteredLevel = (lv: string) => {
    setLevel(level === lv ? "" : lv);
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.bgSecondary }]}>
      <StatusBar barStyle="light-content" />

      {/* HEADER */}
      <LinearGradient colors={["#1e3a5f", colors.bgSecondary]} style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={22} color="white" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>Khám phá bài tập</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>{workouts.length} bài tập</Text>
        </View>
      </LinearGradient>

      {/* SEARCH BAR */}
      <View style={styles.searchRow}>
        <View style={[styles.searchBox, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
          <Search size={16} color={colors.textMuted} />
          <TextInput
            placeholder="Tìm tên bài tập..."
            placeholderTextColor={colors.textMuted}
            style={[styles.searchInput, { color: colors.textPrimary }]}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch("")}>
              <X size={16} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* CATEGORY SCROLL */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.chipScroll}
        contentContainerStyle={styles.chipContent}
      >
        {CATEGORIES.map((c) => {
          const active = category === c.value;
          const col = CATEGORY_COLORS[c.value] ?? CATEGORY_COLORS.All;
          return (
            <TouchableOpacity
              key={c.value}
              onPress={() => setCategory(c.value)}
              style={[
                styles.chip,
                active ? { backgroundColor: col.fg, borderColor: col.fg } : { borderColor: colors.border },
              ]}
            >
              <Text style={[styles.chipText, { color: active ? "white" : colors.textSecondary }]}>{c.label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* LEVEL CHIPS */}
      <View style={styles.levelRow}>
        {LEVELS.map((lv) => {
          const active = level === lv;
          const col = LEVEL_COLORS[lv];
          return (
            <TouchableOpacity
              key={lv}
              onPress={() => filteredLevel(lv)}
              style={[
                styles.levelChip,
                { borderColor: active ? col.fg : colors.border, backgroundColor: active ? col.bg : "transparent" },
              ]}
            >
              <Text style={[styles.levelChipText, { color: active ? col.fg : colors.textMuted }]}>{lv}</Text>
            </TouchableOpacity>
          );
        })}
        {(level || search || category !== "All") && (
          <TouchableOpacity
            onPress={() => { setLevel(""); setSearch(""); setCategory("All"); }}
            style={[styles.resetBtn, { borderColor: colors.border }]}
          >
            <X size={12} color={colors.textMuted} />
            <Text style={[styles.resetText, { color: colors.textMuted }]}>Xoá bộ lọc</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* LIST */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        style={{ flex: 1 }}
        contentContainerStyle={styles.listContent}
      >
        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator color={colors.primary} size="large" />
          </View>
        ) : workouts.length === 0 ? (
          <EmptyState
            emoji="🔍"
            title="Không tìm thấy bài tập"
            subtitle="Thử thay đổi bộ lọc hoặc từ khoá tìm kiếm"
            actionLabel="Xoá bộ lọc"
            onAction={() => { setLevel(""); setSearch(""); setCategory("All"); }}
          />
        ) : (
          workouts.map((w) => {
            const lvCol = LEVEL_COLORS[w.level] ?? LEVEL_COLORS.Beginner;
            const catCol = CATEGORY_COLORS[w.muscleGroup ?? ""] ?? CATEGORY_COLORS.Strength;
            return (
              <TouchableOpacity
                key={w.id}
                style={[styles.card, { backgroundColor: colors.bgCard, borderColor: colors.border }]}
                onPress={() => router.push({ pathname: "/workout/[id]", params: { id: w.id } })}
                activeOpacity={0.75}
              >
                {/* Left icon */}
                <LinearGradient
                  colors={[catCol.fg + "33", catCol.fg + "11"]}
                  style={styles.cardIcon}
                >
                  <Dumbbell size={22} color={catCol.fg} />
                </LinearGradient>

                {/* Info */}
                <View style={{ flex: 1 }}>
                  <Text style={[styles.cardTitle, { color: colors.textPrimary }]} numberOfLines={1}>{w.title}</Text>
                  <View style={styles.cardMeta}>
                    <Text style={[styles.metaBadge, { color: lvCol.fg, backgroundColor: lvCol.bg }]}>{w.level}</Text>
                    <Text style={[styles.metaDot, { color: colors.textMuted }]}>{w.muscleGroup}</Text>
                  </View>
                  <View style={styles.cardStats}>
                    <Flame size={12} color={colors.orange} />
                    <Text style={[styles.statText, { color: colors.textMuted }]}>{w.kcalPerMin} kcal/min</Text>
                    {w.exercises?.length > 0 && (
                      <>
                        <Clock size={12} color={colors.textMuted} />
                        <Text style={[styles.statText, { color: colors.textMuted }]}>{w.exercises.length} bài</Text>
                      </>
                    )}
                  </View>
                </View>

                <ChevronRight size={18} color={colors.textMuted} />
              </TouchableOpacity>
            );
          })
        )}
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 52,
    paddingBottom: Spacing.lg,
    paddingHorizontal: Spacing.base,
    gap: Spacing.md,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: Radius.md,
    backgroundColor: "rgba(255,255,255,0.1)",
    justifyContent: "center", alignItems: "center",
  },
  title: { ...Typography.xxl, fontWeight: "800" },
  subtitle: { ...Typography.sm, marginTop: 2 },

  searchRow: { paddingHorizontal: Spacing.base, paddingVertical: Spacing.sm },
  searchBox: {
    flexDirection: "row", alignItems: "center", gap: Spacing.sm,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    borderWidth: 1,
  },
  searchInput: { flex: 1, ...Typography.base },

  chipScroll: { flexGrow: 0 },
  chipContent: { paddingHorizontal: Spacing.base, gap: Spacing.sm },
  chip: {
    paddingHorizontal: Spacing.md, paddingVertical: 7,
    borderRadius: Radius.full, borderWidth: 1,
  },
  chipText: { ...Typography.sm, fontWeight: "600" },

  levelRow: {
    flexDirection: "row", flexWrap: "wrap", gap: Spacing.sm,
    paddingHorizontal: Spacing.base, paddingVertical: Spacing.sm,
  },
  levelChip: {
    paddingHorizontal: Spacing.md, paddingVertical: 6,
    borderRadius: Radius.full, borderWidth: 1,
  },
  levelChipText: { ...Typography.sm, fontWeight: "600" },
  resetBtn: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: Spacing.md, paddingVertical: 6,
    borderRadius: Radius.full, borderWidth: 1,
  },
  resetText: { ...Typography.sm },

  loadingBox: { paddingTop: 60, alignItems: "center" },
  listContent: { paddingHorizontal: Spacing.base, paddingTop: Spacing.sm },

  card: {
    flexDirection: "row", alignItems: "center", gap: Spacing.md,
    borderRadius: Radius.xl, borderWidth: 1,
    padding: Spacing.md, marginBottom: Spacing.sm,
  },
  cardIcon: {
    width: 52, height: 52, borderRadius: Radius.lg,
    justifyContent: "center", alignItems: "center",
  },
  cardTitle: { ...Typography.md, fontWeight: "700" },
  cardMeta: { flexDirection: "row", alignItems: "center", gap: Spacing.sm, marginTop: 4 },
  metaBadge: {
    ...Typography.xs, fontWeight: "700",
    paddingHorizontal: 8, paddingVertical: 2, borderRadius: Radius.full,
  },
  metaDot: { ...Typography.sm },
  cardStats: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 5 },
  statText: { ...Typography.xs },
});
