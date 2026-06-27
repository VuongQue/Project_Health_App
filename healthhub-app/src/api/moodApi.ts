import axiosClient from "./axiosClient";

export default {
  // 📌 Lấy Dashboard tổng hợp cho UI (đề xuất dùng API này)
  getDashboard: () => axiosClient.get("/moods/dashboard"),

  // 📌 Lấy mood hôm nay
  getToday: () => axiosClient.get("/moods/today"),

  // 📌 Lưu / cập nhật mood
  saveMood: (payload: {
    date?: string;
    mood: { emoji: string; color: string; score: number };
    note?: string;
    tags?: string[];
  }) => axiosClient.post("/moods", payload),

  // 📊 Weekly trend chart
  getWeekTrend: () => axiosClient.get("/moods/week-trend"),

  // ⭐ Weekly summary: average mood, change, best day
  getSummary: () => axiosClient.get("/moods/summary"),

  // 🔥 Streak — số ngày liên tiếp
  getStreak: () => axiosClient.get("/moods/streak"),

  // 📝 Recent logs
  getRecent: () => axiosClient.get("/moods/recent"),

  // 🔎 Lấy mục mới nhất
  getLatest: () => axiosClient.get("/moods/latest"),
};
