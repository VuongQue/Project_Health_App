import axiosClient from "./axiosClient";

export const friendApi = {
  // ============================
  // FRIEND LIST
  // ============================
  getFriends: async () => {
    const res = await axiosClient.get("/friends/list");
    return res.data;
  },

  // ============================
  // REQUESTS I RECEIVED (ACCEPT)
  // ============================
  getReceivedRequests: async () => {
    const res = await axiosClient.get("/friends/requests/received");
    return res.data;
  },

  // ============================
  // REQUESTS I SENT (REQUESTED)
  // ============================
  getSentRequests: async () => {
    const res = await axiosClient.get("/friends/requests/sent");
    return res.data;
  },

  // ============================
  // FRIEND SUGGESTION
  // ============================
  suggest: async () => {
    const res = await axiosClient.get("/friends/suggest");
    return res.data;
  },

  // ============================
  // SEND FRIEND REQUEST
  // ============================
  sendRequest: async (toUserId: number) => {
    const res = await axiosClient.post("/friends/request", {
      toUserId,
    });
    return res.data;
  },

  // ============================
  // ACCEPT / REJECT REQUEST
  // ============================
  respond: async (requestId: string, accept: boolean) => {
    const res = await axiosClient.post("/friends/respond", {
      requestId,
      accept,
    });
    return res.data;
  },

  // ============================
  // UNFRIEND
  // ============================
  unfriend: async (targetId: number) => {
    const res = await axiosClient.post(`/friends/unfriend/${targetId}`);
    return res.data;
  },

  // ============================
  // LEADERBOARD (points)
  // ============================
  getLeaderboard: async () => {
    const res = await axiosClient.get("/friends/leaderboard");
    return res.data as {
      rank: number; id: number; fullName: string; avatarUrl: string | null;
      level: number; points: number; isMe: boolean;
    }[];
  },

  // ============================
  // STEPS LEADERBOARD (today)
  // ============================
  getStepsLeaderboard: async () => {
    const res = await axiosClient.get("/friends/leaderboard/steps");
    return res.data as {
      rank: number; id: number; fullName: string; avatarUrl: string | null;
      level: number; todaySteps: number; goalSteps: number; isMe: boolean;
    }[];
  },
};
