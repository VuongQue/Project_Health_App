import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WaterLog } from './entities/water-log.entity';
import { WaterIntakeService } from './water-intake.service';
import { WaterIntakeController } from './water-intake.controller';

@Module({
  imports: [TypeOrmModule.forFeature([WaterLog])],
  controllers: [WaterIntakeController],
  providers: [WaterIntakeService],
  exports: [WaterIntakeService],
})
export class WaterIntakeModule {}
