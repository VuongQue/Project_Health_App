import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import React from "react";

export function ScreenContainer({ children }: { children: React.ReactNode }) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{
        flex: 1,
        paddingBottom: insets.bottom + 80, 
        backgroundColor: "#0f172a", 
      }}
    >
      {children}
    </View>
  );
}
