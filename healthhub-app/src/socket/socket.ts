import { io } from "socket.io-client";
import { getToken } from "@/src/utils/tokenStorage";
import { API_BASE_URL } from "@/src/config/env";

const API_URL = API_BASE_URL;

export const createSocket = async () => {
  let rawToken = await getToken();

  if (!rawToken) {
    return io(API_URL, { transports: ["websocket"] });
  }

  let token: string = rawToken;
  if (token.startsWith('"') && token.endsWith('"')) {
    try { token = JSON.parse(token); } catch {}
  }

  return io(API_URL, {
    transports: ["websocket"],
    auth: { token },
  });
};
