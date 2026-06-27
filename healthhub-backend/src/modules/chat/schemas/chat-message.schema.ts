import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ChatMessageDocument = ChatMessage & Document;

@Schema({ timestamps: true })
export class ChatMessage {
  @Prop({ type: String, required: true }) 
  roomId: string;

  @Prop({ type: String, required: true }) 
  senderId: string;

  @Prop()
  text: string;

  @Prop({ type: [String], default: [] })
  readBy: string[];
}

export const ChatMessageSchema = SchemaFactory.createForClass(ChatMessage);
