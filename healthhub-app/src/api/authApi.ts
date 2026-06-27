import axiosClient from "./axiosClient";

const authApi = {
  login: (data: { email: string; password: string }) =>
    axiosClient.post("/auth/login", data),

  register: (data: { fullName: string; email: string; password: string }) =>
    axiosClient.post("/auth/register", data),

  verifyOtp: (data: { email: string; otp: string }) =>
    axiosClient.post("/auth/verify-otp", data),

  resendOtp: (email: string) =>
    axiosClient.post("/auth/resend-otp", { email }),

  forgotPassword: (email: string) =>
    axiosClient.post("/auth/forgot-password", { email }),

  resetPassword: (data: { email: string; otp: string; newPassword: string }) =>
    axiosClient.post("/auth/reset-password", data),

  refresh: (refreshToken: string) =>
    axiosClient.post("/auth/refresh", { refreshToken }),

  logout: () => axiosClient.post("/auth/logout"),
};

export default authApi;
