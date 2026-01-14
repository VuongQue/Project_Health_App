import { io, Socket } from "socket.io-client";
import { getToken } from "@/src/utils/tokenStorage";

const NOTI_URL = "http://192.168.110.204:4000/notifications";

let socket: Socket | null = null;

export async function createNotificationSocket(): Promise<Socket> {
  if (socket) return socket;

  let token = await getToken();
  if (token?.startsWith('"')) token = JSON.parse(token);

  socket = io(NOTI_URL, {
    transports: ["websocket"],
    auth: { token },
    autoConnect: true, // 🔥 kết nối ngay
  });

  return socket;
}
