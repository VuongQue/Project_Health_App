import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type StoryDocument = HydratedDocument<Story>;

const STORY_TTL_SECONDS = 24 * 60 * 60; // 24 giờ

@Schema({ timestamps: true })
export class Story {
  @Prop({ type: String })
  userId: string;

  @Prop({ type: Object })
  user: {
    name: string;
    avatar: string;
  };

  @Prop({ type: [String], default: [] })
  media: string[];

  // MongoDB TTL index: document tự xoá sau 24h kể từ createdAt
  @Prop({
    type: Date,
    default: () => new Date(Date.now() + STORY_TTL_SECONDS * 1000),
  })
  expireAt: Date;

  createdAt: Date;
  updatedAt: Date;
}

export const StorySchema = SchemaFactory.createForClass(Story);

// TTL index: MongoDB daemon xoá document khi expireAt < now
StorySchema.index({ expireAt: 1 }, { expireAfterSeconds: 0 });
