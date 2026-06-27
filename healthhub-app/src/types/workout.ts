export interface Workout {
  id: number;
  title: string;
  muscleGroup: string;
  level: string;
  videoUrl?: string;
  kcalPerMin: number;
  createdAt: string;
}
