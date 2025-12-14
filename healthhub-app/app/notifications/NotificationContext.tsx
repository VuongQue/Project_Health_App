import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useRef,
  useCallback,
} from "react";

import notificationApi from "@/src/api/notificationApi";
import { createNotificationSocket } from "@/src/socket/socketNotifications";
import { getUserFromToken } from "@/src/utils/tokenStorage";
import type { Socket } from "socket.io-client";

/* =========================
   Types
========================= */
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

interface NotificationContextValue {
  notifications: NotificationItem[];
  unreadCount: number;
  loading: boolean;
  refresh: () => Promise<void>;
  markAsRead: (id: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  clearAll: () => Promise<void>;
}

/* =========================
   Context
========================= */
const NotificationContext =
  createContext<NotificationContextValue | null>(null);

/* =========================
   Provider
========================= */
export default function NotificationProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0); // 🔥 QUAN TRỌNG
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<number | null>(null);

  const socketRef = useRef<Socket | null>(null);

  /* =========================
     1️⃣ Get userId from token
  ========================= */
  useEffect(() => {
    (async () => {
      const user = await getUserFromToken();
      if (user?.id) {
        console.log("[Notification] Logged-in User ID =", user.id);
        setUserId(user.id);
      } else {
        console.warn("[Notification] ❌ No user from token");
      }
    })();
  }, []);

  /* =========================
     2️⃣ Load unread-count ASAP (fix chuông)
  ========================= */
  useEffect(() => {
    if (!userId) return;

    (async () => {
      try {
        const count = await notificationApi.getUnreadCount();
        console.log("🔔 [Notification] unread-count =", count);
        setUnreadCount(count);
      } catch (err) {
        console.error("[Notification] unread-count error:", err);
      }
    })();
  }, [userId]);

  /* =========================
     3️⃣ Load notifications list
  ========================= */
  const loadData = useCallback(async () => {
    if (!userId) return;

    try {
      setLoading(true);

      const list = await notificationApi.getAll();

      console.log("🟢 [Notification] API list length =", list.length);
      console.log("🟢 [Notification] API list =", list);

      setNotifications(list);
      setUnreadCount(list.filter((n) => !n.isRead).length);
    } catch (err) {
      console.error("[Notification] load error:", err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) loadData();
  }, [userId, loadData]);

  /* =========================
     4️⃣ WebSocket realtime
  ========================= */
  useEffect(() => {
    if (!userId) return;

    let mounted = true;

    (async () => {
      const socket = await createNotificationSocket();
      if (!mounted) return;

      socketRef.current = socket;
      socket.connect();

      socket.emit("registerUser");
      console.log("[Notification] WS connected");

      socket.on("notification", (noti: NotificationItem) => {
        console.log("🔔 WS notification:", noti);

        setNotifications((prev) => {
          if (prev.some((n) => n.id === noti.id)) return prev;
          return [noti, ...prev];
        });

        if (!noti.isRead) {
          setUnreadCount((c) => c + 1); // 🔔 cập nhật chuông realtime
        }
      });
    })();

    return () => {
      mounted = false;
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
  }, [userId]);

  /* =========================
     5️⃣ Mark one as read
  ========================= */
  const markAsRead = async (id: number) => {
    const updated = await notificationApi.markAsRead(id);

    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? updated : n)),
    );

    if (updated.isRead) {
      setUnreadCount((c) => Math.max(0, c - 1));
    }
  };

  /* =========================
     6️⃣ Mark all as read
  ========================= */
  const markAllAsRead = async () => {
    await notificationApi.markAllAsRead();

    setNotifications((prev) =>
      prev.map((n) => ({ ...n, isRead: true })),
    );

    setUnreadCount(0);
  };

  /* =========================
     7️⃣ Clear all
  ========================= */
  const clearAll = async () => {
    await notificationApi.clearAll();
    setNotifications([]);
    setUnreadCount(0);
  };

  /* =========================
     Provider
  ========================= */
  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
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

/* =========================
   Hook
========================= */
export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    throw new Error(
      "useNotifications must be used within NotificationProvider",
    );
  }
  return ctx;
}
