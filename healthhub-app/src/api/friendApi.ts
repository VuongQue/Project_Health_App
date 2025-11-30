import axiosClient from "./axiosClient";

export const friendApi = {
  // Danh sách bạn bè
  getFriends: async () => {
    const res = await axiosClient.get(`/friends/list`);
    return res.data;
  },

  // Lời mời kết bạn đang chờ
  getPending: async () => {
    const res = await axiosClient.get(`/friends/pending`);
    return res.data;
  },

  // Gợi ý kết bạn
  suggest: async () => {
    const res = await axiosClient.get(`/friends/suggest`);
    return res.data;
  },

  // Tìm kiếm người dùng
  search: async (keyword: string) => {
    const res = await axiosClient.get(`/friends/search?q=${keyword}`);
    return res.data;
  },

  // Gửi lời mời kết bạn
  sendRequest: async (toUserId: number) => {
    const res = await axiosClient.post(`/friends/request`, {
      toUserId,
    });
    return res.data;
  },

  // Accept / Reject
  respond: async (requestId: string, accept: boolean) => {
    const res = await axiosClient.post(`/friends/respond`, {
      requestId,
      accept,
    });
    return res.data;
  },

  // Hủy kết bạn
  unfriend: async (targetId: number) => {
    const res = await axiosClient.post(`/friends/unfriend/${targetId}`);
    return res.data;
  },
};
