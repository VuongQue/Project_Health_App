import axiosClient from "./axiosClient";

export default {
  // ✔ Weekly Summary
  getWeekSummary: () => axiosClient.get("/fitness/logs/week"),

  // ✔ Weekly Detail (UI cần cho 7 cái circle)
  getWeekDetail: () => axiosClient.get("/fitness/logs/week-detail"),


  getPlans: () => axiosClient.get("/fitness/plans"),

 
  getMonthProgress: () => axiosClient.get("/fitness/progress/month"),

  // Quick start workout
  startWorkout: (planId: number) =>
    axiosClient.post(`/fitness/logs/start`, { planId }),

  completeWorkout: (logId: number) =>
    axiosClient.post(`/fitness/logs/complete/${logId}`),

  getWorkouts: (params?: {
    search?: string;
    muscleGroup?: string;
    level?: string;
    minKcal?: number;
    maxKcal?: number;
  }) => axiosClient.get("/fitness/workouts", { params }),

  getWorkoutById: (id: any) => axiosClient.get(`/fitness/workouts/${id}`),
  logWorkout: (body: any) => axiosClient.post("/fitness/logs", body),


};
