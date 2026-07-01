import { io, Socket } from "socket.io-client";
import { getToken } from "@/src/utils/tokenStorage";
import { API_BASE_URL } from "@/src/config/env";

const NOTI_URL = `${API_BASE_URL}/notifications`;

export async function createNotificationSocket(): Promise<Socket> {
  let token = await getToken();
  if (token?.startsWith('"')) { try { token = JSON.parse(token); } catch {} }

  const socket = io(NOTI_URL, {
    transports: ["websocket"],
    auth: { token },
    autoConnect: false,
  });

  return socket;
}
