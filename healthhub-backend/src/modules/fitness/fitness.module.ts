import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FitnessService } from './fitness.service';
import { FitnessController } from './fitness.controller';
import { Workout } from './entities/workout.entity';
import { WorkoutLog } from './entities/workout-log.entity';
import { WorkoutPlan } from './entities/workout-plan.entity';
import { WorkoutSession } from './entities/workout-session.entity';
import { WorkoutExercise } from './entities/workout-exercise.entity';
import { UsersModule } from '../users/users.module';
import { ElasticsearchModule } from '../elasticsearch/elasticsearch.module';
import { KafkaModule } from '../kafka/kafka.module';
import { ChallengeModule } from '../challenge/challenge.module';

@Module({
  imports: [
    UsersModule,
    ElasticsearchModule,
    TypeOrmModule.forFeature([Workout, WorkoutLog, WorkoutPlan, WorkoutSession, WorkoutExercise]),
    KafkaModule,
    ChallengeModule,
  ],
  controllers: [FitnessController],
  providers: [FitnessService],
  exports: [FitnessService], 
})
export class FitnessModule {} 
