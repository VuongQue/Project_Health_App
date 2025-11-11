import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Post extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  content: string;

  @Prop([String])
  media: string[];

  @Prop({ enum: ['pending', 'approved', 'rejected'], default: 'approved' })
  status: string;

  @Prop({ default: 0 })
  likeCount: number;
}

export const PostSchema = SchemaFactory.createForClass(Post);
