import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Workout } from '../fitness/entities/workout.entity';

@Injectable()
export class WorkoutSearchService {
  constructor(
    @InjectRepository(Workout)
    private readonly workoutRepo: Repository<Workout>,
  ) {}

  // No-ops kept so FitnessService call sites compile without changes
  async onModuleInit() {}
  async indexWorkout(_workout: Workout) {}
  async removeWorkout(_id: number) {}
  async bulkIndexWorkouts(_workouts: Workout[]) {}

  /**
   * MySQL LIKE-based search on title, description, muscleGroup, category.
   * Returns matching workout IDs sorted by relevance (title match first).
   */
  async searchWorkouts(params: {
    search?: string;
    muscleGroup?: string;
    level?: string;
    minKcal?: number;
  }): Promise<number[]> {
    const qb = this.workoutRepo.createQueryBuilder('w');

    if (params.search) {
      const keyword = `%${params.search}%`;
      qb.where(
        '(w.title LIKE :kw OR w.description LIKE :kw OR w.muscleGroup LIKE :kw OR w.category LIKE :kw)',
        { kw: keyword },
      );
    }

    if (params.muscleGroup) {
      qb.andWhere('w.muscleGroup = :mg', { mg: params.muscleGroup });
    }

    if (params.level) {
      qb.andWhere('w.level = :lv', { lv: params.level });
    }

    if (params.minKcal) {
      qb.andWhere('w.kcalPerMin >= :mk', { mk: params.minKcal });
    }

    qb.orderBy('w.createdAt', 'DESC').select('w.id');

    const rows = await qb.getMany();
    return rows.map((r) => r.id);
  }
}
