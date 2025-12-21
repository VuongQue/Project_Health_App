import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import { WorkoutExercise } from './workout-exercise.entity';

// workout.entity.ts
@Entity('workouts')
export class Workout {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column({ length: 50 })
  level: string;

  @Column({ length: 50 })
  muscleGroup: string;

  @Column({ nullable: true })
  videoUrl: string;

  @Column('int', { default: 5 })
  kcalPerMin: number;

  @Column({ type: 'text', nullable: true })
  description: string;

  // =======================
  // 🔥 NEW FOR MOOD FEATURE
  // =======================

  @Column({ length: 20, default: 'FITNESS' })
  category: 'FITNESS' | 'MOOD';

  @Column({ type: 'simple-array', nullable: true })
  moodTargets?: number[]; // 1..5

  @Column({ length: 30, nullable: true })
  focusType?: 'BREATHING' | 'RELAX' | 'MINDFULNESS' | 'CARDIO' | 'STRENGTH';

  // =======================

  @OneToMany(() => WorkoutExercise, (ex) => ex.workout, {
    cascade: true,
  })
  exercises: WorkoutExercise[];

  @CreateDateColumn()
  createdAt: Date;
}

