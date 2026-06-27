import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Home, Dumbbell, Heart, User, Globe, Users, Users2, Calendar } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter, usePathname } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { routes } from "@/src/navigation/routes";
import { useColors, Colors, Radius, Shadow, sw, sf } from "@/src/theme";
import { useTheme } from "@/src/context/ThemeContext";
import axiosClient from "@/src/api/axiosClient";
import { getToken } from "@/src/utils/tokenStorage";

const ICON = 22;

type Mode = "personal" | "community";

interface TabsProps {
  mode: Mode;
  setMode: (m: Mode) => void;
}

interface TabItem {
  icon: (active: boolean, color: string) => React.ReactNode;
  route: string;
}

export default function CustomBottomTabs({ mode, setMode }: TabsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { isDark } = useTheme();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetch = async () => {
      try {
        const token = await getToken();
        if (!token) return;
        const res = await axiosClient.get("/notifications/unread-count");
        setUnreadCount(res.data?.count ?? res.data ?? 0);
      } catch {}
    };
    fetch();
    const id = setInterval(fetch, 30000);
    return () => clearInterval(id);
  }, []);

  const PERSONAL_TABS: TabItem[] = [
    { icon: (a, c) => <Home  size={ICON} color={c} strokeWidth={a ? 2.5 : 1.7} />, route: routes.personal.home },
    { icon: (a, c) => <Dumbbell size={ICON} color={c} strokeWidth={a ? 2.5 : 1.7} />, route: routes.personal.fitness },
    { icon: (a, c) => <Heart size={ICON} color={c} strokeWidth={a ? 2.5 : 1.7} fill={a ? c + "30" : "transparent"} />, route: routes.personal.mood },
    { icon: (a, c) => <User  size={ICON} color={c} strokeWidth={a ? 2.5 : 1.7} />, route: routes.personal.profile },
  ];

  const COMMUNITY_TABS: TabItem[] = [
    { icon: (a, c) => <Globe     size={ICON} color={c} strokeWidth={a ? 2.5 : 1.7} />, route: routes.community.feed },
    { icon: (a, c) => <Users     size={ICON} color={c} strokeWidth={a ? 2.5 : 1.7} />, route: routes.community.friends },
    { icon: (a, c) => <Users2    size={ICON} color={c} strokeWidth={a ? 2.5 : 1.7} />, route: routes.community.groups },
    { icon: (a, c) => <Calendar  size={ICON} color={c} strokeWidth={a ? 2.5 : 1.7} />, route: routes.community.events },
  ];

  const tabs = mode === "personal" ? PERSONAL_TABS : COMMUNITY_TABS;
  const leftTabs = tabs.slice(0, 2);
  const rightTabs = tabs.slice(2);

  const isActive = (route: string) => {
    const n = `/${route}`;
    return pathname === n || pathname.startsWith(n + "/");
  };

  const go = (path: string) => router.replace(path as any);

  const handleModeSwitch = () => {
    const next = mode === "personal" ? "community" : "personal";
    setMode(next);
    go(next === "community" ? routes.community.feed : routes.personal.home);
  };

  const barShadow = isDark
    ? { shadowColor: "#000", shadowOpacity: 0.35, shadowRadius: 24, shadowOffset: { width: 0, height: -4 }, elevation: 16 }
    : { shadowColor: "#000", shadowOpacity: 0.07, shadowRadius: 16, shadowOffset: { width: 0, height: -2 }, elevation: 8 };

  return (
    <View style={[styles.wrapper, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      <View style={[styles.bar, { backgroundColor: colors.bgCard, borderTopColor: colors.border }, barShadow]}>

        {/* Left tabs */}
        <View style={styles.group}>
          {leftTabs.map((tab) => {
            const active = isActive(tab.route);
            const iconColor = active ? colors.primary : colors.textMuted;
            return (
              <TouchableOpacity key={tab.route} onPress={() => go(tab.route)} style={styles.tab} activeOpacity={0.6}>
                <View style={[styles.iconPill, active && { backgroundColor: colors.primaryBg }]}>
                  {tab.icon(active, iconColor)}
                </View>
                {active && <View style={[styles.dot, { backgroundColor: colors.primary }]} />}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* FAB */}
        <View style={styles.fabWrap}>
          <TouchableOpacity onPress={handleModeSwitch} activeOpacity={0.8}>
            <LinearGradient
              colors={mode === "personal" ? Colors.gradientPrimary : Colors.gradientPurple}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={[styles.fab, { borderColor: colors.bgCard }]}
            >
              {mode === "personal"
                ? <Globe size={20} color="white" strokeWidth={2} />
                : <Home  size={20} color="white" strokeWidth={2} />}
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Right tabs */}
        <View style={styles.group}>
          {rightTabs.map((tab) => {
            const active = isActive(tab.route);
            const iconColor = active ? colors.primary : colors.textMuted;
            const isProfileTab = tab.route === routes.personal.profile;
            return (
              <TouchableOpacity key={tab.route} onPress={() => go(tab.route)} style={styles.tab} activeOpacity={0.6}>
                <View style={[styles.iconPill, active && { backgroundColor: colors.primaryBg }]}>
                  {tab.icon(active, iconColor)}
                  {isProfileTab && unreadCount > 0 && (
                    <View style={[styles.badge, { backgroundColor: colors.danger, borderColor: colors.bgCard }]} />
                  )}
                </View>
                {active && <View style={[styles.dot, { backgroundColor: colors.primary }]} />}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const FAB = sw(50);

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    bottom: 0, left: 0, right: 0,
  },
  bar: {
    flexDirection: "row",
    alignItems: "center",
    borderTopWidth: 1,
    paddingHorizontal: sw(8),
    paddingTop: sw(8),
  },
  group: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
  },
  tab: {
    alignItems: "center",
    paddingBottom: sw(2),
  },
  iconPill: {
    width: sw(46),
    height: sw(36),
    borderRadius: Radius.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  dot: {
    width: sw(4),
    height: sw(4),
    borderRadius: sw(2),
    marginTop: sw(3),
  },
  badge: {
    position: "absolute",
    top: sw(5),
    right: sw(7),
    width: sw(7),
    height: sw(7),
    borderRadius: sw(4),
    borderWidth: 1.5,
  },
  chatBadge: {
    position: "absolute",
    top: sw(3),
    right: sw(4),
    minWidth: sw(16),
    paddingHorizontal: sw(3),
    paddingVertical: sw(1),
    borderRadius: sw(8),
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  chatBadgeText: {
    color: "white",
    fontSize: sf(9),
    fontWeight: "bold",
    lineHeight: sf(12),
  },
  // FAB
  fabWrap: {
    alignItems: "center",
    width: FAB + sw(20),
    marginTop: -(FAB / 2 + sw(8)),
  },
  fab: {
    width: FAB,
    height: FAB,
    borderRadius: FAB / 2,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#3B82F6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 10,
    borderWidth: sw(3),
  },
});
