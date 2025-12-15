import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsNotEmpty, IsObject, IsOptional, IsString, Min } from 'class-validator';
import type { ChallengeRule, ChallengeType } from '../challenge.types';

export class CreateChallengeDto {
  @ApiProperty({ example: '7 ngày theo dõi cảm xúc' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'Track mood mỗi ngày trong 7 ngày liên tiếp.' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ example: 'MOOD', enum: ['MOOD', 'WORKOUT', 'HABIT'] })
  @IsString()
  type: ChallengeType;

  @ApiProperty({ example: 7 })
  @IsInt()
  @Min(1)
  targetCount: number;

  @ApiProperty({ example: 7, required: false })
  @IsOptional()
  @IsInt()
  @Min(1)
  durationDays?: number;

  @ApiProperty({
    example: { source: 'MOOD', requireConsecutive: true, minValue: 4, maxPerDay: 1 },
  })
  @IsObject()
  rule: ChallengeRule;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;
}
