import { Stack } from "expo-router";
import NotificationProvider from "./notifications/NotificationContext";

export default function RootLayout() {
  return (
    <NotificationProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="modal" options={{ presentation: "modal" }} />
      </Stack>
    </NotificationProvider>
  );
}
