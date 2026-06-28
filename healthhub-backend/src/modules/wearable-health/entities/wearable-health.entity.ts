import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity('wearable_health_data')
@Index(['userId', 'date', 'dataType'], { unique: true })
export class WearableHealthData {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @Column({ type: 'date' })
  date: string; // 'YYYY-MM-DD'

  @Column({ type: 'varchar', length: 50 })
  dataType: string; // 'heart_rate' | 'spo2' | 'sleep' | 'stress' | 'steps_wearable' | 'calories_wearable'

  @Column({ type: 'float', nullable: true })
  value: number | null; // giá trị chính (nhịp tim trung bình, SpO2%, stress score...)

  @Column({ type: 'float', nullable: true })
  minValue: number | null; // nhịp tim tối thiểu

  @Column({ type: 'float', nullable: true })
  maxValue: number | null; // nhịp tim tối đa

  @Column({ type: 'varchar', length: 30, nullable: true })
  unit: string | null; // 'bpm' | '%' | 'min' | 'kcal'

  @Column({ type: 'json', nullable: true })
  meta: Record<string, any> | null; // dữ liệu mở rộng (giấc ngủ deep/light/REM, v.v.)

  @Column({ type: 'varchar', length: 50, default: 'health_connect' })
  source: string; // 'health_connect' | 'healthkit' | 'manual'

  @CreateDateColumn()
  createdAt: Date;
}
