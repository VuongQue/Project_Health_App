import { Platform } from "react-native";
import Constants from "expo-constants";

// Khi chạy trên simulator/device, localhost trỏ về máy tính host
// Android emulator dùng 10.0.2.2, iOS simulator dùng localhost
// Thiết bị thật dùng IP LAN của máy dev
function getBaseUrl(): string {
  const PORT = 4000;

  // Expo Go / dev client trên thiết bị thật → dùng IP máy host từ manifest
  if (__DEV__) {
    // Web browser dùng local backend
    if (Platform.OS === "web") return `http://localhost:${PORT}`;

    const debuggerHost =
      Constants.expoConfig?.hostUri ??
      (Constants as any).manifest?.debuggerHost ??
      (Constants as any).manifest2?.extra?.expoGo?.debuggerHost;

    if (debuggerHost) {
      const host = debuggerHost.split(":")[0];
      return `http://${host}:${PORT}`;
    }

    if (Platform.OS === "android") return `http://10.0.2.2:${PORT}`;
    return `http://localhost:${PORT}`;
  }

  // Production build
  return "https://healthhub-app.duckdns.org";
}

export const API_BASE_URL = getBaseUrl();
