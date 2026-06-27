import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity('daily_steps')
@Index(['userId', 'date'], { unique: true })
export class DailySteps {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @Column({ type: 'date' })
  date: string; // 'YYYY-MM-DD'

  @Column({ type: 'int', default: 0 })
  steps: number;

  @Column({ type: 'int', default: 10000 })
  goalSteps: number;

  @CreateDateColumn()
  createdAt: Date;
}
