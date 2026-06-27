import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class SendMessageDto {
  @IsOptional()
  @IsString()
  roomId?: string; // chuỗi bình thường

  @IsOptional()
  @IsString()
  receiverId?: string; // userId MySQL

  @IsNotEmpty()
  @IsString()
  text: string;
}
