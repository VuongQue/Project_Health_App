/**
 * HealthConnectService
 *
 * Đọc dữ liệu từ Health Connect (Android) hoặc Apple HealthKit (iOS).
 * Xiaomi Band 10 → Zepp Life / Mi Fitness → Google Fit/Health Connect → App
 *
 * Cài đặt (chạy trong thư mục healthhub-app):
 *   npx expo install react-native-health-connect
 *
 * Với iOS (HealthKit) thêm vào app.json:
 *   "infoPlist": { "NSHealthShareUsageDescription": "..." }
 */

import { Platform } from "react-native";
import { WearableRecord } from "@/src/api/wearableHealthApi";

// ─── Android: react-native-health-connect ────────────────────────────────────
let HealthConnect: any = null;
try {
  // Dynamic import để tránh lỗi khi chưa cài thư viện
  HealthConnect = require("react-native-health-connect");
} catch {
  // thư viện chưa được cài — chức năng sẽ trả về mảng rỗng
}

// ─── iOS: react-native-health (HealthKit) ────────────────────────────────────
let AppleHealth: any = null;
try {
  AppleHealth = require("react-native-health");
} catch {
  // thư viện chưa được cài
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function toDateStr(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(0, 0, 0, 0);
  return d;
}

function avgOf(arr: number[]): number | null {
  if (!arr.length) return null;
  return Math.round(arr.reduce((s, v) => s + v, 0) / arr.length);
}

// ─── Android implementation ──────────────────────────────────────────────────

async function readAndroid(days = 7): Promise<WearableRecord[]> {
  if (!HealthConnect) return [];

  const { initialize, requestPermission, readRecords, getSdkStatus, SdkAvailabilityStatus } =
    HealthConnect;

  const status = await getSdkStatus();
  if (status !== SdkAvailabilityStatus.SDK_AVAILABLE) return [];

  await initialize();
  await requestPermission([
    { accessType: "read", recordType: "HeartRate" },
    { accessType: "read", recordType: "OxygenSaturation" },
    { accessType: "read", recordType: "SleepSession" },
    { accessType: "read", recordType: "Steps" },
    { accessType: "read", recordType: "TotalCaloriesBurned" },
    { accessType: "read", recordType: "RestingHeartRate" },
  ]);

  const start = daysAgo(days).toISOString();
  const end = new Date().toISOString();
  const timeRange = { operator: "between", startTime: start, endTime: end };
  const records: WearableRecord[] = [];

  // ── Nhịp tim ────────────────────────────────────────────────────────────
  try {
    const hr = await readRecords("HeartRate", { timeRangeFilter: timeRange });
    // Gom nhóm theo ngày
    const byDay: Record<string, number[]> = {};
    for (const r of hr.records ?? []) {
      const day = toDateStr(new Date(r.time ?? r.startTime));
      for (const s of r.samples ?? []) {
        (byDay[day] ??= []).push(s.beatsPerMinute);
      }
    }
    for (const [date, vals] of Object.entries(byDay)) {
      records.push({
        date,
        dataType: "heart_rate",
        value: avgOf(vals) ?? 0,
        minValue: Math.min(...vals),
        maxValue: Math.max(...vals),
        unit: "bpm",
        source: "health_connect",
      });
    }
  } catch {}

  // ── SpO2 ────────────────────────────────────────────────────────────────
  try {
    const spo2 = await readRecords("OxygenSaturation", { timeRangeFilter: timeRange });
    const byDay: Record<string, number[]> = {};
    for (const r of spo2.records ?? []) {
      const day = toDateStr(new Date(r.time));
      (byDay[day] ??= []).push(r.percentage);
    }
    for (const [date, vals] of Object.entries(byDay)) {
      records.push({
        date,
        dataType: "spo2",
        value: avgOf(vals) ?? 0,
        unit: "%",
        source: "health_connect",
      });
    }
  } catch {}

  // ── Giấc ngủ ────────────────────────────────────────────────────────────
  try {
    const sleep = await readRecords("SleepSession", { timeRangeFilter: timeRange });
    for (const r of sleep.records ?? []) {
      const start = new Date(r.startTime);
      const end = new Date(r.endTime);
      const totalMin = Math.round((end.getTime() - start.getTime()) / 60000);
      const date = toDateStr(start);

      // Gom stages
      const stages: Record<string, number> = { deep: 0, light: 0, rem: 0, awake: 0 };
      for (const s of r.stages ?? []) {
        const stageMin = Math.round(
          (new Date(s.endTime).getTime() - new Date(s.startTime).getTime()) / 60000,
        );
        // Health Connect stage types: 4=deep, 3=light, 5=REM, 1=awake
        if (s.stage === 4) stages.deep += stageMin;
        else if (s.stage === 3) stages.light += stageMin;
        else if (s.stage === 5) stages.rem += stageMin;
        else if (s.stage === 1) stages.awake += stageMin;
      }

      records.push({
        date,
        dataType: "sleep",
        value: totalMin,
        unit: "min",
        meta: stages,
        source: "health_connect",
      });
    }
  } catch {}

  // ── Bước chân từ wearable ───────────────────────────────────────────────
  try {
    const steps = await readRecords("Steps", { timeRangeFilter: timeRange });
    const byDay: Record<string, number> = {};
    for (const r of steps.records ?? []) {
      const day = toDateStr(new Date(r.startTime));
      byDay[day] = (byDay[day] ?? 0) + (r.count ?? 0);
    }
    for (const [date, value] of Object.entries(byDay)) {
      records.push({ date, dataType: "steps_wearable", value, unit: "steps", source: "health_connect" });
    }
  } catch {}

  // ── Calories ─────────────────────────────────────────────────────────────
  try {
    const cals = await readRecords("TotalCaloriesBurned", { timeRangeFilter: timeRange });
    const byDay: Record<string, number> = {};
    for (const r of cals.records ?? []) {
      const day = toDateStr(new Date(r.startTime));
      byDay[day] = (byDay[day] ?? 0) + (r.energy?.inKilocalories ?? 0);
    }
    for (const [date, value] of Object.entries(byDay)) {
      records.push({
        date,
        dataType: "calories_wearable",
        value: Math.round(value),
        unit: "kcal",
        source: "health_connect",
      });
    }
  } catch {}

  return records;
}

// ─── iOS implementation (HealthKit) ──────────────────────────────────────────

async function readIOS(days = 7): Promise<WearableRecord[]> {
  if (!AppleHealth) return [];
  const { default: AppleHealthKit, Permissions } = AppleHealth;

  const permissions = {
    permissions: {
      read: [
        Permissions.HeartRate,
        Permissions.OxygenSaturation,
        Permissions.SleepAnalysis,
        Permissions.StepCount,
        Permissions.ActiveEnergyBurned,
      ],
    },
  };

  await new Promise<void>((resolve, reject) =>
    AppleHealthKit.initHealthKit(permissions, (err: any) => (err ? reject(err) : resolve())),
  );

  const options = {
    startDate: daysAgo(days).toISOString(),
    endDate: new Date().toISOString(),
    ascending: false,
  };

  const records: WearableRecord[] = [];

  // ── Nhịp tim ────────────────────────────────────────────────────────────
  await new Promise<void>((res) => {
    AppleHealthKit.getHeartRateSamples(options, (err: any, results: any[]) => {
      if (!err && results) {
        const byDay: Record<string, number[]> = {};
        for (const r of results) {
          const day = toDateStr(new Date(r.startDate));
          (byDay[day] ??= []).push(r.value);
        }
        for (const [date, vals] of Object.entries(byDay)) {
          records.push({
            date,
            dataType: "heart_rate",
            value: avgOf(vals) ?? 0,
            minValue: Math.min(...vals),
            maxValue: Math.max(...vals),
            unit: "bpm",
            source: "healthkit",
          });
        }
      }
      res();
    });
  });

  // ── SpO2 ────────────────────────────────────────────────────────────────
  await new Promise<void>((res) => {
    AppleHealthKit.getOxygenSaturationSamples(options, (err: any, results: any[]) => {
      if (!err && results) {
        const byDay: Record<string, number[]> = {};
        for (const r of results) {
          const day = toDateStr(new Date(r.startDate));
          (byDay[day] ??= []).push(Math.round(r.value * 100));
        }
        for (const [date, vals] of Object.entries(byDay)) {
          records.push({ date, dataType: "spo2", value: avgOf(vals) ?? 0, unit: "%", source: "healthkit" });
        }
      }
      res();
    });
  });

  // ── Giấc ngủ ────────────────────────────────────────────────────────────
  await new Promise<void>((res) => {
    AppleHealthKit.getSleepSamples(options, (err: any, results: any[]) => {
      if (!err && results) {
        const byDay: Record<string, number> = {};
        for (const r of results) {
          if (r.value !== "INBED") {
            const day = toDateStr(new Date(r.startDate));
            const min = Math.round(
              (new Date(r.endDate).getTime() - new Date(r.startDate).getTime()) / 60000,
            );
            byDay[day] = (byDay[day] ?? 0) + min;
          }
        }
        for (const [date, value] of Object.entries(byDay)) {
          records.push({ date, dataType: "sleep", value, unit: "min", source: "healthkit" });
        }
      }
      res();
    });
  });

  return records;
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Đọc dữ liệu sức khoẻ từ Health Connect (Android) hoặc HealthKit (iOS).
 * Trả về mảng WearableRecord sẵn sàng gửi lên backend qua bulkSync.
 */
export async function readWearableData(days = 7): Promise<WearableRecord[]> {
  if (Platform.OS === "android") return readAndroid(days);
  if (Platform.OS === "ios") return readIOS(days);
  return [];
}

/**
 * Kiểm tra thiết bị có hỗ trợ Health Connect / HealthKit không.
 */
export async function isHealthPlatformAvailable(): Promise<boolean> {
  if (Platform.OS === "android") {
    if (!HealthConnect) return false;
    const { getSdkStatus, SdkAvailabilityStatus } = HealthConnect;
    try {
      const status = await getSdkStatus();
      return status === SdkAvailabilityStatus.SDK_AVAILABLE;
    } catch {
      return false;
    }
  }
  if (Platform.OS === "ios") {
    return !!AppleHealth;
  }
  return false;
}
