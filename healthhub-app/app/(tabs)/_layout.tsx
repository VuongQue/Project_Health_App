import { Slot } from "expo-router";
import { View, StyleSheet } from "react-native";
import { useState } from "react";
import CustomBottomTabs from "@/components/navigation/CustomBottomTabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function TabsLayout() {
  const [mode, setMode] = useState<"personal" | "community">("personal");
  const insets = useSafeAreaInsets();

  // Chiều cao thanh tab của bạn
  const TAB_BAR_HEIGHT = 80; // có thể chỉnh 70–90 tùy UI

  return (
    <View style={styles.container}>
      {/* SAFE AREA WRAPPER FOR ALL SCREENS */}
      <View style={[styles.screenWrapper, { paddingBottom: TAB_BAR_HEIGHT + insets.bottom }]}>
        <Slot />
      </View>

      {/* CUSTOM TAB BAR */}
      <CustomBottomTabs mode={mode} setMode={setMode} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  screenWrapper: {
    flex: 1,
    backgroundColor: "#0A0F1F", 
  },
});
