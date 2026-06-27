import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import {
  HealthJourney,
  JourneyGoalType,
  JourneyStatus,
} from './entities/health-journey.entity';
import { JourneyCheckin } from './entities/journey-checkin.entity';
import { CreateJourneyDto } from './dto/create-journey.dto';
import { DailyCheckinDto } from './dto/daily-checkin.dto';
import { StepsService } from '../steps/steps.service';
import { WaterIntakeService } from '../water-intake/water-intake.service';
import { MoodService } from '../mood/mood.service';

const GOAL_DEFAULTS: Record<
  JourneyGoalType,
  {
    stepTarget: number;
    waterTarget: number;
    calorieTarget: number;
    weeklyWorkout: number;
    title: string;
    description: string;
  }
> = {
  [JourneyGoalType.LOSE_WEIGHT]: {
    stepTarget: 10000,
    waterTarget: 2000,
    calorieTarget: 1600,
    weeklyWorkout: 4,
    title: 'Giảm cân',
    description: 'Tăng vận động, kiểm soát calo, uống đủ nước',
  },
  [JourneyGoalType.GAIN_MUSCLE]: {
    stepTarget: 8000,
    waterTarget: 2500,
    calorieTarget: 2500,
    weeklyWorkout: 5,
    title: 'Tăng cơ',
    description: 'Tập luyện cường độ cao, bổ sung protein, nghỉ ngơi đủ',
  },
  [JourneyGoalType.SLEEP_BETTER]: {
    stepTarget: 7000,
    waterTarget: 2000,
    calorieTarget: 1900,
    weeklyWorkout: 3,
    title: 'Ngủ tốt hơn',
    description: 'Vận động nhẹ nhàng, tránh calo cao buổi tối, thư giãn',
  },
  [JourneyGoalType.REDUCE_STRESS]: {
    stepTarget: 6000,
    waterTarget: 2000,
    calorieTarget: 2000,
    weeklyWorkout: 3,
    title: 'Giảm stress',
    description: 'Đi bộ mỗi ngày, yoga, ghi mood, thở sâu',
  },
  [JourneyGoalType.DRINK_WATER]: {
    stepTarget: 8000,
    waterTarget: 2500,
    calorieTarget: 2000,
    weeklyWorkout: 3,
    title: 'Uống đủ nước',
    description: 'Mục tiêu 2.5L mỗi ngày, nhắc nhở đều đặn',
  },
  [JourneyGoalType.INCREASE_ACTIVITY]: {
    stepTarget: 12000,
    waterTarget: 2000,
    calorieTarget: 2200,
    weeklyWorkout: 4,
    title: 'Tăng vận động',
    description: 'Đi bộ nhiều hơn, tập luyện đều đặn, giảm ngồi lâu',
  },
};

@Injectable()
export class HealthJourneyService {
  private readonly logger = new Logger(HealthJourneyService.name);

  constructor(
    @InjectRepository(HealthJourney)
    private readonly journeyRepo: Repository<HealthJourney>,
    @InjectRepository(JourneyCheckin)
    private readonly checkinRepo: Repository<JourneyCheckin>,
    private readonly stepsService: StepsService,
    private readonly waterService: WaterIntakeService,
    private readonly moodService: MoodService,
  ) {}

  async createJourney(userId: number, dto: CreateJourneyDto): Promise<HealthJourney> {
    // Abandon any existing active journey
    await this.journeyRepo.update(
      { userId, status: JourneyStatus.ACTIVE },
      { status: JourneyStatus.ABANDONED },
    );

    const defaults = GOAL_DEFAULTS[dto.goalType];
    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + dto.durationDays - 1);

    const journey = this.journeyRepo.create({
      userId,
      goalType: dto.goalType,
      durationDays: dto.durationDays,
      startDate: this.formatDate(startDate),
      endDate: this.formatDate(endDate),
      dailyStepTarget: defaults.stepTarget,
      dailyWaterTargetMl: defaults.waterTarget,
      dailyCalorieTarget: defaults.calorieTarget,
      weeklyWorkoutTarget: defaults.weeklyWorkout,
    });

    return this.journeyRepo.save(journey);
  }

  async getActiveJourney(userId: number): Promise<{
    journey: HealthJourney;
    meta: { title: string; description: string };
    todayCheckin: JourneyCheckin | null;
    checkIns: JourneyCheckin[];
    progressPercent: number;
    daysElapsed: number;
    daysRemaining: number;
  } | null> {
    const journey = await this.journeyRepo.findOne({
      where: { userId, status: JourneyStatus.ACTIVE },
    });
    if (!journey) return null;

    const today = this.formatDate(new Date());
    const checkIns = await this.checkinRepo.find({
      where: { journeyId: journey.id, userId },
      order: { date: 'ASC' },
    });

    const todayCheckin = checkIns.find((c) => c.date === today) ?? null;

    const start = new Date(journey.startDate);
    const end = new Date(journey.endDate);
    const now = new Date();
    const daysElapsed = Math.max(
      0,
      Math.floor((now.getTime() - start.getTime()) / 86400000) + 1,
    );
    const daysRemaining = Math.max(
      0,
      Math.floor((end.getTime() - now.getTime()) / 86400000),
    );
    const completedDays = checkIns.filter((c) => c.completed).length;
    const progressPercent = Math.round((completedDays / journey.durationDays) * 100);

    const meta = {
      title: GOAL_DEFAULTS[journey.goalType].title,
      description: GOAL_DEFAULTS[journey.goalType].description,
    };

    return {
      journey,
      meta,
      todayCheckin,
      checkIns,
      progressPercent,
      daysElapsed,
      daysRemaining,
    };
  }

  async dailyCheckin(userId: number, dto: DailyCheckinDto): Promise<JourneyCheckin> {
    const journey = await this.journeyRepo.findOne({
      where: { userId, status: JourneyStatus.ACTIVE },
    });
    if (!journey) throw new NotFoundException('Không có lộ trình đang hoạt động');

    const today = this.formatDate(new Date());

    // Check if already checked in today
    let checkin = await this.checkinRepo.findOne({
      where: { journeyId: journey.id, userId, date: today },
    });

    // Fetch real-time data from other modules
    const [stepsData, waterData, moodData] = await Promise.allSettled([
      this.stepsService.getToday(userId),
      this.waterService.getToday(userId),
      this.moodService.getToday(String(userId)),
    ]);

    const steps = stepsData.status === 'fulfilled' ? (stepsData.value?.steps ?? 0) : 0;
    const waterMl = waterData.status === 'fulfilled' ? (waterData.value?.total ?? 0) : 0;
    const moodScore = moodData.status === 'fulfilled' ? (moodData.value?.mood?.score ?? null) : null;

    // Determine if completed based on step target
    const completed = steps >= journey.dailyStepTarget;

    if (checkin) {
      // Update existing
      checkin.steps = steps;
      checkin.waterMl = waterMl;
      if (moodScore !== null) checkin.moodScore = moodScore;
      if (dto.note) checkin.note = dto.note;
      checkin.completed = completed;
    } else {
      checkin = this.checkinRepo.create({
        journeyId: journey.id,
        userId,
        date: today,
        steps,
        waterMl,
        moodScore: moodScore ?? undefined,
        completed,
        note: dto.note,
      });
    }

    const saved = await this.checkinRepo.save(checkin);

    // Update streak
    await this.updateStreak(journey);

    // Check if journey is completed
    if (this.formatDate(new Date()) >= journey.endDate) {
      const totalCompleted = await this.checkinRepo.count({
        where: { journeyId: journey.id, completed: true },
      });
      if (totalCompleted >= Math.ceil(journey.durationDays * 0.7)) {
        await this.journeyRepo.update(journey.id, { status: JourneyStatus.COMPLETED });
      }
    }

    return saved;
  }

  async getJourneyHistory(userId: number): Promise<HealthJourney[]> {
    return this.journeyRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: 10,
    });
  }

  async abandonJourney(userId: number): Promise<void> {
    await this.journeyRepo.update(
      { userId, status: JourneyStatus.ACTIVE },
      { status: JourneyStatus.ABANDONED },
    );
  }

  // ─── Weekly Progress for a journey ───────────────────────────────────────
  async getWeeklyProgress(userId: number): Promise<{
    weekDays: { date: string; dayLabel: string; completed: boolean; steps: number; waterMl: number }[];
    completedCount: number;
    averageMood: number | null;
  }> {
    const journey = await this.journeyRepo.findOne({
      where: { userId, status: JourneyStatus.ACTIVE },
    });

    const today = new Date();
    const weekDays = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today);
      d.setDate(d.getDate() - (6 - i));
      return this.formatDate(d);
    });

    if (!journey) {
      return {
        weekDays: weekDays.map((date, i) => ({
          date,
          dayLabel: this.getDayLabel(i),
          completed: false,
          steps: 0,
          waterMl: 0,
        })),
        completedCount: 0,
        averageMood: null,
      };
    }

    const checkins = await this.checkinRepo.find({
      where: {
        journeyId: journey.id,
        userId,
        date: Between(weekDays[0], weekDays[6]),
      },
    });

    const checkinMap = new Map(checkins.map((c) => [c.date, c]));
    const days = weekDays.map((date, i) => {
      const c = checkinMap.get(date);
      return {
        date,
        dayLabel: this.getDayLabel(i),
        completed: c?.completed ?? false,
        steps: c?.steps ?? 0,
        waterMl: c?.waterMl ?? 0,
      };
    });

    const completedCount = days.filter((d) => d.completed).length;
    const moodScores = checkins
      .filter((c) => c.moodScore !== null && c.moodScore !== undefined)
      .map((c) => c.moodScore);
    const averageMood =
      moodScores.length > 0
        ? Math.round((moodScores.reduce((a, b) => a + b, 0) / moodScores.length) * 10) / 10
        : null;

    return { weekDays: days, completedCount, averageMood };
  }

  // ─── Private helpers ──────────────────────────────────────────────────────
  private formatDate(d: Date): string {
    return d.toISOString().split('T')[0];
  }

  private getDayLabel(index: number): string {
    const labels = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
    const today = new Date().getDay(); // 0=Sun ... 6=Sat
    const todayIdx = today === 0 ? 6 : today - 1;
    const offset = index - 6;
    const dayIdx = ((todayIdx + offset) % 7 + 7) % 7;
    return labels[dayIdx];
  }

  private async updateStreak(journey: HealthJourney): Promise<void> {
    const checkins = await this.checkinRepo.find({
      where: { journeyId: journey.id, completed: true },
      order: { date: 'DESC' },
    });

    let streak = 0;
    const today = this.formatDate(new Date());
    let checkDate = today;

    for (const c of checkins) {
      if (c.date === checkDate) {
        streak++;
        const d = new Date(checkDate);
        d.setDate(d.getDate() - 1);
        checkDate = this.formatDate(d);
      } else {
        break;
      }
    }

    const bestStreak = Math.max(journey.bestStreak, streak);
    await this.journeyRepo.update(journey.id, {
      currentStreak: streak,
      bestStreak,
      totalCheckIns: checkins.length,
    });
  }
}
