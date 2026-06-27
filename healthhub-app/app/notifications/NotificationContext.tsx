import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useRef,
  useCallback,
} from "react";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";
import notificationApi from "@/src/api/notificationApi";
import { createNotificationSocket } from "@/src/socket/socketNotifications";
import { getUserFromToken, onTokenChange } from "@/src/utils/tokenStorage";
import axiosClient from "@/src/api/axiosClient";
import type { Socket } from "socket.io-client";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export interface NotificationItem {
  id: number;
  userId?: number;
  type: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  icon?: string;
  link?: string;
  metadata?: any;
  priority?: number;
}

export interface PendingAchievement {
  code: string;
  name: string;
  points?: number;
}

interface NotificationContextValue {
  notifications: NotificationItem[];
  unreadCount: number;
  loading: boolean;
  pendingAchievement: PendingAchievement | null;
  clearAchievement: () => void;
  refresh: () => Promise<void>;
  markAsRead: (id: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  clearAll: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

export default function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<number | null>(null);
  const [pendingAchievement, setPendingAchievement] = useState<PendingAchievement | null>(null);

  const socketRef = useRef<Socket | null>(null);

  /* 1️⃣ Sync userId whenever token changes (login / logout) */
  useEffect(() => {
    const syncUser = async () => {
      const user = await getUserFromToken();
      setUserId(user?.id ?? null);
    };

    syncUser();

    const unsub = onTokenChange((hasToken) => {
      if (hasToken) syncUser();
      else setUserId(null);
    });

    return unsub;
  }, []);

  /* 1b. Register Expo push token */
  useEffect(() => {
    if (!userId) return;
    (async () => {
      try {
        if (!Device.isDevice) return;
        const { status: existing } = await Notifications.getPermissionsAsync();
        let finalStatus = existing;
        if (existing !== "granted") {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }
        if (finalStatus !== "granted") return;
        if (Platform.OS === "android") {
          await Notifications.setNotificationChannelAsync("default", {
            name: "default",
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
          });
        }
        const tokenData = await Notifications.getExpoPushTokenAsync();
        await axiosClient.post("/users/push-token", { token: tokenData.data });
      } catch {
        // push token is optional
      }
    })();
  }, [userId]);

  /* 3️⃣ Load notifications list */
  const loadData = useCallback(async (triggerAchievementPopup = false) => {
    if (!userId) return;
    try {
      setLoading(true);
      const list = await notificationApi.getAll();
      setNotifications(list);
      setUnreadCount(list.filter((n) => !n.isRead).length);

      // Only show popup for achievements created within the last 60 seconds
      // (i.e., just unlocked during registration/login before socket was ready)
      if (triggerAchievementPopup) {
        const cutoff = Date.now() - 60_000;
        const freshAchievement = list.find(
          (n) =>
            n.type === "ACHIEVEMENT" &&
            !n.isRead &&
            n.metadata &&
            new Date(n.createdAt).getTime() >= cutoff
        );
        if (freshAchievement) {
          setPendingAchievement({
            code: freshAchievement.metadata.achievementCode,
            name: freshAchievement.metadata.name,
            points: freshAchievement.metadata.points,
          });
        }
      }
    } catch {
      // keep stale
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) loadData(true);
  }, [userId, loadData]);

  /* 4️⃣ Single WebSocket — handles both notifications and achievement popup */
  useEffect(() => {
    if (!userId) return;

    let mounted = true;

    (async () => {
      const socket = await createNotificationSocket();
      if (!mounted) return;

      socketRef.current = socket;

      socket.on("connect", () => {
        socket.emit("registerUser");
        // Reload and trigger achievement popup for notifications missed before socket connected
        loadData(true);
      });

      socket.on("notification", (noti: NotificationItem) => {
        // Update notification list (dedup by id)
        setNotifications((prev) => {
          if (prev.some((n) => n.id === noti.id)) return prev;
          return [noti, ...prev];
        });
        if (!noti.isRead) setUnreadCount((c) => c + 1);

        // Show achievement popup if applicable
        if (noti.type === "ACHIEVEMENT" && noti.metadata) {
          setPendingAchievement({
            code: noti.metadata.achievementCode,
            name: noti.metadata.name,
            points: noti.metadata.points,
          });
        }
      });

      socket.connect();
    })();

    return () => {
      mounted = false;
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
  }, [userId]);

  /* 5️⃣ Mark one as read */
  const markAsRead = async (id: number) => {
    const updated = await notificationApi.markAsRead(id);
    setNotifications((prev) => prev.map((n) => (n.id === id ? updated : n)));
    if (updated.isRead) setUnreadCount((c) => Math.max(0, c - 1));
  };

  /* 6️⃣ Mark all as read */
  const markAllAsRead = async () => {
    await notificationApi.markAllAsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
  };

  /* 7️⃣ Clear all */
  const clearAll = async () => {
    await notificationApi.clearAll();
    setNotifications([]);
    setUnreadCount(0);
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        pendingAchievement,
        clearAchievement: () => setPendingAchievement(null),
        refresh: loadData,
        markAsRead,
        markAllAsRead,
        clearAll,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error("useNotifications must be used within NotificationProvider");
  return ctx;
}
