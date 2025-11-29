import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Home, Dumbbell, Heart, User, Globe, Bell, Leaf } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { routes } from "@/src/navigation/routes";
import React from "react";

// ---- TYPES ----
type Mode = "personal" | "community";

interface TabsProps {
  mode: Mode;
  setMode: (m: Mode) => void;
}

interface TabItemProps {
  label: string;
  icon: React.ReactNode;
  onPress: () => void;
}

// ---- MAIN COMPONENT ----
export default function CustomBottomTabs({ mode, setMode }: TabsProps) {
  const router = useRouter();

  const go = (path: string) => router.replace(path as any);

  const isPersonal = mode === "personal";
  const isCommunity = mode === "community";

  return (
    <View style={styles.container}>
      <View style={styles.tabWrapper}>

        {isPersonal && (
          <>
            <TabItem label="Home" icon={<Home size={24} />} onPress={() => go(routes.personal.home)} />
            <TabItem label="Fitness" icon={<Dumbbell size={24} />} onPress={() => go(routes.personal.fitness)} />

            <View style={{ width: 70 }} />

            <TabItem label="Mood" icon={<Heart size={24} />} onPress={() => go(routes.personal.mood)} />
            <TabItem label="Profile" icon={<User size={24} />} onPress={() => go(routes.personal.profile)} />
          </>
        )}

        {isCommunity && (
          <>
            <TabItem label="Feed" icon={<User size={24} />} onPress={() => go(routes.community.feed)} />
            <TabItem label="Friends" icon={<Leaf size={24} />} onPress={() => go(routes.community.friends)} />

            <View style={{ width: 70 }} />

            <TabItem label="Alerts" icon={<Bell size={24} />} onPress={() => go(routes.community.alerts)} />
            <TabItem label="Profile" icon={<User size={24} />} onPress={() => go(routes.community.profile)} />
          </>
        )}

        {/* SWITCH MODE */}
        <TouchableOpacity
            onPress={() => {
              if (isPersonal) {
                setMode("community");
                router.replace(routes.community.feed as any);   
              } else {
                setMode("personal");
                router.replace(routes.personal.home as any);    
              }
            }}
            style={styles.fabWrapper}
          >
          <LinearGradient colors={["#3b82f6", "#6366f1"]} style={styles.fab}>
            {isPersonal ? <Globe size={32} color="white" /> : <Home size={32} color="white" />}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ---- TAB ITEM ----
function TabItem({ label, icon, onPress }: TabItemProps) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.tabItem}>
      {icon}
      <Text style={styles.tabLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

// ---- STYLES ----
const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    alignItems: "center",
    paddingBottom: 10,
  },
  tabWrapper: {
    width: "100%",
    maxWidth: 400,
    height: 70,
    backgroundColor: "#1e293b",
    borderRadius: 30,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
  },
  tabItem: {
    alignItems: "center",
    width: 65,
  },
  tabLabel: {
    color: "#94a3b8",
    fontSize: 11,
    marginTop: 4,
  },
  fabWrapper: {
    position: "absolute",
    top: -30,
    left: "50%",
    transform: [{ translateX: -35 }],
  },
  fab: {
    width: 70,
    height: 70,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    elevation: 10,
  },
});
