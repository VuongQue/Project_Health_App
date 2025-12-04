import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
} from 'typeorm';
import { Workout } from './workout.entity';

@Entity('workout_exercises')
export class WorkoutExercise {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Workout, (w) => w.exercises, {
    onDelete: 'CASCADE',
  })
  workout: Workout;

  @Column()
  name: string;

  // exercise dạng time-based (ví dụ: plank 30s)
  @Column({ nullable: true })
  durationSec: number;

  // exercise dạng rep-based (ví dụ: push-up 12 reps)
  @Column({ nullable: true })
  reps: number;

  @Column('int', { default: 0 })
  orderIndex: number;
}
