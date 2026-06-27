import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BodyMetric } from './entities/body-metric.entity';
import { CreateBodyMetricDto } from './dto/create-body-metric.dto';

@Injectable()
export class BodyMetricsService {
  constructor(
    @InjectRepository(BodyMetric)
    private readonly repo: Repository<BodyMetric>,
  ) {}

  private calcBmi(weight: number, height: number): number {
    const hm = height / 100;
    return +(weight / (hm * hm)).toFixed(1);
  }

  async create(userId: number, dto: CreateBodyMetricDto) {
    const bmi =
      dto.weight && dto.height
        ? this.calcBmi(dto.weight, dto.height)
        : dto.weight
        ? await this.calcBmiWithLastHeight(userId, dto.weight)
        : undefined;

    const metric = this.repo.create({
      userId,
      weight: dto.weight,
      height: dto.height,
      bmi,
      bloodPressureSystolic: dto.bloodPressureSystolic,
      bloodPressureDiastolic: dto.bloodPressureDiastolic,
      heartRate: dto.heartRate,
      note: dto.note,
    });

    return this.repo.save(metric);
  }

  private async calcBmiWithLastHeight(userId: number, weight: number) {
    const last = await this.repo.findOne({
      where: { userId },
      order: { recordedAt: 'DESC' },
    });
    if (last?.height) return this.calcBmi(weight, last.height);
    return undefined;
  }

  async getHistory(userId: number, limit = 30) {
    return this.repo.find({
      where: { userId },
      order: { recordedAt: 'DESC' },
      take: limit,
    });
  }

  async getLatest(userId: number) {
    return this.repo.findOne({
      where: { userId },
      order: { recordedAt: 'DESC' },
    });
  }

  async getStats(userId: number) {
    const records = await this.repo.find({
      where: { userId },
      order: { recordedAt: 'ASC' },
    });

    if (!records.length) return { weightTrend: [], bmiTrend: [], latest: null };

    const latest = records[records.length - 1];
    const weightTrend = records
      .filter((r) => r.weight)
      .map((r) => ({ date: r.recordedAt, value: r.weight }));
    const bmiTrend = records
      .filter((r) => r.bmi)
      .map((r) => ({ date: r.recordedAt, value: r.bmi }));

    return { weightTrend, bmiTrend, latest };
  }

  async delete(userId: number, id: number) {
    const metric = await this.repo.findOne({ where: { id, userId } });
    if (!metric) return { success: false };
    await this.repo.remove(metric);
    return { success: true };
  }
}
