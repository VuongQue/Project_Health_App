import "../src/i18n";
import { Stack } from "expo-router";
import NotificationProvider, { useNotifications } from "./notifications/NotificationContext";
import AchievementPopup from "../components/achievement/AchievementPopup";
import { ThemeProvider } from "../src/context/ThemeContext";
import { LanguageProvider } from "../src/context/LanguageContext";
import { CompanionProvider } from "../src/context/CompanionContext";
import { TourProvider } from "../src/context/TourContext";
import { ScreenTourProvider } from "../src/context/ScreenTourContext";
import TourOverlay from "../components/tour/TourOverlay";
import ScreenTourOverlay from "../components/tour/ScreenTourOverlay";

function AppShell() {
  const { pendingAchievement, clearAchievement } = useNotifications();

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="onboarding/index" />
        <Stack.Screen name="modal" options={{ presentation: "modal" }} />
        <Stack.Screen name="ai/coach" />
        <Stack.Screen name="ai/daily-insight" />
        <Stack.Screen name="ai/meal-analyzer" />
        <Stack.Screen name="ai/workout-planner" />
        <Stack.Screen name="health-journey/index" />
        <Stack.Screen name="weekly-summary/index" />
        <Stack.Screen name="streak/index" />
        <Stack.Screen name="health-alerts/index" />
        <Stack.Screen name="steps-challenge/index" />
        <Stack.Screen name="auth/google/callback" />
      </Stack>

      <AchievementPopup achievement={pendingAchievement} onClose={clearAchievement} />
      <TourOverlay />
      <ScreenTourOverlay />
    </>
  );
}

export default function RootLayout() {
  return (
    <LanguageProvider>
      <ThemeProvider>
        <NotificationProvider>
          <CompanionProvider>
            <TourProvider>
              <ScreenTourProvider>
                <AppShell />
              </ScreenTourProvider>
            </TourProvider>
          </CompanionProvider>
        </NotificationProvider>
      </ThemeProvider>
    </LanguageProvider>
  );
}
