import {
  Entity, PrimaryGeneratedColumn, ManyToOne, Column,
  CreateDateColumn, UpdateDateColumn,
} from 'typeorm';
import { Event } from './event.entity';
import { User } from '../../users/entities/user.entity';
import { EventRegistration } from './event-registration.entity';

export enum SubmissionStatus {
  PENDING   = 'pending',    // Chờ admin duyệt
  APPROVED  = 'approved',   // Đã duyệt → tính tiến độ
  WARNED    = 'warned',     // Từ chối nhẹ (sai tư thế / thiếu thời gian) → upload lại được
  FRAUD     = 'fraud',      // Gian lận → ban khỏi event
  APPEALING = 'appealing',  // User đang khiếu nại sau khi bị FRAUD
  RESTORED  = 'restored',   // Admin xét lại, phục hồi sau appeal
}

@Entity('event_submissions')
export class EventSubmission {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Event, { onDelete: 'CASCADE' })
  event: Event;

  @ManyToOne(() => User)
  user: User;

  @ManyToOne(() => EventRegistration, { nullable: true })
  registration: EventRegistration;

  // URL ảnh/video bằng chứng (Cloudinary)
  @Column()
  mediaUrl: string;

  @Column({ type: 'enum', default: 'video', enum: ['video', 'image'] })
  mediaType: 'video' | 'image';

  // Ghi chú của user khi nộp (optional)
  @Column({ nullable: true })
  userNote?: string;

  @Column({ type: 'enum', enum: SubmissionStatus, default: SubmissionStatus.PENDING })
  status: SubmissionStatus;

  // Lý do admin từ chối / cảnh báo (gửi qua chat cho user)
  @Column({ nullable: true })
  adminReason?: string;

  @ManyToOne(() => User, { nullable: true })
  reviewedBy?: User;

  @Column({ type: 'datetime', nullable: true })
  reviewedAt?: Date;

  // URL ảnh/video appeal (user upload lại sau khi bị FRAUD)
  @Column({ nullable: true })
  appealMediaUrl?: string;

  @Column({ nullable: true })
  appealNote?: string;

  @Column({ type: 'datetime', nullable: true })
  appealedAt?: Date;

  // Ngày check-in ứng với submission này (YYYY-MM-DD)
  @Column({ type: 'date' })
  checkInDate: string;

  @CreateDateColumn()
  submittedAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
