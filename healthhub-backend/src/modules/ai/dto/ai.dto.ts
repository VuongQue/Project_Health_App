import { IsString, IsArray, IsEnum, IsNumber, IsOptional, ValidateNested, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class ChatMessageDto {
  @IsEnum(['user', 'assistant'])
  role: 'user' | 'assistant';

  @IsString()
  content: string;
}

export class AiChatDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChatMessageDto)
  messages: ChatMessageDto[];
}

export class AnalyzeMealDto {
  @IsString()
  mealDescription: string;

  @IsEnum(['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK'])
  mealType: string;
}

export class WorkoutPlanDto {
  @IsNumber()
  @Min(1)
  @Max(7)
  daysPerWeek: number;

  @IsString()
  goal: string;
}

export class CompanionMessageDto {
  @IsString()
  message: string;

  @IsArray()
  @IsOptional()
  history?: { role: 'user' | 'assistant'; content: string }[];

  @IsString()
  @IsOptional()
  screen?: string;
}
