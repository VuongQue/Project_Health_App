import axiosClient from "./axiosClient";

const notificationApi = {
  getAll: () => axiosClient.get("/notifications"),
  getUnreadCount: () => axiosClient.get("/notifications/unread-count"),
  markAsRead: (id: number) => axiosClient.patch(`/notifications/${id}/read`),
  clearAll: () => axiosClient.delete("/notifications/clear"),
};

export default notificationApi;
