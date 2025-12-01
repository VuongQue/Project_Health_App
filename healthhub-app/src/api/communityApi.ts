import axiosClient from "./axiosClient";
import { mediaApi } from "./mediaApi";

export const communityApi = {
  getFeed: async (page = 1, limit = 10) => {
    const res = await axiosClient.get(`/posts?page=${page}&limit=${limit}`);
    return res.data;
  },

  getStories: async () => {
    const res = await axiosClient.get(`/posts/stories/list`);
    return res.data;
  },

  uploadStory: async (fileUri: string) => {
    // mediaApi.uploadFile MUST return a STRING
    const url = await mediaApi.uploadFile(fileUri);

    console.log("UPLOAD URL:", url);

    if (!url || typeof url !== "string") {
        throw new Error("Upload failed: URL is invalid");
    }

    const res = await axiosClient.post("/posts/stories", {
        media: [url],   // ALWAYS string[]
    });

    return res.data;
    },


  createPost: async (data: { content: string; media?: string[] }) => {
    const payload = {
      content: data.content,
      media: Array.isArray(data.media) ? data.media : [], // nếu undefined → []
    };

    const res = await axiosClient.post(`/posts`, payload);
    return res.data;
  },  


  toggleLike: (postId: string) =>
    axiosClient.post(`/posts/${postId}/like`),

  getComments: async (postId: string) => {
    const res = await axiosClient.get(`/posts/${postId}/comments`);
    return res.data;
  },

  addComment: async (postId: string, text: string, parentId?: string) => {
    const res = await axiosClient.post(`/posts/${postId}/comment`, {
      text,
      parentId,
    });
    return res.data;
  },

  uploadMultiple: async (uris: string[]) => {
    const results: string[] = [];

    for (const uri of uris) {
      const url = await mediaApi.uploadFile(uri);
      results.push(url);
    }

    return results;
  },

};
