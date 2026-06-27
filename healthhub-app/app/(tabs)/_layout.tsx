import { Slot, usePathname } from "expo-router";
import { View, StyleSheet } from "react-native";
import { useState } from "react";
import CustomBottomTabs from "@/components/navigation/CustomBottomTabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/src/theme";

const HIDE_TAB_ROUTES = ["/story/"];

export default function TabsLayout() {
  const [mode, setMode] = useState<"personal" | "community">("personal");
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const colors = useColors();

  const TAB_BAR_HEIGHT = 68;
  const hideTab = HIDE_TAB_ROUTES.some((r) => pathname.includes(r));

  return (
    <View style={[styles.container, { backgroundColor: colors.bgSecondary }]}>
      <View style={[styles.screenWrapper, { paddingBottom: hideTab ? 0 : TAB_BAR_HEIGHT + insets.bottom, backgroundColor: colors.bgSecondary }]}>
        <Slot />
      </View>

      {!hideTab && <CustomBottomTabs mode={mode} setMode={setMode} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  screenWrapper: {
    flex: 1,
  },
});
