import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsString, Min } from 'class-validator';

export class CreateChallengeDto {
  @ApiProperty({ example: '7 ngày thiền định' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'Duy trì thiền định 10 phút mỗi ngày trong 7 ngày.' })
  @IsString()
  description: string;

  @ApiProperty({ example: 7 })
  @IsInt()
  @Min(1)
  durationDays: number;
}
