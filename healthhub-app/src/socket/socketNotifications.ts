import { io, Socket } from "socket.io-client";
import { getToken } from "@/src/utils/tokenStorage";

const NOTI_URL = "http://localhost:4000/notifications";

export async function createNotificationSocket(): Promise<Socket> {
  let token = await getToken();
  if (token?.startsWith('"')) token = JSON.parse(token);

  const socket = io(NOTI_URL, {
    transports: ["websocket"],
    auth: { token },
    autoConnect: false,
  });

  return socket;
}
