import React, { useState, useRef, useCallback, useEffect } from "react";
import { View, Text, TextInput, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Image } from "react-native";
import { Search, X, Dumbbell, Users, FileText, ChevronRight } from "lucide-react-native";
import { useRouter } from "expo-router";
import axiosClient from "@/src/api/axiosClient";
import { useColors, Radius, Spacing, sf } from "@/src/theme";

type TabType = "workouts" | "users" | "posts";

interface Workout { id: number; title: string; category: string; level: string; kcalPerMin: number; }
interface UserResult { id: number; fullName: string; username?: string; avatarUrl?: string; level?: number; }
interface Post { _id: string; content: string; author?: { fullName: string; avatarUrl?: string }; createdAt: string; }

export default function SearchScreen() {
  const router = useRouter();
  const colors = useColors();
  const inputRef = useRef<TextInput>(null);
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<TabType>("workouts");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{ workouts: Workout[]; users: UserResult[]; posts: Post[] }>({ workouts: [], users: [], posts: [] });
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) { setResults({ workouts: [], users: [], posts: [] }); return; }
    try {
      setLoading(true);
      const [workoutsRes, usersRes, postsRes] = await Promise.all([
        axiosClient.get(`/fitness/workouts?q=${encodeURIComponent(q)}`).catch(() => ({ data: [] })),
        axiosClient.get(`/users/search?q=${encodeURIComponent(q)}`).catch(() => ({ data: [] })),
        axiosClient.get(`/community/posts?q=${encodeURIComponent(q)}&limit=10`).catch(() => ({ data: [] })),
      ]);
      setResults({
        workouts: Array.isArray(workoutsRes.data) ? workoutsRes.data : workoutsRes.data?.data ?? [],
        users: Array.isArray(usersRes.data) ? usersRes.data : [],
        posts: Array.isArray(postsRes.data) ? postsRes.data : postsRes.data?.data ?? [],
      });
    } finally { setLoading(false); }
  }, []);

  const handleQueryChange = (text: string) => {
    setQuery(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(text), 400);
  };

  useEffect(() => () => { if (debounceRef.current) clearTimeout(debounceRef.current); }, []);

  const clearSearch = () => { setQuery(""); setResults({ workouts: [], users: [], posts: [] }); inputRef.current?.focus(); };
  const totalResults = results.workouts.length + results.users.length + results.posts.length;

  return (
    <View style={[styles.container, { backgroundColor: colors.bgSecondary }]}>
      <View style={[styles.searchBar, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
        <Search size={18} color={colors.textMuted} />
        <TextInput
          ref={inputRef} style={[styles.input, { color: colors.textPrimary }]}
          placeholder="Tìm kiếm bài tập, người dùng, bài viết..."
          placeholderTextColor={colors.textMuted} value={query}
          onChangeText={handleQueryChange} autoFocus returnKeyType="search"
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={clearSearch}><X size={18} color={colors.textMuted} /></TouchableOpacity>
        )}
      </View>

      <View style={styles.tabs}>
        <TabBtn colors={colors} label="Bài tập" icon={<Dumbbell size={14} color={tab === "workouts" ? colors.primary : colors.textMuted} />} active={tab === "workouts"} count={results.workouts.length} onPress={() => setTab("workouts")} />
        <TabBtn colors={colors} label="Người dùng" icon={<Users size={14} color={tab === "users" ? colors.primary : colors.textMuted} />} active={tab === "users"} count={results.users.length} onPress={() => setTab("users")} />
        <TabBtn colors={colors} label="Bài viết" icon={<FileText size={14} color={tab === "posts" ? colors.primary : colors.textMuted} />} active={tab === "posts"} count={results.posts.length} onPress={() => setTab("posts")} />
      </View>

      {loading && (
        <View style={styles.loadingRow}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textMuted }]}>Đang tìm...</Text>
        </View>
      )}

      <ScrollView style={styles.results} showsVerticalScrollIndicator={false}>
        {!loading && query.length > 0 && totalResults === 0 && (
          <View style={styles.emptyState}>
            <Search size={40} color={colors.textMuted} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Không tìm thấy kết quả nào</Text>
            <Text style={[styles.emptySubText, { color: colors.textMuted }]}>Thử tìm với từ khóa khác</Text>
          </View>
        )}

        {!query && (
          <View style={styles.suggestions}>
            <Text style={[styles.suggestTitle, { color: colors.textMuted }]}>Gợi ý tìm kiếm</Text>
            {["Cardio", "Yoga", "Strength", "HIIT", "Pilates"].map((s) => (
              <TouchableOpacity key={s} style={[styles.suggestItem, { borderBottomColor: colors.border }]} onPress={() => handleQueryChange(s)}>
                <Search size={14} color={colors.textMuted} />
                <Text style={[styles.suggestText, { color: colors.textSecondary }]}>{s}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {tab === "workouts" && results.workouts.map((w) => (
          <TouchableOpacity key={w.id} style={[styles.resultItem, { backgroundColor: colors.bgCard, borderColor: colors.border }]} onPress={() => router.push(`/workout/${w.id}` as any)}>
            <View style={[styles.resultIcon, { backgroundColor: colors.bgSecondary }]}><Dumbbell size={20} color={colors.primary} /></View>
            <View style={styles.resultInfo}>
              <Text style={[styles.resultTitle, { color: colors.textPrimary }]}>{w.title}</Text>
              <Text style={[styles.resultSub, { color: colors.textMuted }]}>{w.category} · {w.level} · {w.kcalPerMin} kcal/min</Text>
            </View>
            <ChevronRight size={16} color={colors.textMuted} />
          </TouchableOpacity>
        ))}

        {tab === "users" && results.users.map((u) => (
          <TouchableOpacity key={u.id} style={[styles.resultItem, { backgroundColor: colors.bgCard, borderColor: colors.border }]} onPress={() => router.push(`/(tabs)/profile?userId=${u.id}` as any)}>
            <View style={styles.avatarContainer}>
              {u.avatarUrl ? (
                <Image source={{ uri: u.avatarUrl }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatarFallback, { backgroundColor: colors.border }]}>
                  <Text style={[styles.avatarInitial, { color: colors.textPrimary }]}>{u.fullName?.[0] ?? "?"}</Text>
                </View>
              )}
            </View>
            <View style={styles.resultInfo}>
              <Text style={[styles.resultTitle, { color: colors.textPrimary }]}>{u.fullName}</Text>
              <Text style={[styles.resultSub, { color: colors.textMuted }]}>{u.username ? `@${u.username}` : ""} {u.level ? `· Level ${u.level}` : ""}</Text>
            </View>
            <ChevronRight size={16} color={colors.textMuted} />
          </TouchableOpacity>
        ))}

        {tab === "posts" && results.posts.map((p) => (
          <TouchableOpacity key={p._id} style={[styles.resultItem, { backgroundColor: colors.bgCard, borderColor: colors.border }]} onPress={() => router.push(`/community/posts/${p._id}` as any)}>
            <View style={[styles.resultIcon, { backgroundColor: colors.bgSecondary }]}><FileText size={20} color="#a855f7" /></View>
            <View style={styles.resultInfo}>
              <Text style={[styles.resultTitle, { color: colors.textPrimary }]} numberOfLines={2}>{p.content}</Text>
              <Text style={[styles.resultSub, { color: colors.textMuted }]}>{p.author?.fullName ?? "Người dùng"} · {new Date(p.createdAt).toLocaleDateString("vi-VN")}</Text>
            </View>
          </TouchableOpacity>
        ))}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

function TabBtn({ label, icon, active, count, onPress, colors }: {
  label: string; icon: React.ReactNode; active: boolean; count: number; onPress: () => void; colors: any;
}) {
  return (
    <TouchableOpacity
      style={[styles.tab, { backgroundColor: colors.bgCard, borderColor: colors.border }, active && { backgroundColor: colors.primaryBg, borderColor: colors.primary }]}
      onPress={onPress}
    >
      {icon}
      <Text style={[styles.tabText, { color: colors.textMuted }, active && { color: colors.primary }]}>{label}</Text>
      {count > 0 && (
        <View style={[styles.countBadge, { backgroundColor: colors.primary }]}>
          <Text style={styles.countBadgeText}>{count}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: Spacing.base, paddingTop: 60 },
  searchBar: { flexDirection: "row", alignItems: "center", borderRadius: Radius.lg, paddingHorizontal: 14, paddingVertical: 12, gap: 10, marginBottom: 16, borderWidth: 1 },
  input: { flex: 1, fontSize: sf(15) },
  tabs: { flexDirection: "row", gap: 8, marginBottom: 16 },
  tab: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5, paddingVertical: 9, borderRadius: Radius.md, borderWidth: 1 },
  tabText: { fontSize: sf(12), fontWeight: "600" },
  countBadge: { borderRadius: 8, paddingHorizontal: 5, paddingVertical: 1 },
  countBadgeText: { color: "white", fontSize: sf(10), fontWeight: "700" },
  loadingRow: { flexDirection: "row", alignItems: "center", gap: 8, padding: 12 },
  loadingText: { fontSize: sf(13) },
  results: { flex: 1 },
  emptyState: { alignItems: "center", paddingTop: 60, gap: 10 },
  emptyText: { fontSize: sf(16), fontWeight: "600" },
  emptySubText: { fontSize: sf(13) },
  suggestions: { paddingTop: 8 },
  suggestTitle: { fontSize: sf(13), fontWeight: "600", marginBottom: 12 },
  suggestItem: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 12, borderBottomWidth: 1 },
  suggestText: { fontSize: sf(15) },
  resultItem: { flexDirection: "row", alignItems: "center", borderRadius: Radius.lg, padding: 14, marginBottom: 8, borderWidth: 1, gap: 12 },
  resultIcon: { width: 42, height: 42, borderRadius: Radius.md, justifyContent: "center", alignItems: "center" },
  resultInfo: { flex: 1 },
  resultTitle: { fontSize: sf(15), fontWeight: "600" },
  resultSub: { fontSize: sf(12), marginTop: 2 },
  avatarContainer: { width: 42, height: 42 },
  avatar: { width: 42, height: 42, borderRadius: 21 },
  avatarFallback: { width: 42, height: 42, borderRadius: 21, justifyContent: "center", alignItems: "center" },
  avatarInitial: { fontSize: sf(18), fontWeight: "700" },
});
