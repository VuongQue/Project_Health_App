import { IsDateString, IsString, IsOptional, IsEnum, IsInt, Min } from 'class-validator';
import { EventScope, EventConditionType } from '../entities/event.entity';

export class CreateEventDto {
  @IsString() title: string;
  @IsOptional() @IsString() description?: string;
  @IsString() type: string; // online | offline
  @IsOptional() @IsString() link?: string;
  @IsOptional() @IsString() coverImage?: string;
  @IsEnum(EventScope) scope: EventScope;
  @IsOptional() @IsString() groupId?: string;
  @IsOptional() @IsInt() @Min(1) maxParticipants?: number;
  @IsDateString() startTime: string;
  @IsDateString() endTime: string;

  // ─── Điều kiện tự động ────────────────────────────────────────────────────
  @IsOptional() @IsEnum(EventConditionType)
  conditionType?: EventConditionType;

  // Ngưỡng cần đạt: số buổi tập (WORKOUT), số bước (STEPS), số ml (WATER)
  @IsOptional() @IsInt() @Min(1)
  conditionValue?: number;
}
