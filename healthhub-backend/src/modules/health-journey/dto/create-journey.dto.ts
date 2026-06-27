import { IsEnum, IsInt, Min, Max } from 'class-validator';
import { JourneyGoalType } from '../entities/health-journey.entity';

export class CreateJourneyDto {
  @IsEnum(JourneyGoalType)
  goalType: JourneyGoalType;

  @IsInt()
  @Min(7)
  @Max(30)
  durationDays: number;
}
