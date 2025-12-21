import { IsOptional, IsString, IsNumberString, IsIn } from 'class-validator';

export class WorkoutFilterDto {
  // =====================
  // EXISTING (GIỮ NGUYÊN)
  // =====================
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  muscleGroup?: string;

  @IsOptional()
  @IsString()
  level?: string;

  @IsOptional()
  @IsNumberString()
  minKcal?: string;

  @IsOptional()
  @IsNumberString()
  maxKcal?: string;

  // =====================
  // NEW FOR MOOD FEATURE
  // =====================
  @IsOptional()
  @IsIn(['FITNESS', 'MOOD'])
  category?: 'FITNESS' | 'MOOD';

  @IsOptional()
  @IsNumberString()
  moodScore?: string; // 1..5

  @IsOptional()
  @IsIn([
    'BREATHING',
    'RELAX',
    'MINDFULNESS',
    'CARDIO',
    'STRENGTH',
  ])
  focusType?: string;
}
