import axiosClient from "./axiosClient";

export default {
  // =====================
  // SUMMARY & PROGRESS
  // =====================
  getWeekSummary: () => axiosClient.get("/fitness/logs/week"),
  getWeekDetail: () => axiosClient.get("/fitness/logs/week-detail"),
  getPlans: () => axiosClient.get("/fitness/plans"),
  getMonthProgress: () => axiosClient.get("/fitness/progress/month"),
  getSummary: () => axiosClient.get("/fitness/summary"),

  // =====================
  // WORKOUT CRUD
  // =====================
  getWorkouts: (params?: {
    search?: string;
    muscleGroup?: string;
    level?: string;
    minKcal?: number;
    maxKcal?: number;
  }) => axiosClient.get("/fitness/workouts", { params }),

  getWorkoutById: (id: number | string) =>
    axiosClient.get(`/fitness/workouts/${id}`),

  // =====================
  // LOG WORKOUT
  // =====================
  logWorkout: (body: {
    workoutId: number;
    durationMin: number;
    kcal: number;
    note?: string;
  }) => axiosClient.post("/fitness/logs", body),

  // =====================
  // QUICK START
  // =====================
  quickStart: () => axiosClient.post("/fitness/quick-start"),

  // =====================
  // WORKOUT SESSION (nếu bạn bật phần này)
  // =====================
  startSession: (workoutId: number) =>
  axiosClient.post(`/fitness/session/start/${workoutId}`),

  getActiveSession: (workoutId: number) =>
    axiosClient.get(`/fitness/session/${workoutId}`),

  updateSessionIndex: (sessionId: number, index: number) =>
    axiosClient.post(`/fitness/session/update/${sessionId}`, { index }),

  completeSession: (sessionId: number, body: { seconds: number; calories: number }) =>
    axiosClient.post(`/fitness/session/complete/${sessionId}`, body),


  getSessionDetail: (sessionId: number) =>
    axiosClient.get(`/fitness/session/detail/${sessionId}`),
};
