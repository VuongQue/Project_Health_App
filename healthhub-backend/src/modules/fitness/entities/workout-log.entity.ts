import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Workout } from './workout.entity';

@Entity('workout_logs')
export class WorkoutLog {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User)
  user: User;

  @ManyToOne(() => Workout)
  workout: Workout;

  @Column('int')
  durationMin: number;

  @Column('int')
  kcal: number;

  @CreateDateColumn()
  startedAt: Date;

  @Column({ nullable: true })
  note?: string;
}
