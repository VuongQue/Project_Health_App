import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('workout_plans')
export class WorkoutPlan {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User)
  user: User;

  @Column()
  name: string;

  @Column({ length: 50 })
  goalType: string; // lose / gain / keep

  @Column('int', { default: 4 })
  weeks: number;

  @CreateDateColumn()
  createdAt: Date;
}
