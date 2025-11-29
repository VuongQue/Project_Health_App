import axiosClient from "./axiosClient";

const authApi = {
  login: (data: { email: string; password: string }) =>
    axiosClient.post("/auth/login", data),
  register: (data: { name: string; email: string; password: string }) =>
    axiosClient.post("/auth/register", data),
};

export default authApi;
