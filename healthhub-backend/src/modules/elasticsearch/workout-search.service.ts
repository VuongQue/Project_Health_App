import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Client } from '@elastic/elasticsearch';
import { Workout } from '../fitness/entities/workout.entity';

@Injectable()
export class WorkoutSearchService implements OnModuleInit {
  private readonly index = 'workouts';
  private readonly logger = new Logger(WorkoutSearchService.name);

  // 🔥 Đây là cấu hình đúng cho Elasticsearch 8.x
  private readonly es = new Client({
    node: 'http://localhost:9200',
  });

  // ==================================================
  // Tạo index nếu chưa có
  // ==================================================
  async onModuleInit() {
    try {
      const exists = await this.es.indices.exists({ index: this.index });

      if (!exists) {
        this.logger.log(`Creating index ${this.index}...`);

        await this.es.indices.create({
          index: this.index,
          body: {
            settings: {
              analysis: {
                analyzer: {
                  edge_ngram_analyzer: {
                    type: "custom",
                    tokenizer: "edge_ngram_tokenizer",
                    filter: ["lowercase"],
                  },
                },
                tokenizer: {
                  edge_ngram_tokenizer: {
                    type: "edge_ngram",
                    min_gram: 1,
                    max_gram: 20,
                    token_chars: ["letter", "digit"],
                  },
                },
              },
            },
            mappings: {
              properties: {
                id: { type: 'integer' },
                title: {
                  type: 'text',
                  analyzer: 'edge_ngram_analyzer',
                  search_analyzer: 'standard',
                },
                description: { type: 'text' },
                level: { type: 'keyword' },
                muscleGroup: { type: 'keyword' },
                kcalPerMin: { type: 'integer' },
                createdAt: { type: 'date' },
              },
            },
          },
        });

        this.logger.log(`Index ${this.index} created.`);
      } else {
        this.logger.log(`Index ${this.index} already exists.`);
      }
    } catch (e) {
      this.logger.error('❌ Elasticsearch init failed', e);
    }
  }

  // ==================================================
  // Index 1 workout
  // ==================================================
  async indexWorkout(workout: Workout) {
    await this.es.index({
      index: this.index,
      id: String(workout.id),
      document: {
        id: workout.id,
        title: workout.title,
        description: workout.description,
        level: workout.level,
        muscleGroup: workout.muscleGroup,
        kcalPerMin: workout.kcalPerMin,
        createdAt: workout.createdAt ?? new Date(),
      },
      refresh: true,
    });
  }

  // ==================================================
  // Xóa workout khỏi index
  // ==================================================
  async removeWorkout(id: number) {
    await this.es.delete({
      index: this.index,
      id: String(id),
    }).catch(err => {
      if (err.meta?.statusCode !== 404) throw err;
    });
  }

  // ==================================================
  // SEARCH hỗ trợ 1 ký tự (nhờ edge_ngram)
  // ==================================================
  async searchWorkouts(params: {
    search?: string;
    muscleGroup?: string;
    level?: string;
    minKcal?: number;
  }): Promise<number[]> {

    const must: any[] = [];

    if (params.search) {
      must.push({
        multi_match: {
          query: params.search,
          fields: ['title^3', 'description'],
          fuzziness: 'AUTO',
        },
      });
    }

    if (params.muscleGroup) {
      must.push({ term: { muscleGroup: params.muscleGroup } });
    }

    if (params.level) {
      must.push({ term: { level: params.level } });
    }

    if (params.minKcal) {
      must.push({
        range: { kcalPerMin: { gte: params.minKcal } },
      });
    }

    const result = await this.es.search({
      index: this.index,
      size: 200,
      query: { bool: { must } },
      sort: [{ createdAt: { order: 'desc' } }],
    });

    const hits = result.hits.hits as any[];
    return hits.map(h => Number(h._source.id));
  }

  // ==================================================
  // Bulk reindex toàn bộ workouts
  // ==================================================
  async bulkIndexWorkouts(workouts: Workout[]) {
    if (!workouts.length) return;

    const ops = workouts.flatMap(w => [
      { index: { _index: this.index, _id: w.id } },
      {
        id: w.id,
        title: w.title,
        description: w.description,
        level: w.level,
        muscleGroup: w.muscleGroup,
        kcalPerMin: w.kcalPerMin,
        createdAt: w.createdAt ?? new Date(),
      },
    ]);

    await this.es.bulk({ refresh: true, body: ops });
  }
}
