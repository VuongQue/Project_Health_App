import axiosClient from "./axiosClient";

export const chatApi = {
  openChat: async (payload: { receiverId: string }) => {
    const res = await axiosClient.post("/chat/open", payload);
    return res.data;
  },

  getRooms: async () => {
    const res = await axiosClient.get("/chat/rooms");
    return res.data;
  },

  getMessages: async (roomId: string, limit = 50) => {
    const res = await axiosClient.get(`/chat/messages/${roomId}?limit=${limit}`);
    return res.data;
  },

  sendMessage: async (payload: { roomId: string; text: string }) => {
    const res = await axiosClient.post("/chat/message", payload);
    return res.data;
  },

  getUnreadCount: async (): Promise<number> => {
    const res = await axiosClient.get("/chat/unread-count");
    return res.data?.count ?? 0;
  },

  markRoomAsRead: async (roomId: string): Promise<void> => {
    await axiosClient.patch(`/chat/rooms/${roomId}/read`);
  },
};
