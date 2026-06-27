import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { WaterLog } from './entities/water-log.entity';

const DAILY_GOAL_ML = 2000;

@Injectable()
export class WaterIntakeService {
  constructor(
    @InjectRepository(WaterLog)
    private readonly repo: Repository<WaterLog>,
  ) {}

  async log(userId: number, amount: number) {
    const entry = this.repo.create({ userId, amount });
    return this.repo.save(entry);
  }

  async getToday(userId: number) {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);

    const logs = await this.repo.find({
      where: { userId, loggedAt: Between(start, end) },
      order: { loggedAt: 'ASC' },
    });

    const total = logs.reduce((s, l) => s + l.amount, 0);
    return {
      logs,
      total,
      goal: DAILY_GOAL_ML,
      percentage: Math.min(100, Math.round((total / DAILY_GOAL_ML) * 100)),
    };
  }

  async getWeekSummary(userId: number) {
    const today = new Date();
    const start = new Date(today);
    start.setDate(today.getDate() - 6);
    start.setHours(0, 0, 0, 0);
    today.setHours(23, 59, 59, 999);

    const logs = await this.repo.find({
      where: { userId, loggedAt: Between(start, today) },
      order: { loggedAt: 'ASC' },
    });

    const grouped: Record<string, number> = {};
    for (const log of logs) {
      const key = log.loggedAt.toISOString().split('T')[0];
      grouped[key] = (grouped[key] ?? 0) + log.amount;
    }

    return { daily: grouped, goal: DAILY_GOAL_ML };
  }

  async delete(userId: number, id: number) {
    const log = await this.repo.findOne({ where: { id, userId } });
    if (!log) return { success: false };
    await this.repo.remove(log);
    return { success: true };
  }
}
