import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('water_logs')
export class WaterLog {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User)
  user: User;

  @Column({ type: 'int' })
  userId: number;

  @Column({ type: 'int' })
  amount: number; // ml

  @CreateDateColumn()
  loggedAt: Date;
}
