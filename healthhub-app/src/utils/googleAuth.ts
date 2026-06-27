import { Platform } from "react-native";
import * as WebBrowser from "expo-web-browser";
import { API_BASE_URL } from "@/src/config/env";

WebBrowser.maybeCompleteAuthSession();

export async function openGoogleLogin() {
  if (Platform.OS === "web") {
    // Web: dùng endpoint riêng có callbackURL trỏ về HTTP
    window.location.href = `${API_BASE_URL}/auth/google/web`;
    return;
  }

  // Mobile: dùng endpoint mobile, bắt deep link healthhub://
  await WebBrowser.openAuthSessionAsync(
    `${API_BASE_URL}/auth/google`,
    "healthhub://auth/google/callback"
  );
}
