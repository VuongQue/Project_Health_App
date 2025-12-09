import { Module } from '@nestjs/common';
import { ElasticsearchModule as ESModule } from '@nestjs/elasticsearch';
import { WorkoutSearchService } from './workout-search.service';

@Module({
  imports: [
    ESModule.register({
      node: 'http://localhost:9200',
      maxRetries: 3,
      requestTimeout: 30000,
    }),
  ],
  providers: [WorkoutSearchService],
  exports: [WorkoutSearchService],  
})
export class ElasticsearchModule {}
