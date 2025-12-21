import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type PostDocument = Post & Document;

@Schema({ timestamps: true })
export class Post {
  @Prop({ type: String, required: true })
  userId: string; // user từ MySQL

  @Prop({ type: Object })
  user: {
    name: string;
    avatar: string;
  };

  @Prop({ required: true })
  content: string;

  @Prop([String])
  media: string[];

  @Prop({ default: 0 })
  likeCount: number;

  @Prop({ type: [String], default: [] })
  likes: string[]; // lưu userId MySQL

  @Prop({ default: 0 })
  commentCount: number;

  @Prop({ default: 'approved' })
  status: string;

  isHidden: { type: Boolean, default: false };

  _id: Types.ObjectId;
}

export const PostSchema = SchemaFactory.createForClass(Post);
