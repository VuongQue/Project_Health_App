import { IsNumber, IsOptional, IsString, Min, Max } from 'class-validator';

export class CreateBodyMetricDto {
  @IsOptional()
  @IsNumber()
  @Min(10)
  @Max(500)
  weight?: number;

  @IsOptional()
  @IsNumber()
  @Min(50)
  @Max(300)
  height?: number;

  @IsOptional()
  @IsNumber()
  @Min(40)
  @Max(300)
  bloodPressureSystolic?: number;

  @IsOptional()
  @IsNumber()
  @Min(20)
  @Max(200)
  bloodPressureDiastolic?: number;

  @IsOptional()
  @IsNumber()
  @Min(20)
  @Max(300)
  heartRate?: number;

  @IsOptional()
  @IsString()
  note?: string;
}
