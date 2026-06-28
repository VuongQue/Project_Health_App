import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WearableHealthData } from './entities/wearable-health.entity';
import { UpsertWearableRecordDto } from './dto/wearable-health.dto';

@Injectable()
export class WearableHealthService {
  constructor(
    @InjectRepository(WearableHealthData)
    private readonly repo: Repository<WearableHealthData>,
  ) {}

  async upsert(userId: number, dto: UpsertWearableRecordDto): Promise<WearableHealthData> {
    const existing = await this.repo.findOne({
      where: { userId, date: dto.date, dataType: dto.dataType },
    });

    if (existing) {
      Object.assign(existing, {
        value: dto.value,
        minValue: dto.minValue ?? existing.minValue,
        maxValue: dto.maxValue ?? existing.maxValue,
        unit: dto.unit ?? existing.unit,
        meta: dto.meta ?? existing.meta,
        source: dto.source ?? existing.source,
      });
      return this.repo.save(existing);
    }

    return this.repo.save(
      this.repo.create({
        userId,
        date: dto.date,
        dataType: dto.dataType,
        value: dto.value,
        minValue: dto.minValue ?? null,
        maxValue: dto.maxValue ?? null,
        unit: dto.unit ?? null,
        meta: dto.meta ?? null,
        source: dto.source ?? 'health_connect',
      }),
    );
  }

  async bulkSync(userId: number, records: UpsertWearableRecordDto[]): Promise<{ synced: number }> {
    await Promise.all(records.map((r) => this.upsert(userId, r)));
    return { synced: records.length };
  }

  async getToday(userId: number): Promise<Record<string, WearableHealthData | null>> {
    const date = new Date().toISOString().slice(0, 10);
    const rows = await this.repo.find({ where: { userId, date } });
    return this.indexByType(rows);
  }

  async getHistory(userId: number, dataType: string, days = 7): Promise<WearableHealthData[]> {
    return this.repo
      .createQueryBuilder('w')
      .where('w.userId = :userId AND w.dataType = :dataType', { userId, dataType })
      .orderBy('w.date', 'DESC')
      .limit(days)
      .getMany();
  }

  async getSummary(userId: number, days = 7): Promise<{
    avgHeartRate: number | null;
    avgSpo2: number | null;
    avgStress: number | null;
    avgSleepMin: number | null;
    heartRateHistory: { date: string; value: number }[];
    sleepHistory: { date: string; value: number; meta: any }[];
  }> {
    const types = ['heart_rate', 'spo2', 'stress', 'sleep'];
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    const cutoffStr = cutoff.toISOString().slice(0, 10);

    const rows = await this.repo
      .createQueryBuilder('w')
      .where('w.userId = :userId AND w.dataType IN (:...types) AND w.date >= :cutoff', {
        userId,
        types,
        cutoff: cutoffStr,
      })
      .orderBy('w.date', 'DESC')
      .getMany();

    const byType = this.groupByType(rows);

    const avg = (arr: WearableHealthData[]) =>
      arr.length ? Math.round(arr.reduce((s, r) => s + (r.value ?? 0), 0) / arr.length) : null;

    return {
      avgHeartRate: avg(byType['heart_rate'] ?? []),
      avgSpo2: avg(byType['spo2'] ?? []),
      avgStress: avg(byType['stress'] ?? []),
      avgSleepMin: avg(byType['sleep'] ?? []),
      heartRateHistory: (byType['heart_rate'] ?? []).map((r) => ({ date: r.date, value: r.value ?? 0 })),
      sleepHistory: (byType['sleep'] ?? []).map((r) => ({ date: r.date, value: r.value ?? 0, meta: r.meta })),
    };
  }

  // Dùng bởi AI service để đưa vào context
  async getLatestSummaryForAi(userId: number): Promise<{
    avgHeartRate: number | null;
    avgSpo2: number | null;
    avgStress: number | null;
    avgSleepMin: number | null;
  }> {
    const s = await this.getSummary(userId, 7);
    return {
      avgHeartRate: s.avgHeartRate,
      avgSpo2: s.avgSpo2,
      avgStress: s.avgStress,
      avgSleepMin: s.avgSleepMin,
    };
  }

  private indexByType(rows: WearableHealthData[]): Record<string, WearableHealthData | null> {
    const result: Record<string, WearableHealthData | null> = {};
    for (const r of rows) result[r.dataType] = r;
    return result;
  }

  private groupByType(rows: WearableHealthData[]): Record<string, WearableHealthData[]> {
    return rows.reduce<Record<string, WearableHealthData[]>>((acc, r) => {
      (acc[r.dataType] ??= []).push(r);
      return acc;
    }, {});
  }
}
