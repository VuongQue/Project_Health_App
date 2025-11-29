import { Entity, PrimaryGeneratedColumn, ManyToOne, Column, CreateDateColumn } from 'typeorm';
import { Challenge } from './challenge.entity';
import { User } from '../../users/entities/user.entity';

@Entity('user_challenges')
export class UserChallenge {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Challenge)
  challenge: Challenge;

  @ManyToOne(() => User)
  user: User;

  @Column({ default: 'ongoing' })
  status: string; // ongoing, completed, failed

  @CreateDateColumn()
  joinedAt: Date;

  @Column({ type: 'int', default: 0 })
  completedDays: number;

  @Column({ type: 'date', nullable: true })
  lastCompletedDate: string | null;

}
