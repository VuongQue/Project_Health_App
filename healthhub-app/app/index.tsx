import { useEffect, useState } from "react";
import { Redirect } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getToken } from "@/src/utils/tokenStorage";
import { View, ActivityIndicator } from "react-native";
import { Colors } from "@/src/theme";

export default function Index() {
  const [ready, setReady] = useState(false);
  const [target, setTarget] = useState<string>("/(auth)/login");

  useEffect(() => {
    (async () => {
      const token = await getToken();
      if (!token) {
        setTarget("/(auth)/login");
        setReady(true);
        return;
      }
      const seen = await AsyncStorage.getItem("hasSeenOnboarding");
      if (!seen) {
        setTarget("/onboarding");
      } else {
        setTarget("/(tabs)/(personal)");
      }
      setReady(true);
    })();
  }, []);

  if (!ready) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.bgSecondary, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator color={Colors.primary} size="large" />
      </View>
    );
  }

  return <Redirect href={target as any} />;
}
