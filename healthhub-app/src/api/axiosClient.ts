import axios from "axios";
import { getToken } from "../utils/tokenStorage";
import { API_BASE_URL } from "../config/env";

export { API_BASE_URL };

const axiosClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
    "Accept": "application/json",     
  },
  timeout: 5000,
});

axiosClient.interceptors.request.use(async (config) => {
  if (config.url?.startsWith("/auth")) {
    return config;
  }

  // AI endpoints cần thêm thời gian vì Gemini xử lý lâu
  if (config.url?.startsWith("/ai")) {
    config.timeout = 60000;
  }

  const token = await getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;

  return config;
});

axiosClient.interceptors.response.use(
  (res) => res,
  (err) => Promise.reject(err)
);

export default axiosClient;
