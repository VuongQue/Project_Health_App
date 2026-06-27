import { Platform } from "react-native";
import Constants from "expo-constants";

// Khi chạy trên simulator/device, localhost trỏ về máy tính host
// Android emulator dùng 10.0.2.2, iOS simulator dùng localhost
// Thiết bị thật dùng IP LAN của máy dev
function getBaseUrl(): string {
  const PORT = 4000;

  // Expo Go / dev client trên thiết bị thật → dùng IP máy host từ manifest
  if (__DEV__) {
    const debuggerHost =
      Constants.expoConfig?.hostUri ??          // Expo SDK 49+
      (Constants as any).manifest?.debuggerHost ?? // Expo SDK cũ
      (Constants as any).manifest2?.extra?.expoGo?.debuggerHost;

    if (debuggerHost) {
      const host = debuggerHost.split(":")[0];  // lấy IP, bỏ port
      return `http://${host}:${PORT}`;
    }

    // Fallback: Android emulator
    if (Platform.OS === "android") return `http://10.0.2.2:${PORT}`;

    // iOS simulator
    return `http://localhost:${PORT}`;
  }

  // Production build
  return "https://api.yourdomain.com";
}

export const API_BASE_URL = getBaseUrl();
