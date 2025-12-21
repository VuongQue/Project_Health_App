import { Injectable, Inject, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { MoodEntry } from './schemas/mood-entry.schema';
import { CreateMoodDto } from './dto/create-mood.dto';

import { ClientKafka } from '@nestjs/microservices';
import { NotificationType } from '../notification/entities/notification.entity';
import { TOPIC_NOTIFICATION_EVENTS } from '../../config/kafka.config';

import { ChallengeEngineService } from '../challenge/challenge-engine.service';
import { AchievementEngine } from '../achievement/achievement.engine';

import { FitnessService } from '../fitness/fitness.service';


export interface TodayMoodDto {
  hasEntry: boolean;
  date: Date;
  mood: {
    score: number;
    label?: string;
  } | null;
  note: string | null;
}

export interface WeekTrendDto {
  labels: string[];
  values: number[];
}

export interface SummaryDto {
  averageMood: number;
  change: number;
  bestDay: string | null;
  bestDayScore: number | null;
}

export interface StreakDto {
  streak: number;
}

export interface RecentMoodDto {
  id: any;
  date: Date;
  rating: number;
  score: number;
  note: string | null;
  tags: string[];
}

export interface DashboardDto {
  today: TodayMoodDto;
  insights: {
    averageMood: number;
    change: number;
    bestDay: string | null;
    bestDayScore: number | null;
    streak: number;
  };
  weekTrend: WeekTrendDto;
  recent: RecentMoodDto[];
}


@Injectable()
export class MoodService {
  private readonly logger = new Logger(MoodService.name);
  constructor(
    @InjectModel(MoodEntry.name) private moodModel: Model<MoodEntry>,
    @Inject('KAFKA_CLIENT')
    private readonly kafka: ClientKafka,
    private readonly challengeEngine: ChallengeEngineService,
    private readonly achievementEngine: AchievementEngine,
    private readonly fitnessService: FitnessService,
  ) {}

  // Chuẩn hoá date về 00:00:00 để so sánh theo ngày
  private normalizeDate(d: Date) {
    const date = new Date(d);
    date.setHours(0, 0, 0, 0);
    return date;
  }

  // Tạo / cập nhật mood cho 1 ngày — LƯU THẲNG 1..5
  async create(userId: string, dto: CreateMoodDto) {
    const date = this.normalizeDate(dto.date ? new Date(dto.date) : new Date());

    this.logger.log(
      `[MOOD][CREATE] userId=${userId}, date=${date.toISOString()}, score=${dto.mood?.score}`,
    );

    // 1️⃣ Nếu đã có mood hôm nay → update (KHÔNG bắn notification)
    const existing = await this.moodModel.findOne({ userId, date });
      if (existing) {
        this.logger.warn(
          `[MOOD][UPDATE] existing mood found → update only (no notification)`,
        );

        existing.mood = dto.mood;
        existing.note = dto.note;
        existing.tags = dto.tags;

        await existing.save();
        return existing;
      }

      // 2️⃣ Tạo mood mới cho hôm nay
      const mood = new this.moodModel({
        userId,
        date,
        mood: dto.mood,
        note: dto.note,
        tags: dto.tags,
      });

      const saved = await mood.save();

      // ===============================
      // 🏆 ACHIEVEMENT: MOOD
      // ===============================
      try {
        // 1️⃣ Tổng số ngày đã ghi mood
        const moodCount = await this.moodModel.countDocuments({ userId });

        // 2️⃣ BIRTHDAY_MOOD (secret)
        let birthday = 0;
        if (dto.date) {
          const today = new Date(dto.date);
          // nếu user có birthday → so sánh ở đây
          // (giả sử user.birthDate có ở user service / profile)
          // 👉 nếu chưa có thì để 0
        }

        await this.achievementEngine.evaluate(
          { id: Number(userId) } as any, // AchievementEngine chỉ cần user.id
          'MOOD_CREATED',
          {
            moodCount,
            birthday,
          },
        );

        this.logger.log(
          `[MOOD][ACHIEVEMENT] evaluated mood achievements for userId=${userId}`,
        );
      } catch (err) {
        this.logger.error('[MOOD][ACHIEVEMENT] engine failed', err);
      }


      this.logger.log(
        `[MOOD][CREATE] new mood saved with id=${saved._id}`,
      );

      try {
        await this.challengeEngine.handleUserAction({
          userId: Number(userId),
          source: 'MOOD',
          payload: {
            score: dto.mood.score, // 1..5
          },
        });

        this.logger.log(
          `[MOOD][CHALLENGE] progress updated for userId=${userId}`,
        );
      } catch (err) {
        this.logger.error('[MOOD][CHALLENGE] engine failed', err);
      }
      // =========================
      // 🔔 NOTIFICATION: TRACK MOOD
      // =========================
      try {
        this.logger.log(`[MOOD][NOTI] emit TRACK_MOOD notification`);

        this.kafka.emit(TOPIC_NOTIFICATION_EVENTS, {
          userId: Number(userId),
          type: NotificationType.MOOD,
          message: '😊 Bạn vừa ghi lại cảm xúc hôm nay. Cảm ơn bạn đã quan tâm đến bản thân!',
          metadata: {
            moodScore: dto.mood.score,
            date: date.toISOString(),
          },
          priority: 1,
        });
      } catch (err) {
        this.logger.error('[MOOD][NOTI] emit TRACK_MOOD failed', err);
      }

      // =========================
      // 🔥 STREAK CHECK (7 / 14 / 21 / ...)
      // =========================
      try {
        const { streak } = await this.getStreak(userId);

        this.logger.log(`[MOOD][STREAK] current streak=${streak}`);

        if (streak > 0 && streak % 7 === 0) {
          this.logger.log(
            `[MOOD][STREAK] 🎉 milestone reached: ${streak} days`,
          );

          this.kafka.emit(TOPIC_NOTIFICATION_EVENTS, {
            userId: Number(userId),
            type: NotificationType.MOOD,
            message: `🔥 Tuyệt vời! Bạn đã duy trì theo dõi mood ${streak} ngày liên tiếp!`,
            metadata: {
              streak,
              milestone: 'MOOD_STREAK',
            },
            priority: 2,
          });
        }
      } catch (err) {
        this.logger.error('[MOOD][STREAK] check failed', err);
      }

      return saved;
    }

  // Hôm nay — trả đúng 1..5
  async getToday(userId: string): Promise<TodayMoodDto> {
    const today = this.normalizeDate(new Date());
    const entry = await this.moodModel
      .findOne({ userId, date: today })
      .sort({ createdAt: -1 })
      .lean();

    return {
      hasEntry: !!entry,
      date: today,
      mood: entry?.mood ?? null, // score = 1..5
      note: entry?.note ?? null,
    };
  }

  // Lấy entry gần nhất
  async getLatest(userId: string) {
    return this.moodModel
      .findOne({ userId })
      .sort({ date: -1, createdAt: -1 })
      .lean();
  }

  // Streak: số ngày liên tiếp từ hôm nay trở về trước
  async getStreak(userId: string): Promise<StreakDto>  {
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
        current.setDate(current.getDate() - 1);
      } else if (entryDate.getTime() < current.getTime()) {
        break;
      }
    }

    return { streak };
  }

  // Weekly Trend — TRẢ VỀ score 1..5 cho FE
  async getWeekTrend(userId: string): Promise<WeekTrendDto> {
    const today = this.normalizeDate(new Date());

    // Lấy ngày thứ 2 của tuần hiện tại
    const day = today.getDay(); // 0=Sun, 1=Mon,...
    const monday = this.normalizeDate(
      new Date(today.getFullYear(), today.getMonth(), today.getDate() - (day === 0 ? 6 : day - 1))
    );

    // Chủ nhật
    const sunday = this.normalizeDate(
      new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + 6)
    );

    // Lấy mọi entry trong khoảng Mon → Sun
    const entries = await this.moodModel.find({
      userId,
      date: { $gte: monday, $lte: sunday },
    }).lean();

    // map: timestamp → score (1..5)
    const map = new Map<number, number>();
    for (const e of entries) {
      const ts = this.normalizeDate(new Date(e.date)).getTime();
      map.set(ts, e.mood.score);
    }

    const labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const values: number[] = [];

    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);

      const ts = d.getTime();
      const score = map.get(ts) ?? 3; // default neutral = 3

      values.push(score);
    }

    return { labels, values };
  }


  // Summary: average, change, bestDayScore (1..5)
  async getSummary(userId: string): Promise<SummaryDto> {
    const today = this.normalizeDate(new Date());

    const startCurrent = this.normalizeDate(
      new Date(today.getFullYear(), today.getMonth(), today.getDate() - 6),
    );

    const startPrev = this.normalizeDate(
      new Date(today.getFullYear(), today.getMonth(), today.getDate() - 13),
    );

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

    // average score = 1..5
    const avgRaw = (arr: any[]) => {
      if (!arr.length) return 3;
      const sum = arr.reduce((s, e) => s + e.mood.score, 0);
      return sum / arr.length;
    };

    const averageMood = avgRaw(currentEntries);
    const prevAverageMood = avgRaw(prevEntries);
    const change = +(averageMood - prevAverageMood).toFixed(1);

    // Best Day (theo trung bình score 1..5)
    const weekdayNamesFull = [
      'Sunday',
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
    ];

    const groupByWeekday = new Map<number, { total: number; count: number }>();

    for (const e of allEntries) {
      const weekday = new Date(e.date).getDay();
      const g = groupByWeekday.get(weekday) ?? { total: 0, count: 0 };
      g.total += e.mood.score; // score 1..5
      g.count++;
      groupByWeekday.set(weekday, g);
    }

    let bestDayName: string | null = null;
    let bestDayScore: number | null = null;
    let bestScore = -Infinity;

    for (const [weekday, stat] of groupByWeekday.entries()) {
      const avgDay = stat.total / stat.count;
      if (avgDay > bestScore) {
        bestScore = avgDay;
        bestDayName = weekdayNamesFull[weekday];
        bestDayScore = +avgDay.toFixed(1);
      }
    }

    return {
      averageMood: +averageMood.toFixed(1),
      change: isFinite(change) ? change : 0,
      bestDay: bestDayName,
      bestDayScore, // 1..5
    };
  }

  // Lịch sử gần đây — rating = 1..5
  async getRecent(userId: string, limit = 10) {
    const list = await this.moodModel
      .find({ userId })
      .sort({ date: -1, createdAt: -1 })
      .limit(limit)
      .lean();

    return list.map((e) => ({
      id: e._id,
      date: e.date,
      rating: e.mood.score, // 1..5
      score: e.mood.score,  // 1..5
      note: e.note,
      tags: e.tags ?? [],
    }));
  }

  // Dashboard tổng hợp
  

  async getDashboard(userId: string): Promise<DashboardDto> {
    const promises = [
      this.getToday(userId),
      this.getSummary(userId),
      this.getStreak(userId),
      this.getWeekTrend(userId),
      this.getRecent(userId, 5),
    ] as const;
  
    const [
      today,
      summary,
      streakObj,
      weekTrend,
      recent,
    ] = await Promise.all(promises) as [
      TodayMoodDto,
      SummaryDto,
      StreakDto,
      WeekTrendDto,
      RecentMoodDto[]
    ];
  
    return {
      today,
      insights: {
        averageMood: summary.averageMood,
        change: summary.change,
        bestDay: summary.bestDay,
        bestDayScore: summary.bestDayScore,
        streak: streakObj.streak,
      },
      weekTrend,
      recent,
    };
  }
  
  
  async getWorkoutSuggestions(userId: string) {
    const today = await this.getToday(userId);
    const score = today.mood?.score ?? 3;

    const workouts = await this.fitnessService.getMoodWorkouts(score);

    return {
      mood: today.mood,
      suggestions: workouts.slice(0, 3),
    };
  }
}
