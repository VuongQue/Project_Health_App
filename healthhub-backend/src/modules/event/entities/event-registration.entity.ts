import { Entity, PrimaryGeneratedColumn, ManyToOne, Column, CreateDateColumn } from 'typeorm';
import { Event } from './event.entity';
import { User } from '../../users/entities/user.entity';

@Entity('event_registrations')
export class EventRegistration {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Event)
  event: Event;

  @ManyToOne(() => User)
  user: User;

  @Column({ default: 'registered' })
  status: string; // registered, checked_in, cancelled

  @CreateDateColumn()
  registeredAt: Date;
}
