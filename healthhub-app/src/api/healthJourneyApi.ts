import axiosClient from './axiosClient';

export type JourneyGoalType =
  | 'LOSE_WEIGHT'
  | 'GAIN_MUSCLE'
  | 'SLEEP_BETTER'
  | 'REDUCE_STRESS'
  | 'DRINK_WATER'
  | 'INCREASE_ACTIVITY';

export interface HealthJourney {
  id: number;
  userId: number;
  goalType: JourneyGoalType;
  durationDays: number;
  startDate: string;
  endDate: string;
  status: 'ACTIVE' | 'COMPLETED' | 'ABANDONED';
  dailyStepTarget: number;
  dailyWaterTargetMl: number;
  dailyCalorieTarget: number;
  weeklyWorkoutTarget: number;
  totalCheckIns: number;
  currentStreak: number;
  bestStreak: number;
  createdAt: string;
  updatedAt: string;
}

export interface JourneyCheckin {
  id: number;
  journeyId: number;
  date: string;
  steps: number;
  waterMl: number;
  calories: number;
  moodScore: number | null;
  completed: boolean;
  note?: string;
}

export interface ActiveJourneyResponse {
  journey: HealthJourney;
  meta: { title: string; description: string };
  todayCheckin: JourneyCheckin | null;
  checkIns: JourneyCheckin[];
  progressPercent: number;
  daysElapsed: number;
  daysRemaining: number;
}

export interface WeeklyProgressResponse {
  weekDays: {
    date: string;
    dayLabel: string;
    completed: boolean;
    steps: number;
    waterMl: number;
  }[];
  completedCount: number;
  averageMood: number | null;
}

const healthJourneyApi = {
  create: (goalType: JourneyGoalType, durationDays: number) =>
    axiosClient.post<HealthJourney>('/health-journey', { goalType, durationDays }),

  getActive: () =>
    axiosClient.get<ActiveJourneyResponse | null>('/health-journey/active'),

  getHistory: () =>
    axiosClient.get<HealthJourney[]>('/health-journey/history'),

  getWeeklyProgress: () =>
    axiosClient.get<WeeklyProgressResponse>('/health-journey/weekly-progress'),

  checkin: (note?: string) =>
    axiosClient.post<JourneyCheckin>('/health-journey/checkin', { note: note ?? '' }),

  abandon: () =>
    axiosClient.delete('/health-journey/active'),
};

export default healthJourneyApi;
