// src/realtime/useNotificationSocket.ts
import { useEffect } from "react";
import { createNotificationSocket } from "@/src/socket/socketNotifications";

export function useNotificationSocket({
  onFriendRequest,
}: {
  onFriendRequest?: () => void;
}) {
  useEffect(() => {
    let socket: any;

    const connect = async () => {
      socket = await createNotificationSocket();

      socket.on("connect", () => {
        socket.emit("registerUser");
      });

      socket.on("notification", (data: any) => {
        if (data.type === "FRIEND_REQUEST") {
          onFriendRequest?.();
        }
      });
    };

    connect();

    return () => {
      socket?.disconnect();
    };
  }, []);
}
