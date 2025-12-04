import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  UpdateDateColumn,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Workout } from './workout.entity';

@Entity('workout_sessions')
export class WorkoutSession {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => Workout, { nullable: false })
  @JoinColumn({ name: 'workoutId' })
  workout: Workout;

  @Column({ default: 0 })
  currentExerciseIndex: number;

  @Column({ default: false })
  completed: boolean;

  @UpdateDateColumn()
  updatedAt: Date;
}
