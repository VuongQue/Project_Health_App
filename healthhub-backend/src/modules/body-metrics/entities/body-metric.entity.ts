import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('body_metrics')
export class BodyMetric {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User)
  user: User;

  @Column({ type: 'int' })
  userId: number;

  @Column({ type: 'float', nullable: true })
  weight: number; // kg

  @Column({ type: 'float', nullable: true })
  height: number; // cm

  @Column({ type: 'float', nullable: true })
  bmi: number;

  @Column({ type: 'int', nullable: true })
  bloodPressureSystolic: number; // mmHg

  @Column({ type: 'int', nullable: true })
  bloodPressureDiastolic: number; // mmHg

  @Column({ type: 'int', nullable: true })
  heartRate: number; // bpm

  @Column({ type: 'varchar', nullable: true })
  note: string;

  @CreateDateColumn()
  recordedAt: Date;
}
