// fitness.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Workout } from './entities/workout.entity';
import { WorkoutLog } from './entities/workout-log.entity';
import { WorkoutPlan } from './entities/workout-plan.entity';
import { CreateWorkoutDto } from './dto/create-workout.dto';
import { CreateWorkoutLogDto } from './dto/create-workout-log.dto';
import { CreateWorkoutPlanDto } from './dto/create-workout-plan.dto';
import { User } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';
import { WorkoutFilterDto } from './dto/workout-filter.dto';
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';

export interface WeeklyDay {
  day: string;
  completed: boolean;
}
@Injectable()
export class FitnessService {
  constructor(
    @InjectRepository(Workout) private workoutRepo: Repository<Workout>,
    @InjectRepository(WorkoutLog) private logRepo: Repository<WorkoutLog>,
    @InjectRepository(WorkoutPlan) private planRepo: Repository<WorkoutPlan>,
    private usersService: UsersService,
  ) {}

  // ============================================
  // WORKOUT CRUD
  // ============================================
  async findAllWorkouts(filter?: WorkoutFilterDto) {
    const qb = this.workoutRepo.createQueryBuilder('w');

    if (filter?.search) {
      qb.andWhere('w.title LIKE :search', { search: `%${filter.search}%` });
    }

    if (filter?.muscleGroup) {
      qb.andWhere('w.muscleGroup = :mg', { mg: filter.muscleGroup });
    }

    if (filter?.level) {
      qb.andWhere('w.level = :lv', { lv: filter.level });
    }

    if (filter?.minKcal) {
      qb.andWhere('w.kcalPerMin >= :minKcal', { minKcal: filter.minKcal });
    }

    if (filter?.maxKcal) {
      qb.andWhere('w.kcalPerMin <= :maxKcal', { maxKcal: filter.maxKcal });
    }

    qb.orderBy('w.createdAt', 'DESC');

    return qb.getMany();
  }

  async createWorkout(dto: CreateWorkoutDto) {
    const workout = this.workoutRepo.create(dto);
    return this.workoutRepo.save(workout);
  }


  // ============================================
  // LOG WORKOUT
  // ============================================
  async logWorkout(jwtUser: any, dto: CreateWorkoutLogDto) {
    const user = await this.usersService.findByEmail(jwtUser.email);
    if (!user) throw new Error('User not found');

    const workout = await this.workoutRepo.findOne({ where: { id: dto.workoutId } });
    if (!workout) throw new NotFoundException(`Workout ${dto.workoutId} not found`);

    const log = this.logRepo.create({
      user,
      workout,
      durationMin: dto.durationMin,
      kcal: dto.kcal,
      note: dto.note,
    });

    return this.logRepo.save(log);
  }

  getLogsByUser(user: User) {
    return this.logRepo.find({
      where: { user: { id: user.id }},
      relations: ['workout'],
      order: { startedAt: 'DESC' }
    });
  }

  // ============================================
  // WEEKLY SUMMARY (UI: 8 workouts, 240 min,...)
  // ============================================
  async getWeeklySummary(user: User) {
  const logs = await this.getLogsByUser(user);

  const start = startOfWeek(new Date(), { weekStartsOn: 1 });
  const end = endOfWeek(new Date(), { weekStartsOn: 1 });

  const weeklyLogs = logs.filter(l => {
    const d = new Date(l.startedAt);
    return d >= start && d <= end;
  });

  // generate 7 days list
  const days: WeeklyDay[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);

    const count = await this.logRepo.count({
      where: {
        user: { id: user.id },
        startedAt: Between(
          new Date(d.setHours(0,0,0,0)),
          new Date(d.setHours(23,59,59,999))
        ),
      },
    });

    days.push({
      day: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'][i],
      completed: count > 0,
    });
  }

  return {
    weekTotal: {
      workouts: weeklyLogs.length,
      calories: weeklyLogs.reduce((t, x) => t + x.kcal, 0),
      minutes: weeklyLogs.reduce((t, x) => t + x.durationMin, 0),
    },
    days,
  };
}


  // ============================================
  // WEEKLY DETAIL (Mon → Sun)
  // ============================================
  async getWeeklyDetail(user: User) {
    const start = startOfWeek(new Date(), { weekStartsOn: 1 });

    const week: WeeklyDay[] = [];

    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + i);

      const count = await this.logRepo.count({
        where: {
          user: { id: user.id },
          startedAt: Between(
            new Date(d.setHours(0,0,0,0)),
            new Date(d.setHours(23,59,59,999))
          )
        }
      });

      week.push({
        day: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'][i],
        completed: count > 0,
      });
    }

  return week;
}


  // ============================================
  // MONTHLY PROGRESS (Cardio, Strength, Flex)
  // ============================================
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

  const result = {
    cardio: { sessions: 0, target: 10, progress: 0 },
    strength: { sessions: 0, target: 10, progress: 0 },
    flex: { sessions: 0, target: 10, progress: 0 },
  };

  logs.forEach(log => {
    const mg = log.workout.muscleGroup.toLowerCase();
    if (['cardio','hiit'].includes(mg)) result.cardio.sessions++;
    if (['strength','upper','lower','back','legs','chest'].includes(mg)) result.strength.sessions++;
    if (['flexibility','yoga','stretch'].includes(mg)) result.flex.sessions++;
  });

  // auto progress %
  Object.keys(result).forEach(key => {
    result[key].progress = Math.floor(
      (result[key].sessions / result[key].target) * 100
    );
  });

  return result;
}


  // ============================================
  // UI SUMMARY (UI Fitness tổng hợp)
  // ============================================
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

  // ============================================
  // QUICK START WORKOUT – sử dụng workout mặc định
  // ============================================
  async quickStart(user: User) {
    const quick = await this.workoutRepo.findOne({
      where: { title: 'Quick Workout' },
    });

    if (!quick)
      throw new NotFoundException(
        'Quick Workout not found — please insert it manually.'
      );

    const log = this.logRepo.create({
      user,
      workout: quick,
      kcal: 120,
      durationMin: 15,
      note: 'Quick workout',
    });

    return this.logRepo.save(log);
  }

  // ============================================
  // WORKOUT PLANS
  // ============================================
  async createPlan(jwtUser: any, dto: CreateWorkoutPlanDto) {
    const user = await this.usersService.findByEmail(jwtUser.email);
    if (!user) throw new Error('User not found');

    const plan = this.planRepo.create({ ...dto, user });
    return this.planRepo.save(plan);
  }

  getPlansByUser(user: User) {
    return this.planRepo.find({
      where: { user: { id: user.id }},
      order: { createdAt: 'DESC' }
    });
  }
  async getWorkoutDetail(id: number) {
    const w = await this.workoutRepo.findOne({ where: { id } });
    if (!w) throw new NotFoundException("Workout not found");
    return w;
  }

}
