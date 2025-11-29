import axios from "axios";
import axiosClient from "./axiosClient";

export const mediaApi = {
  uploadFile: async (uri: string) => {
    if (!uri) throw new Error("Invalid file URI");

    const filename = uri.split("/").pop() || `file_${Date.now()}.jpg`;

    // Expo Web + Mobile compatible
    const blob = await (await fetch(uri)).blob();

    const formData = new FormData();
    formData.append("file", blob, filename);

    const res = await axiosClient.post("/media/upload", formData, {
        timeout: 20000, // 20 seconds timeout
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return res.data.secure_url || res.data.url;
  },
};
