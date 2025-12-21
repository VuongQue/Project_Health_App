import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, In, Repository } from 'typeorm';
import { startOfDay, subDays } from 'date-fns';

import { Workout } from './entities/workout.entity';
import { WorkoutLog } from './entities/workout-log.entity';
import { WorkoutPlan } from './entities/workout-plan.entity';
import { WorkoutExercise } from './entities/workout-exercise.entity';
import { WorkoutSession } from './entities/workout-session.entity';

import { CreateWorkoutDto } from './dto/create-workout.dto';
import { CreateWorkoutLogDto } from './dto/create-workout-log.dto';
import { CreateWorkoutPlanDto } from './dto/create-workout-plan.dto';
import { WorkoutFilterDto } from './dto/workout-filter.dto';

import { UsersService } from '../users/users.service';
import { User } from '../users/entities/user.entity';

import { ClientKafka } from '@nestjs/microservices';

import { TOPIC_NOTIFICATION_EVENTS } from '../../config/kafka.config';
import { NotificationType } from '../notification/entities/notification.entity';

import { ChallengeEngineService } from '../challenge/challenge-engine.service';
import { AchievementEngine } from '../achievement/achievement.engine';



import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
} from 'date-fns';
import { WorkoutSearchService } from '../elasticsearch/workout-search.service';


export interface WeeklyDay {
  day: string;
  completed: boolean;
}

@Injectable()
export class FitnessService {
  constructor(
    @InjectRepository(Workout)
    private workoutRepo: Repository<Workout>,

    @InjectRepository(WorkoutExercise)
    private exerciseRepo: Repository<WorkoutExercise>,

    @InjectRepository(WorkoutLog)
    private logRepo: Repository<WorkoutLog>,

    @InjectRepository(WorkoutPlan)
    private planRepo: Repository<WorkoutPlan>,

    @InjectRepository(WorkoutSession)
    private sessionRepo: Repository<WorkoutSession>,

    private usersService: UsersService,

    private workoutSearch: WorkoutSearchService,

    @Inject('KAFKA_CLIENT')
    private readonly kafka: ClientKafka, 
    private readonly challengeEngine: ChallengeEngineService,
    private readonly achievementEngine: AchievementEngine,
  ) {}

  // ======================================================
  // WORKOUT LIST + FILTER (ELASTICSEARCH + fallback DB)
  // ======================================================
  async findAllWorkouts(filter?: WorkoutFilterDto) {
    const where: any = {};

    if (filter?.category) {
      where.category = filter.category;
    }

    if (filter?.level) {
      where.level = filter.level;
    }

    if (filter?.muscleGroup) {
      where.muscleGroup = filter.muscleGroup;
    }

    if (filter?.focusType) {
      where.focusType = filter.focusType;
    }

    if (filter?.moodScore) {
      where.moodTargets = In([Number(filter.moodScore)]);
    }

    if (filter?.minKcal || filter?.maxKcal) {
      where.kcalPerMin = Between(
        filter.minKcal ? Number(filter.minKcal) : 0,
        filter.maxKcal ? Number(filter.maxKcal) : 999,
      );
    }

    return this.workoutRepo.find({
      where,
      relations: ['exercises'],
      order: { createdAt: 'DESC' },
    });
  }




  // ======================================================
  // CREATE WORKOUT + EXERCISES (và index vào ES)
  // ======================================================
  async createWorkout(dto: CreateWorkoutDto) {
    const workout = this.workoutRepo.create({
      title: dto.title,
      level: dto.level,
      muscleGroup: dto.muscleGroup,
      videoUrl: dto.videoUrl,
      kcalPerMin: dto.kcalPerMin,
      description: dto.description,
    });

    const saved = await this.workoutRepo.save(workout);

    // save exercises if exist
    if (dto.exercises && dto.exercises.length > 0) {
      for (let i = 0; i < dto.exercises.length; i++) {
        await this.exerciseRepo.save({
          workout: saved,
          name: dto.exercises[i].name,
          durationSec: dto.exercises[i].durationSec,
          reps: dto.exercises[i].reps,
          orderIndex: i,
        });
      }
    }

    // Index vào Elasticsearch
    await this.workoutSearch.indexWorkout(saved);

    return this.getWorkoutDetail(saved.id);
  }

  // ======================================================
  // (OPTIONAL) REINDEX TOÀN BỘ WORKOUT VÀO ES
  // ======================================================
  async reindexAllWorkouts() {
    const all = await this.workoutRepo.find();
    await this.workoutSearch.bulkIndexWorkouts(all);
    return { count: all.length };
  }

  // ======================================================
  // WORKOUT DETAIL (FULL INFO)
  // ======================================================
  async getWorkoutDetail(id: number) {
    const w = await this.workoutRepo.findOne({
      where: { id },
      relations: ['exercises'],
      // order exercises nếu version TypeORM của bạn hỗ trợ
      // order: { exercises: { orderIndex: 'ASC' } },
    });

    if (!w) throw new NotFoundException('Workout not found');

    // Nếu order không được đảm bảo từ DB, sort lại bằng JS:
    if (w.exercises) {
      w.exercises = w.exercises.sort(
        (a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0),
      );
    }

    return w;
  }

  // ======================================================
  // LOG A WORKOUT
  // ======================================================
  async logWorkout(jwtUser: any, dto: CreateWorkoutLogDto) {
    const user = await this.usersService.findByEmail(jwtUser.email);
    if (!user) throw new NotFoundException('User not found');

    const workout = await this.workoutRepo.findOne({
      where: { id: dto.workoutId },
    });
    if (!workout) throw new NotFoundException('Workout not found');

    const log = this.logRepo.create({
      user,
      workout,
      durationMin: dto.durationMin,
      kcal: dto.kcal,
      note: dto.note,
      startedAt: new Date(),
    });

    return this.logRepo.save(log);
  }

  // ======================================================
  // USER LOG LIST
  // ======================================================
  async getLogsByUser(user: User) {
    return this.logRepo.find({
      where: { user: { id: user.id } },
      relations: ['workout'],
      order: { startedAt: 'DESC' },
    });
  }

  // ======================================================
  // WEEKLY SUMMARY
  // ======================================================
  async getWeeklySummary(user: User) {
    const start = startOfWeek(new Date(), { weekStartsOn: 1 });
    const end = endOfWeek(new Date(), { weekStartsOn: 1 });

    const logs = await this.logRepo.find({
      where: {
        user: { id: user.id },
        startedAt: Between(start, end),
      },
    });

    const days: WeeklyDay[] = [];

    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);

      const count = logs.filter(
        (l) => new Date(l.startedAt).toDateString() === d.toDateString(),
      ).length;

      days.push({
        day: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i],
        completed: count > 0,
      });
    }

    return {
      weekTotal: {
        workouts: logs.length,
        calories: logs.reduce((t, x) => t + x.kcal, 0),
        minutes: logs.reduce((t, x) => t + x.durationMin, 0),
      },
      days,
    };
  }

  // ======================================================
  // WEEKLY DETAIL (UI)
  // ======================================================
  async getWeeklyDetail(user: User) {
    return this.getWeeklySummary(user);
  }

  // ======================================================
  // MONTHLY PROGRESS
  // ======================================================
  async getMonthProgress(user: User) {
    const start = startOfMonth(new Date());
    const end = endOfMonth(new Date());

    const logs = await this.logRepo.find({
      where: {
        user: { id: user.id },
        startedAt: Between(start, end),
      },
      relations: ['workout'],
    });

    const result: any = {
      cardio: { sessions: 0, target: 10, progress: 0 },
      strength: { sessions: 0, target: 10, progress: 0 },
      flex: { sessions: 0, target: 10, progress: 0 },
    };

    for (const log of logs) {
      const mg = log.workout.muscleGroup.toLowerCase();

      if (['cardio', 'hiit'].includes(mg)) result.cardio.sessions++;
      if (['strength', 'upper', 'lower', 'legs', 'chest', 'back'].includes(mg))
        result.strength.sessions++;
      if (['flexibility', 'stretch', 'yoga'].includes(mg)) result.flex.sessions++;
    }

    for (const key of Object.keys(result)) {
      result[key].progress = Math.floor(
        (result[key].sessions / result[key].target) * 100,
      );
    }

    return result;
  }

  // ======================================================
  // SUMMARY (UI FITNESS SCREEN)
  // ======================================================
  async getSummary(user: User) {
    const week = await this.getWeeklySummary(user);
    const month = await this.getMonthProgress(user);
    const logs = await this.getLogsByUser(user);

    return {
      week,
      month,
      totalKcal: logs.reduce((t, x) => t + x.kcal, 0),
      totalMinutes: logs.reduce((t, x) => t + x.durationMin, 0),
    };
  }

  // ======================================================
  // QUICK START DEFAULT WORKOUT
  // ======================================================
  async quickStart(user: User) {
    const quick = await this.workoutRepo.findOne({
      where: { title: 'Quick Workout' },
    });

    if (!quick)
      throw new NotFoundException(
        'Quick Workout not found — please insert default workout.',
      );

    const log = this.logRepo.create({
      user,
      workout: quick,
      durationMin: 15,
      kcal: 120,
      note: 'Quick workout session',
      startedAt: new Date(),
    });

    return this.logRepo.save(log);
  }

  // ======================================================
  // WORKOUT PLAN
  // ======================================================
  async createPlan(jwtUser: any, dto: CreateWorkoutPlanDto) {
    const user = await this.usersService.findByEmail(jwtUser.email);
    if (!user) throw new NotFoundException('User not found');

    const plan = this.planRepo.create({ ...dto, user });
    return this.planRepo.save(plan);
  }

  getPlansByUser(user: User) {
    return this.planRepo.find({
      where: { user: { id: user.id } },
      order: { createdAt: 'DESC' },
    });
  }

  // ===============================
  // WORKOUT SESSION SERVICES
  // ===============================
  async getActiveSession(user: User, workoutId: number) {
    return this.sessionRepo.findOne({
      where: {
        user: { id: user.id },
        workout: { id: workoutId },
        completed: false,
      },
      relations: ['workout'],
    });
  }

  async startSession(jwtUser: any, workoutId: number) {
    console.log('🔥 StartSession jwtUser =', jwtUser);

    const user = await this.usersService.findByEmail(jwtUser.email);
    if (!user) throw new NotFoundException('User not found');

    const workout = await this.workoutRepo.findOne({
      where: { id: workoutId },
      relations: ['exercises'],
    });
    if (!workout) throw new NotFoundException('Workout not found');

    const existing = await this.sessionRepo.findOne({
      where: {
        user: { id: user.id },
        workout: { id: workoutId },
        completed: false,
      },
    });
    if (existing) return existing;

    const session = this.sessionRepo.create({
      user,
      workout,
      currentExerciseIndex: 0,
      completed: false,
    });

    return this.sessionRepo.save(session);
  }

  async updateSession(user: User, sessionId: number, newIndex: number) {
    const session = await this.sessionRepo.findOne({
      where: { id: sessionId, user: { id: user.id } },
    });

    if (!session) throw new NotFoundException('Session not found');

    session.currentExerciseIndex = newIndex;

    return this.sessionRepo.save(session);
  }

  async completeSession(
    jwtUser: any,
    sessionId: number,
    dto: { seconds: number; calories: number },
  ) {
    const user = await this.usersService.findByEmail(jwtUser.email);
    if (!user) throw new NotFoundException('User not found');

    const session = await this.sessionRepo.findOne({
      where: { id: sessionId, user: { id: user.id } },
      relations: ['workout'],
    });
    if (!session) throw new NotFoundException('Session not found');

    // 1️⃣ Đánh dấu session hoàn thành
    session.completed = true;
    await this.sessionRepo.save(session);

    // 2️⃣ Tạo log
    const durationMin = Math.max(1, Math.floor(dto.seconds / 60));
    const kcal = dto.calories;

    const log = this.logRepo.create({
      user,
      workout: session.workout,
      durationMin,
      kcal,
      startedAt: new Date(Date.now() - dto.seconds * 1000),
    });
    await this.logRepo.save(log);

    // ===============================
    // 🏆 ACHIEVEMENT: WORKOUT
    // ===============================

    // 1️⃣ Tổng số workout
    const workoutCount = await this.getTotalWorkouts(user.id);

    // 2️⃣ Streak hiện tại
    const streak = await this.getWorkoutStreak(user.id);

    // 3️⃣ EARLY_BIRD (trước 6h sáng)
    const hour = new Date().getHours();
    const earlyWorkout = hour < 6 ? 1 : 0;

    // 4️⃣ COMEBACK (nghỉ >= 7 ngày rồi quay lại)
    const lastLogs = await this.logRepo.find({
      where: { user: { id: user.id } },
      order: { startedAt: 'DESC' },
      skip: 1, // bỏ log vừa tạo
      take: 1,
    });

    let comeback = 0;
    const lastLog = lastLogs[0];

    if (lastLog) {
      const diffDays =
        (Date.now() - new Date(lastLog.startedAt).getTime()) /
        (1000 * 60 * 60 * 24);

      if (diffDays >= 7) comeback = 1;
    }

    // 5️⃣ Evaluate tất cả achievement liên quan workout
    await this.achievementEngine.evaluate(user.id, 'WORKOUT_COMPLETED', {
          workoutCount,
          streak,
          earlyWorkout,
          comeback,
        });


    // 3️⃣ 🔥 EMIT KAFKA NOTIFICATION
    this.kafka.emit(
      TOPIC_NOTIFICATION_EVENTS,
      {
        userId: user.id,
        type: NotificationType.WORKOUT,
        message: `💪 Bạn vừa hoàn thành bài tập "${session.workout.title}"! Tuyệt vời lắm 👏`,
        metadata: {
          workoutId: session.workout.id,
          durationMin,
          calories: kcal,
        },
        priority: 1,
      },
    );

    try {
      await this.challengeEngine.handleUserAction({
        userId: user.id,
        source: 'WORKOUT',
        payload: {
          workoutId: session.workout.id,
          calories: kcal,
          durationMin,
        },
      });

      console.log(
        `[WORKOUT][CHALLENGE] progress updated for userId=${user.id}`,
      );
    } catch (err) {
      console.error('[WORKOUT][CHALLENGE] engine failed', err);
    }

    return { session, log };
  }


  async getSessionDetail(user: User, sessionId: number) {
    const session = await this.sessionRepo.findOne({
      where: { id: sessionId, user: { id: user.id } },
      relations: ['workout', 'workout.exercises'],
    });

    if (!session) throw new NotFoundException('Session not found');

    return session;
  }

  async getTotalWorkouts(userId: number) {
    return this.logRepo.count({
      where: { user: { id: userId } },
    });
  }

  async getWorkoutStreak(userId: number): Promise<number> {
    const logs = await this.logRepo.find({
      where: { user: { id: userId } },
      order: { startedAt: 'DESC' },
    });

    if (!logs.length) return 0;

    const days = new Set(
      logs.map((l) => startOfDay(new Date(l.startedAt)).getTime()),
    );

    let streak = 0;
    let current = startOfDay(new Date()).getTime();

    while (days.has(current)) {
      streak++;
      current = startOfDay(subDays(current, 1)).getTime();
    }

    return streak;
  }

  async getMoodWorkouts(moodScore?: number) {
    const where: any = {
      category: 'MOOD',
    };

    if (moodScore) {
      where.moodTargets = In([moodScore]);
    }

    return this.workoutRepo.find({
      where,
      order: { kcalPerMin: 'ASC' },
    });
  }

}
