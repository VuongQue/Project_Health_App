import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: "slide_from_right" }}>
      <Stack.Screen name="(tabs)"/>
      <Stack.Screen name="modal" options={{ presentation: "modal" }} />
      <Stack.Screen name="notifications" />
    </Stack>
  );
}
