import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { Types } from 'mongoose';

@Schema({ timestamps: true })
export class MoodEntry extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ type: Date, required: true })
  date: Date;

  @Prop({
    type: Object,
    required: true,
    default: { emoji: '🙂', color: '#FFD700', score: 0 },
  })
  mood: {
    emoji: string;
    color: string;
    score: number; // từ -2 .. +2
  };

  @Prop()
  note?: string;

  @Prop([String])
  tags?: string[];
}

export const MoodEntrySchema = SchemaFactory.createForClass(MoodEntry);
