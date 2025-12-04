import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import { WorkoutExercise } from './workout-exercise.entity';

@Entity('workouts')
export class Workout {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column({ length: 50 })
  level: string; // Beginner | Intermediate | Advanced

  @Column({ length: 50 })
  muscleGroup: string; // Chest, Legs, Core...

  @Column({ nullable: true })
  videoUrl: string;

  @Column('int', { default: 5 })
  kcalPerMin: number;

  @Column({ type: 'text', nullable: true })
  description: string;

  @OneToMany(() => WorkoutExercise, (ex) => ex.workout, {
    cascade: true,
  })
  exercises: WorkoutExercise[];

  @CreateDateColumn()
  createdAt: Date;
}
