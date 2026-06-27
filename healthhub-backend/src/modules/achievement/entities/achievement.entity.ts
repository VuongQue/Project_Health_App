import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

export type AchievementCondition = {
  field: string;
  operator: '==' | '!=' | '>=' | '<=' | '>' | '<';
  value: number;
};

@Entity('achievements')
export class Achievement {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  code: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description?: string;

  // WORKOUT, MOOD, SYSTEM
  @Column()
  category: string;

  // WORKOUT_COMPLETED, MOOD_CREATED, LOGIN
  @Column()
  trigger: string;

  // Rule-based condition
  @Column('json')
  condition: AchievementCondition;

  // 🎭 Hidden settings
  @Column({ default: false })
  isHidden: boolean;

  /**
   * 0 = public
   * 1 = hidden (show hint)
   * 2 = progressive hint (future)
   * 3 = secret (not shown until unlocked)
   */
  @Column({ default: 0 })
  hiddenLevel: number;

  @Column({ nullable: true })
  hint?: string;

  @Column('int', { default: 10 })
  points: number;
}
