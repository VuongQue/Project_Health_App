import { IsDateString, IsInt, Max, Min, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
export class CreateMoodDto {
    @ApiProperty({ example: '2024-06-15', description: 'Ngày ghi nhận tâm trạng (YYYY-MM-DD)' })
    @IsDateString()
    date: string;

    @ApiProperty({ example: 1, description: 'Điểm số tâm trạng từ -2 (Rất tệ) đến 2 (Rất tốt)' })
    @IsInt()
    @Min(-2)
    @Max(2)
    score: number;

    @ApiProperty({ example: 'Cảm thấy khá ổn hôm nay.', description: 'Ghi chú thêm về tâm trạng', required: false })
    @IsOptional()
    @IsString()
    note?: string;
}
