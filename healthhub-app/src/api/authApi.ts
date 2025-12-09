import axiosClient from "./axiosClient";

const authApi = {
  login: (data: { email: string; password: string }) =>
    axiosClient.post("/auth/login", data),

  register: (data: { fullName: string; email: string; password: string }) =>
    axiosClient.post("/auth/register", data),

  verifyOtp: (data: { email: string; otp: string }) =>
    axiosClient.post("/auth/verify-otp", data),
};

export default authApi;
