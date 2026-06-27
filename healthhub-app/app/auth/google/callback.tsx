import { useEffect } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { saveToken } from "@/src/utils/tokenStorage";
import { useColors } from "@/src/theme";

export default function GoogleCallbackScreen() {
  const { accessToken, refreshToken, userId } = useLocalSearchParams<{
    accessToken: string;
    refreshToken: string;
    userId: string;
  }>();
  const router = useRouter();
  const colors = useColors();

  useEffect(() => {
    const handleCallback = async () => {
      if (!accessToken) {
        router.replace("/(auth)/login" as any);
        return;
      }
      try {
        await saveToken(accessToken);
        if (refreshToken) await AsyncStorage.setItem("refresh_token", refreshToken);
        const seen = await AsyncStorage.getItem("hasSeenOnboarding");
        router.replace(seen ? "/(tabs)/(personal)" : "/onboarding" as any);
      } catch {
        router.replace("/(auth)/login" as any);
      }
    };
    handleCallback();
  }, [accessToken]);

  return (
    <View style={[styles.container, { backgroundColor: colors.bgPrimary }]}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center" },
});
