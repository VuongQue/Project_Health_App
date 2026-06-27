import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Lock, ChevronLeft, Award, Star, Share2 } from "lucide-react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { achievementApi } from "@/src/api/achievementApi";
import { communityApi } from "@/src/api/communityApi";
import { ACHIEVEMENT_ICONS } from "@/src/icons/achievementIcons";
import { useColors, Colors, Spacing, Radius, Typography } from "@/src/theme";
import { CardSkeleton } from "@/components/ui/SkeletonLoader";

const { width } = Dimensions.get("window");
const COLS = 2;
const CARD_SIZE = (width - Spacing.base * 2 - Spacing.sm) / COLS;

export default function AchievementsScreen() {
  const router = useRouter();
  const colors = useColors();
  const { t } = useTranslation();
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    achievementApi
      .myAchievements()
      .then((res) => setList(res.data ?? []))
      .finally(() => setLoading(false));
  }, []);

  const shareAchievement = (item: any) => {
    Alert.alert(
      "Chia sẻ thành tích",
      `Chia sẻ "${item.name ?? item.displayName}" lên cộng đồng?`,
      [
        { text: "Huỷ", style: "cancel" },
        {
          text: "Chia sẻ",
          onPress: async () => {
            try {
              await communityApi.createPost({
                content: `🏆 Tôi vừa mở khoá thành tích "${item.name ?? item.displayName}"!\n⭐ +${item.points ?? 0} điểm\n${item.hint ? `💡 ${item.hint}` : ""}\n#HealthHub #Achievement`,
              });
              Alert.alert("Đã chia sẻ!", "Thành tích của bạn đã được đăng lên cộng đồng.");
            } catch {
              Alert.alert("Lỗi", "Không thể chia sẻ. Thử lại sau.");
            }
          },
        },
      ]
    );
  };

  const unlockedCount = list.filter((a) => a.unlocked).length;
  const totalPoints = list
    .filter((a) => a.unlocked)
    .reduce((sum: number, a: any) => sum + (a.points ?? 0), 0);

  return (
    <View style={[styles.container, { backgroundColor: colors.bgSecondary }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
          <ChevronLeft size={22} color={colors.textSecondary} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>{t("achievements.title")}</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>{t("achievements.subtitle")}</Text>
        </View>
      </View>

      {/* Summary bar */}
      <View style={[styles.summary, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
        <View style={styles.summaryItem}>
          <Award size={20} color={colors.warning} />
          <View>
            <Text style={[styles.summaryValue, { color: colors.textPrimary }]}>{unlockedCount}/{list.length}</Text>
            <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>{t("achievements.unlocked")}</Text>
          </View>
        </View>
        <View style={[styles.summaryDivider, { backgroundColor: colors.border }]} />
        <View style={styles.summaryItem}>
          <Star size={20} color={colors.purple} />
          <View>
            <Text style={[styles.summaryValue, { color: colors.textPrimary }]}>{totalPoints}</Text>
            <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>{t("achievements.points")}</Text>
          </View>
        </View>
        <View style={[styles.summaryDivider, { backgroundColor: colors.border }]} />
        <View style={styles.summaryItem}>
          <View style={[styles.progressPill, { backgroundColor: colors.bgSecondary }]}>
            <View
              style={[
                styles.progressFill,
                { width: `${list.length ? (unlockedCount / list.length) * 100 : 0}%` as any },
              ]}
            />
          </View>
          <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>
            {t("achievements.completion", { percent: list.length ? Math.round((unlockedCount / list.length) * 100) : 0 })}
          </Text>
        </View>
      </View>

      {loading ? (
        <View style={{ paddingHorizontal: Spacing.base }}>
          <CardSkeleton />
          <CardSkeleton />
        </View>
      ) : (
        <FlatList
          data={list}
          keyExtractor={(i) => i.code ?? i.id}
          numColumns={COLS}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.grid}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const unlocked = item.unlocked === true;
            const code = item.code ?? "";
            const Icon = ACHIEVEMENT_ICONS[code] || Award;

            return (
              <View style={[styles.card, { width: CARD_SIZE, height: CARD_SIZE }]}>
                {unlocked ? (
                  <LinearGradient
                    colors={["#1e293b", "#243347"]}
                    style={styles.cardInner}
                  >
                    {/* Share button */}
                    <TouchableOpacity style={styles.shareBtn} onPress={() => shareAchievement(item)}>
                      <Share2 size={13} color="#60a5fa" />
                    </TouchableOpacity>

                    {/* Glow ring */}
                    <View style={styles.iconRing}>
                      <LinearGradient
                        colors={Colors.gradientWarm}
                        style={styles.iconGradient}
                      >
                        <Icon size={26} color="white" />
                      </LinearGradient>
                    </View>

                    <Text style={[styles.cardName, { color: colors.textPrimary }]} numberOfLines={2}>
                      {item.name ?? item.displayName}
                    </Text>

                    <View style={styles.pointsBadge}>
                      <Star size={10} color={colors.warning} fill={colors.warning} />
                      <Text style={styles.pointsText}>+{item.points ?? 0}</Text>
                    </View>

                    <Text style={[styles.cardDate, { color: colors.textMuted }]}>
                      {item.earnedAt
                        ? new Date(item.earnedAt).toLocaleDateString("vi-VN")
                        : ""}
                    </Text>
                  </LinearGradient>
                ) : (
                  <View style={[styles.cardInner, styles.lockedCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
                    <View style={styles.lockedIconWrap}>
                      <Icon size={24} color={colors.textDisabled} />
                      <Lock size={14} color={colors.textDisabled} style={styles.lockOverlay} />
                    </View>
                    <Text style={[styles.lockedName, { color: colors.textDisabled }]} numberOfLines={2}>
                      {item.displayName ?? item.name}
                    </Text>
                    <Text style={[styles.hint, { color: colors.textMuted }]} numberOfLines={2}>
                      {item.hint}
                    </Text>
                  </View>
                )}
              </View>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.base,
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

  summary: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: Spacing.base,
    borderRadius: Radius.xl,
    borderWidth: 1,
    padding: Spacing.base,
    marginBottom: Spacing.base,
    gap: Spacing.base,
  },
  summaryItem: { flex: 1, flexDirection: "row", alignItems: "center", gap: Spacing.sm },
  summaryDivider: { width: 1, height: 32 },
  summaryValue: { fontSize: 18, fontWeight: "700" },
  summaryLabel: { fontSize: 11, marginTop: 1 },
  progressPill: {
    height: 6,
    flex: 1,
    borderRadius: 3,
    overflow: "hidden",
    marginBottom: 4,
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#FBBF24",
    borderRadius: 3,
  },

  grid: { paddingHorizontal: Spacing.base, paddingBottom: 100 },
  row: { gap: Spacing.sm, marginBottom: Spacing.sm },

  card: { borderRadius: Radius.xl, overflow: "hidden" },
  cardInner: {
    flex: 1,
    padding: Spacing.md,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
  },
  lockedCard: { borderWidth: 1 },

  iconRing: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(251,191,36,0.13)",
    alignItems: "center",
    justifyContent: "center",
  },
  iconGradient: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },

  cardName: {
    fontSize: 12,
    fontWeight: "700",
    textAlign: "center",
    lineHeight: 16,
  },
  pointsBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "rgba(251,191,36,0.13)",
    borderRadius: Radius.sm,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  pointsText: { color: "#FBBF24", fontSize: 11, fontWeight: "700" },
  cardDate: { fontSize: 10 },
  shareBtn: { position: "absolute", top: 6, right: 6, padding: 4, backgroundColor: "rgba(96,165,250,0.15)", borderRadius: 6 },

  lockedIconWrap: { position: "relative", width: 52, height: 52, alignItems: "center", justifyContent: "center" },
  lockOverlay: { position: "absolute", bottom: 0, right: 0 },
  lockedName: {
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
    lineHeight: 16,
  },
  hint: { fontSize: 10, textAlign: "center", fontStyle: "italic", lineHeight: 14 },
});
