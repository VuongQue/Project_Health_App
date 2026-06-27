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

  @Column({ type: 'int', nullable: true })
  durationSec: number | null;

  @Column({ type: 'int', nullable: true })
  reps: number | null;

  @Column({ type: 'int', nullable: true })
  sets: number | null;

  @Column({ type: 'int', nullable: true })
  restSec: number | null;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'varchar', nullable: true })
  gifUrl: string | null;

  @Column('int', { default: 0 })
  orderIndex: number;
}
