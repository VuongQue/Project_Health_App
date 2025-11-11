import { IsNotEmpty, IsInt, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
export class CreateWorkoutDto {
    @ApiProperty({ example: 'Chạy bộ 30 phút', description: 'Tiêu đề bài tập' })
    @IsString()
    @IsNotEmpty()
    title: string;

    @ApiProperty({ example: 'Dành cho người mới bắt đầu', description: 'Mức độ bài tập' })
    @IsString()
    level: string;

    @ApiProperty({ example: 'Chân', description: 'Nhóm cơ chính' })
    @IsString()
    muscleGroup: string;

    @ApiProperty({ example: 'http://example.com/video.mp4', description: 'URL video hướng dẫn' })
    @IsString()
    videoUrl: string;

    @ApiProperty({ example: 10, description: 'Lượng calo tiêu thụ mỗi phút' })
    @IsInt()
    kcalPerMin: number;
}
