import axiosClient from './axiosClient';

export interface WeeklySummaryResponse {
  weekData: {
    totalSteps: number;
    workoutSessions: number;
    averageMoodScore: number | null;
    averageCalories: number;
    daysWithEnoughWater: number;
    totalWaterMl: number;
    streakDays: number;
  };
  summary: {
    headline: string;
    highlights: string[];
    improvements: string[];
    nextWeekFocus: string;
    motivationalMessage: string;
  };
  stepsHistory: { date: string; steps: number; goalSteps: number }[];
  waterHistory: { date: string; total: number }[];
}

const weeklySummaryApi = {
  get: () => axiosClient.get<WeeklySummaryResponse>('/ai/weekly-summary'),
};

export default weeklySummaryApi;
