import React, { useState, useRef, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
} from "react-native";
import { Search, X, Dumbbell, Users, FileText, ChevronRight } from "lucide-react-native";
import { useRouter } from "expo-router";
import axiosClient from "@/src/api/axiosClient";

type TabType = "workouts" | "users" | "posts";

interface Workout {
  id: number;
  title: string;
  category: string;
  level: string;
  kcalPerMin: number;
}

interface UserResult {
  id: number;
  fullName: string;
  username?: string;
  avatarUrl?: string;
  level?: number;
}

interface Post {
  _id: string;
  content: string;
  author?: { fullName: string; avatarUrl?: string };
  createdAt: string;
}

export default function SearchScreen() {
  const router = useRouter();
  const inputRef = useRef<TextInput>(null);
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<TabType>("workouts");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{
    workouts: Workout[];
    users: UserResult[];
    posts: Post[];
  }>({ workouts: [], users: [], posts: [] });

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const doSearch = useCallback(
    async (q: string) => {
      if (!q.trim()) {
        setResults({ workouts: [], users: [], posts: [] });
        return;
      }
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
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const handleQueryChange = (text: string) => {
    setQuery(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(text), 400);
  };

  const clearSearch = () => {
    setQuery("");
    setResults({ workouts: [], users: [], posts: [] });
    inputRef.current?.focus();
  };

  const totalResults =
    results.workouts.length + results.users.length + results.posts.length;

  return (
    <View style={styles.container}>
      {/* Search bar */}
      <View style={styles.searchBar}>
        <Search size={18} color="#64748b" />
        <TextInput
          ref={inputRef}
          style={styles.input}
          placeholder="Tìm kiếm bài tập, người dùng, bài viết..."
          placeholderTextColor="#475569"
          value={query}
          onChangeText={handleQueryChange}
          autoFocus
          returnKeyType="search"
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={clearSearch}>
            <X size={18} color="#64748b" />
          </TouchableOpacity>
        )}
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TabBtn label="Bài tập" icon={<Dumbbell size={14} color={tab === "workouts" ? "#3b82f6" : "#64748b"} />} active={tab === "workouts"} count={results.workouts.length} onPress={() => setTab("workouts")} />
        <TabBtn label="Người dùng" icon={<Users size={14} color={tab === "users" ? "#3b82f6" : "#64748b"} />} active={tab === "users"} count={results.users.length} onPress={() => setTab("users")} />
        <TabBtn label="Bài viết" icon={<FileText size={14} color={tab === "posts" ? "#3b82f6" : "#64748b"} />} active={tab === "posts"} count={results.posts.length} onPress={() => setTab("posts")} />
      </View>

      {loading && (
        <View style={styles.loadingRow}>
          <ActivityIndicator size="small" color="#3b82f6" />
          <Text style={styles.loadingText}>Đang tìm...</Text>
        </View>
      )}

      <ScrollView style={styles.results} showsVerticalScrollIndicator={false}>
        {/* Empty state */}
        {!loading && query.length > 0 && totalResults === 0 && (
          <View style={styles.emptyState}>
            <Search size={40} color="#475569" />
            <Text style={styles.emptyText}>Không tìm thấy kết quả nào</Text>
            <Text style={styles.emptySubText}>Thử tìm với từ khóa khác</Text>
          </View>
        )}

        {/* Default suggestion */}
        {!query && (
          <View style={styles.suggestions}>
            <Text style={styles.suggestTitle}>Gợi ý tìm kiếm</Text>
            {["Cardio", "Yoga", "Strength", "HIIT", "Pilates"].map((s) => (
              <TouchableOpacity key={s} style={styles.suggestItem} onPress={() => handleQueryChange(s)}>
                <Search size={14} color="#475569" />
                <Text style={styles.suggestText}>{s}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Workouts tab */}
        {tab === "workouts" &&
          results.workouts.map((w) => (
            <TouchableOpacity
              key={w.id}
              style={styles.resultItem}
              onPress={() => router.push(`/workout/${w.id}` as any)}
            >
              <View style={styles.resultIcon}>
                <Dumbbell size={20} color="#3b82f6" />
              </View>
              <View style={styles.resultInfo}>
                <Text style={styles.resultTitle}>{w.title}</Text>
                <Text style={styles.resultSub}>{w.category} · {w.level} · {w.kcalPerMin} kcal/min</Text>
              </View>
              <ChevronRight size={16} color="#475569" />
            </TouchableOpacity>
          ))}

        {/* Users tab */}
        {tab === "users" &&
          results.users.map((u) => (
            <TouchableOpacity
              key={u.id}
              style={styles.resultItem}
            >
              <View style={styles.avatarContainer}>
                {u.avatarUrl ? (
                  <Image source={{ uri: u.avatarUrl }} style={styles.avatar} />
                ) : (
                  <View style={styles.avatarFallback}>
                    <Text style={styles.avatarInitial}>{u.fullName?.[0] ?? "?"}</Text>
                  </View>
                )}
              </View>
              <View style={styles.resultInfo}>
                <Text style={styles.resultTitle}>{u.fullName}</Text>
                <Text style={styles.resultSub}>
                  {u.username ? `@${u.username}` : ""} {u.level ? `· Level ${u.level}` : ""}
                </Text>
              </View>
              <ChevronRight size={16} color="#475569" />
            </TouchableOpacity>
          ))}

        {/* Posts tab */}
        {tab === "posts" &&
          results.posts.map((p) => (
            <TouchableOpacity
              key={p._id}
              style={styles.resultItem}
              onPress={() => router.push(`/community/posts/${p._id}` as any)}
            >
              <View style={styles.resultIcon}>
                <FileText size={20} color="#a855f7" />
              </View>
              <View style={styles.resultInfo}>
                <Text style={styles.resultTitle} numberOfLines={2}>{p.content}</Text>
                <Text style={styles.resultSub}>
                  {p.author?.fullName ?? "Người dùng"} · {new Date(p.createdAt).toLocaleDateString("vi-VN")}
                </Text>
              </View>
            </TouchableOpacity>
          ))}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

function TabBtn({
  label,
  icon,
  active,
  count,
  onPress,
}: {
  label: string;
  icon: React.ReactNode;
  active: boolean;
  count: number;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.tab, active && styles.tabActive]}
      onPress={onPress}
    >
      {icon}
      <Text style={[styles.tabText, active && styles.tabTextActive]}>{label}</Text>
      {count > 0 && (
        <View style={styles.countBadge}>
          <Text style={styles.countBadgeText}>{count}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f172a", padding: 16, paddingTop: 60 },

  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1e293b",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#334155",
  },
  input: { flex: 1, color: "white", fontSize: 15 },

  tabs: { flexDirection: "row", gap: 8, marginBottom: 16 },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingVertical: 9,
    borderRadius: 12,
    backgroundColor: "#1e293b",
    borderWidth: 1,
    borderColor: "#334155",
  },
  tabActive: { backgroundColor: "#1e3a5f", borderColor: "#3b82f6" },
  tabText: { color: "#64748b", fontSize: 12, fontWeight: "600" },
  tabTextActive: { color: "#3b82f6" },
  countBadge: { backgroundColor: "#3b82f6", borderRadius: 8, paddingHorizontal: 5, paddingVertical: 1 },
  countBadgeText: { color: "white", fontSize: 10, fontWeight: "700" },

  loadingRow: { flexDirection: "row", alignItems: "center", gap: 8, padding: 12 },
  loadingText: { color: "#64748b", fontSize: 13 },

  results: { flex: 1 },

  emptyState: { alignItems: "center", paddingTop: 60, gap: 10 },
  emptyText: { color: "#cbd5e1", fontSize: 16, fontWeight: "600" },
  emptySubText: { color: "#64748b", fontSize: 13 },

  suggestions: { paddingTop: 8 },
  suggestTitle: { color: "#64748b", fontSize: 13, fontWeight: "600", marginBottom: 12 },
  suggestItem: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#1e293b" },
  suggestText: { color: "#94a3b8", fontSize: 15 },

  resultItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1e293b",
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#334155",
    gap: 12,
  },
  resultIcon: { width: 42, height: 42, borderRadius: 12, backgroundColor: "#0f172a", justifyContent: "center", alignItems: "center" },
  resultInfo: { flex: 1 },
  resultTitle: { color: "white", fontSize: 15, fontWeight: "600" },
  resultSub: { color: "#64748b", fontSize: 12, marginTop: 2 },

  avatarContainer: { width: 42, height: 42 },
  avatar: { width: 42, height: 42, borderRadius: 21 },
  avatarFallback: { width: 42, height: 42, borderRadius: 21, backgroundColor: "#334155", justifyContent: "center", alignItems: "center" },
  avatarInitial: { color: "white", fontSize: 18, fontWeight: "700" },
});
