import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { MoodEntry } from './schemas/mood-entry.schema';
import { CreateMoodDto } from './dto/create-mood.dto';

@Injectable()
export class MoodService {
  constructor(
    @InjectModel(MoodEntry.name) private moodModel: Model<MoodEntry>,
  ) {}

  async create(userId: string, dto: CreateMoodDto) {
    const mood = new this.moodModel({
      userId,
      date: dto.date,
      mood: {
        score: dto.score,
        emoji: this.mapScoreToEmoji(dto.score),
        color: this.mapScoreToColor(dto.score),
      },
      note: dto.note,
    });
    return mood.save();
  }

  async findAllByUser(userId: string, from?: Date, to?: Date) {
    const query: any = { userId };
    if (from && to) query.date = { $gte: from, $lte: to };
    return this.moodModel.find(query).sort({ date: -1 }).lean();
  }

  // helper để chuyển score -> emoji / màu
  mapScoreToEmoji(score: number) {
    const map: Record<number, string> = {
      '-2': '😞',
      '-1': '😐',
      0: '🙂',
      1: '😊',
      2: '😁',
    };
    return map[score] || '🙂';
  }

  mapScoreToColor(score: number) {
    const map: Record<number, string> = {
      '-2': '#7f1d1d',
      '-1': '#b45309',
      0: '#facc15',
      1: '#4ade80',
      2: '#16a34a',
    };
    return map[score] || '#facc15';
  }
}
