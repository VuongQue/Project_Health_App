import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter, useFocusEffect } from "expo-router";
import { ArrowLeft, Sparkles, CheckCircle, Lightbulb, Heart, RefreshCw } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import aiApi, { DailyInsight } from "@/src/api/aiApi";
import { useColors, Spacing, Radius, Typography } from "@/src/theme";

const CACHE_KEY = 'daily-insight:cache';
const CACHE_TTL_MS = 3 * 60 * 60 * 1000;

async function getCached(): Promise<DailyInsight | null> {
  const raw = await AsyncStorage.getItem(CACHE_KEY);
  if (!raw) return null;
  const { data, savedAt } = JSON.parse(raw);
  if (Date.now() - savedAt > CACHE_TTL_MS) return null;
  return data;
}

async function saveCache(data: DailyInsight) {
  await AsyncStorage.setItem(CACHE_KEY, JSON.stringify({ data, savedAt: Date.now() }));
}

export default function DailyInsightScreen() {
  const router = useRouter();
  const colors = useColors();
  const [insight, setInsight] = useState<DailyInsight | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const loadInsight = useCallback(async (forceRefresh = false) => {
    setLoading(true);
    setError(false);
    try {
      if (!forceRefresh) {
        const cached = await getCached();
        if (cached) {
          setInsight(cached);
          setLoading(false);
          return;
        }
      }
      const res = await aiApi.getDailyInsight();
      await saveCache(res.data);
      setInsight(res.data);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(false);
      try {
        const cached = await getCached();
        if (cached) {
          if (!cancelled) { setInsight(cached); setLoading(false); }
          return;
        }
        const res = await aiApi.getDailyInsight();
        await saveCache(res.data);
        if (!cancelled) setInsight(res.data);
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []));

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.bgPrimary }]} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <LinearGradient colors={["#1a1040", colors.bgPrimary]} style={styles.header}>
        <TouchableOpacity
          onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)/(personal)')}
          style={styles.backBtn}
        >
          <ArrowLeft size={22} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <LinearGradient colors={["#a855f7", "#ec4899"]} style={styles.headerIcon}>
            <Sparkles size={24} color="#fff" />
          </LinearGradient>
          <Text style={styles.headerTitle}>AI Daily Insight</Text>
          <Text style={[styles.headerSub, { color: colors.textSecondary }]}>
            {new Date().toLocaleDateString("vi-VN", { weekday: "long", day: "numeric", month: "long" })}
          </Text>
        </View>
      </LinearGradient>

      <View style={styles.body}>
        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#a855f7" />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
              AI đang phân tích dữ liệu sức khoẻ của bạn...
            </Text>
          </View>
        ) : error ? (
          <View style={styles.errorBox}>
            <Text style={[styles.errorText, { color: colors.textSecondary }]}>
              Không thể tải insight. Kiểm tra kết nối và thử lại.
            </Text>
            <TouchableOpacity style={styles.retryBtn} onPress={() => loadInsight(true)}>
              <RefreshCw size={16} color={colors.primary} />
              <Text style={[styles.retryText, { color: colors.primary }]}>Thử lại</Text>
            </TouchableOpacity>
          </View>
        ) : insight ? (
          <>
            {/* Summary card */}
            <LinearGradient colors={["#1a1040", "#2d1b69"]} style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Tổng quan hôm nay</Text>
              <Text style={styles.summaryText}>{insight.summary}</Text>
            </LinearGradient>

            {/* Motivational message */}
            <LinearGradient
              colors={["rgba(236,72,153,0.12)", "rgba(168,85,247,0.12)"]}
              style={[styles.motivCard, { borderColor: "rgba(236,72,153,0.2)" }]}
            >
              <Heart size={18} color="#ec4899" />
              <Text style={[styles.motivText, { color: colors.textPrimary }]}>{insight.motivationalMessage}</Text>
            </LinearGradient>

            {/* Highlights */}
            {(insight.highlights ?? []).length > 0 && (
              <View style={[styles.section, { backgroundColor: colors.bgCard }]}>
                <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Điểm nổi bật</Text>
                {insight.highlights.map((h, i) => (
                  <View key={i} style={styles.itemRow}>
                    <CheckCircle size={16} color={colors.success} />
                    <Text style={[styles.itemText, { color: colors.textSecondary }]}>{h}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Suggestions */}
            {(insight.suggestions ?? []).length > 0 && (
              <View style={[styles.section, { backgroundColor: colors.bgCard }]}>
                <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Gợi ý cải thiện</Text>
                {insight.suggestions.map((s, i) => (
                  <View key={i} style={styles.itemRow}>
                    <Lightbulb size={16} color={colors.warning} />
                    <Text style={[styles.itemText, { color: colors.textSecondary }]}>{s}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Refresh */}
            <TouchableOpacity style={styles.refreshRow} onPress={() => loadInsight(true)}>
              <RefreshCw size={14} color={colors.textMuted} />
              <Text style={[styles.refreshText, { color: colors.textMuted }]}>Làm mới phân tích</Text>
            </TouchableOpacity>
          </>
        ) : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingTop: 52, paddingBottom: 24, paddingHorizontal: Spacing.base },
  backBtn: { marginBottom: 16 },
  headerContent: { alignItems: "center", gap: 10 },
  headerIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { color: "#fff", ...Typography.xxl, fontWeight: "800" },
  headerSub: { ...Typography.sm, textTransform: "capitalize" },
  body: { padding: Spacing.base, gap: Spacing.md },
  loadingBox: { alignItems: "center", paddingVertical: 60, gap: 16 },
  loadingText: { ...Typography.sm, textAlign: "center" },
  errorBox: { alignItems: "center", paddingVertical: 40, gap: 12 },
  errorText: { textAlign: "center", ...Typography.sm },
  retryBtn: { flexDirection: "row", alignItems: "center", gap: 6, padding: 8 },
  retryText: { ...Typography.sm },
  summaryCard: {
    borderRadius: Radius.xl,
    padding: Spacing.base,
    marginBottom: Spacing.sm,
  },
  summaryLabel: {
    color: "#a855f7",
    ...Typography.xs,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 8,
  },
  summaryText: { color: "#fff", ...Typography.md, lineHeight: 24 },
  motivCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    borderRadius: Radius.xl,
    padding: Spacing.base,
    marginBottom: Spacing.sm,
    borderWidth: 1,
  },
  motivText: { ...Typography.sm, flex: 1, lineHeight: 20 },
  section: {
    borderRadius: Radius.xl,
    padding: Spacing.base,
    gap: 10,
    marginBottom: Spacing.sm,
  },
  sectionTitle: { ...Typography.md, fontWeight: "700", marginBottom: 4 },
  itemRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  itemText: { ...Typography.sm, flex: 1, lineHeight: 20 },
  refreshRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 16,
  },
  refreshText: { ...Typography.xs },
});
