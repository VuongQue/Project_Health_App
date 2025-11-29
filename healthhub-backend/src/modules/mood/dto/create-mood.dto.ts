import { IsDateString, IsNotEmpty, IsOptional, IsString, IsArray, ValidateNested, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

class MoodObjectDto {
  @IsString()
  emoji: string;

  @IsString()
  color: string;

  @IsNumber()
  score: number; // -2 .. +2
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
