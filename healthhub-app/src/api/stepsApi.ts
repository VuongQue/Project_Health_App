import axiosClient from "./axiosClient";

export interface DailyStepsRecord {
  userId: number;
  date: string;
  steps: number;
  goalSteps: number;
}

export interface StepStreakResponse {
  currentStreak: number;
  bestStreak: number;
  totalActiveDays: number;
  last30Days: { date: string; steps: number; goalSteps: number; reached: boolean }[];
}

const stepsApi = {
  upsert: (steps: number, goalSteps?: number) =>
    axiosClient.post<DailyStepsRecord>("/steps", { steps, goalSteps }),
  getToday: () => axiosClient.get<DailyStepsRecord>("/steps/today"),
  getHistory: (days = 7) =>
    axiosClient.get<DailyStepsRecord[]>(`/steps/history?days=${days}`),
  getStreak: () => axiosClient.get<StepStreakResponse>("/steps/streak"),
};

export default stepsApi;
