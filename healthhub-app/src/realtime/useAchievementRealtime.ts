import { useEffect, useState } from "react";
import { createNotificationSocket } from "../socket/socketNotifications";
import { onTokenChange, getUserFromToken } from "../utils/tokenStorage";

export type RealtimeAchievement = {
  code: string;
  name: string;
  points?: number;
};

export function useAchievementRealtime() {
  const [achievement, setAchievement] = useState<RealtimeAchievement | null>(null);

  useEffect(() => {
    let socket: any = null;
    let mounted = true;

    const connect = async () => {
      const user = await getUserFromToken();
      if (!user || !mounted) return;

      socket = await createNotificationSocket();
      if (!mounted) { socket.disconnect(); return; }

      socket.on("connect", () => {
        socket.emit("registerUser");
      });

      socket.on("notification", (noti: any) => {
        if (noti.type !== "ACHIEVEMENT") return;
        const meta = noti.metadata;
        setAchievement({
          code: meta.achievementCode,
          name: meta.name,
          points: meta.points,
        });
      });

      socket.connect();
    };

    // Try immediately (handles app resume with existing token)
    connect();

    // Re-connect when token is saved after login
    const unsub = onTokenChange((hasToken) => {
      if (!hasToken) {
        socket?.disconnect();
        socket = null;
      } else {
        // Small delay to let AsyncStorage flush
        setTimeout(() => { if (mounted) connect(); }, 100);
      }
    });

    return () => {
      mounted = false;
      unsub();
      socket?.disconnect();
    };
  }, []);

  return {
    achievement,
    clearAchievement: () => setAchievement(null),
  };
}
