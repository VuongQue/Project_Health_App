import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum EventScope {
  PUBLIC = 'PUBLIC',   // Admin tạo — hiển thị toàn bộ user
  GROUP  = 'GROUP',    // User tạo trong group — chỉ member group thấy
}

/**
 * MANUAL   — check-in tay (mặc định cũ)
 * WORKOUT  — hoàn thành ≥ conditionValue buổi tập trong ngày
 * STEPS    — đạt ≥ conditionValue bước chân trong ngày
 * WATER    — uống ≥ conditionValue ml nước trong ngày
 */
export enum EventConditionType {
  MANUAL  = 'MANUAL',
  WORKOUT = 'WORKOUT',
  STEPS   = 'STEPS',
  WATER   = 'WATER',
  MEDIA   = 'MEDIA',   // Upload video/ảnh bằng chứng — admin duyệt
}

@Entity('events')
export class Event {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column({ nullable: true })
  description?: string;

  @Column({ type: 'enum', enum: ['online', 'offline'], default: 'online' })
  type: string;

  @Column({ nullable: true })
  link?: string;

  @Column({ nullable: true })
  coverImage?: string;

  @Column({ type: 'enum', enum: EventScope, default: EventScope.PUBLIC })
  scope: EventScope;

  // Chỉ có giá trị khi scope = GROUP (MongoDB ObjectId dạng string)
  @Column({ nullable: true })
  groupId?: string;

  @Column({ type: 'int', nullable: true })
  maxParticipants?: number;

  // ─── Điều kiện tự động verify tiến độ ──────────────────────────────────────
  @Column({
    type: 'enum',
    enum: EventConditionType,
    default: EventConditionType.MANUAL,
  })
  conditionType: EventConditionType;

  // Ngưỡng cần đạt mỗi ngày: số buổi tập / số bước / số ml nước
  @Column({ type: 'int', nullable: true })
  conditionValue?: number;

  @Column({ type: 'datetime' })
  startTime: Date;

  @Column({ type: 'datetime' })
  endTime: Date;

  @ManyToOne(() => User)
  createdBy: User;

  @CreateDateColumn()
  createdAt: Date;
}
