import AsyncStorage from "@react-native-async-storage/async-storage";
import { jwtDecode } from "jwt-decode";

const KEY = "auth_token";

export const saveToken = async (token: string) => {
  await AsyncStorage.setItem(KEY, token);
};

export const getToken = async () => {
  return await AsyncStorage.getItem(KEY);
};

export const clearToken = async () => {
  await AsyncStorage.removeItem(KEY);
};

export const getUserFromToken = async () => {
  const token = await AsyncStorage.getItem(KEY);
  console.log("[TOKEN RAW] =", token);

  if (!token) return null;

  try {
    const parsed = token.startsWith('"') ? JSON.parse(token) : token;
    const payload: any = jwtDecode(parsed);

    // ⛔ CHECK TOKEN EXPIRE
    if (!payload?.exp || payload.exp * 1000 < Date.now()) {
      console.log("[token] ❌ expired → clear storage");
      await clearToken();
      return null;
    }

    const userId = payload.sub || payload.userId || payload.id;

    if (!userId) {
      console.log("[token] ❌ no userId in payload");
      await clearToken();
      return null;
    }

    console.log("[token] ✅ valid user:", userId);

    return {
      id: userId,
      email: payload.email,
      raw: payload,
    };
  } catch (err) {
    console.log("[token] ❌ decode failed:", err);
    await clearToken();
    return null;
  }
};
