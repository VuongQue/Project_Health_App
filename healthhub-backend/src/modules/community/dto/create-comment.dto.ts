import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CreateCommentDto {
  @ApiProperty({ example: 'Tuyệt vời quá, cố lên nhé!' })
  @IsString()
  text: string;
}
