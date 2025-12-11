import axios from "axios";
import { getToken } from "../utils/tokenStorage";

const axiosClient = axios.create({
  baseURL: "http://192.168.110.204:4000",
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

  const token = await getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;

  return config;
});

axiosClient.interceptors.response.use(
  (res) => res,
  (err) => {
    console.log("❌ API Error:", err.response?.status, err.response?.data);
    return Promise.reject(err);
  }
);

export default axiosClient;
