import { IsString, IsNumber, IsOptional, IsArray, ValidateNested, IsObject } from 'class-validator';
import { Type } from 'class-transformer';

export class UpsertWearableRecordDto {
  @IsString()
  date: string; // 'YYYY-MM-DD'

  @IsString()
  dataType: string;

  @IsNumber()
  value: number;

  @IsOptional()
  @IsNumber()
  minValue?: number;

  @IsOptional()
  @IsNumber()
  maxValue?: number;

  @IsOptional()
  @IsString()
  unit?: string;

  @IsOptional()
  @IsObject()
  meta?: Record<string, any>;

  @IsOptional()
  @IsString()
  source?: string;
}

export class BulkSyncDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpsertWearableRecordDto)
  records: UpsertWearableRecordDto[];
}
