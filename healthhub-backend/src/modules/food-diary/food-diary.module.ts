import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FoodLog } from './entities/food-log.entity';
import { FoodDiaryService } from './food-diary.service';
import { FoodDiaryController } from './food-diary.controller';

@Module({
  imports: [TypeOrmModule.forFeature([FoodLog])],
  controllers: [FoodDiaryController],
  providers: [FoodDiaryService],
  exports: [FoodDiaryService],
})
export class FoodDiaryModule {}
