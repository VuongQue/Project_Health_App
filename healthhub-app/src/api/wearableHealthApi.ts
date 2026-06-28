import axiosClient from "./axiosClient";

export type WearableDataType =
  | "heart_rate"
  | "spo2"
  | "sleep"
  | "stress"
  | "steps_wearable"
  | "calories_wearable";

export interface WearableRecord {
  date: string;
  dataType: WearableDataType;
  value: number;
  minValue?: number;
  maxValue?: number;
  unit?: string;
  meta?: Record<string, any>;
  source?: string;
}

export interface WearableSummary {
  avgHeartRate: number | null;
  avgSpo2: number | null;
  avgStress: number | null;
  avgSleepMin: number | null;
  heartRateHistory: { date: string; value: number }[];
  sleepHistory: { date: string; value: number; meta: any }[];
}

export interface WearableTodayData {
  heart_rate?: { value: number; minValue?: number; maxValue?: number; unit?: string } | null;
  spo2?: { value: number; unit?: string } | null;
  sleep?: { value: number; meta?: { deep?: number; light?: number; rem?: number; awake?: number } } | null;
  stress?: { value: number } | null;
  steps_wearable?: { value: number } | null;
  calories_wearable?: { value: number } | null;
}

const wearableHealthApi = {
  // Đồng bộ nhiều bản ghi cùng lúc (từ Health Connect)
  bulkSync: (records: WearableRecord[]) =>
    axiosClient.post<{ synced: number }>("/wearable-health/sync", { records }),

  // Upsert 1 bản ghi
  upsert: (record: WearableRecord) =>
    axiosClient.post("/wearable-health", record),

  // Lấy tất cả data hôm nay (indexed by dataType)
  getToday: () =>
    axiosClient.get<WearableTodayData>("/wearable-health/today"),

  // Lịch sử theo loại data
  getHistory: (dataType: WearableDataType, days = 7) =>
    axiosClient.get<{ date: string; value: number; minValue?: number; maxValue?: number; meta?: any }[]>(
      `/wearable-health/history?dataType=${dataType}&days=${days}`
    ),

  // Tổng hợp 7 ngày gần nhất
  getSummary: (days = 7) =>
    axiosClient.get<WearableSummary>(`/wearable-health/summary?days=${days}`),
};

export default wearableHealthApi;
