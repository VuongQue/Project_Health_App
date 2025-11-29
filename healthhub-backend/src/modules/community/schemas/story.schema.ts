import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type StoryDocument = HydratedDocument<Story>;

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


  createdAt: Date;
  updatedAt: Date;
}

export const StorySchema = SchemaFactory.createForClass(Story);
