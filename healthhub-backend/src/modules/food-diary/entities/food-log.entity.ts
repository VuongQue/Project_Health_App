import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum MealType {
  BREAKFAST = 'BREAKFAST',
  LUNCH = 'LUNCH',
  DINNER = 'DINNER',
  SNACK = 'SNACK',
}

@Entity('food_logs')
export class FoodLog {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User)
  user: User;

  @Column({ type: 'int' })
  userId: number;

  @Column({ type: 'varchar', length: 255 })
  foodName: string;

  @Column({ type: 'float' })
  calories: number;

  @Column({ type: 'float', nullable: true })
  protein: number; // g

  @Column({ type: 'float', nullable: true })
  carbs: number; // g

  @Column({ type: 'float', nullable: true })
  fat: number; // g

  @Column({ type: 'float', nullable: true, default: 1 })
  servingSize: number;

  @Column({ type: 'varchar', nullable: true, default: 'serving' })
  servingUnit: string;

  @Column({ type: 'enum', enum: MealType, default: MealType.LUNCH })
  mealType: MealType;

  @Column({ type: 'varchar', nullable: true })
  note: string;

  @CreateDateColumn()
  loggedAt: Date;
}
