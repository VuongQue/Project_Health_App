import { io } from "socket.io-client";
import { getToken } from "@/src/utils/tokenStorage";

const API_URL = "http://localhost:4000";

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
