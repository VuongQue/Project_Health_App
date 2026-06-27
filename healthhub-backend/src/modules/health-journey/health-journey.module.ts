import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HealthJourney } from './entities/health-journey.entity';
import { JourneyCheckin } from './entities/journey-checkin.entity';
import { HealthJourneyService } from './health-journey.service';
import { HealthJourneyController } from './health-journey.controller';
import { StepsModule } from '../steps/steps.module';
import { WaterIntakeModule } from '../water-intake/water-intake.module';
import { MoodModule } from '../mood/mood.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([HealthJourney, JourneyCheckin]),
    StepsModule,
    WaterIntakeModule,
    MoodModule,
  ],
  controllers: [HealthJourneyController],
  providers: [HealthJourneyService],
  exports: [HealthJourneyService],
})
export class HealthJourneyModule {}
