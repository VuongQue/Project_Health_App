// src/api/notificationApi.ts
import axiosClient from "./axiosClient";
import type { Notification } from "@/src/types/notification";

/* =========================
   Helpers
========================= */
function unwrapArray<T>(res: any): T[] {
  // Case 1: backend trả thẳng array
  if (Array.isArray(res)) return res;

  // Case 2: backend trả { data: [] }
  if (Array.isArray(res?.data)) return res.data;

  // Case 3: backend trả { success, data: [] }
  if (Array.isArray(res?.data?.data)) return res.data.data;

  // Case 4: backend trả { items: [], total, page, limit }
  if (Array.isArray(res?.items)) return res.items;

  return [];
}

/* =========================
   API
========================= */
const notificationApi = {
  // 🔔 LẤY DANH SÁCH
  async getAll(): Promise<Notification[]> {
    const res = await axiosClient.get("/notifications");
    return unwrapArray<Notification>(res.data);
  },

  // 🔢 ĐẾM CHƯA ĐỌC
  async getUnreadCount(): Promise<number> {
    const res = await axiosClient.get("/notifications/unread-count");

    if (typeof res.data === "number") return res.data;
    if (typeof res.data?.data === "number") return res.data.data;

    return 0;
  },

  // 👁️ ĐÁNH DẤU ĐÃ ĐỌC
  async markAsRead(id: number): Promise<Notification> {
    const res = await axiosClient.patch(`/notifications/${id}/read`);

    return res.data?.data ?? res.data;
  },

  // 👁️👁️ ĐÁNH DẤU TẤT CẢ
  async markAllAsRead(): Promise<void> {
    await axiosClient.patch("/notifications/read-all");
  },

  // 🧹 XOÁ TẤT CẢ
  async clearAll(): Promise<void> {
    await axiosClient.delete("/notifications/clear");
  },
};

export default notificationApi;
