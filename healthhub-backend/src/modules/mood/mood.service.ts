import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { MoodEntry } from './schemas/mood-entry.schema';
import { CreateMoodDto } from './dto/create-mood.dto';

@Injectable()
export class MoodService {
  constructor(
    @InjectModel(MoodEntry.name) private moodModel: Model<MoodEntry>,
  ) {}

  private normalizeDate(d: Date) {
    const date = new Date(d);
    date.setHours(0, 0, 0, 0);
    return date;
  }

  // Tạo / cập nhật mood cho 1 ngày
  async create(userId: string, dto: CreateMoodDto) {
    const date = this.normalizeDate(dto.date ? new Date(dto.date) : new Date());

    const existing = await this.moodModel.findOne({ userId, date });
    if (existing) {
      existing.mood = dto.mood;
      existing.note = dto.note;
      existing.tags = dto.tags;
      await existing.save();
      return existing;
    }

    const mood = new this.moodModel({
      userId,
      date,
      mood: dto.mood,
      note: dto.note,
      tags: dto.tags,
    });

    return mood.save();
  }

  // Hôm nay
  async getToday(userId: string) {
    const today = this.normalizeDate(new Date());
    const entry = await this.moodModel
      .findOne({ userId, date: today })
      .sort({ createdAt: -1 })
      .lean();

    return {
      hasEntry: !!entry,
      date: today,
      mood: entry?.mood ?? null,
      note: entry?.note ?? null,
    };
  }

  // Lấy mới nhất (bất kỳ ngày nào)
  async getLatest(userId: string) {
    return this.moodModel
      .findOne({ userId })
      .sort({ date: -1, createdAt: -1 })
      .lean();
  }

  // Streak: số ngày liên tiếp có mood tính từ hôm nay lùi về
  async getStreak(userId: string) {
    const today = this.normalizeDate(new Date());

    const entries = await this.moodModel
      .find({ userId })
      .sort({ date: -1 })
      .lean();

    let streak = 0;
    let current = today;

    for (const entry of entries) {
      const entryDate = this.normalizeDate(new Date(entry.date));

      if (entryDate.getTime() === current.getTime()) {
        streak++;
        // lùi về hôm trước
        current.setDate(current.getDate() - 1);
      } else if (entryDate.getTime() < current.getTime()) {
        // Bị đứt quãng
        break;
      }
    }

    return { streak };
  }

  // Weekly trend (7 ngày gần nhất)
  async getWeekTrend(userId: string) {
    const today = this.normalizeDate(new Date());
    const start = this.normalizeDate(
      new Date(today.getFullYear(), today.getMonth(), today.getDate() - 6),
    );

    const entries = await this.moodModel
      .find({
        userId,
        date: { $gte: start, $lte: today },
      })
      .lean();

    const map = new Map<number, number>(); // key: timestamp, value: score(-2..2)

    for (const e of entries) {
      const d = this.normalizeDate(new Date(e.date)).getTime();
      map.set(d, e.mood.score);
    }

    const labels: string[] = [];
    const values: number[] = [];

    const weekdayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const ts = d.getTime();
      const weekday = weekdayNames[d.getDay()];
      labels.push(weekday);

      const score = map.has(ts) ? (map.get(ts) ?? 0) : 0;
      // convert -2..+2 -> 1..5 cho UI
      values.push(score + 3);
    }

    return {
      labels,
      values,
    };
  }

  // Summary: average, change, bestDay
  async getSummary(userId: string) {
    const today = this.normalizeDate(new Date());

    const startCurrent = this.normalizeDate(
      new Date(today.getFullYear(), today.getMonth(), today.getDate() - 6),
    ); // 7 ngày hiện tại
    const startPrev = this.normalizeDate(
      new Date(today.getFullYear(), today.getMonth(), today.getDate() - 13),
    ); // 7 ngày trước đó
    const endPrev = this.normalizeDate(
      new Date(today.getFullYear(), today.getMonth(), today.getDate() - 7),
    );

    const [currentEntries, prevEntries, allEntries] = await Promise.all([
      this.moodModel
        .find({ userId, date: { $gte: startCurrent, $lte: today } })
        .lean(),
      this.moodModel
        .find({ userId, date: { $gte: startPrev, $lte: endPrev } })
        .lean(),
      this.moodModel.find({ userId }).lean(),
    ]);

    const avg = (arr: any[]) => {
      if (!arr.length) return 0;
      // convert sang 1..5
      const sum = arr.reduce((s, e) => s + (e.mood.score + 3), 0);
      return sum / arr.length;
    };

    const averageMood = avg(currentEntries);
    const prevAverage = avg(prevEntries);
    const change = +(averageMood - prevAverage).toFixed(1);

    // Best day: weekday nào có avg cao nhất
    const weekdayNamesFull = [
      'Sunday',
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
    ];

    const groupByWeekday = new Map<
      number,
      { total: number; count: number; lastEmoji: string }
    >();

    for (const e of allEntries) {
      const d = new Date(e.date);
      const weekday = d.getDay();
      const g = groupByWeekday.get(weekday) ?? {
        total: 0,
        count: 0,
        lastEmoji: e.mood.emoji,
      };
      g.total += e.mood.score + 3;
      g.count += 1;
      g.lastEmoji = e.mood.emoji;
      groupByWeekday.set(weekday, g);
    }

    let bestDayName: string | null = null;
    let bestDayEmoji: string | null = null;
    let bestScore = -Infinity;

    for (const [weekday, stat] of groupByWeekday.entries()) {
      const avgDay = stat.total / stat.count;
      if (avgDay > bestScore) {
        bestScore = avgDay;
        bestDayName = weekdayNamesFull[weekday];
        bestDayEmoji = stat.lastEmoji;
      }
    }

    return {
      averageMood: +averageMood.toFixed(1),
      change: isFinite(change) ? change : 0,
      bestDay: bestDayName,
      bestDayEmoji,
    };
  }

  async getRecent(userId: string, limit = 10) {
    const list = await this.moodModel
      .find({ userId })
      .sort({ date: -1, createdAt: -1 })
      .limit(limit)
      .lean();

    return list.map((e) => ({
      id: e._id,
      date: e.date,
      emoji: e.mood.emoji,
      rating: e.mood.score + 3,
      note: e.note,
      tags: e.tags ?? [],
    }));
  }

  // Gộp hết cho UI mobile
  async getDashboard(userId: string) {
    const [today, summary, streakObj, weekTrend, recent] = await Promise.all([
      this.getToday(userId),
      this.getSummary(userId),
      this.getStreak(userId),
      this.getWeekTrend(userId),
      this.getRecent(userId, 5),
    ]);

    return {
      today,
      insights: {
        averageMood: summary.averageMood,
        change: summary.change,
        bestDay: summary.bestDay,
        bestDayEmoji: summary.bestDayEmoji,
        streak: streakObj.streak,
      },
      weekTrend,
      recent,
    };
  }
}
