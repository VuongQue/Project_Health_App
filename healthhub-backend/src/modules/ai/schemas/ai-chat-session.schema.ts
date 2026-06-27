import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type AiChatSessionDocument = AiChatSession & Document;

@Schema({ timestamps: true })
export class AiChatSession {
  @Prop({ required: true }) userId: number;

  @Prop({ required: true }) title: string;

  @Prop({
    type: [{ role: String, content: String }],
    default: [],
  })
  messages: { role: string; content: string }[];

  @Prop({ default: Date.now }) lastActiveAt: Date;
}

export const AiChatSessionSchema = SchemaFactory.createForClass(AiChatSession);
AiChatSessionSchema.index({ userId: 1, lastActiveAt: -1 });
