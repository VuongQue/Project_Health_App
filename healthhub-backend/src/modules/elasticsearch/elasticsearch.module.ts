import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorkoutSearchService } from './workout-search.service';
import { Workout } from '../fitness/entities/workout.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Workout])],
  providers: [WorkoutSearchService],
  exports: [WorkoutSearchService],
})
export class ElasticsearchModule {}
