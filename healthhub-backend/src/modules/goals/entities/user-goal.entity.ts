import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum GoalType {
  WEIGHT_LOSS = 'WEIGHT_LOSS',
  WEIGHT_GAIN = 'WEIGHT_GAIN',
  MUSCLE_GAIN = 'MUSCLE_GAIN',
  IMPROVE_FITNESS = 'IMPROVE_FITNESS',
  DAILY_STEPS = 'DAILY_STEPS',
  DAILY_CALORIES = 'DAILY_CALORIES',
  DAILY_WATER = 'DAILY_WATER',
  WEEKLY_WORKOUTS = 'WEEKLY_WORKOUTS',
  CUSTOM = 'CUSTOM',
}

export enum GoalStatus {
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  PAUSED = 'PAUSED',
}

@Entity('user_goals')
export class UserGoal {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User)
  user: User;

  @Column({ type: 'int' })
  userId: number;

  @Column({ type: 'enum', enum: GoalType })
  type: GoalType;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'varchar', nullable: true })
  description: string;

  @Column({ type: 'float', nullable: true })
  targetValue: number;

  @Column({ type: 'float', nullable: true, default: 0 })
  currentValue: number;

  @Column({ type: 'varchar', nullable: true })
  unit: string;

  @Column({ type: 'enum', enum: GoalStatus, default: GoalStatus.ACTIVE })
  status: GoalStatus;

  @Column({ type: 'date', nullable: true })
  deadline: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
