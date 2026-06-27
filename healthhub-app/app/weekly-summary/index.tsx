import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ChevronLeft,
  Footprints,
  Dumbbell,
  Droplets,
  CheckCircle,
  Lightbulb,
  TrendingUp,
  RefreshCw,
  Smile,
  Flame,
  Target,
} from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors, Spacing, Radius, Typography, sw } from '@/src/theme';
import weeklySummaryApi, { WeeklySummaryResponse } from '@/src/api/weeklySummaryApi';

const CACHE_KEY = 'weekly_summary_cache';
const CACHE_TTL = 3 * 60 * 60 * 1000; // 3 hours

const MOOD_LABELS: Record<number, string> = {
  1: 'Buồn', 2: 'Bình thường', 3: 'Ổn', 4: 'Vui', 5: 'Tuyệt vời',
};
const MOOD_COLORS = ['#ef4444', '#f97316', '#f59e0b', '#22c55e', '#3b82f6'];

export default function WeeklySummaryScreen() {
  const [data, setData] = useState<WeeklySummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadFromCache = async (): Promise<WeeklySummaryResponse | null> => {
    try {
      const raw = await AsyncStorage.getItem(CACHE_KEY);
      if (!raw) return null;
      const { timestamp, value } = JSON.parse(raw);
      if (Date.now() - timestamp < CACHE_TTL) return value;
    } catch {}
    return null;
  };

  const fetchData = useCallback(async (forceRefresh = false) => {
    if (!forceRefresh) {
      const cached = await loadFromCache();
      if (cached) { setData(cached); setLoading(false); return; }
    }
    try {
      const res = await weeklySummaryApi.get();
      const value = res.data as WeeklySummaryResponse;
      setData(value);
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify({ timestamp: Date.now(), value }));
    } catch {}
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData(true);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <LinearGradient colors={['#0f1729', Colors.bgPrimary]} style={StyleSheet.absoluteFill} />
        <ActivityIndicator size="large" color={Colors.purple} />
        <Text style={styles.loadingText}>AI đang phân tích tuần của bạn...</Text>
      </View>
    );
  }

  if (!data) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorEmoji}>📊</Text>
        <Text style={styles.errorTitle}>Chưa có dữ liệu</Text>
        <Text style={styles.errorSub}>Cần có dữ liệu hoạt động trong tuần để tạo báo cáo.</Text>
        <TouchableOpacity onPress={() => fetchData(true)} style={styles.retryBtn}>
          <Text style={{ color: Colors.primary, ...Typography.base, fontWeight: '600' }}>Thử lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const { weekData, summary, stepsHistory, waterHistory } = data;
  const maxSteps = Math.max(...stepsHistory.map(d => d.steps), 1);
  const moodScore = weekData.averageMoodScore;
  const moodColor = moodScore !== null ? MOOD_COLORS[Math.round(moodScore) - 1] ?? Colors.primary : Colors.textMuted;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 100 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={Colors.purple} />}
    >
      {/* Header */}
      <LinearGradient colors={['#0f1729', '#1a0d35', Colors.bgSecondary]} style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerLabel}>Tổng kết</Text>
          <Text style={styles.headerTitle}>📊 Báo cáo tuần này</Text>
        </View>
        <TouchableOpacity onPress={handleRefresh} style={styles.refreshBtn}>
          <RefreshCw size={18} color={Colors.textSecondary} />
        </TouchableOpacity>
      </LinearGradient>

      <View style={styles.body}>
        {/* Headline card */}
        <LinearGradient colors={['rgba(168,85,247,0.18)', 'rgba(168,85,247,0.05)']} style={styles.headlineCard}>
          <View style={styles.aiTag}>
            <Text style={styles.aiTagText}>✨ AI Insight</Text>
          </View>
          <Text style={styles.headline}>{summary.headline}</Text>
          <View style={styles.divider} />
          <Text style={styles.motivational}>"{summary.motivationalMessage}"</Text>
        </LinearGradient>

        {/* Stats grid */}
        <View style={styles.statsGrid}>
          <StatCard
            icon={<Footprints size={20} color={Colors.primary} />}
            label="Tổng bước chân"
            value={weekData.totalSteps.toLocaleString()}
            sub="bước"
            color={Colors.primary}
          />
          <StatCard
            icon={<Dumbbell size={20} color={Colors.warning} />}
            label="Buổi tập"
            value={String(weekData.workoutSessions)}
            sub="buổi"
            color={Colors.warning}
          />
          <StatCard
            icon={<Droplets size={20} color={Colors.info} />}
            label="Đủ nước"
            value={`${weekData.daysWithEnoughWater}/7`}
            sub="ngày"
            color={Colors.info}
          />
          {moodScore !== null ? (
            <StatCard
              icon={<Smile size={20} color={moodColor} />}
              label="Mood TB"
              value={moodScore.toFixed(1)}
              sub={`/5 - ${MOOD_LABELS[Math.round(moodScore)] ?? ''}`}
              color={moodColor}
            />
          ) : (
            <StatCard
              icon={<Target size={20} color={Colors.orange} />}
              label="Calo TB"
              value={String(weekData.averageCalories)}
              sub="kcal/ngày"
              color={Colors.orange}
            />
          )}
        </View>

        {/* Steps chart */}
        {stepsHistory.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Bước chân 7 ngày</Text>
            <View style={styles.chartCard}>
              <View style={styles.barChart}>
                {stepsHistory.map((d, i) => {
                  const pct = d.steps / maxSteps;
                  const dateObj = new Date(d.date);
                  const day = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'][dateObj.getDay()];
                  return (
                    <View key={d.date} style={styles.barItem}>
                      <Text style={styles.barValue}>
                        {d.steps >= 1000 ? `${(d.steps / 1000).toFixed(1)}k` : d.steps}
                      </Text>
                      <View style={styles.barBg}>
                        <View style={[styles.barFill, { height: `${Math.max(pct * 100, 4)}%`, backgroundColor: pct >= 0.9 ? Colors.success : Colors.primary }]} />
                      </View>
                      <Text style={styles.barLabel}>{day}</Text>
                    </View>
                  );
                })}
              </View>
            </View>
          </View>
        )}

        {/* Water chart */}
        {waterHistory.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Nước uống 7 ngày</Text>
            <View style={styles.chartCard}>
              <View style={styles.waterRow}>
                {waterHistory.map((d) => {
                  const pct = Math.min(d.total / 2000, 1);
                  const dateObj = new Date(d.date);
                  const day = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'][dateObj.getDay()];
                  return (
                    <View key={d.date} style={styles.waterItem}>
                      <View style={[styles.waterCircle, { borderColor: pct >= 1 ? Colors.info : Colors.border }]}>
                        <View style={[styles.waterFill, { height: `${pct * 100}%`, backgroundColor: Colors.info }]} />
                        <Text style={styles.waterPct}>{Math.round(pct * 100)}%</Text>
                      </View>
                      <Text style={styles.barLabel}>{day}</Text>
                    </View>
                  );
                })}
              </View>
            </View>
          </View>
        )}

        {/* Highlights */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <CheckCircle size={16} color={Colors.success} />
            <Text style={styles.sectionTitle}>Thành tích nổi bật</Text>
          </View>
          <View style={styles.listCard}>
            {summary.highlights.map((h, i) => (
              <View key={i} style={styles.listItem}>
                <View style={[styles.listDot, { backgroundColor: Colors.success }]} />
                <Text style={styles.listText}>{h}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Improvements */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <TrendingUp size={16} color={Colors.warning} />
            <Text style={styles.sectionTitle}>Cần cải thiện</Text>
          </View>
          <View style={styles.listCard}>
            {summary.improvements.map((item, i) => (
              <View key={i} style={styles.listItem}>
                <View style={[styles.listDot, { backgroundColor: Colors.warning }]} />
                <Text style={styles.listText}>{item}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Next week focus */}
        <LinearGradient colors={['rgba(59,130,246,0.15)', 'rgba(59,130,246,0.05)']} style={styles.focusCard}>
          <View style={styles.sectionHeader}>
            <Lightbulb size={18} color={Colors.primary} />
            <Text style={[styles.sectionTitle, { color: Colors.primary }]}>Tuần tới tập trung</Text>
          </View>
          <Text style={styles.focusText}>{summary.nextWeekFocus}</Text>
        </LinearGradient>
      </View>
    </ScrollView>
  );
}

// ─── Sub-components ────────────────────────────────────────────────────────
function StatCard({ icon, label, value, sub, color }: { icon: React.ReactNode; label: string; value: string; sub: string; color: string }) {
  return (
    <View style={[styles.statCard, { borderColor: `${color}30` }]}>
      <View style={[styles.statIcon, { backgroundColor: `${color}18` }]}>{icon}</View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statSub}>{sub}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgPrimary },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.bgPrimary, gap: Spacing.base },
  loadingText: { ...Typography.base, color: Colors.textSecondary },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.bgPrimary, padding: Spacing.xl, gap: Spacing.sm },
  errorEmoji: { fontSize: 48, marginBottom: Spacing.sm },
  errorTitle: { ...Typography.xl, color: Colors.textPrimary, fontWeight: '700' },
  errorSub: { ...Typography.base, color: Colors.textSecondary, textAlign: 'center' },
  retryBtn: { marginTop: Spacing.base, paddingHorizontal: Spacing.xl, paddingVertical: Spacing.sm, borderRadius: Radius.xl, borderWidth: 1, borderColor: Colors.primary },
  header: {
    paddingTop: sw(52), paddingBottom: Spacing.xl, paddingHorizontal: Spacing.base,
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: Radius.full, backgroundColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center', alignItems: 'center',
  },
  refreshBtn: {
    width: 38, height: 38, borderRadius: Radius.full, backgroundColor: 'rgba(255,255,255,0.06)',
    justifyContent: 'center', alignItems: 'center',
  },
  headerLabel: { ...Typography.sm, color: Colors.textMuted },
  headerTitle: { ...Typography.xl, color: Colors.textPrimary, fontWeight: '700', marginTop: 2 },
  body: { padding: Spacing.base },
  headlineCard: {
    borderRadius: Radius.xl, padding: Spacing.base,
    borderWidth: 1, borderColor: 'rgba(168,85,247,0.2)', marginBottom: Spacing.base,
  },
  aiTag: {
    alignSelf: 'flex-start', backgroundColor: 'rgba(168,85,247,0.2)',
    borderRadius: Radius.full, paddingHorizontal: Spacing.sm, paddingVertical: 3, marginBottom: Spacing.sm,
  },
  aiTagText: { ...Typography.xs, color: Colors.purple, fontWeight: '600' },
  headline: { ...Typography.lg, color: Colors.textPrimary, fontWeight: '700', lineHeight: 24 },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.08)', marginVertical: Spacing.sm },
  motivational: { ...Typography.sm, color: Colors.purple, fontStyle: 'italic' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.base },
  statCard: {
    width: '47%', backgroundColor: Colors.bgCard, borderRadius: Radius.xl,
    padding: Spacing.base, borderWidth: 1, alignItems: 'center', gap: 2,
  },
  statIcon: { width: 36, height: 36, borderRadius: Radius.full, justifyContent: 'center', alignItems: 'center', marginBottom: 4 },
  statValue: { ...Typography.xxl, color: Colors.textPrimary, fontWeight: '800' },
  statSub: { ...Typography.xs, color: Colors.textSecondary },
  statLabel: { ...Typography.xs, color: Colors.textMuted, textAlign: 'center' },
  section: { marginTop: Spacing.base },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, marginBottom: Spacing.sm },
  sectionTitle: { ...Typography.base, color: Colors.textPrimary, fontWeight: '600' },
  chartCard: { backgroundColor: Colors.bgCard, borderRadius: Radius.xl, padding: Spacing.base, borderWidth: 1, borderColor: Colors.border },
  barChart: { flexDirection: 'row', alignItems: 'flex-end', height: 100, gap: 4 },
  barItem: { flex: 1, alignItems: 'center', gap: 4 },
  barValue: { ...Typography.xs, color: Colors.textMuted, fontSize: 9 },
  barBg: { flex: 1, width: '100%', backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: Radius.sm, overflow: 'hidden', justifyContent: 'flex-end' },
  barFill: { width: '100%', borderRadius: Radius.sm },
  barLabel: { ...Typography.xs, color: Colors.textMuted },
  waterRow: { flexDirection: 'row', gap: Spacing.xs, justifyContent: 'space-between' },
  waterItem: { alignItems: 'center', gap: 4 },
  waterCircle: {
    width: 36, height: 36, borderRadius: Radius.full,
    borderWidth: 2, overflow: 'hidden', justifyContent: 'flex-end', alignItems: 'center', position: 'relative',
  },
  waterFill: { width: '100%', position: 'absolute', bottom: 0 },
  waterPct: { ...Typography.xs, color: Colors.textPrimary, fontWeight: '700', position: 'absolute', fontSize: 9 },
  listCard: { backgroundColor: Colors.bgCard, borderRadius: Radius.xl, padding: Spacing.base, borderWidth: 1, borderColor: Colors.border, gap: Spacing.sm },
  listItem: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm },
  listDot: { width: 6, height: 6, borderRadius: 3, marginTop: 7 },
  listText: { ...Typography.base, color: Colors.textSecondary, flex: 1, lineHeight: 20 },
  focusCard: {
    borderRadius: Radius.xl, padding: Spacing.base,
    borderWidth: 1, borderColor: 'rgba(59,130,246,0.2)', marginTop: Spacing.base,
  },
  focusText: { ...Typography.base, color: Colors.textSecondary, lineHeight: 22, marginTop: 4 },
});
