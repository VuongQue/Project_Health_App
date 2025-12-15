import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';
import type { ChallengeRule, ChallengeType } from '../challenge.types';

@Entity('challenges')
export class Challenge {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'varchar', length: 20, default: 'HABIT' })
  type: ChallengeType;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: true })
  isPublic: boolean;

  @Column({ type: 'int' })
  targetCount: number; // 7 ngày / 10 buổi / ...

  @Column({ type: 'int', nullable: true })
  durationDays?: number; // nếu muốn giới hạn thời gian (optional)

  @Column({ type: 'json' })
  rule: ChallengeRule;

  @CreateDateColumn()
  createdAt: Date;
}
