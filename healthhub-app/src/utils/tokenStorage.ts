import AsyncStorage from "@react-native-async-storage/async-storage";
import { jwtDecode } from "jwt-decode";

const KEY = "auth_token";

// Simple listeners for token change events
type TokenListener = (hasToken: boolean) => void;
const listeners = new Set<TokenListener>();

export const onTokenChange = (cb: TokenListener) => {
  listeners.add(cb);
  return () => listeners.delete(cb);
};

const notifyListeners = (hasToken: boolean) => {
  listeners.forEach((cb) => cb(hasToken));
};

export const saveToken = async (token: string) => {
  await AsyncStorage.setItem(KEY, token);
  notifyListeners(true);
};

export const getToken = async () => {
  return await AsyncStorage.getItem(KEY);
};

export const clearToken = async () => {
  await AsyncStorage.removeItem(KEY);
  notifyListeners(false);
};

export const getUserFromToken = async () => {
  const token = await AsyncStorage.getItem(KEY);

  if (!token) return null;

  try {
    const parsed = token.startsWith('"') ? JSON.parse(token) : token;
    const payload: any = jwtDecode(parsed);

    if (!payload?.exp || payload.exp * 1000 < Date.now()) {
      await clearToken();
      return null;
    }

    const userId = payload.sub || payload.userId || payload.id;

    if (!userId) return null;

    return {
      id: userId,
      email: payload.email,
      raw: payload,
    };
  } catch {
    // Decode failed — do NOT clear token, may be a transient read error
    return null;
  }
};
