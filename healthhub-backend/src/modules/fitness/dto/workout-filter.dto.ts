import { IsOptional, IsString, IsNumberString } from "class-validator";

export class WorkoutFilterDto {
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
  minKcal?: number;

  @IsOptional()
  @IsNumberString()
  maxKcal?: number;
}
