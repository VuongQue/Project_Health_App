import { useEffect, useState } from "react";
import { createNotificationSocket } from "../socket/socketNotifications";

export type RealtimeAchievement = {
  code: string;
  name: string;
  points?: number;
};

export function useAchievementRealtime() {
  const [achievement, setAchievement] =
    useState<RealtimeAchievement | null>(null);

  useEffect(() => {
    let socket: any;

    const connect = async () => {
      socket = await createNotificationSocket();

      socket.connect();

      socket.on("connect", () => {
        console.log("🔔 [Realtime] Notification socket connected");
        socket.emit("registerUser");
      });

      socket.on("notification", (noti: any) => {
        console.log("📩 [Realtime] Raw notification:", noti);

        if (noti.type !== "ACHIEVEMENT") return;

        const meta = noti.metadata;

        console.log("🏅 [Realtime] Achievement metadata:", meta);

        // ✅ Chuẩn hóa object cho popup
        setAchievement({
          code: meta.achievementCode,
          name: meta.name,
          points: meta.points,
        });
      });

      socket.on("disconnect", () => {
        console.log("🔌 [Realtime] Notification socket disconnected");
      });
    };

    connect();

    return () => {
      socket?.disconnect();
    };
  }, []);

  return {
    achievement,
    clearAchievement: () => setAchievement(null),
  };
}
