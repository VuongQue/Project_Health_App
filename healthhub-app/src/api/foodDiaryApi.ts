import axiosClient from './axiosClient';

export type MealType = 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK';

export interface FoodLog {
  id: number;
  userId: number;
  foodName: string;
  calories: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  servingSize?: number;
  servingUnit?: string;
  mealType: MealType;
  note?: string;
  loggedAt: string;
}

export interface CreateFoodLogDto {
  foodName: string;
  calories: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  servingSize?: number;
  servingUnit?: string;
  mealType: MealType;
  note?: string;
}

export interface DaySummary {
  meals: Record<MealType, FoodLog[]>;
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
}

export const foodDiaryApi = {
  create: (dto: CreateFoodLogDto) =>
    axiosClient.post<FoodLog>('/food-diary', dto).then((r) => r.data),

  getToday: () =>
    axiosClient.get<DaySummary>('/food-diary/today').then((r) => r.data),

  getByDate: (date: string) =>
    axiosClient.get<DaySummary>(`/food-diary/date?date=${date}`).then((r) => r.data),

  getWeekSummary: () =>
    axiosClient.get('/food-diary/week').then((r) => r.data),

  delete: (id: number) =>
    axiosClient.delete(`/food-diary/${id}`).then((r) => r.data),
};
