import { IsString, IsEnum, IsOptional, IsBoolean, IsArray, IsInt, IsDateString, MinLength, MaxLength } from 'class-validator';
import type { AdCategory, AdMediaType, AdPlacement } from '../entities/advertisement.entity';

export class CreateAdvertisementDto {
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  title: string;

  @IsString()
  @MinLength(2)
  @MaxLength(100)
  brandName: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsString()
  mediaUrl: string;

  @IsOptional()
  @IsEnum(['image', 'video'])
  mediaType?: AdMediaType;

  @IsOptional()
  @IsEnum(['feed', 'personal_banner', 'splash'])
  placement?: AdPlacement;

  @IsOptional()
  @IsArray()
  categories?: AdCategory[];

  @IsOptional()
  @IsString()
  @MaxLength(500)
  targetUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  ctaText?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsInt()
  priority?: number;
}
