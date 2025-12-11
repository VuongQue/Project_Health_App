import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum NotificationType {
  ACHIEVEMENT = 'ACHIEVEMENT',
  WORKOUT = 'WORKOUT',
  CHALLENGE = 'CHALLENGE',
  FRIEND = 'FRIEND',
  PLAN = 'PLAN',
  MOOD = 'MOOD',
  SYSTEM = 'SYSTEM',
}

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;

  @Column({ type: 'enum', enum: NotificationType })
  type: NotificationType;

  @Column()
  message: string;

  @Column({ nullable: true })
  icon?: string;

  @Column({ nullable: true })
  link?: string; // deep-link cho FE (vd: /plan/123)

  @Column({ type: 'json', nullable: true })
  metadata?: any;

  @Column({ default: false })
  isRead: boolean;

  @Column({ default: 1 })
  priority: number;

  @CreateDateColumn()
  createdAt: Date;
}
