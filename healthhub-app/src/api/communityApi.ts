import axiosClient from "./axiosClient";
import { mediaApi } from "./mediaApi";

export const communityApi = {
  // ─── FEED ──────────────────────────────────────────────────────────────────
  getFeed: async (page = 1, limit = 10) => {
    const res = await axiosClient.get(`/posts?page=${page}&limit=${limit}`);
    return res.data;
  },

  searchPosts: async (q: string, page = 1, limit = 10) => {
    const res = await axiosClient.get(`/posts?q=${encodeURIComponent(q)}&page=${page}&limit=${limit}`);
    return res.data;
  },

  // ─── POST CRUD ──────────────────────────────────────────────────────────────
  createPost: async (data: { content: string; media?: string[] }) => {
    const res = await axiosClient.post(`/posts`, {
      content: data.content,
      media: Array.isArray(data.media) ? data.media : [],
    });
    return res.data;
  },

  getPostById: async (id: string) => {
    const res = await axiosClient.get(`/posts/${id}`);
    return res.data;
  },

  editPost: async (postId: string, content: string) => {
    const res = await axiosClient.patch(`/posts/${postId}`, { content });
    return res.data;
  },

  deletePost: async (postId: string) => {
    const res = await axiosClient.delete(`/posts/${postId}`);
    return res.data;
  },

  toggleLike: (postId: string) => axiosClient.post(`/posts/${postId}/like`),

  reportPost: async (postId: string, reason: string, description = "") => {
    const res = await axiosClient.post(`/posts/${postId}/report`, { reason, description });
    return res.data;
  },

  getFriendsFeed: async (friendUserIds: string[], limit = 6) => {
    if (!friendUserIds.length) return [];
    const res = await axiosClient.get(`/posts?userIds=${friendUserIds.join(',')}&limit=${limit}`);
    return (res.data?.posts ?? res.data ?? []) as any[];
  },

  // ─── COMMENTS ──────────────────────────────────────────────────────────────
  getComments: async (postId: string) => {
    const res = await axiosClient.get(`/posts/${postId}/comments`);
    return res.data;
  },

  addComment: async (postId: string, text: string, parentId?: string) => {
    const res = await axiosClient.post(`/posts/${postId}/comment`, { text, parentId });
    return res.data;
  },

  // ─── STORIES ───────────────────────────────────────────────────────────────
  getStories: async () => {
    const res = await axiosClient.get(`/posts/stories/list`);
    return res.data;
  },

  uploadStory: async (fileUri: string) => {
    const url = await mediaApi.uploadFile(fileUri);
    if (!url || typeof url !== "string") throw new Error("Upload failed");
    const res = await axiosClient.post("/posts/stories", { media: [url] });
    return res.data;
  },

  // ─── MEDIA ─────────────────────────────────────────────────────────────────
  uploadMultiple: async (uris: string[]) => {
    const results: string[] = [];
    for (const uri of uris) {
      const url = await mediaApi.uploadFile(uri);
      results.push(url);
    }
    return results;
  },

  // ─── GROUPS ────────────────────────────────────────────────────────────────
  getGroups: async (page = 1, limit = 20) => {
    const res = await axiosClient.get(`/groups?page=${page}&limit=${limit}`);
    return res.data;
  },

  getMyGroups: async () => {
    const res = await axiosClient.get(`/groups/my`);
    return res.data;
  },

  createGroup: async (data: {
    name: string;
    description?: string;
    avatarUrl?: string;
    type?: "public" | "private";
  }) => {
    const res = await axiosClient.post(`/groups`, data);
    return res.data;
  },

  getGroupById: async (groupId: string) => {
    const res = await axiosClient.get(`/groups/${groupId}`);
    return res.data;
  },

  joinGroup: async (groupId: string) => {
    const res = await axiosClient.post(`/groups/${groupId}/join`);
    return res.data;
  },

  leaveGroup: async (groupId: string) => {
    const res = await axiosClient.post(`/groups/${groupId}/leave`);
    return res.data;
  },

  getGroupPosts: async (groupId: string, page = 1, limit = 10) => {
    const res = await axiosClient.get(`/groups/${groupId}/posts?page=${page}&limit=${limit}`);
    return res.data;
  },

  createGroupPost: async (
    groupId: string,
    data: { content: string; media?: string[] }
  ) => {
    const res = await axiosClient.post(`/groups/${groupId}/posts`, {
      content: data.content,
      media: data.media ?? [],
    });
    return res.data;
  },

  // ─── EVENTS ────────────────────────────────────────────────────────────────
  getEvents: async () => {
    const res = await axiosClient.get(`/events`);
    return res.data;
  },

  getMyEventRegistrations: async () => {
    const res = await axiosClient.get(`/events/me/registrations`);
    return res.data;
  },

  registerEvent: async (eventId: number) => {
    const res = await axiosClient.post(`/events/${eventId}/register`);
    return res.data;
  },
};
