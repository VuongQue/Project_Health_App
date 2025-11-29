import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CommentDocument = Comment & Document;

@Schema({ timestamps: true })
export class Comment {
  @Prop({ type: Types.ObjectId, required: true })
  postId: Types.ObjectId;

  @Prop({ type: String, required: true })
  userId: string; // MySQL userId

  @Prop({ type: Object })
  user: {
    name: string;
    avatar: string;
  };

  @Prop({ required: true })
  text: string;

  @Prop({ type: Types.ObjectId, default: null })
  parentId: Types.ObjectId | null;

  _id: Types.ObjectId;
}

export const CommentSchema = SchemaFactory.createForClass(Comment);
