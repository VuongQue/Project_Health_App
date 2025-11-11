import { ApiProperty } from '@nestjs/swagger';
import { IsInt } from 'class-validator';

export class JoinChallengeDto {
  @ApiProperty() @IsInt() challengeId: number;
}
