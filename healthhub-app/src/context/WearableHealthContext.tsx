import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import wearableHealthApi, { WearableSummary, WearableTodayData } from "@/src/api/wearableHealthApi";
import { readWearableData, isHealthPlatformAvailable } from "@/src/services/healthConnectService";

const LAST_SYNC_KEY = "@wearable_last_sync";
const MIN_SYNC_INTERVAL_MS = 30 * 60 * 1000; // 30 phút tối thiểu giữa 2 lần sync

interface WearableHealthContextValue {
  isAvailable: boolean;
  isSyncing: boolean;
  lastSyncAt: Date | null;
  todayData: WearableTodayData | null;
  summary: WearableSummary | null;
  sync: () => Promise<void>;
  refresh: () => Promise<void>;
}

const WearableHealthContext = createContext<WearableHealthContextValue>({
  isAvailable: false,
  isSyncing: false,
  lastSyncAt: null,
  todayData: null,
  summary: null,
  sync: async () => {},
  refresh: async () => {},
});

export function WearableHealthProvider({ children }: { children: React.ReactNode }) {
  const [isAvailable, setIsAvailable] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncAt, setLastSyncAt] = useState<Date | null>(null);
  const [todayData, setTodayData] = useState<WearableTodayData | null>(null);
  const [summary, setSummary] = useState<WearableSummary | null>(null);
  const syncLock = useRef(false);

  // Kiểm tra nền tảng + load last sync time
  useEffect(() => {
    (async () => {
      const available = await isHealthPlatformAvailable();
      setIsAvailable(available);

      const lastStr = await AsyncStorage.getItem(LAST_SYNC_KEY);
      if (lastStr) setLastSyncAt(new Date(lastStr));
    })();
  }, []);

  // Lấy data hiện tại từ backend (không đọc lại Health Connect)
  const refresh = useCallback(async () => {
    try {
      const [todayRes, summaryRes] = await Promise.allSettled([
        wearableHealthApi.getToday(),
        wearableHealthApi.getSummary(7),
      ]);
      if (todayRes.status === "fulfilled") setTodayData(todayRes.value.data);
      if (summaryRes.status === "fulfilled") setSummary(summaryRes.value.data);
    } catch {}
  }, []);

  // Đọc Health Connect → gửi lên backend
  const sync = useCallback(async () => {
    if (!isAvailable || syncLock.current) return;

    // Throttle: không sync quá thường xuyên
    if (lastSyncAt && Date.now() - lastSyncAt.getTime() < MIN_SYNC_INTERVAL_MS) {
      await refresh();
      return;
    }

    syncLock.current = true;
    setIsSyncing(true);
    try {
      const records = await readWearableData(7);
      if (records.length > 0) {
        await wearableHealthApi.bulkSync(records);
        const now = new Date();
        setLastSyncAt(now);
        await AsyncStorage.setItem(LAST_SYNC_KEY, now.toISOString());
      }
      await refresh();
    } catch {
      // Sync thất bại → vẫn refresh từ cache backend
      await refresh();
    } finally {
      setIsSyncing(false);
      syncLock.current = false;
    }
  }, [isAvailable, lastSyncAt, refresh]);

  // Auto-sync khi app mở (nếu đã quá 30 phút)
  useEffect(() => {
    if (isAvailable) {
      sync();
    } else {
      refresh();
    }
  }, [isAvailable]);

  return (
    <WearableHealthContext.Provider
      value={{ isAvailable, isSyncing, lastSyncAt, todayData, summary, sync, refresh }}
    >
      {children}
    </WearableHealthContext.Provider>
  );
}

export const useWearableHealth = () => useContext(WearableHealthContext);
