import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ChatRoomDocument = ChatRoom & Document;

@Schema({ timestamps: true })
export class ChatRoom {
  @Prop({ type: [String], required: true }) 
  participants: string[];

  @Prop()
  lastMessage?: string;

  @Prop()
  lastMessageAt?: Date;
}

export const ChatRoomSchema = SchemaFactory.createForClass(ChatRoom);
