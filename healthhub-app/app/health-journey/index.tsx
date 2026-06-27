import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Target,
  Flame,
  Footprints,
  Droplets,
  Dumbbell,
  CheckCircle,
  Circle,
  ChevronLeft,
  Plus,
  TrendingUp,
  Trophy,
  Calendar,
  Lightbulb,
  ChevronRight,
  Map,
  Zap,
} from 'lucide-react-native';
import { Colors, Spacing, Radius, Typography, sw, sf } from '@/src/theme';
import healthJourneyApi, {
  ActiveJourneyResponse,
  JourneyGoalType,
} from '@/src/api/healthJourneyApi';
import aiApi, { WorkoutPlan } from '@/src/api/aiApi';

// ─── Constants ────────────────────────────────────────────────────────────────

const GOAL_CONFIG: Record<
  JourneyGoalType,
  { label: string; icon: string; color: string; gradient: readonly [string, string] }
> = {
  LOSE_WEIGHT: { label: 'Giảm cân', icon: '⚖️', color: '#f97316', gradient: ['#f97316', '#ef4444'] },
  GAIN_MUSCLE: { label: 'Tăng cơ', icon: '💪', color: '#3b82f6', gradient: ['#3b82f6', '#6366f1'] },
  SLEEP_BETTER: { label: 'Ngủ tốt hơn', icon: '😴', color: '#8b5cf6', gradient: ['#8b5cf6', '#a855f7'] },
  REDUCE_STRESS: { label: 'Giảm stress', icon: '🧘', color: '#14b8a6', gradient: ['#14b8a6', '#06b6d4'] },
  DRINK_WATER: { label: 'Uống đủ nước', icon: '💧', color: '#06b6d4', gradient: ['#06b6d4', '#3b82f6'] },
  INCREASE_ACTIVITY: { label: 'Tăng vận động', icon: '🏃', color: '#22c55e', gradient: ['#22c55e', '#16a34a'] },
};

const AI_DAYS_OPTIONS = [2, 3, 4, 5];

const AI_GOAL_OPTIONS = [
  { key: 'Giảm cân', emoji: '🔥', desc: 'Đốt mỡ, cardio nhiều' },
  { key: 'Tăng cơ', emoji: '💪', desc: 'Strength training' },
  { key: 'Tăng sức bền', emoji: '🏃', desc: 'Cardio & endurance' },
  { key: 'Duy trì sức khoẻ', emoji: '❤️', desc: 'Cân bằng, nhẹ nhàng' },
  { key: 'Giảm stress', emoji: '🧘', desc: 'Yoga, thở, thư giãn' },
];

const DAY_COLORS: Record<string, string> = {
  'Thứ Hai': '#3b82f6',
  'Thứ Ba': '#8b5cf6',
  'Thứ Tư': '#22c55e',
  'Thứ Năm': '#f59e0b',
  'Thứ Sáu': '#ef4444',
  'Thứ Bảy': '#ec4899',
  'Chủ Nhật': '#14b8a6',
};

type Tab = 'journey' | 'planner';

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function HealthJourneyScreen() {
  const [activeTab, setActiveTab] = useState<Tab>('journey');
  const [activeJourney, setActiveJourney] = useState<ActiveJourneyResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [checkingIn, setCheckingIn] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await healthJourneyApi.getActive();
      setActiveJourney((res.data as any) ?? null);
    } catch {
      setActiveJourney(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleCheckin = async () => {
    setCheckingIn(true);
    try {
      await healthJourneyApi.checkin();
      await load();
      Alert.alert('✅ Check-in thành công!', 'Dữ liệu hôm nay đã được ghi lại.');
    } catch {
      Alert.alert('Lỗi', 'Không thể check-in. Vui lòng thử lại.');
    } finally {
      setCheckingIn(false);
    }
  };

  const handleAbandon = () => {
    Alert.alert(
      'Bỏ lộ trình?',
      'Bạn có chắc muốn từ bỏ lộ trình hiện tại không?',
      [
        { text: 'Huỷ', style: 'cancel' },
        {
          text: 'Từ bỏ',
          style: 'destructive',
          onPress: async () => {
            await healthJourneyApi.abandon();
            setActiveJourney(null);
          },
        },
      ],
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.outerContainer}>
      {/* Header */}
      <LinearGradient colors={['#0f1729', '#131d35', Colors.bgSecondary]} style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerLabel}>Kế hoạch tập luyện</Text>
          <Text style={styles.headerTitle}>
            {activeTab === 'journey' ? '🗺️ Lộ trình sức khoẻ' : '🤖 AI Workout Planner'}
          </Text>
        </View>
        {activeTab === 'journey' && activeJourney && (
          <TouchableOpacity onPress={handleAbandon} style={styles.abandonBtn}>
            <Text style={{ color: Colors.danger, ...Typography.sm }}>Bỏ</Text>
          </TouchableOpacity>
        )}
      </LinearGradient>

      {/* Tab Switcher */}
      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'journey' && styles.tabBtnActive]}
          onPress={() => setActiveTab('journey')}
        >
          <Map size={15} color={activeTab === 'journey' ? Colors.primary : Colors.textMuted} />
          <Text style={[styles.tabBtnText, activeTab === 'journey' && styles.tabBtnTextActive]}>
            Lộ trình
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'planner' && styles.tabBtnActive]}
          onPress={() => setActiveTab('planner')}
        >
          <Zap size={15} color={activeTab === 'planner' ? '#8b5cf6' : Colors.textMuted} />
          <Text style={[styles.tabBtnText, activeTab === 'planner' && { color: '#8b5cf6' }]}>
            AI Planner
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {activeTab === 'journey' ? (
        activeJourney ? (
          <JourneyTrackingTab
            data={activeJourney}
            refreshing={refreshing}
            checkingIn={checkingIn}
            onRefresh={() => { setRefreshing(true); load(); }}
            onCheckin={handleCheckin}
          />
        ) : (
          <SelectGoalScreen onCreated={load} />
        )
      ) : (
        <AIPlannerTab />
      )}
    </View>
  );
}

// ─── Journey Tracking Tab ─────────────────────────────────────────────────────

function JourneyTrackingTab({
  data,
  refreshing,
  checkingIn,
  onRefresh,
  onCheckin,
}: {
  data: ActiveJourneyResponse;
  refreshing: boolean;
  checkingIn: boolean;
  onRefresh: () => void;
  onCheckin: () => void;
}) {
  const { journey, meta, todayCheckin, checkIns, progressPercent, daysElapsed, daysRemaining } = data;
  const cfg = GOAL_CONFIG[journey.goalType];
  const checkedInToday = todayCheckin?.completed ?? false;

  const today = new Date();
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (6 - i));
    const dateStr = d.toISOString().split('T')[0];
    const c = checkIns.find((ci) => ci.date === dateStr);
    return { dateStr, completed: c?.completed ?? false, isToday: i === 6 };
  });
  const dayLabels = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
  const todayDayIdx = today.getDay() === 0 ? 6 : today.getDay() - 1;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 100 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
    >
      <View style={styles.body}>
        {/* Progress Card */}
        <LinearGradient colors={[`${cfg.color}22`, `${cfg.color}08`]} style={styles.progressCard}>
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.progressLabel}>Tiến độ tổng thể</Text>
              <Text style={styles.progressValue}>{progressPercent}%</Text>
              <Text style={styles.progressSub}>
                Ngày {daysElapsed}/{journey.durationDays} • Còn {daysRemaining} ngày
              </Text>
            </View>
            <View style={styles.streakBox}>
              <Flame size={20} color={Colors.warning} />
              <Text style={styles.streakNum}>{journey.currentStreak}</Text>
              <Text style={styles.streakLabel}>ngày liên tiếp</Text>
            </View>
          </View>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${progressPercent}%`, backgroundColor: cfg.color }]} />
          </View>
          <Text style={styles.descText}>{meta.description}</Text>
        </LinearGradient>

        {/* 7-day strip */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>7 ngày gần nhất</Text>
          <View style={styles.calRow}>
            {last7.map((day, i) => {
              const dayLabel = dayLabels[(todayDayIdx - 6 + i + 7) % 7];
              return (
                <View key={day.dateStr} style={styles.dayItem}>
                  <Text style={[styles.dayLabel, day.isToday && { color: cfg.color }]}>{dayLabel}</Text>
                  <View style={[styles.dayCircle, day.completed && { backgroundColor: cfg.color }, day.isToday && { borderColor: cfg.color, borderWidth: 2 }]}>
                    {day.completed
                      ? <CheckCircle size={16} color="#fff" />
                      : <Circle size={16} color={day.isToday ? cfg.color : Colors.textMuted} />}
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* Daily targets */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mục tiêu hằng ngày</Text>
          <View style={styles.targetsGrid}>
            <TargetCard icon={<Footprints size={18} color={Colors.primary} />} label="Bước chân" value={`${(journey.dailyStepTarget / 1000).toFixed(0)}K`} color={Colors.primary} />
            <TargetCard icon={<Droplets size={18} color={Colors.info} />} label="Nước uống" value={`${journey.dailyWaterTargetMl / 1000}L`} color={Colors.info} />
            <TargetCard icon={<Dumbbell size={18} color={Colors.warning} />} label="Tập/tuần" value={`${journey.weeklyWorkoutTarget} buổi`} color={Colors.warning} />
            <TargetCard icon={<Target size={18} color={Colors.success} />} label="Calo" value={`${journey.dailyCalorieTarget}`} color={Colors.success} />
          </View>
        </View>

        {/* Today check-in status */}
        {todayCheckin && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Hôm nay</Text>
            <View style={[styles.todayCard, checkedInToday && { borderColor: Colors.success }]}>
              <View style={styles.row}>
                <CheckCircle size={20} color={checkedInToday ? Colors.success : Colors.textMuted} />
                <Text style={[styles.todayStatus, checkedInToday && { color: Colors.success }]}>
                  {checkedInToday ? 'Đã hoàn thành mục tiêu hôm nay!' : 'Chưa đạt mục tiêu hôm nay'}
                </Text>
              </View>
              <View style={[styles.row, { marginTop: Spacing.sm }]}>
                <MiniStat label="Bước" value={todayCheckin.steps.toLocaleString()} />
                <MiniStat label="Nước" value={`${todayCheckin.waterMl}ml`} />
                {todayCheckin.moodScore && <MiniStat label="Mood" value={`${todayCheckin.moodScore}/5`} />}
              </View>
            </View>
          </View>
        )}

        {/* Check-in button */}
        <TouchableOpacity onPress={onCheckin} disabled={checkingIn} activeOpacity={0.8} style={{ marginTop: Spacing.md }}>
          <LinearGradient colors={[cfg.gradient[0], cfg.gradient[1]]} style={styles.checkinBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
            {checkingIn
              ? <ActivityIndicator size="small" color="#fff" />
              : <>
                  <CheckCircle size={20} color="#fff" />
                  <Text style={styles.checkinBtnText}>
                    {checkedInToday ? 'Cập nhật Check-in hôm nay' : 'Check-in hôm nay'}
                  </Text>
                </>}
          </LinearGradient>
        </TouchableOpacity>

        {/* Stats */}
        <View style={[styles.row, { marginTop: Spacing.base, gap: Spacing.sm }]}>
          <View style={[styles.statChip, { flex: 1 }]}>
            <Trophy size={14} color={Colors.warning} />
            <Text style={styles.statChipText}>Best streak: {journey.bestStreak} ngày</Text>
          </View>
          <View style={[styles.statChip, { flex: 1 }]}>
            <TrendingUp size={14} color={Colors.success} />
            <Text style={styles.statChipText}>Check-in: {journey.totalCheckIns} lần</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

// ─── AI Planner Tab ───────────────────────────────────────────────────────────

function AIPlannerTab() {
  const [daysPerWeek, setDaysPerWeek] = useState(3);
  const [selectedGoal, setSelectedGoal] = useState('Duy trì sức khoẻ');
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<WorkoutPlan | null>(null);

  const generate = async () => {
    setLoading(true);
    setPlan(null);
    try {
      const res = await aiApi.generateWorkoutPlan(daysPerWeek, selectedGoal);
      setPlan(res.data);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
      <View style={styles.body}>
        {/* Days */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Số buổi/tuần</Text>
          <View style={styles.daysRow}>
            {AI_DAYS_OPTIONS.map((d) => (
              <TouchableOpacity
                key={d}
                style={[styles.dayChip, daysPerWeek === d && styles.dayChipActive]}
                onPress={() => setDaysPerWeek(d)}
              >
                <Text style={[styles.dayChipNum, daysPerWeek === d && styles.dayChipNumActive]}>{d}</Text>
                <Text style={[styles.dayChipLabel, daysPerWeek === d && styles.dayChipLabelActive]}>buổi</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Goal */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mục tiêu</Text>
          <View style={styles.goalList}>
            {AI_GOAL_OPTIONS.map((g) => (
              <TouchableOpacity
                key={g.key}
                style={[styles.goalItem, selectedGoal === g.key && styles.goalItemActive]}
                onPress={() => setSelectedGoal(g.key)}
              >
                <Text style={styles.goalEmoji}>{g.emoji}</Text>
                <View style={styles.goalInfo}>
                  <Text style={[styles.goalKey, selectedGoal === g.key && styles.goalKeyActive]}>{g.key}</Text>
                  <Text style={styles.goalDesc}>{g.desc}</Text>
                </View>
                {selectedGoal === g.key && <Target size={16} color="#8b5cf6" />}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Generate button */}
        <TouchableOpacity onPress={generate} disabled={loading}>
          <LinearGradient
            colors={loading ? [Colors.bgCard, Colors.bgCard] : ['#8b5cf6', '#6d28d9']}
            style={styles.generateBtn}
          >
            {loading ? <ActivityIndicator size="small" color="#fff" /> : <Calendar size={18} color="#fff" />}
            <Text style={styles.generateBtnText}>
              {loading ? 'AI đang lập kế hoạch...' : 'Tạo kế hoạch tập'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Result */}
        {plan && (
          <>
            <LinearGradient colors={['#1a1040', '#2d1b69']} style={styles.weekGoalCard}>
              <Target size={18} color="#8b5cf6" />
              <Text style={styles.weekGoalText}>{plan.weeklyGoal}</Text>
            </LinearGradient>

            <View style={styles.planSection}>
              <Text style={styles.planTitle}>Lịch tập tuần</Text>
              {plan.plan.map((item, i) => {
                const color = DAY_COLORS[item.day] ?? Colors.primary;
                return (
                  <TouchableOpacity
                    key={i}
                    style={styles.planItem}
                    onPress={() => item.workoutId && router.push(`/workout/${item.workoutId}` as any)}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.planDayBadge, { backgroundColor: color + '20' }]}>
                      <Text style={[styles.planDay, { color }]}>{item.day}</Text>
                    </View>
                    <View style={styles.planInfo}>
                      <Text style={styles.planWorkout}>{item.workoutTitle}</Text>
                      <Text style={styles.planReason}>{item.reason}</Text>
                    </View>
                    <ChevronRight size={16} color={Colors.textMuted} />
                  </TouchableOpacity>
                );
              })}
            </View>

            {plan.tips.length > 0 && (
              <View style={styles.tipsCard}>
                <View style={styles.tipsHeader}>
                  <Lightbulb size={16} color={Colors.warning} />
                  <Text style={styles.tipsTitle}>Mẹo từ AI Coach</Text>
                </View>
                {plan.tips.map((tip, i) => (
                  <Text key={i} style={styles.tipItem}>• {tip}</Text>
                ))}
              </View>
            )}
          </>
        )}
      </View>
    </ScrollView>
  );
}

// ─── Select Goal Screen (no active journey) ───────────────────────────────────

function SelectGoalScreen({ onCreated }: { onCreated: () => void }) {
  const [selected, setSelected] = useState<JourneyGoalType | null>(null);
  const [duration, setDuration] = useState<7 | 30>(7);
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    if (!selected) return;
    setCreating(true);
    try {
      await healthJourneyApi.create(selected, duration);
      onCreated();
    } catch {
      Alert.alert('Lỗi', 'Không thể tạo lộ trình. Vui lòng thử lại.');
    } finally {
      setCreating(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 100 }}>
      <View style={styles.body}>
        <Text style={styles.selectTitle}>Mục tiêu của bạn là gì?</Text>
        <Text style={styles.selectSub}>Chọn một mục tiêu để app tạo lộ trình phù hợp</Text>

        <View style={styles.goalGrid}>
          {(Object.keys(GOAL_CONFIG) as JourneyGoalType[]).map((key) => {
            const cfg = GOAL_CONFIG[key];
            const isSelected = selected === key;
            return (
              <TouchableOpacity
                key={key}
                activeOpacity={0.8}
                onPress={() => setSelected(key)}
                style={[styles.goalCard, isSelected && { borderColor: cfg.color, backgroundColor: `${cfg.color}18` }]}
              >
                <Text style={styles.goalIcon}>{cfg.icon}</Text>
                <Text style={[styles.goalLabel, isSelected && { color: cfg.color }]}>{cfg.label}</Text>
                {isSelected && <View style={[styles.goalCheck, { backgroundColor: cfg.color }]}><CheckCircle size={12} color="#fff" /></View>}
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={[styles.sectionTitle, { marginTop: Spacing.xl }]}>Thời gian</Text>
        <View style={styles.durationRow}>
          {([7, 30] as const).map((d) => (
            <TouchableOpacity
              key={d}
              onPress={() => setDuration(d)}
              style={[styles.durationBtn, duration === d && styles.durationBtnActive]}
            >
              <Text style={[styles.durationBtnText, duration === d && { color: Colors.primary }]}>
                {d} ngày
              </Text>
              <Text style={styles.durationSub}>{d === 7 ? 'Thử nghiệm' : 'Thay đổi thói quen'}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          onPress={handleCreate}
          disabled={!selected || creating}
          activeOpacity={0.8}
          style={{ marginTop: Spacing.xl }}
        >
          <LinearGradient
            colors={selected ? [GOAL_CONFIG[selected].gradient[0], GOAL_CONFIG[selected].gradient[1]] : ['#334155', '#475569']}
            style={styles.checkinBtn}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            {creating
              ? <ActivityIndicator size="small" color="#fff" />
              : <>
                  <Plus size={20} color="#fff" />
                  <Text style={styles.checkinBtnText}>Bắt đầu lộ trình</Text>
                </>}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function TargetCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  return (
    <View style={[styles.targetCard, { borderColor: `${color}30` }]}>
      <View style={[styles.targetIcon, { backgroundColor: `${color}18` }]}>{icon}</View>
      <Text style={styles.targetValue}>{value}</Text>
      <Text style={styles.targetLabel}>{label}</Text>
    </View>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.miniStat}>
      <Text style={styles.miniStatValue}>{value}</Text>
      <Text style={styles.miniStatLabel}>{label}</Text>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  outerContainer: { flex: 1, backgroundColor: Colors.bgPrimary },
  container: { flex: 1, backgroundColor: Colors.bgPrimary },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.bgPrimary },
  header: {
    paddingTop: sw(52),
    paddingBottom: Spacing.xl,
    paddingHorizontal: Spacing.base,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: Radius.full, backgroundColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center', alignItems: 'center',
  },
  abandonBtn: {
    paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs,
    borderRadius: Radius.sm, borderWidth: 1, borderColor: Colors.danger,
  },
  headerLabel: { ...Typography.sm, color: Colors.textMuted },
  headerTitle: { ...Typography.xl, color: Colors.textPrimary, fontWeight: '700', marginTop: 2 },

  // Tab switcher
  tabRow: {
    flexDirection: 'row',
    backgroundColor: Colors.bgSecondary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingHorizontal: Spacing.base,
    gap: Spacing.sm,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabBtnActive: {
    borderBottomColor: Colors.primary,
  },
  tabBtnText: {
    ...Typography.sm,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  tabBtnTextActive: {
    color: Colors.primary,
  },

  body: { padding: Spacing.base },
  progressCard: {
    borderRadius: Radius.xl, padding: Spacing.base,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', marginBottom: Spacing.base,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  progressLabel: { ...Typography.sm, color: Colors.textMuted },
  progressValue: { ...Typography.display, color: Colors.textPrimary, fontWeight: '800' },
  progressSub: { ...Typography.sm, color: Colors.textSecondary, marginTop: 2 },
  streakBox: { alignItems: 'center', backgroundColor: 'rgba(245,158,11,0.12)', borderRadius: Radius.lg, padding: Spacing.sm },
  streakNum: { ...Typography.xxl, color: Colors.warning, fontWeight: '800' },
  streakLabel: { ...Typography.xs, color: Colors.warning },
  progressBarBg: { height: 8, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: Radius.full, marginVertical: Spacing.sm, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: Radius.full },
  descText: { ...Typography.sm, color: Colors.textSecondary },
  section: { marginTop: Spacing.base },
  sectionTitle: { ...Typography.base, color: Colors.textPrimary, fontWeight: '600', marginBottom: Spacing.sm },
  calRow: { flexDirection: 'row', justifyContent: 'space-between' },
  dayItem: { alignItems: 'center', gap: 4 },
  dayLabel: { ...Typography.xs, color: Colors.textMuted },
  dayCircle: {
    width: 34, height: 34, borderRadius: Radius.full,
    backgroundColor: 'rgba(255,255,255,0.06)', justifyContent: 'center', alignItems: 'center',
  },
  targetsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  targetCard: {
    flex: 1, minWidth: '45%', backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg, padding: Spacing.sm, alignItems: 'center',
    borderWidth: 1, gap: 4,
  },
  targetIcon: { width: 32, height: 32, borderRadius: Radius.full, justifyContent: 'center', alignItems: 'center' },
  targetValue: { ...Typography.lg, color: Colors.textPrimary, fontWeight: '700' },
  targetLabel: { ...Typography.xs, color: Colors.textMuted },
  todayCard: {
    backgroundColor: Colors.bgCard, borderRadius: Radius.lg, padding: Spacing.base,
    borderWidth: 1, borderColor: Colors.border,
  },
  todayStatus: { ...Typography.base, color: Colors.textSecondary, fontWeight: '500', flex: 1 },
  miniStat: { flex: 1, alignItems: 'center' },
  miniStatValue: { ...Typography.base, color: Colors.textPrimary, fontWeight: '700' },
  miniStatLabel: { ...Typography.xs, color: Colors.textMuted },
  checkinBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    borderRadius: Radius.xl, paddingVertical: Spacing.base, gap: Spacing.sm,
  },
  checkinBtnText: { ...Typography.lg, color: '#fff', fontWeight: '700' },
  statChip: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.xs,
    backgroundColor: Colors.bgCard, borderRadius: Radius.lg, padding: Spacing.sm,
    borderWidth: 1, borderColor: Colors.border,
  },
  statChipText: { ...Typography.xs, color: Colors.textSecondary },

  // AI Planner styles
  daysRow: { flexDirection: 'row', gap: 10 },
  dayChip: {
    flex: 1, alignItems: 'center', backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg, paddingVertical: 12,
    borderWidth: 1, borderColor: Colors.border,
  },
  dayChipActive: { borderColor: '#8b5cf6', backgroundColor: 'rgba(139,92,246,0.12)' },
  dayChipNum: { color: Colors.textSecondary, fontSize: 20, fontWeight: '700' },
  dayChipNumActive: { color: '#8b5cf6' },
  dayChipLabel: { color: Colors.textMuted, fontSize: 12 },
  dayChipLabelActive: { color: '#8b5cf6' },
  goalList: { gap: 8 },
  goalItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Colors.bgCard, borderRadius: Radius.lg, padding: Spacing.sm,
    borderWidth: 1, borderColor: Colors.border,
  },
  goalItemActive: { borderColor: '#8b5cf6', backgroundColor: 'rgba(139,92,246,0.08)' },
  goalEmoji: { fontSize: 22 },
  goalInfo: { flex: 1 },
  goalKey: { color: Colors.textPrimary, fontSize: 14, fontWeight: '600' },
  goalKeyActive: { color: '#8b5cf6' },
  goalDesc: { color: Colors.textMuted, fontSize: 12 },
  generateBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, borderRadius: Radius.lg, paddingVertical: 14,
  },
  generateBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  weekGoalCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderRadius: Radius.xl, padding: Spacing.base, marginTop: Spacing.base,
  },
  weekGoalText: { color: '#fff', fontSize: 14, flex: 1, lineHeight: 20 },
  planSection: { backgroundColor: Colors.bgCard, borderRadius: Radius.xl, overflow: 'hidden', marginTop: Spacing.base },
  planTitle: { color: Colors.textPrimary, fontSize: 15, fontWeight: '700', padding: Spacing.base, paddingBottom: 8 },
  planItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: Spacing.base, paddingVertical: 12,
    borderTopWidth: 1, borderTopColor: Colors.border,
  },
  planDayBadge: { borderRadius: Radius.sm, paddingHorizontal: 8, paddingVertical: 4, minWidth: 68, alignItems: 'center' },
  planDay: { fontSize: 12, fontWeight: '700' },
  planInfo: { flex: 1 },
  planWorkout: { color: Colors.textPrimary, fontSize: 14, fontWeight: '600' },
  planReason: { color: Colors.textMuted, fontSize: 12, marginTop: 2 },
  tipsCard: { backgroundColor: Colors.bgCard, borderRadius: Radius.xl, padding: Spacing.base, gap: 8, marginTop: Spacing.base },
  tipsHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  tipsTitle: { color: Colors.textPrimary, fontSize: 15, fontWeight: '700' },
  tipItem: { color: Colors.textSecondary, fontSize: 14, lineHeight: 20 },

  // Select goal screen
  selectTitle: { ...Typography.xxxl, color: Colors.textPrimary, fontWeight: '800', marginBottom: Spacing.xs },
  selectSub: { ...Typography.base, color: Colors.textSecondary, marginBottom: Spacing.lg },
  goalGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  goalCard: {
    width: '47%', backgroundColor: Colors.bgCard, borderRadius: Radius.xl,
    padding: Spacing.base, borderWidth: 1.5, borderColor: Colors.border,
    alignItems: 'center', gap: Spacing.xs, position: 'relative',
  },
  goalIcon: { fontSize: sf(28) },
  goalLabel: { ...Typography.base, color: Colors.textPrimary, fontWeight: '600', textAlign: 'center' },
  goalCheck: { position: 'absolute', top: 6, right: 6, width: 20, height: 20, borderRadius: Radius.full, justifyContent: 'center', alignItems: 'center' },
  durationRow: { flexDirection: 'row', gap: Spacing.sm },
  durationBtn: {
    flex: 1, backgroundColor: Colors.bgCard, borderRadius: Radius.xl,
    padding: Spacing.base, borderWidth: 1.5, borderColor: Colors.border, alignItems: 'center',
  },
  durationBtnActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryBg },
  durationBtnText: { ...Typography.lg, color: Colors.textPrimary, fontWeight: '700' },
  durationSub: { ...Typography.xs, color: Colors.textMuted, marginTop: 2 },
});
