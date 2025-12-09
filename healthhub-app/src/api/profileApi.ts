import axios from "./axiosClient";
import { UpdateProfileDto } from "@/src/types/profile";
import { mediaApi } from "./mediaApi";

export const profileApi = {
  getMe() {
    return axios.get("/profile/me");
  },

  updateMe(dto: UpdateProfileDto) {
    return axios.put("/profile/me", dto);
  },

  async uploadAvatar(uri: string) {
    const url = await mediaApi.uploadFile(uri);
    return url; // trả về direct url
  }

};
