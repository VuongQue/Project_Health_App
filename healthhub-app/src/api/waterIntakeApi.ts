import axiosClient from './axiosClient';

export interface WaterLog {
  id: number;
  userId: number;
  amount: number;
  loggedAt: string;
}

export interface TodayWater {
  logs: WaterLog[];
  total: number;
  goal: number;
  percentage: number;
}

export const waterIntakeApi = {
  log: (amount: number) =>
    axiosClient.post<WaterLog>('/water-intake', { amount }).then((r) => r.data),

  getToday: () =>
    axiosClient.get<TodayWater>('/water-intake/today').then((r) => r.data),

  getWeekSummary: () =>
    axiosClient.get('/water-intake/week').then((r) => r.data),

  delete: (id: number) =>
    axiosClient.delete(`/water-intake/${id}`).then((r) => r.data),
};
