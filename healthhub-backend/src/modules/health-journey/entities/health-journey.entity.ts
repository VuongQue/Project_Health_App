import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum JourneyGoalType {
  LOSE_WEIGHT = 'LOSE_WEIGHT',
  GAIN_MUSCLE = 'GAIN_MUSCLE',
  SLEEP_BETTER = 'SLEEP_BETTER',
  REDUCE_STRESS = 'REDUCE_STRESS',
  DRINK_WATER = 'DRINK_WATER',
  INCREASE_ACTIVITY = 'INCREASE_ACTIVITY',
}

export enum JourneyDuration {
  SEVEN_DAYS = 7,
  THIRTY_DAYS = 30,
}

export enum JourneyStatus {
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  ABANDONED = 'ABANDONED',
}

@Entity('health_journeys')
export class HealthJourney {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User)
  user: User;

  @Column({ type: 'int' })
  userId: number;

  @Column({ type: 'enum', enum: JourneyGoalType })
  goalType: JourneyGoalType;

  @Column({ type: 'int', default: 7 })
  durationDays: number;

  @Column({ type: 'date' })
  startDate: string;

  @Column({ type: 'date' })
  endDate: string;

  @Column({ type: 'enum', enum: JourneyStatus, default: JourneyStatus.ACTIVE })
  status: JourneyStatus;

  // Targets generated for this journey
  @Column({ type: 'int', nullable: true })
  dailyStepTarget: number;

  @Column({ type: 'int', nullable: true })
  dailyWaterTargetMl: number;

  @Column({ type: 'int', nullable: true })
  dailyCalorieTarget: number;

  @Column({ type: 'int', nullable: true })
  weeklyWorkoutTarget: number;

  @Column({ type: 'int', default: 0 })
  totalCheckIns: number;

  @Column({ type: 'int', default: 0 })
  currentStreak: number;

  @Column({ type: 'int', default: 0 })
  bestStreak: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
