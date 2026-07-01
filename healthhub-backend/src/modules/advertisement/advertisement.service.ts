import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual, MoreThanOrEqual, IsNull, Or } from 'typeorm';
import { Advertisement, AdCategory, AdPlacement } from './entities/advertisement.entity';
import { CreateAdvertisementDto } from './dto/create-advertisement.dto';
import { UpdateAdvertisementDto } from './dto/update-advertisement.dto';

@Injectable()
export class AdvertisementService {
  constructor(
    @InjectRepository(Advertisement)
    private readonly adRepo: Repository<Advertisement>,
  ) {}

  // ─── Admin CRUD ───────────────────────────────────────────────

  async create(dto: CreateAdvertisementDto): Promise<Advertisement> {
    const ad = this.adRepo.create({
      ...dto,
      mediaType: dto.mediaType ?? 'image',
      placement: dto.placement ?? 'feed',
      categories: dto.categories ?? ['general'],
      ctaText: dto.ctaText ?? 'Xem thêm',
      isActive: dto.isActive ?? true,
      priority: dto.priority ?? 0,
      startDate: dto.startDate ? new Date(dto.startDate) : null,
      endDate: dto.endDate ? new Date(dto.endDate) : null,
    });
    return this.adRepo.save(ad);
  }

  async findAll(): Promise<Advertisement[]> {
    return this.adRepo.find({ order: { priority: 'DESC', createdAt: 'DESC' } });
  }

  async findOne(id: number): Promise<Advertisement> {
    const ad = await this.adRepo.findOneBy({ id });
    if (!ad) throw new NotFoundException(`Advertisement #${id} not found`);
    return ad;
  }

  async update(id: number, dto: UpdateAdvertisementDto): Promise<Advertisement> {
    const ad = await this.findOne(id);
    const updated = Object.assign(ad, {
      ...dto,
      startDate: dto.startDate ? new Date(dto.startDate) : ad.startDate,
      endDate: dto.endDate ? new Date(dto.endDate) : ad.endDate,
    });
    return this.adRepo.save(updated);
  }

  async remove(id: number): Promise<void> {
    const ad = await this.findOne(id);
    await this.adRepo.remove(ad);
  }

  async toggleActive(id: number): Promise<Advertisement> {
    const ad = await this.findOne(id);
    ad.isActive = !ad.isActive;
    return this.adRepo.save(ad);
  }

  // ─── Mobile: lấy ads đang chạy ───────────────────────────────

  async getActiveAds(
    placement: AdPlacement,
    categories?: AdCategory[],
    limit = 3,
  ): Promise<Advertisement[]> {
    const now = new Date();

    const qb = this.adRepo
      .createQueryBuilder('ad')
      .where('ad.isActive = :active', { active: true })
      .andWhere('ad.placement = :placement', { placement })
      .andWhere('(ad.startDate IS NULL OR ad.startDate <= :now)', { now })
      .andWhere('(ad.endDate IS NULL OR ad.endDate >= :now)', { now })
      .orderBy('ad.priority', 'DESC')
      .addOrderBy('RAND()')
      .limit(limit);

    const ads = await qb.getMany();

    // Nếu có categories → ưu tiên ads match category (sort lại phía app)
    if (categories && categories.length > 0) {
      const matched = ads.filter((ad) =>
        (ad.categories ?? []).some((c) => categories.includes(c)),
      );
      const unmatched = ads.filter(
        (ad) => !(ad.categories ?? []).some((c) => categories.includes(c)),
      );
      return [...matched, ...unmatched].slice(0, limit);
    }

    return ads;
  }

  // ─── Tracking ─────────────────────────────────────────────────

  async trackImpression(id: number): Promise<void> {
    await this.adRepo.increment({ id }, 'impressions', 1);
  }

  async trackClick(id: number): Promise<void> {
    await this.adRepo.increment({ id }, 'clicks', 1);
  }

  // ─── AI Coach: lấy ads relevant theo context ─────────────────

  async getAdsForAiContext(categories: AdCategory[], limit = 2): Promise<Advertisement[]> {
    const now = new Date();

    const qb = this.adRepo
      .createQueryBuilder('ad')
      .where('ad.isActive = :active', { active: true })
      .andWhere('(ad.startDate IS NULL OR ad.startDate <= :now)', { now })
      .andWhere('(ad.endDate IS NULL OR ad.endDate >= :now)', { now })
      .orderBy('ad.priority', 'DESC')
      .limit(10);

    const all = await qb.getMany();

    // Filter có ít nhất 1 category overlap
    const matched = all.filter((ad) =>
      (ad.categories ?? []).some((c) => categories.includes(c)),
    );

    return matched.slice(0, limit);
  }

  // ─── Stats cho admin dashboard ────────────────────────────────

  async getStats() {
    const ads = await this.adRepo.find();
    const total = ads.length;
    const active = ads.filter((a) => a.isActive).length;
    const totalImpressions = ads.reduce((sum, a) => sum + a.impressions, 0);
    const totalClicks = ads.reduce((sum, a) => sum + a.clicks, 0);
    const ctr = totalImpressions > 0
      ? ((totalClicks / totalImpressions) * 100).toFixed(2)
      : '0.00';

    return {
      total,
      active,
      totalImpressions,
      totalClicks,
      ctr: `${ctr}%`,
      ads: ads.map((a) => ({
        id: a.id,
        title: a.title,
        brandName: a.brandName,
        placement: a.placement,
        isActive: a.isActive,
        impressions: a.impressions,
        clicks: a.clicks,
        ctr: a.impressions > 0
          ? `${((a.clicks / a.impressions) * 100).toFixed(2)}%`
          : '0.00%',
      })),
    };
  }
}
