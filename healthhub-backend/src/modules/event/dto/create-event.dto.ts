import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsString, IsOptional } from 'class-validator';

export class CreateEventDto {
  @ApiProperty() @IsString() title: string;
  @ApiProperty({ enum: ['online', 'offline'] }) @IsString() type: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() link?: string;
  @ApiProperty() @IsDateString() startTime: string;
  @ApiProperty() @IsDateString() endTime: string;
}
