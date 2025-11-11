import { IsNotEmpty, IsString, IsInt } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
export class CreateWorkoutPlanDto {
    @ApiProperty({ example: 'Kế hoạch tập luyện giảm cân', description: 'Tên kế hoạch tập luyện' })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiProperty({ example: 'Giảm cân', description: 'Loại mục tiêu của kế hoạch' })
    @IsString()
    goalType: string;

    @ApiProperty({ example: 8, description: 'Số tuần của kế hoạch tập luyện' })
    @IsInt()
    weeks: number;
}
