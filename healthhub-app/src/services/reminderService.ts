import AsyncStorage from '@react-native-async-storage/async-storage';

export interface ReminderSettings {
  workoutReminder: boolean;
  workoutHour: number;
  workoutMinute: number;
  waterReminder: boolean;
  waterIntervalHours: number;
  sleepReminder: boolean;
  sleepHour: number;
  sleepMinute: number;
}

const STORAGE_KEY = 'healthhub_reminder_settings';

const DEFAULTS: ReminderSettings = {
  workoutReminder: true,
  workoutHour: 7,
  workoutMinute: 0,
  waterReminder: true,
  waterIntervalHours: 2,
  sleepReminder: false,
  sleepHour: 22,
  sleepMinute: 0,
};

export const reminderService = {
  async getSettings(): Promise<ReminderSettings> {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (!raw) return DEFAULTS;
      return { ...DEFAULTS, ...JSON.parse(raw) };
    } catch {
      return DEFAULTS;
    }
  },

  async saveSettings(settings: ReminderSettings): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  },

  formatTime(hour: number, minute: number): string {
    const h = hour.toString().padStart(2, '0');
    const m = minute.toString().padStart(2, '0');
    return `${h}:${m}`;
  },
};
