import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BodyMetric } from './entities/body-metric.entity';
import { BodyMetricsService } from './body-metrics.service';
import { BodyMetricsController } from './body-metrics.controller';

@Module({
  imports: [TypeOrmModule.forFeature([BodyMetric])],
  controllers: [BodyMetricsController],
  providers: [BodyMetricsService],
  exports: [BodyMetricsService],
})
export class BodyMetricsModule {}
