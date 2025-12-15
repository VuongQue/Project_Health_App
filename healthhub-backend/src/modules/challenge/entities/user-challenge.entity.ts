import { Entity, PrimaryGeneratedColumn, ManyToOne, Column, CreateDateColumn, Index } from 'typeorm';
import { Challenge } from './challenge.entity';
import { User } from '../../users/entities/user.entity';
import type { ChallengeStatus } from '../challenge.types';

@Entity('user_challenges')
@Index(['user', 'challenge'], { unique: true })
export class UserChallenge {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Challenge, { eager: true, onDelete: 'CASCADE' })
  challenge: Challenge;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;

  @Column({ type: 'varchar', length: 20, default: 'ongoing' })
  status: ChallengeStatus;

  @CreateDateColumn()
  joinedAt: Date;

  @Column({ type: 'int', default: 0 })
  completedCount: number;

  @Column({ type: 'int', default: 0 })
  currentStreak: number;

  @Column({ type: 'int', default: 0 })
  maxStreak: number;

  @Column({ type: 'date', nullable: true })
  lastCompletedDate: string | null;

  @Column({ type: 'int', default: 0 })
  todayCount: number; // để giới hạn maxPerDay

  @Column({ type: 'date', nullable: true })
  todayKey: string | null; // hôm nay để reset todayCount
}
