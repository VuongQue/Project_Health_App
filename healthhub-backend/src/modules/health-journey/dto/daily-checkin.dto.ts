import { IsOptional, IsInt, Min, IsString } from 'class-validator';

export class DailyCheckinDto {
  @IsOptional()
  @IsString()
  note?: string;
}
