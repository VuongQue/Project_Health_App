import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('workouts')
export class Workout {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column({ length: 50 })
  level: string; // Beginner / Intermediate / Advanced

  @Column({ length: 50 })
  muscleGroup: string; // Chest, Legs, Core...

  @Column()
  videoUrl: string;

  @Column('int', { default: 5 })
  kcalPerMin: number;

  @CreateDateColumn()
  createdAt: Date;
}
