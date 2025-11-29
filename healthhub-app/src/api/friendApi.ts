import axiosClient from "./axiosClient";

export const friendApi = {
  // Danh sách bạn bè
  getFriends: async (userId: number) => {
    const res = await axiosClient.get(`/friend/list/${userId}`);
    return res.data;
  },

  // Lời mời kết bạn đang chờ
  getPending: async (userId: number) => {
    const res = await axiosClient.get(`/friend/pending/${userId}`);
    return res.data;
  },

  // Gợi ý kết bạn
  suggest: async (userId: number) => {
    const res = await axiosClient.get(`/friend/suggest/${userId}`);
    return res.data;
  },

  // Tìm kiếm người dùng
  search: async (keyword: string) => {
    const res = await axiosClient.get(`/friend/search?q=${keyword}`);
    return res.data;
  },

  // Gửi lời mời kết bạn
  sendRequest: async (fromUserId: number, toUserId: number) => {
    const res = await axiosClient.post(`/friend/send`, {
      fromUserId,
      toUserId,
    });
    return res.data;
  },

  // Accept / Reject
  respond: async (requestId: string, accept: boolean) => {
    const res = await axiosClient.post(`/friend/respond`, {
      requestId,
      accept,
    });
    return res.data;
  },

  // Hủy kết bạn
  unfriend: async (userId: number, targetId: number) => {
    const res = await axiosClient.post(`/friend/unfriend/${userId}/${targetId}`);
    return res.data;
  },
};
