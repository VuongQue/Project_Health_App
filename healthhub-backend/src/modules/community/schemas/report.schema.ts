import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ReportDocument = Report & Document;

export enum ReportReason {
  SPAM = 'SPAM',
  HATE_SPEECH = 'HATE_SPEECH',
  VIOLENCE = 'VIOLENCE',
  HARASSMENT = 'HARASSMENT',
  MISINFORMATION = 'MISINFORMATION',
  NSFW = 'NSFW',
  OTHER = 'OTHER',
}

export enum ReportStatus {
  PENDING = 'PENDING',
  REVIEWED = 'REVIEWED',
  RESOLVED = 'RESOLVED',
  DISMISSED = 'DISMISSED',
}

@Schema({ timestamps: true })
export class Report {
  @Prop({ type: String, required: true })
  reporterId: string;

  @Prop({ type: Object })
  reporter: { name: string; avatar: string };

  @Prop({ type: Types.ObjectId, ref: 'Post', default: null })
  postId?: Types.ObjectId;

  @Prop({ type: String, default: null })
  targetUserId?: string;

  @Prop({ type: String, enum: ReportReason, required: true })
  reason: ReportReason;

  @Prop({ type: String, default: '' })
  description: string;

  @Prop({ type: String, enum: ReportStatus, default: ReportStatus.PENDING })
  status: ReportStatus;

  @Prop({ type: String, default: null })
  adminNote?: string;

  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export const ReportSchema = SchemaFactory.createForClass(Report);
ReportSchema.index({ status: 1, createdAt: -1 });
