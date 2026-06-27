import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class MoodEntry extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  // Lưu theo ngày, luôn set về 00:00:00
  @Prop({ type: Date, required: true })
  date: Date;

  @Prop({
    type: Object,
    required: true,
    default: { emoji: '🙂', color: '#FFD700', score: 0 }, // score: -2..+2
  })
  mood: {
    emoji: string;
    color: string;
    score: number; // -2 .. +2
  };

  @Prop()
  note?: string;

  @Prop([String])
  tags?: string[];
}

export const MoodEntrySchema = SchemaFactory.createForClass(MoodEntry);
