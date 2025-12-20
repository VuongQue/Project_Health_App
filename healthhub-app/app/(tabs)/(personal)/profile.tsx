import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
  Modal,
} from "react-native";

import {
  Award,
  TrendingUp,
  Settings,
  Flame,
  Star,
  User,
  LogOut,
  Pencil,
} from "lucide-react-native";

import { useRouter } from "expo-router";
import { clearToken } from "@/src/utils/tokenStorage";
import { profileApi } from "@/src/api/profileApi";
import { UserProfile } from "@/src/types/profile";
import { ACHIEVEMENT_ICONS } from "@/src/icons/achievementIcons";

export default function ProfileScreen() {
  const router = useRouter();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const [showSettings, setShowSettings] = useState(false);
  const [showConfirmLogout, setShowConfirmLogout] = useState(false);

  useEffect(() => {
    profileApi
      .getMe()
      .then((res) => setProfile(res.data))
      .finally(() => setLoading(false));
  }, []);

  const handleLogout = async () => {
    await clearToken();
    router.replace("/login");
  };

  if (loading || !profile) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  const { user, stats, badges, challenges } = profile;
  const previewBadges = badges?.slice(0, 6) ?? [];

  return (
    <>
      <ScrollView style={styles.container}>
        {/* ===== HEADER ===== */}
        <View style={styles.header}>
          <View style={styles.row}>
            <View style={styles.avatar}>
              {user.avatarUrl ? (
                <Image source={{ uri: user.avatarUrl }} style={styles.avatarImg} />
              ) : (
                <User size={40} color="white" />
              )}
            </View>

            <View>
              <Text style={styles.title}>{user.fullName}</Text>
              <Text style={styles.subtitle}>@{user.username}</Text>

              <View style={styles.row}>
                <View style={styles.levelTag}>
                  <Star size={12} color="#60a5fa" />
                  <Text style={styles.levelText}>Level {user.level || 1}</Text>
                </View>
                <Text style={styles.points}>{user.points || 0} pts</Text>
              </View>
            </View>
          </View>

          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => setShowSettings(true)}
          >
            <Settings color="#cbd5e1" size={20} />
          </TouchableOpacity>
        </View>

        {/* ===== STATS ===== */}
        <View style={styles.rowWrap}>
          <StatBox
            label="Total Workouts"
            value={stats.totalWorkouts}
            color="#3b82f6"
            icon={TrendingUp}
          />
          <StatBox
            label="Badges Earned"
            value={stats.badgesEarned}
            color="#a855f7"
            icon={Award}
          />
          <StatBox
            label="Current Streak"
            value={stats.currentStreak}
            color="#f97316"
            icon={Flame}
          />
        </View>

        {/* ===== CHALLENGES ===== */}
        <Text style={styles.sectionTitle}>Active Challenges</Text>
        {challenges?.map((ch, i) => (
          <View key={i} style={styles.challengeCard}>
            <View style={styles.rowBetween}>
              <Text style={styles.textWhite}>{ch.name}</Text>
              <Text style={styles.textMuted}>
                {ch.daysCompleted}/{ch.totalDays}
              </Text>
            </View>

            <View style={styles.progressBg}>
              <View style={[styles.progressFill, { width: `${ch.progress}%` }]} />
            </View>
          </View>
        ))}

        {/* ===== BADGES (UNLOCKED ONLY) ===== */}
        <View style={styles.badgeHeader}>
          <Text style={styles.sectionTitle}>Badges</Text>
          <TouchableOpacity onPress={() => router.push("/achievements")}>
            <Text style={styles.linkText}>View All</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.badgeGrid}>
          {previewBadges.map((b, i) => {
            const code = b.code ?? "";
            const Icon = ACHIEVEMENT_ICONS[code] || Award;

            return (
              <View key={i} style={[styles.badgeCard, styles.badgeUnlocked]}>
                <Icon size={28} color="#facc15" />
                <Text style={styles.badgeName}>{b.name}</Text>
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* ===== SETTINGS ===== */}
      <Modal visible={showSettings} transparent animationType="slide">
        <TouchableOpacity
          style={styles.modalOverlay}
          onPress={() => setShowSettings(false)}
        />
        <View style={styles.sheet}>
          <TouchableOpacity
            style={styles.sheetBtn}
            onPress={() => {
              setShowSettings(false);
              router.push("/profile/edit");
            }}
          >
            <Pencil size={20} color="white" />
            <Text style={styles.sheetText}>Edit Profile</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.sheetBtn, { backgroundColor: "#ef4444" }]}
            onPress={() => {
              setShowSettings(false);
              setShowConfirmLogout(true);
            }}
          >
            <LogOut size={20} color="white" />
            <Text style={styles.sheetText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      {/* ===== LOGOUT CONFIRM ===== */}
      <Modal visible={showConfirmLogout} transparent animationType="fade">
        <View style={styles.centerBox}>
          <View style={styles.confirmBox}>
            <Text style={styles.confirmTitle}>Đăng xuất?</Text>
            <Text style={styles.confirmSubtitle}>
              Bạn có chắc muốn đăng xuất tài khoản?
            </Text>

            <View style={styles.confirmActions}>
              <TouchableOpacity
                style={[styles.confirmBtn, { backgroundColor: "#334155" }]}
                onPress={() => setShowConfirmLogout(false)}
              >
                <Text style={styles.confirmText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.confirmBtn, { backgroundColor: "#ef4444" }]}
                onPress={handleLogout}
              >
                <Text style={styles.confirmText}>Logout</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

/* ===== SMALL COMPONENT ===== */
function StatBox({ label, value, icon: Icon, color }: any) {
  return (
    <View style={styles.statBox}>
      <View style={[styles.iconBox, { backgroundColor: color + "20" }]}>
        <Icon color={color} size={18} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

/* ===== STYLES ===== */
// ⚠️ styles giữ nguyên như bạn đang dùng (không thay đổi)


/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: { backgroundColor: "#0f172a", flex: 1, padding: 16 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },

  row: { flexDirection: "row", alignItems: "center", gap: 8 },
  rowBetween: { flexDirection: "row", justifyContent: "space-between" },

  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#3b82f6",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },

  avatarImg: { width: "100%", height: "100%", borderRadius: 36 },

  title: { color: "white", fontSize: 20, fontWeight: "bold" },
  subtitle: { color: "#94a3b8", fontSize: 13 },

  levelTag: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(37,99,235,0.2)",
    paddingHorizontal: 6,
    borderRadius: 8,
  },

  levelText: { color: "#60a5fa", fontSize: 11, marginLeft: 4 },
  points: { color: "#64748b", fontSize: 11 },

  iconBtn: {
  width: 44,             
  height: 44,             
  borderRadius: 14,
  backgroundColor: "#1e293b",
  alignItems: "center",
  justifyContent: "center",
  alignSelf: "center", 


  shadowColor: "#000",
  shadowOpacity: 0.25,
  shadowRadius: 6,
  elevation: 4,
},


  rowWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 10,
  },

  statBox: {
    width: "48%",
    backgroundColor: "#1e293b",
    borderWidth: 1,
    borderColor: "#334155",
    borderRadius: 16,
    padding: 12,
  },

  iconBox: { padding: 8, borderRadius: 10, marginBottom: 4 },
  statValue: { color: "white", fontSize: 20, fontWeight: "600" },
  statLabel: { color: "#94a3b8", fontSize: 12 },

  sectionTitle: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    marginVertical: 12,
  },

  challengeCard: {
    backgroundColor: "#1e293b",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#334155",
    padding: 12,
    marginBottom: 10,
  },

  textWhite: { color: "white" },
  textMuted: { color: "#94a3b8", fontSize: 13 },

  progressBg: {
    backgroundColor: "#334155",
    borderRadius: 4,
    height: 8,
    marginTop: 6,
  },

  progressFill: {
    height: "100%",
    borderRadius: 4,
    backgroundColor: "#2563eb",
  },

  badgeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  linkText: { color: "#3b82f6", fontSize: 13 },

  badgeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },

  badgeCard: {
    width: "30%",
    borderRadius: 16,
    alignItems: "center",
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
  },

  badgeUnlocked: {
    backgroundColor: "#1e293b",
    borderColor: "#facc15",
  },

  badgeLocked: {
    backgroundColor: "#0f172a",
    borderColor: "#334155",
    opacity: 0.6,
  },

  badgeName: {
    color: "white",
    fontSize: 11,
    textAlign: "center",
    marginTop: 6,
  },

  modalOverlay: {
    backgroundColor: "rgba(0,0,0,0.5)",
    position: "absolute",
    inset: 0,
  },

  sheet: {
    backgroundColor: "#1e293b",
    padding: 16,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    position: "absolute",
    bottom: 0,
    width: "100%",
  },

  sheetBtn: {
    padding: 14,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#334155",
    marginBottom: 10,
  },

  sheetText: { color: "white", fontSize: 16, fontWeight: "500" },

  centerBox: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.6)",
  },

  confirmBox: {
    width: "80%",
    backgroundColor: "#1e293b",
    padding: 20,
    borderRadius: 16,
  },

  confirmTitle: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 6,
  },

  confirmSubtitle: {
    color: "#94a3b8",
    fontSize: 14,
    marginBottom: 16,
  },

  confirmActions: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  confirmBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    marginHorizontal: 5,
    alignItems: "center",
  },

  confirmText: { color: "white", fontSize: 15, fontWeight: "500" },
});
