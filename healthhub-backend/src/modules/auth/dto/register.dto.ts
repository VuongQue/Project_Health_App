import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'Nguyen Van A', description: 'Tên đầy đủ' })
  @IsNotEmpty()
  fullName: string;

  @ApiProperty({ example: 'a@gmail.com', description: 'Địa chỉ email' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '123456', description: 'Mật khẩu đăng nhập (>=6 ký tự)' })
  @MinLength(6)
  password: string;
}
