import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import {
  Trophy,
  Zap,
  Target,
  CheckCircle2,
  Clock,
  ChevronRight,
  ArrowLeft,
  Flame,
  Heart,
  Share2,
} from "lucide-react-native";

import challengeApi from "@/src/api/challengeApi";
import { communityApi } from "@/src/api/communityApi";
import { useTranslation } from "react-i18next";
import { useColors, Spacing, Radius, Typography } from "@/src/theme";
import { CardSkeleton } from "@/components/ui/SkeletonLoader";
import EmptyState from "@/components/ui/EmptyState";

// NOTE: SOURCE_COLORS uses static Colors because semantic colors don't change with theme
import { Colors } from "@/src/theme";
const SOURCE_COLORS: Record<string, { bg: string; fg: string; icon: any; gradient: readonly [string, string] }> = {
  WORKOUT: { bg: Colors.primaryBg, fg: Colors.primary, icon: Zap, gradient: Colors.gradientPrimary },
  MOOD: { bg: Colors.pinkBg, fg: Colors.pink, icon: Heart, gradient: ["#ec4899", "#f43f5e"] as const },
  STEPS: { bg: Colors.successBg, fg: Colors.success, icon: Target, gradient: Colors.gradientSuccess },
};

function ProgressRing({ percent, color }: { percent: number; color: string }) {
  const colors = useColors();
  const clamped = Math.min(100, Math.max(0, percent));
  return (
    <View style={ring.wrap}>
      <View style={[ring.track, { borderColor: colors.border }]} />
      <View style={[ring.fill, { borderColor: color, opacity: clamped / 100 + 0.15 }]} />
      <View style={ring.center}>
        <Text style={[ring.label, { color }]}>{clamped}%</Text>
      </View>
    </View>
  );
}

const ring = StyleSheet.create({
  wrap: { width: 52, height: 52, alignItems: "center", justifyContent: "center" },
  track: { position: "absolute", width: 52, height: 52, borderRadius: 26, borderWidth: 4 },
  fill: { position: "absolute", width: 52, height: 52, borderRadius: 26, borderWidth: 4 },
  center: { alignItems: "center", justifyContent: "center" },
  label: { fontSize: 11, fontWeight: "700" },
});

export default function ChallengeListScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const colors = useColors();
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [joiningId, setJoiningId] = useState<number | null>(null);

  const load = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await challengeApi.getAll();
      setList(res.data ?? []);
    } catch {
      Alert.alert(t("common.error"), t("challenges.err_load"));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { load(); }, []);

  const onJoin = async (id: number) => {
    setJoiningId(id);
    try {
      await challengeApi.join(id);
      await load(true);
    } catch (e: any) {
      Alert.alert(t("challenges.err_join"), e?.response?.data?.message ?? t("common.retry"));
    } finally {
      setJoiningId(null);
    }
  };

  const ongoingList = list.filter((c) => c.joined && c.userChallenge?.status === "ongoing");
  const availableList = list.filter((c) => !c.joined);
  const completedList = list.filter((c) => c.userChallenge?.status === "completed");

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.bgSecondary }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => { setRefreshing(true); load(true); }}
          tintColor={colors.primary}
        />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
          <ArrowLeft size={22} color={colors.textSecondary} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>{t("challenges.title")}</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>{t("challenges.subtitle")}</Text>
        </View>
        <View style={styles.statBadge}>
          <Trophy size={14} color={colors.warning} />
          <Text style={[styles.statBadgeText, { color: colors.warning }]}>{completedList.length} {t("challenges.completed_count")}</Text>
        </View>
      </View>

      {loading ? (
        <>
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </>
      ) : list.length === 0 ? (
        <EmptyState emoji="🏆" title={t("challenges.no_challenges")} subtitle={t("challenges.no_challenges_sub")} />
      ) : (
        <>
          {/* Đang tham gia */}
          {ongoingList.length > 0 && (
            <Section title={t("challenges.in_progress")} icon={<Flame size={16} color={colors.orange} />} textColor={colors.textSecondary}>
              {ongoingList.map((c) => (
                <ChallengeCard key={c.id} item={c} onJoin={onJoin} joiningId={joiningId} router={router} colors={colors} />
              ))}
            </Section>
          )}

          {/* Khả dụng */}
          {availableList.length > 0 && (
            <Section title={t("challenges.available")} icon={<Target size={16} color={colors.primary} />} textColor={colors.textSecondary}>
              {availableList.map((c) => (
                <ChallengeCard key={c.id} item={c} onJoin={onJoin} joiningId={joiningId} router={router} colors={colors} />
              ))}
            </Section>
          )}

          {/* Đã hoàn thành */}
          {completedList.length > 0 && (
            <Section title={t("challenges.completed")} icon={<CheckCircle2 size={16} color={colors.success} />} textColor={colors.textSecondary}>
              {completedList.map((c) => (
                <ChallengeCard key={c.id} item={c} onJoin={onJoin} joiningId={joiningId} router={router} colors={colors} />
              ))}
            </Section>
          )}
        </>
      )}

      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

function Section({ title, icon, children, textColor }: { title: string; icon: React.ReactNode; children: React.ReactNode; textColor: string }) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        {icon}
        <Text style={[styles.sectionTitle, { color: textColor }]}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

function ChallengeCard({ item: c, onJoin, joiningId, router, colors }: any) {
  const { t } = useTranslation();
  const joined = c.joined;
  const completed = c.userChallenge?.status === "completed";
  const progress = c.userChallenge?.progress ?? 0;
  const goal = c.goal ?? 1;
  const percent = Math.min(100, Math.round((progress / goal) * 100));

  const shareChallenge = async () => {
    try {
      const text = completed
        ? `🏆 Tôi vừa hoàn thành thử thách "${c.name}"!\n🎯 Đạt ${progress}/${goal} mục tiêu\n#HealthHub #Challenge`
        : `🔥 Tôi đang tham gia thử thách "${c.name}" trên HealthHub!\n📊 Tiến độ: ${percent}% (${progress}/${goal})\nBạn có muốn cùng tham gia không? 💪\n#HealthHub #Challenge`;
      await communityApi.createPost({ content: text });
      Alert.alert("Đã chia sẻ!", "Thử thách đã được đăng lên cộng đồng.");
    } catch {
      Alert.alert("Lỗi", "Không thể chia sẻ. Thử lại sau.");
    }
  };

  const src = SOURCE_COLORS[c.source] ?? SOURCE_COLORS.WORKOUT;
  const Icon = src.icon;

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.bgCard, borderColor: colors.border }]}
      activeOpacity={0.85}
      onPress={() => router.push(`/challenges/${c.id}` as any)}
    >
      {/* Icon + gradient pill */}
      <LinearGradient colors={src.gradient} style={styles.iconPill}>
        <Icon size={18} color="white" />
      </LinearGradient>

      {/* Content */}
      <View style={styles.cardBody}>
        <View style={styles.cardRow}>
          <Text style={[styles.cardName, { color: colors.textPrimary }]} numberOfLines={1}>{c.name}</Text>
          {completed && (
            <View style={styles.completedBadge}>
              <CheckCircle2 size={12} color={colors.success} />
              <Text style={styles.completedText}>Done</Text>
            </View>
          )}
        </View>

        <Text style={[styles.cardDesc, { color: colors.textMuted }]} numberOfLines={2}>{c.description}</Text>

        <View style={styles.metaRow}>
          <Clock size={12} color={colors.textMuted} />
          <Text style={[styles.metaText, { color: colors.textMuted }]}>
            {c.startDate ? new Date(c.startDate).toLocaleDateString("vi-VN") : t("challenges.no_limit")}
          </Text>
          <View style={[styles.dot, { backgroundColor: colors.textMuted }]} />
          <Text style={[styles.metaText, { color: colors.textMuted }]}>{t("challenges.goal", { goal })}</Text>
        </View>

        {joined && !completed && (
          <View style={styles.progressArea}>
            <View style={[styles.progressTrack, { backgroundColor: colors.bgSecondary }]}>
              <View style={[styles.progressFill, { width: `${percent}%` as any, backgroundColor: src.fg }]} />
            </View>
            <Text style={[styles.progressPct, { color: src.fg }]}>{progress}/{goal}</Text>
          </View>
        )}

        {joined && (
          <TouchableOpacity
            style={[styles.shareRow]}
            onPress={(e) => { e.stopPropagation(); shareChallenge(); }}
            activeOpacity={0.7}
          >
            <Share2 size={13} color="#60a5fa" />
            <Text style={styles.shareText}>{completed ? "Chia sẻ thành tích" : "Mời bạn bè tham gia"}</Text>
          </TouchableOpacity>
        )}

        {!joined && (
          <TouchableOpacity
            style={[styles.joinBtn, joiningId === c.id && styles.joinBtnDisabled]}
            disabled={joiningId === c.id}
            onPress={(e) => { e.stopPropagation(); onJoin(c.id); }}
          >
            <LinearGradient colors={src.gradient} style={styles.joinGradient}>
              <Text style={styles.joinText}>
                {joiningId === c.id ? t("challenges.joining") : t("challenges.join_button")}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
      </View>

      {/* Progress ring for ongoing */}
      {joined && !completed && (
        <ProgressRing percent={percent} color={src.fg} />
      )}

      {!joined && (
        <ChevronRight size={18} color={colors.textMuted} style={{ marginLeft: 4 }} />
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: Spacing.base, paddingTop: Spacing.xl },

  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
  },
  title: { ...Typography.xxxl, fontWeight: "800" },
  subtitle: { ...Typography.sm, marginTop: 2 },
  statBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(251,191,36,0.13)",
    borderRadius: Radius.md,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  statBadgeText: { fontSize: 12, fontWeight: "600" },

  section: { marginBottom: Spacing.lg },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  sectionTitle: { fontSize: 13, fontWeight: "700", letterSpacing: 0.5, textTransform: "uppercase" },

  card: {
    borderRadius: Radius.xl,
    borderWidth: 1,
    padding: Spacing.base,
    marginBottom: Spacing.sm,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.md,
  },
  iconPill: {
    width: 44,
    height: 44,
    borderRadius: Radius.lg,
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },
  cardBody: { flex: 1 },
  cardRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 2 },
  cardName: { fontSize: 15, fontWeight: "700", flex: 1 },
  completedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "rgba(52,211,153,0.13)",
    borderRadius: Radius.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  completedText: { color: "#34D399", fontSize: 10, fontWeight: "600" },
  cardDesc: { fontSize: 13, marginTop: 2, lineHeight: 18 },

  metaRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: Spacing.sm },
  metaText: { fontSize: 11 },
  dot: { width: 3, height: 3, borderRadius: 1.5 },

  progressArea: { flexDirection: "row", alignItems: "center", gap: Spacing.sm, marginTop: Spacing.sm },
  progressTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: { height: "100%", borderRadius: 3 },
  progressPct: { fontSize: 11, fontWeight: "700", minWidth: 32, textAlign: "right" },

  joinBtn: { marginTop: Spacing.md, borderRadius: Radius.lg, overflow: "hidden" },
  joinBtnDisabled: { opacity: 0.6 },
  joinGradient: { paddingVertical: 10, alignItems: "center" },
  joinText: { color: "white", fontSize: 13, fontWeight: "700" },
  shareRow: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 8 },
  shareText: { fontSize: 12, color: "#60a5fa", fontWeight: "600" },
});
