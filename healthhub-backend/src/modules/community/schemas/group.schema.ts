import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type GroupDocument = HydratedDocument<Group>;

@Schema({ timestamps: true })
export class Group {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ default: '' })
  description: string;

  @Prop({ default: null })
  avatarUrl: string;

  @Prop({ enum: ['public', 'private'], default: 'public' })
  type: string;

  @Prop({ type: String, required: true })
  createdBy: string; // userId MySQL

  @Prop({ type: Object })
  creator: { name: string; avatar: string };

  @Prop({ type: [String], default: [] })
  members: string[]; // userId array

  @Prop({ default: 0 })
  memberCount: number;

  _id: Types.ObjectId;
  createdAt: Date;
}

export const GroupSchema = SchemaFactory.createForClass(Group);
