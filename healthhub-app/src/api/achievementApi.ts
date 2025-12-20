import axiosClient from "./axiosClient";

export const achievementApi = {
  myAchievements: () => axiosClient.get("/achievements/me"),
  getAll: () => axiosClient.get("/achievements"),
};
