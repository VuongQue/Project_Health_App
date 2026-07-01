export interface WorkoutExercise {
  id: number;
  name: string;
  durationSec: number | null;
  reps: number | null;
  sets: number | null;
  restSec: number | null;
  description: string | null;
  gifUrl: string | null;
  orderIndex: number;
}

export interface Workout {
  id: number;
  title: string;
  muscleGroup: string;
  level: string;
  videoUrl?: string;
  kcalPerMin: number;
  createdAt: string;
  /** Backend trả về khi load relations: ['exercises'] */
  exercises?: WorkoutExercise[];
}
