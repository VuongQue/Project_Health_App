import { Entity, PrimaryGeneratedColumn, ManyToOne, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Event } from './event.entity';
import { User } from '../../users/entities/user.entity';

export enum RegistrationStatus {
  REGISTERED  = 'registered',
  CHECKED_IN  = 'checked_in',
  COMPLETED   = 'completed',
  CANCELLED   = 'cancelled',
}

@Entity('event_registrations')
export class EventRegistration {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Event, { onDelete: 'CASCADE' })
  event: Event;

  @ManyToOne(() => User)
  user: User;

  @Column({ type: 'enum', enum: RegistrationStatus, default: RegistrationStatus.REGISTERED })
  status: RegistrationStatus;

  // Số lần checkin (mỗi ngày tham gia event tính 1 lần)
  @Column({ type: 'int', default: 0 })
  checkInCount: number;

  // Ngày checkin cuối cùng (để chặn checkin 2 lần trong 1 ngày)
  @Column({ type: 'date', nullable: true })
  lastCheckInDate?: Date;

  // Tiến độ % (0–100)
  @Column({ type: 'int', default: 0 })
  progress: number;

  @Column({ type: 'datetime', nullable: true })
  completedAt?: Date;

  @CreateDateColumn()
  registeredAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
