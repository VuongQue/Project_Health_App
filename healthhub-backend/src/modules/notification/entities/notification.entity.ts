import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  JoinColumn,
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
  FRIEND_REQUEST = 'FRIEND_REQUEST',
  LIKE = 'LIKE',
  COMMENT = 'COMMENT',
  REPORT = 'REPORT',
  WARNING = 'WARNING',
  EVENT = 'EVENT',
}

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })   // 🔥 BẮT BUỘC
  user: User;

  @Column()
  userId: number;                   // 🔥 BẮT BUỘC

  @Column({ type: 'enum', enum: NotificationType })
  type: NotificationType;

  @Column()
  message: string;

  @Column({ nullable: true })
  icon?: string;

  @Column({ nullable: true })
  link?: string;

  @Column({ type: 'json', nullable: true })
  metadata?: any;

  @Column({ default: false })
  isRead: boolean;

  @Column({ default: 1 })
  priority: number;

  @CreateDateColumn()
  createdAt: Date;
}
