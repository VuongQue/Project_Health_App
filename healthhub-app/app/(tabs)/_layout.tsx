import { Slot } from "expo-router";
import { View, StyleSheet } from "react-native";
import { useState } from "react";
import CustomBottomTabs from "@/components/navigation/CustomBottomTabs";

export default function TabsLayout() {
  const [mode, setMode] = useState<"personal" | "community">("personal");

  return (
    <View style={styles.container}>
      <Slot />

      <CustomBottomTabs mode={mode} setMode={setMode} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 }
});
