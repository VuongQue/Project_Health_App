import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';
import { HealthJourney } from './health-journey.entity';
import { User } from '../../users/entities/user.entity';

@Entity('journey_checkins')
export class JourneyCheckin {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => HealthJourney, { onDelete: 'CASCADE' })
  journey: HealthJourney;

  @Column({ type: 'int' })
  journeyId: number;

  @ManyToOne(() => User)
  user: User;

  @Column({ type: 'int' })
  userId: number;

  @Column({ type: 'date' })
  date: string;

  // Actual values logged on this day
  @Column({ type: 'int', default: 0 })
  steps: number;

  @Column({ type: 'int', default: 0 })
  waterMl: number;

  @Column({ type: 'int', default: 0 })
  calories: number;

  @Column({ type: 'int', default: 0 })
  workouts: number;

  @Column({ type: 'int', nullable: true })
  moodScore: number;

  // Whether the user explicitly checked in
  @Column({ type: 'boolean', default: false })
  completed: boolean;

  @Column({ type: 'text', nullable: true })
  note: string;

  @CreateDateColumn()
  createdAt: Date;
}
