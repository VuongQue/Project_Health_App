import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Workout } from './entities/workout.entity';
import { WorkoutLog } from './entities/workout-log.entity';
import { WorkoutPlan } from './entities/workout-plan.entity';
import { CreateWorkoutDto } from './dto/create-workout.dto';
import { CreateWorkoutLogDto } from './dto/create-workout-log.dto';
import { CreateWorkoutPlanDto } from './dto/create-workout-plan.dto';
import { User } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';

@Injectable()
export class FitnessService {
  constructor(
    @InjectRepository(Workout)
    private workoutRepo: Repository<Workout>,

    @InjectRepository(WorkoutLog)
    private logRepo: Repository<WorkoutLog>,

    @InjectRepository(WorkoutPlan)
    private planRepo: Repository<WorkoutPlan>,
    private usersService: UsersService,
  ) {}

  // Workout CRUD
  findAllWorkouts() {
    return this.workoutRepo.find();
  }

  async createWorkout(dto: CreateWorkoutDto) {
    const workout = this.workoutRepo.create(dto);
    return this.workoutRepo.save(workout);
  }

  // Log workout
  async logWorkout(jwtUser: any, dto: CreateWorkoutLogDto) {
  const user = await this.usersService.findByEmail(jwtUser.email);
  if (!user) throw new Error('User not found');
  const workout = await this.workoutRepo.findOne({ where: { id: dto.workoutId } });
  if (!workout) {
    throw new NotFoundException(`Workout with ID ${dto.workoutId} not found`);
  }
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
      where: { user },
      relations: ['workout'],
      order: { startedAt: 'DESC' },
    });
  }

  // Plan
  async createPlan(jwtUser: any, dto: CreateWorkoutPlanDto) {
  const user = await this.usersService.findByEmail(jwtUser.email);
  if (!user) throw new Error('User not found');

  const plan = this.planRepo.create({ ...dto, user });
  return this.planRepo.save(plan);
}

  async getPlansByUser(user: User) {
    return this.planRepo.find({ where: { user }, order: { createdAt: 'DESC' } });
  }
}
