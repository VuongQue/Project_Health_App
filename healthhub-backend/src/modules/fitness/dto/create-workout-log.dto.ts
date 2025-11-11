import { IsInt, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateWorkoutLogDto {
    @ApiProperty({ example: 1, description: 'ID của bài tập' })
    @IsInt()
    workoutId: number;

    @ApiProperty({ example: 30, description: 'Thời lượng tập luyện (phút)' })
    @IsInt()
    durationMin: number;

    @ApiProperty({ example: 250, description: 'Lượng calo tiêu thụ (kcal)' })   
    @IsInt()
    kcal: number;

    @ApiProperty({ example: 'Cảm thấy rất tốt sau buổi tập', description: 'Ghi chú (tùy chọn)' })   
    @IsOptional()
    @IsString()
    note?: string;
}
