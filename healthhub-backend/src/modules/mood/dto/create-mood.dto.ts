import { IsDateString, IsOptional, IsString, IsArray, ValidateNested, IsNumber, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

class MoodObjectDto {
  @IsString()
  emoji: string;

  @IsString()
  color: string;

  @IsNumber()
  @Min(1)
  @Max(5)
  score: number; // 1 (very sad) → 5 (great)
}

export class CreateMoodDto {
  @IsDateString()
  @IsOptional()
  date?: string; // nếu không gửi sẽ lấy ngày hôm nay

  @ValidateNested()
  @Type(() => MoodObjectDto)
  mood: MoodObjectDto;

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}
