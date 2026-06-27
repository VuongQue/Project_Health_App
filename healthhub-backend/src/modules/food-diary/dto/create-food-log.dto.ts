import { IsString, IsNumber, IsOptional, IsEnum, Min } from 'class-validator';
import { MealType } from '../entities/food-log.entity';

export class CreateFoodLogDto {
  @IsString()
  foodName: string;

  @IsNumber()
  @Min(0)
  calories: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  protein?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  carbs?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  fat?: number;

  @IsOptional()
  @IsNumber()
  @Min(0.1)
  servingSize?: number;

  @IsOptional()
  @IsString()
  servingUnit?: string;

  @IsEnum(MealType)
  mealType: MealType;

  @IsOptional()
  @IsString()
  note?: string;
}
