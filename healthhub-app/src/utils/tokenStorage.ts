import AsyncStorage from "@react-native-async-storage/async-storage";
import {jwtDecode} from "jwt-decode";

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
  const token = await AsyncStorage.getItem("auth_token");
  console.log("[TOKEN RAW] =", token);
  if (!token) return null;

  try {
    const parsed = token.startsWith('"') ? JSON.parse(token) : token;
    const payload: any = jwtDecode(parsed);

    console.log("[token] decoded user:", payload);

    // tuỳ backend bạn:
    const userId = payload.sub || payload.userId || payload.id;

    return {
      id: userId,
      email: payload.email,
      raw: payload,
    };
  } catch (err) {
    console.log("[token] decode failed:", err);
    return null;
  }
};