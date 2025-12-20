import { io } from "socket.io-client";
import { getToken } from "@/src/utils/tokenStorage";

const API_URL = "http://192.168.110.205:4000";

export const createSocket = async () => {
  let rawToken = await getToken();

  console.log("[socket] rawToken =", rawToken);

  if (!rawToken) {
    console.log("[socket] ❌ No auth_token found");
    return io(API_URL, {
      transports: ["websocket"],
    });
  }

  let token: string = rawToken;

  // nếu bị stringify
  if (token.startsWith('"') && token.endsWith('"')) {
    try {
      token = JSON.parse(token);
    } catch {}
  }

  console.log("[socket] using token =", token);

  return io(API_URL, {
    transports: ["websocket"],
    auth: { token },
  });
};
