import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type PostDocument = Post & Document;

@Schema({ timestamps: true })
export class Post {
  @Prop({ type: String, required: true })
  userId: string;

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
  likes: string[];

  @Prop({ default: 0 })
  commentCount: number;

  @Prop({ default: 'approved' })
  status: string;

  @Prop({ default: false })
  isHidden: boolean;

  // null = post thường; ObjectId = bài đăng trong group
  @Prop({ type: Types.ObjectId, ref: 'Group', default: null })
  groupId?: Types.ObjectId;

  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export const PostSchema = SchemaFactory.createForClass(Post);
PostSchema.index({ content: 'text' }); // full-text search
