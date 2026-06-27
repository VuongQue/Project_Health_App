import axiosClient from './axiosClient';

export type GoalType =
  | 'WEIGHT_LOSS'
  | 'WEIGHT_GAIN'
  | 'MUSCLE_GAIN'
  | 'IMPROVE_FITNESS'
  | 'DAILY_STEPS'
  | 'DAILY_CALORIES'
  | 'DAILY_WATER'
  | 'WEEKLY_WORKOUTS'
  | 'CUSTOM';

export type GoalStatus = 'ACTIVE' | 'COMPLETED' | 'PAUSED';

export interface UserGoal {
  id: number;
  userId: number;
  type: GoalType;
  title: string;
  description?: string;
  targetValue?: number;
  currentValue: number;
  unit?: string;
  status: GoalStatus;
  deadline?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateGoalDto {
  type: GoalType;
  title: string;
  description?: string;
  targetValue?: number;
  unit?: string;
  deadline?: string;
}

export const goalsApi = {
  create: (dto: CreateGoalDto) =>
    axiosClient.post<UserGoal>('/goals', dto).then((r) => r.data),

  getAll: () =>
    axiosClient.get<UserGoal[]>('/goals').then((r) => r.data),

  getActive: () =>
    axiosClient.get<UserGoal[]>('/goals/active').then((r) => r.data),

  updateProgress: (id: number, currentValue: number) =>
    axiosClient.put<UserGoal>(`/goals/${id}/progress`, { currentValue }).then((r) => r.data),

  updateStatus: (id: number, status: GoalStatus) =>
    axiosClient.put<UserGoal>(`/goals/${id}/status`, { status }).then((r) => r.data),

  delete: (id: number) =>
    axiosClient.delete(`/goals/${id}`).then((r) => r.data),
};
