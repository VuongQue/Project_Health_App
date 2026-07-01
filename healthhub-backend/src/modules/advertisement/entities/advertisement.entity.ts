import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn,
} from 'typeorm';

export type AdPlacement = 'feed' | 'personal_banner' | 'splash';
export type AdMediaType = 'image' | 'video';
export type AdCategory =
  | 'fitness' | 'nutrition' | 'supplement' | 'equipment'
  | 'wellness' | 'apparel' | 'general';

@Entity('advertisements')
export class Advertisement {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column()
  brandName: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column()
  mediaUrl: string;

  @Column({ type: 'varchar', length: 10, default: 'image' })
  mediaType: AdMediaType;

  @Column({ type: 'varchar', length: 30, default: 'feed' })
  placement: AdPlacement;

  // Categories để contextual matching với post tags.
  // simple-array = cột TEXT → MySQL không cho phép DEFAULT trên TEXT, nên
  // để nullable và set mặc định ['general'] ở service khi tạo ad.
  @Column({ type: 'simple-array', nullable: true })
  categories: AdCategory[];

  // Link khi user tap vào ad
  @Column({ type: 'varchar', length: 500, nullable: true })
  targetUrl: string | null;

  // CTA text: "Xem thêm", "Mua ngay", "Tìm hiểu thêm"
  @Column({ type: 'varchar', length: 50, default: 'Xem thêm' })
  ctaText: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'datetime', nullable: true })
  startDate: Date | null;

  @Column({ type: 'datetime', nullable: true })
  endDate: Date | null;

  // Tracking
  @Column({ type: 'int', default: 0 })
  impressions: number;

  @Column({ type: 'int', default: 0 })
  clicks: number;

  // Priority: cao hơn → hiển thị trước
  @Column({ type: 'int', default: 0 })
  priority: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
