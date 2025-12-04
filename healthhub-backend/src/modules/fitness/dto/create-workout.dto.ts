import { IsNotEmpty, IsInt, IsString, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateWorkoutExerciseDto {
  @ApiProperty({ example: "Push Ups", description: "Tên bài tập con" })
  @IsString()
  name: string;

  @ApiProperty({ example: 30, description: "Thời gian (giây), optional" })
  @IsOptional()
  @IsInt()
  durationSec?: number;

  @ApiProperty({ example: 12, description: "Số reps, optional" })
  @IsOptional()
  @IsInt()
  reps?: number;
}

export class CreateWorkoutDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty()
  @IsString()
  level: string;

  @ApiProperty()
  @IsString()
  muscleGroup: string;

  @ApiProperty()
  @IsString()
  videoUrl: string;

  @ApiProperty()
  @IsInt()
  kcalPerMin: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    type: [CreateWorkoutExerciseDto],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateWorkoutExerciseDto)
  exercises?: CreateWorkoutExerciseDto[];
}
