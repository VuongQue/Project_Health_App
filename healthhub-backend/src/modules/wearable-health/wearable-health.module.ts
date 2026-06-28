import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WearableHealthData } from './entities/wearable-health.entity';
import { WearableHealthService } from './wearable-health.service';
import { WearableHealthController } from './wearable-health.controller';

@Module({
  imports: [TypeOrmModule.forFeature([WearableHealthData])],
  providers: [WearableHealthService],
  controllers: [WearableHealthController],
  exports: [WearableHealthService],
})
export class WearableHealthModule {}
