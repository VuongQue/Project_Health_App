export class WorkoutFilterDto {
  search?: string;       // tìm theo title
  muscleGroup?: string;  // Chest, Legs, Back...
  level?: string;        // Beginner / Intermediate / Advanced
  minKcal?: number;      // kcalPerMin >= minKcal
  maxKcal?: number;      // kcalPerMin <= maxKcal
}
