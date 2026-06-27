import { IsString, IsEnum, IsOptional, IsNumber, IsDateString, Min } from 'class-validator';
import { GoalType } from '../entities/user-goal.entity';

export class CreateGoalDto {
  @IsEnum(GoalType)
  type: GoalType;

  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  targetValue?: number;

  @IsOptional()
  @IsString()
  unit?: string;

  @IsOptional()
  @IsDateString()
  deadline?: string;
}
