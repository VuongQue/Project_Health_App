import { Stack } from "expo-router";
import NotificationProvider from "./notifications/NotificationContext";
import AchievementPopup from "../components/achievement/AchievementPopup";
import { useAchievementRealtime } from "../src/realtime/useAchievementRealtime";

export default function RootLayout() {
  // 🔥 Realtime achievement
  const { achievement, clearAchievement } = useAchievementRealtime();

  return (
    <NotificationProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="modal" options={{ presentation: "modal" }} />
      </Stack>

      {/* 🔥 POPUP HIỆN TOÀN APP */}
      <AchievementPopup
        achievement={achievement}
        onClose={clearAchievement}
      />
    </NotificationProvider>
  );
}

