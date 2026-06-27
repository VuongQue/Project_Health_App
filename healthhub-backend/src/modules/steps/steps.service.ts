import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DailySteps } from './entities/daily-steps.entity';
import { AchievementEngine } from '../achievement/achievement.engine';

@Injectable()
export class StepsService {
  constructor(
    @InjectRepository(DailySteps)
    private readonly repo: Repository<DailySteps>,
    private readonly achievementEngine: AchievementEngine,
  ) {}

  private today() {
    return new Date().toISOString().slice(0, 10);
  }

  async upsert(userId: number, steps: number, goalSteps?: number) {
    const date = this.today();
    let record = await this.repo.findOne({ where: { userId, date } });

    if (record) {
      record.steps = steps;
      if (goalSteps) record.goalSteps = goalSteps;
    } else {
      record = this.repo.create({ userId, date, steps, goalSteps: goalSteps ?? 10000 });
    }

    const saved = await this.repo.save(record);

    await this.achievementEngine.evaluate(userId, 'STEPS_DAILY', { steps });

    return saved;
  }

  async getToday(userId: number) {
    const date = this.today();
    const record = await this.repo.findOne({ where: { userId, date } });
    return record ?? { userId, date, steps: 0, goalSteps: 10000 };
  }

  async getHistory(userId: number, days = 7) {
    return this.repo
      .createQueryBuilder('s')
      .where('s.userId = :userId', { userId })
      .orderBy('s.date', 'DESC')
      .limit(days)
      .getMany();
  }

  async getWeeklyTotal(userId: number) {
    const rows = await this.getHistory(userId, 7);
    return rows.reduce((sum, r) => sum + r.steps, 0);
  }

  async getStreak(userId: number): Promise<{
    currentStreak: number;
    bestStreak: number;
    totalActiveDays: number;
    last30Days: { date: string; steps: number; goalSteps: number; reached: boolean }[];
  }> {
    const records = await this.repo
      .createQueryBuilder('s')
      .where('s.userId = :userId', { userId })
      .orderBy('s.date', 'DESC')
      .limit(90)
      .getMany();

    if (records.length === 0) {
      return { currentStreak: 0, bestStreak: 0, totalActiveDays: 0, last30Days: [] };
    }

    // Sort ascending for streak calc
    const sorted = [...records].sort((a, b) => a.date.localeCompare(b.date));
    const today = new Date().toISOString().slice(0, 10);

    let currentStreak = 0;
    let bestStreak = 0;
    let streak = 0;
    let prevDate: string | null = null;

    for (const r of sorted) {
      const reached = r.steps >= r.goalSteps;
      if (!reached) { streak = 0; prevDate = null; continue; }

      if (!prevDate) {
        streak = 1;
      } else {
        const prev = new Date(prevDate);
        const curr = new Date(r.date);
        const diff = (curr.getTime() - prev.getTime()) / 86400000;
        streak = diff === 1 ? streak + 1 : 1;
      }
      prevDate = r.date;
      if (streak > bestStreak) bestStreak = streak;
    }

    // Current streak: count backwards from today
    const dateMap = new Map(records.map((r) => [r.date, r]));
    let checkDate = today;
    currentStreak = 0;
    while (true) {
      const r = dateMap.get(checkDate);
      if (!r || r.steps < r.goalSteps) break;
      currentStreak++;
      const d = new Date(checkDate);
      d.setDate(d.getDate() - 1);
      checkDate = d.toISOString().slice(0, 10);
    }

    const totalActiveDays = records.filter((r) => r.steps >= r.goalSteps).length;

    const last30 = Array.from({ length: 30 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (29 - i));
      const dateStr = d.toISOString().slice(0, 10);
      const r = dateMap.get(dateStr);
      return {
        date: dateStr,
        steps: r?.steps ?? 0,
        goalSteps: r?.goalSteps ?? 10000,
        reached: r ? r.steps >= r.goalSteps : false,
      };
    });

    return { currentStreak, bestStreak, totalActiveDays, last30Days: last30 };
  }
}
