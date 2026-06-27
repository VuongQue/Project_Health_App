import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, Image, Modal,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import {
  Award, TrendingUp, Settings, Flame, Star, User, LogOut,
  Pencil, Dumbbell, ChevronRight, Shield, BarChart2,
} from "lucide-react-native";
import { useFocusEffect, useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { clearToken } from "@/src/utils/tokenStorage";
import { simpleCache } from "@/src/utils/simpleCache";
import { profileApi } from "@/src/api/profileApi";
import { UserProfile } from "@/src/types/profile";
import { ACHIEVEMENT_ICONS } from "@/src/icons/achievementIcons";
import { useColors, Colors, Shadow, Spacing, Radius, Typography, sw, sf } from "@/src/theme";
import { useTheme } from "@/src/context/ThemeContext";
import { useTranslation } from "react-i18next";
import { useScreenTour, useScreenTourStep } from "@/src/context/ScreenTourContext";

const LEVEL_THRESHOLDS = [0, 100, 250, 500, 1000, 2000, 4000, 7000, 11000, 16000];

function getLevelProgress(points: number, level: number) {
  const idx = Math.max(0, level - 1);
  const current = LEVEL_THRESHOLDS[idx] ?? 0;
  const next = LEVEL_THRESHOLDS[idx + 1] ?? current + 1;
  return Math.min(1, (points - current) / (next - current));
}

export default function ProfileScreen() {
  const router = useRouter();
  const colors = useColors();
  const { isDark } = useTheme();
  const { t } = useTranslation();
  const { startScreenTour } = useScreenTour();
  const tourStartedRef = useRef(false);
  const step0 = useScreenTourStep(0); // XP bar in hero
  const step1 = useScreenTourStep(1); // Stats row
  const step2 = useScreenTourStep(2); // Quick links (settings, stats...)

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showMenu, setShowMenu] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  useFocusEffect(useCallback(() => {
    const cached = simpleCache.get<UserProfile>("profile:me");
    if (cached) {
      setProfile(cached);
      setLoading(false);
      return;
    }
    profileApi.getMe().then((res) => {
      simpleCache.set("profile:me", res.data, 2 * 60_000);
      setProfile(res.data);
    }).finally(() => setLoading(false));
  }, []));

  useEffect(() => {
    if (!loading && !tourStartedRef.current) {
      tourStartedRef.current = true;
      startScreenTour('profile', [
        {
          id: 'xp',
          placement: 'bottom',
          icon: '⭐',
          title: 'Cấp độ & Điểm XP',
          body: 'Thanh tiến trình hiển thị XP hiện tại so với level tiếp theo. Nhấn nút bút chì để chỉnh sửa ảnh đại diện và thông tin cá nhân.',
        },
        {
          id: 'stats',
          placement: 'bottom',
          icon: '📊',
          title: 'Thống kê tổng hợp',
          body: 'Tổng số buổi tập, số huy hiệu đã mở khoá và streak ngày hoạt động liên tiếp hiện tại của bạn.',
        },
        {
          id: 'links',
          placement: 'top',
          icon: '⚙️',
          title: 'Công cụ & Cài đặt',
          body: 'Xem thống kê nâng cao (heatmap, biểu đồ), tất cả thành tích, báo cáo sức khoẻ, và thay đổi cài đặt app tại đây.',
        },
      ]);
    }
  }, [loading]);

  const handleLogout = async () => {
    await clearToken();
    await AsyncStorage.removeItem('@tour_pending');
    router.replace("/login");
  };

  if (loading || !profile) {
    return (
      <View style={[styles.center, { backgroundColor: colors.bgSecondary }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const { user, stats, badges } = profile;
  const previewBadges = (badges ?? []).slice(0, 6);
  const level = user.level ?? 1;
  const points = user.points ?? 0;
  const lvProgress = getLevelProgress(points, level);
  const nextLevelPts = LEVEL_THRESHOLDS[level] ?? LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1];

  return (
    <>
      <ScrollView style={[styles.container, { backgroundColor: colors.bgSecondary }]} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={[styles.hero, { backgroundColor: colors.bgPrimary, borderBottomColor: colors.border }]}>
          <TouchableOpacity style={[styles.settingsBtn, { backgroundColor: colors.bgCardElevated }]} onPress={() => setShowMenu(true)}>
            <Settings size={18} color={colors.textMuted} />
          </TouchableOpacity>

          {/* Avatar */}
          <View style={styles.avatarWrap}>
            {user.avatarUrl ? (
              <Image source={{ uri: user.avatarUrl }} style={[styles.avatarImg, { borderColor: colors.primary }]} />
            ) : (
              <LinearGradient colors={Colors.gradientPrimary} style={styles.avatarFallback}>
                <User size={38} color="white" />
              </LinearGradient>
            )}
            <TouchableOpacity style={[styles.editBadge, { backgroundColor: colors.primary, borderColor: colors.bgPrimary }]} onPress={() => router.push("/profile/edit")}>
              <Pencil size={11} color="white" />
            </TouchableOpacity>
          </View>

          <Text style={[styles.heroName, { color: colors.textPrimary }]}>{user.fullName}</Text>
          <Text style={[styles.heroUsername, { color: colors.textMuted }]}>@{user.username}</Text>

          <View style={styles.levelRow}>
            <View style={[styles.levelPill, { backgroundColor: colors.warningBg }]}>
              <Star size={9} color={colors.warning} fill={colors.warning} />
              <Text style={[styles.levelPillText, { color: colors.warning }]}>{t("profile.level", { level })}</Text>
            </View>
            <Text style={[styles.pointsText, { color: colors.textMuted }]}>{t("profile.xp", { points: points.toLocaleString() })}</Text>
          </View>

          {/* XP bar */}
          <View
            ref={step0.ref}
            onLayout={step0.measure}
            style={styles.xpWrap}
          >
            <View style={styles.xpRow}>
              <Text style={[styles.xpLabel, { color: colors.textMuted }]}>XP đến Level {level + 1}</Text>
              <Text style={[styles.xpVal, { color: colors.primary }]}>{points.toLocaleString()} / {nextLevelPts.toLocaleString()}</Text>
            </View>
            <View style={[styles.xpTrack, { backgroundColor: colors.border }]}>
              <LinearGradient colors={Colors.gradientPrimary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[styles.xpFill, { width: `${Math.round(lvProgress * 100)}%` as any }]} />
            </View>
          </View>
        </View>

        {/* Stats */}
        <View
          ref={step1.ref}
          onLayout={step1.measure}
          style={styles.statsRow}
        >
          {[
            { icon: <Dumbbell size={18} color={colors.primary} />, bg: colors.primaryBg, val: stats?.totalWorkouts ?? 0, label: t("profile.workouts") },
            { icon: <Award size={18} color={colors.purple} />, bg: colors.purpleBg, val: stats?.badgesEarned ?? 0, label: t("profile.badges") },
            { icon: <Flame size={18} color={colors.orange} />, bg: colors.orangeBg, val: stats?.currentStreak ?? 0, label: t("profile.streak") },
          ].map((s, i) => (
            <View key={i} style={[styles.statCard, { backgroundColor: colors.bgCard, borderColor: colors.border }, isDark ? {} : Shadow.sm]}>
              <View style={[styles.statIcon, { backgroundColor: s.bg }]}>{s.icon}</View>
              <Text style={[styles.statVal, { color: colors.textPrimary }]}>{s.val}</Text>
              <Text style={[styles.statLabel, { color: colors.textMuted }]}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Badges */}
        {previewBadges.length > 0 && (
          <View style={[styles.section, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>{t("profile.badges_section")}</Text>
              <TouchableOpacity style={styles.seeAllBtn} onPress={() => router.push("/achievements")}>
                <Text style={[styles.seeAll, { color: colors.primary }]}>{t("profile.see_all_badges")}</Text>
                <ChevronRight size={13} color={colors.primary} />
              </TouchableOpacity>
            </View>
            <View style={styles.badgeGrid}>
              {previewBadges.map((b, i) => {
                const Icon = ACHIEVEMENT_ICONS[b.code ?? ""] || Award;
                return (
                  <View key={i} style={styles.badgeCard}>
                    <View style={[styles.badgeIconWrap, { backgroundColor: colors.warningBg, borderColor: colors.warning + "25" }]}>
                      <Icon size={22} color={colors.warning} />
                    </View>
                    <Text style={[styles.badgeName, { color: colors.textSecondary }]} numberOfLines={2}>{b.name}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Quick links */}
        <View
          ref={step2.ref}
          onLayout={step2.measure}
          style={[styles.section, { backgroundColor: colors.bgCard, borderColor: colors.border }]}
        >
          {[
            { icon: <TrendingUp size={17} color={colors.primary} />, bg: colors.primaryBg, label: t("profile.advanced_stats"), route: "/advanced-stats" },
            { icon: <Award size={17} color={colors.warning} />, bg: colors.warningBg, label: t("profile.all_achievements"), route: "/achievements" },
            { icon: <BarChart2 size={17} color={colors.purple} />, bg: colors.purpleBg, label: t("profile.health_report"), route: "/health-report" },
            { icon: <Settings size={17} color={colors.textMuted} />, bg: colors.bgCardElevated, label: t("profile.settings"), route: "/settings" },
          ].map((item, i, arr) => (
            <TouchableOpacity key={i} style={[styles.linkRow, { borderBottomColor: colors.border }, i === arr.length - 1 && { borderBottomWidth: 0 }]} onPress={() => router.push(item.route as any)} activeOpacity={0.7}>
              <View style={[styles.linkIcon, { backgroundColor: item.bg }]}>{item.icon}</View>
              <Text style={[styles.linkLabel, { color: colors.textPrimary }]}>{item.label}</Text>
              <ChevronRight size={15} color={colors.textMuted} />
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={[styles.linkRow, { borderBottomWidth: 0 }]} onPress={() => setShowLogoutConfirm(true)} activeOpacity={0.7}>
            <View style={[styles.linkIcon, { backgroundColor: "rgba(239,68,68,0.12)" }]}><LogOut size={17} color={colors.danger} /></View>
            <Text style={[styles.linkLabel, { color: colors.danger }]}>{t("profile.logout")}</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Bottom sheet menu */}
      <Modal visible={showMenu} transparent animationType="slide">
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setShowMenu(false)} />
        <View style={[styles.sheet, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
          <View style={[styles.sheetHandle, { backgroundColor: colors.border }]} />
          <Text style={[styles.sheetTitle, { color: colors.textPrimary }]}>{t("profile.menu_title")}</Text>
          {[
            { icon: <Pencil size={17} color={colors.primary} />, bg: colors.primaryBg, label: t("profile.edit_profile"), action: () => { setShowMenu(false); router.push("/profile/edit"); } },
            { icon: <Settings size={17} color={colors.textSecondary} />, bg: colors.bgCardElevated, label: t("profile.settings"), action: () => { setShowMenu(false); router.push("/settings" as any); } },
            { icon: <LogOut size={17} color={colors.danger} />, bg: colors.dangerBg, label: t("profile.logout"), labelColor: colors.danger, action: () => { setShowMenu(false); setShowLogoutConfirm(true); } },
          ].map((item, i, arr) => (
            <TouchableOpacity key={i} style={[styles.sheetRow, { borderBottomColor: colors.border }, i === arr.length - 1 && { borderBottomWidth: 0 }]} onPress={item.action}>
              <View style={[styles.sheetIcon, { backgroundColor: item.bg }]}>{item.icon}</View>
              <Text style={[styles.sheetLabel, { color: colors.textPrimary }, item.labelColor ? { color: item.labelColor } : null]}>{item.label}</Text>
              <ChevronRight size={15} color={colors.textMuted} />
            </TouchableOpacity>
          ))}
        </View>
      </Modal>

      {/* Logout confirm */}
      <Modal visible={showLogoutConfirm} transparent animationType="fade">
        <View style={styles.confirmOverlay}>
          <View style={[styles.confirmBox, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
            <View style={styles.confirmIconWrap}>
              <LogOut size={26} color={colors.danger} />
            </View>
            <Text style={[styles.confirmTitle, { color: colors.textPrimary }]}>{t("profile.logout_title")}</Text>
            <Text style={[styles.confirmSub, { color: colors.textSecondary }]}>{t("profile.logout_msg")}</Text>
            <View style={styles.confirmBtns}>
              <TouchableOpacity style={[styles.confirmBtn, { backgroundColor: colors.bgCardElevated, borderColor: colors.border }]} onPress={() => setShowLogoutConfirm(false)}>
                <Text style={[styles.confirmBtnText, { color: colors.textSecondary }]}>{t("profile.logout_cancel")}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.confirmBtn, { backgroundColor: colors.danger }]} onPress={handleLogout}>
                <Text style={[styles.confirmBtnText, { color: "white" }]}>{t("profile.logout_confirm")}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingBottom: 20 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  hero: { paddingTop: sw(52), paddingHorizontal: Spacing.base, paddingBottom: Spacing.xl, alignItems: "center", borderBottomWidth: 1 },
  settingsBtn: { position: "absolute", top: sw(52), right: Spacing.base, width: sw(38), height: sw(38), borderRadius: Radius.lg, alignItems: "center", justifyContent: "center" },
  avatarWrap: { position: "relative", width: sw(88), height: sw(88), marginBottom: sw(12), marginTop: Spacing.sm },
  avatarImg: { width: sw(88), height: sw(88), borderRadius: sw(44), borderWidth: 2.5 },
  avatarFallback: { width: sw(88), height: sw(88), borderRadius: sw(44), alignItems: "center", justifyContent: "center" },
  editBadge: { position: "absolute", bottom: sw(2), right: sw(2), width: sw(24), height: sw(24), borderRadius: sw(12), alignItems: "center", justifyContent: "center", borderWidth: 2 },
  heroName: { fontSize: sf(22), fontWeight: "800", marginBottom: 3 },
  heroUsername: { fontSize: sf(13), marginBottom: Spacing.sm },
  levelRow: { flexDirection: "row", alignItems: "center", gap: Spacing.sm, marginBottom: Spacing.base },
  levelPill: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: sw(10), paddingVertical: sw(5), borderRadius: Radius.full },
  levelPillText: { fontSize: sf(11), fontWeight: "700" },
  pointsText: { fontSize: sf(12) },
  xpWrap: { width: "100%", marginTop: sw(4) },
  xpRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: sw(6) },
  xpLabel: { fontSize: sf(12) },
  xpVal: { fontSize: sf(12), fontWeight: "600" },
  xpTrack: { height: sw(6), borderRadius: sw(3), overflow: "hidden" },
  xpFill: { height: "100%", borderRadius: sw(3) },

  statsRow: { flexDirection: "row", gap: Spacing.sm, marginHorizontal: Spacing.base, marginTop: -Spacing.base, marginBottom: Spacing.base },
  statCard: { flex: 1, borderRadius: Radius.xl, padding: Spacing.md, alignItems: "center", gap: 5, borderWidth: 1 },
  statIcon: { width: sw(38), height: sw(38), borderRadius: sw(11), justifyContent: "center", alignItems: "center", marginBottom: 2 },
  statVal: { fontSize: sf(22), fontWeight: "800" },
  statLabel: { fontSize: sf(11) },

  section: { marginHorizontal: Spacing.base, marginBottom: Spacing.base, borderRadius: Radius.xl, borderWidth: 1, overflow: "hidden" },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: Spacing.base, paddingTop: Spacing.base, paddingBottom: Spacing.sm },
  sectionTitle: { ...Typography.md, fontWeight: "700" },
  seeAllBtn: { flexDirection: "row", alignItems: "center", gap: 2 },
  seeAll: { ...Typography.xs, fontWeight: "600" },
  badgeGrid: { flexDirection: "row", flexWrap: "wrap", padding: Spacing.sm, gap: Spacing.sm },
  badgeCard: { width: "30%", alignItems: "center", padding: Spacing.sm, gap: Spacing.xs },
  badgeIconWrap: { width: sw(50), height: sw(50), borderRadius: Radius.lg, alignItems: "center", justifyContent: "center", borderWidth: 1 },
  badgeName: { fontSize: sf(10), textAlign: "center" },

  linkRow: { flexDirection: "row", alignItems: "center", gap: Spacing.md, paddingVertical: Spacing.base, paddingHorizontal: Spacing.base, borderBottomWidth: 1 },
  linkIcon: { width: sw(36), height: sw(36), borderRadius: sw(10), alignItems: "center", justifyContent: "center" },
  linkLabel: { flex: 1, fontSize: sf(15), fontWeight: "500" },

  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.6)" },
  sheet: { position: "absolute", bottom: 0, left: 0, right: 0, borderTopLeftRadius: Radius.xxl, borderTopRightRadius: Radius.xxl, padding: Spacing.base, paddingBottom: sw(40), borderTopWidth: 1 },
  sheetHandle: { width: sw(36), height: sw(4), borderRadius: 2, alignSelf: "center", marginBottom: Spacing.base },
  sheetTitle: { fontSize: sf(18), fontWeight: "700", marginBottom: Spacing.base },
  sheetRow: { flexDirection: "row", alignItems: "center", gap: Spacing.md, paddingVertical: Spacing.base, borderBottomWidth: 1 },
  sheetIcon: { width: sw(40), height: sw(40), borderRadius: Radius.md, alignItems: "center", justifyContent: "center" },
  sheetLabel: { flex: 1, fontSize: sf(15), fontWeight: "500" },

  confirmOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "center", alignItems: "center" },
  confirmBox: { width: "82%", borderRadius: Radius.xxl, padding: Spacing.xl, alignItems: "center", borderWidth: 1 },
  confirmIconWrap: { width: sw(58), height: sw(58), borderRadius: sw(29), backgroundColor: "rgba(239,68,68,0.12)", alignItems: "center", justifyContent: "center", marginBottom: Spacing.base },
  confirmTitle: { fontSize: sf(18), fontWeight: "700", marginBottom: Spacing.sm },
  confirmSub: { fontSize: sf(14), textAlign: "center", marginBottom: Spacing.lg },
  confirmBtns: { flexDirection: "row", gap: Spacing.sm, width: "100%" },
  confirmBtn: { flex: 1, paddingVertical: sw(12), borderRadius: Radius.xl, alignItems: "center", borderWidth: 1 },
  confirmBtnText: { fontSize: sf(15), fontWeight: "600" },
});
