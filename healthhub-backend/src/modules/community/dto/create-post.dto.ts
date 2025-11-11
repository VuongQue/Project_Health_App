import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsArray } from 'class-validator';

export class CreatePostDto {
  @ApiProperty({ example: 'Hôm nay mình vừa hoàn thành 30 phút plank!' })
  @IsString()
  content: string;

  @ApiProperty({ example: ['https://example.com/image1.jpg'], required: false })
  @IsOptional()
  @IsArray()
  media?: string[];
}
