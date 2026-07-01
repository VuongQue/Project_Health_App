import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { AdvertisementService } from './advertisement.service';
import { Advertisement } from './entities/advertisement.entity';

// Helper: fake ad
const makeAd = (over: Partial<Advertisement> = {}): Advertisement =>
  ({
    id: 1,
    title: 'Whey Gold',
    brandName: 'FitBrand',
    description: '',
    mediaUrl: 'http://x/i.jpg',
    mediaType: 'image',
    placement: 'feed',
    categories: ['supplement'],
    targetUrl: '',
    ctaText: 'Xem thêm',
    isActive: true,
    startDate: null,
    endDate: null,
    impressions: 0,
    clicks: 0,
    priority: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...over,
  }) as Advertisement;

describe('AdvertisementService', () => {
  let service: AdvertisementService;
  let repo: any;
  let qbResult: Advertisement[];

  // Chainable query-builder mock; getMany() returns qbResult
  const qb = {
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    addOrderBy: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    getMany: jest.fn(async () => qbResult),
  };

  beforeEach(async () => {
    qbResult = [];
    repo = {
      create: jest.fn((x) => x),
      save: jest.fn(async (x) => ({ id: 1, ...x })),
      find: jest.fn(),
      findOneBy: jest.fn(),
      remove: jest.fn(),
      increment: jest.fn(),
      createQueryBuilder: jest.fn(() => qb),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdvertisementService,
        { provide: getRepositoryToken(Advertisement), useValue: repo },
      ],
    }).compile();

    service = module.get(AdvertisementService);
    jest.clearAllMocks();
  });

  describe('create()', () => {
    it('applies sensible defaults when optional fields omitted', async () => {
      await service.create({
        title: 'Ad',
        brandName: 'Brand',
        mediaUrl: 'http://x/i.jpg',
      } as any);

      const arg = repo.create.mock.calls[0][0];
      expect(arg.mediaType).toBe('image');
      expect(arg.placement).toBe('feed');
      expect(arg.categories).toEqual(['general']);
      expect(arg.ctaText).toBe('Xem thêm');
      expect(arg.isActive).toBe(true);
      expect(arg.priority).toBe(0);
      expect(arg.startDate).toBeNull();
      expect(arg.endDate).toBeNull();
    });

    it('parses provided date strings into Date objects', async () => {
      await service.create({
        title: 'Ad',
        brandName: 'Brand',
        mediaUrl: 'http://x/i.jpg',
        startDate: '2026-01-01',
        endDate: '2026-02-01',
      } as any);
      const arg = repo.create.mock.calls[0][0];
      expect(arg.startDate).toBeInstanceOf(Date);
      expect(arg.endDate).toBeInstanceOf(Date);
    });
  });

  describe('findOne()', () => {
    it('throws NotFoundException when missing', async () => {
      repo.findOneBy.mockResolvedValue(null);
      await expect(service.findOne(99)).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('toggleActive()', () => {
    it('flips isActive', async () => {
      repo.findOneBy.mockResolvedValue(makeAd({ isActive: true }));
      const res = await service.toggleActive(1);
      expect(res.isActive).toBe(false);
    });
  });

  describe('getActiveAds()', () => {
    it('returns all fetched ads when no categories given (round-robin / Layer 3)', async () => {
      qbResult = [makeAd({ id: 1 }), makeAd({ id: 2, categories: ['fitness'] })];
      const res = await service.getActiveAds('feed');
      expect(res).toHaveLength(2);
      expect(qb.where).toHaveBeenCalledWith('ad.isActive = :active', { active: true });
    });

    it('prioritizes category-matched ads before unmatched (Layer 1/2)', async () => {
      qbResult = [
        makeAd({ id: 1, categories: ['apparel'] }), // unmatched
        makeAd({ id: 2, categories: ['supplement'] }), // matched
        makeAd({ id: 3, categories: ['fitness'] }), // unmatched
      ];
      const res = await service.getActiveAds('feed', ['supplement']);
      expect(res[0].id).toBe(2); // matched ad floats to front
      expect(res.map((a) => a.id)).toEqual([2, 1, 3]);
    });

    it('respects the limit after category reordering', async () => {
      qbResult = [
        makeAd({ id: 1, categories: ['apparel'] }),
        makeAd({ id: 2, categories: ['supplement'] }),
        makeAd({ id: 3, categories: ['nutrition'] }),
      ];
      const res = await service.getActiveAds('feed', ['nutrition'], 2);
      expect(res).toHaveLength(2);
      expect(res[0].id).toBe(3);
    });
  });

  describe('getAdsForAiContext()', () => {
    it('returns only ads overlapping requested categories', async () => {
      qbResult = [
        makeAd({ id: 1, categories: ['supplement'] }),
        makeAd({ id: 2, categories: ['apparel'] }),
        makeAd({ id: 3, categories: ['nutrition', 'supplement'] }),
      ];
      const res = await service.getAdsForAiContext(['supplement']);
      expect(res.map((a) => a.id).sort()).toEqual([1, 3]);
    });

    it('caps results at the requested limit', async () => {
      qbResult = [
        makeAd({ id: 1, categories: ['supplement'] }),
        makeAd({ id: 2, categories: ['supplement'] }),
        makeAd({ id: 3, categories: ['supplement'] }),
      ];
      const res = await service.getAdsForAiContext(['supplement'], 2);
      expect(res).toHaveLength(2);
    });
  });

  describe('getStats()', () => {
    it('computes CTR and avoids division by zero', async () => {
      repo.find.mockResolvedValue([
        makeAd({ id: 1, isActive: true, impressions: 100, clicks: 10 }),
        makeAd({ id: 2, isActive: false, impressions: 0, clicks: 0 }),
      ]);
      const stats = await service.getStats();
      expect(stats.total).toBe(2);
      expect(stats.active).toBe(1);
      expect(stats.totalImpressions).toBe(100);
      expect(stats.totalClicks).toBe(10);
      expect(stats.ctr).toBe('10.00%');
      // per-ad CTR: zero-impression ad must be 0.00% not NaN
      expect(stats.ads[1].ctr).toBe('0.00%');
    });

    it('returns 0.00% overall CTR when no impressions at all', async () => {
      repo.find.mockResolvedValue([makeAd({ impressions: 0, clicks: 0 })]);
      const stats = await service.getStats();
      expect(stats.ctr).toBe('0.00%');
    });
  });
});
