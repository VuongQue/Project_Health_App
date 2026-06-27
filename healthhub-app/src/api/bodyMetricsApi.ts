import axiosClient from './axiosClient';

export interface BodyMetric {
  id: number;
  userId: number;
  weight?: number;
  height?: number;
  bmi?: number;
  bloodPressureSystolic?: number;
  bloodPressureDiastolic?: number;
  heartRate?: number;
  note?: string;
  recordedAt: string;
}

export interface CreateBodyMetricDto {
  weight?: number;
  height?: number;
  bloodPressureSystolic?: number;
  bloodPressureDiastolic?: number;
  heartRate?: number;
  note?: string;
}

export const bodyMetricsApi = {
  create: (dto: CreateBodyMetricDto) =>
    axiosClient.post<BodyMetric>('/body-metrics', dto).then((r) => r.data),

  getHistory: (limit = 30) =>
    axiosClient.get<BodyMetric[]>(`/body-metrics?limit=${limit}`).then((r) => r.data),

  getLatest: () =>
    axiosClient.get<BodyMetric>('/body-metrics/latest').then((r) => r.data),

  getStats: () =>
    axiosClient
      .get<{ weightTrend: any[]; bmiTrend: any[]; latest: BodyMetric | null }>('/body-metrics/stats')
      .then((r) => r.data),

  delete: (id: number) =>
    axiosClient.delete(`/body-metrics/${id}`).then((r) => r.data),
};
