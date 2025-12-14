import { io } from "socket.io-client";
import { getToken } from "@/src/utils/tokenStorage";

const NOTI_URL = "http://192.168.110.204:4000/notifications";

export const createNotificationSocket = async () => {
  let token = await getToken();
  if (token?.startsWith('"')) token = JSON.parse(token);

  return io(NOTI_URL, {
    transports: ["websocket"],
    auth: { token },
    autoConnect: false, 
  });
};
