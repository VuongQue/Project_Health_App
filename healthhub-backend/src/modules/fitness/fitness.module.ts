import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FitnessService } from './fitness.service';
import { FitnessController } from './fitness.controller';
import { Workout } from './entities/workout.entity';
import { WorkoutLog } from './entities/workout-log.entity';
import { WorkoutPlan } from './entities/workout-plan.entity';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    UsersModule,
    TypeOrmModule.forFeature([Workout, WorkoutLog, WorkoutPlan]),
  ],
  controllers: [FitnessController],
  providers: [FitnessService],
})
export class FitnessModule {} 
