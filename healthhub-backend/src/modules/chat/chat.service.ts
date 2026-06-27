import {
  Injectable,
  BadRequestException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ChatRoom, ChatRoomDocument } from './schemas/chat-room.schema';
import { ChatMessage, ChatMessageDocument } from './schemas/chat-message.schema';
import { SendMessageDto } from './dto/send-message.dto';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    @InjectModel(ChatRoom.name) private roomModel: Model<ChatRoomDocument>,
    @InjectModel(ChatMessage.name) private messageModel: Model<ChatMessageDocument>,
  ) {}

  async findOrCreateRoom(userId: string, otherUserId: string) {
    const uid = String(userId);
    const oid = String(otherUserId);

    let room = await this.roomModel.findOne({ participants: { $all: [uid, oid] } });

    if (!room) {
      room = await this.roomModel.create({ participants: [uid, oid], lastMessageAt: new Date() });
      this.logger.debug(`Created chat room ${room.id} for users ${uid}, ${oid}`);
    }

    return room;
  }

  async sendMessage(senderId: string, dto: SendMessageDto) {
    const sender = String(senderId);
    let room: ChatRoomDocument | null;

    if (dto.roomId) {
      room = await this.roomModel.findById(String(dto.roomId));
      if (!room) throw new NotFoundException('Room not found');
    } else if (dto.receiverId) {
      room = await this.findOrCreateRoom(sender, String(dto.receiverId));
    } else {
      throw new BadRequestException('roomId or receiverId is required');
    }

    const message = await this.messageModel.create({
      roomId: room.id,
      senderId: sender,
      text: dto.text,
      readBy: [sender],
    });

    room.lastMessage = dto.text;
    room.lastMessageAt = new Date();
    await room.save();

    const obj = message.toObject();
    return {
      ...obj,
      senderId: String(obj.senderId),
      roomId: String(obj.roomId ?? room.id),
    };
  }

  async getUserRooms(userId: string) {
    const uid = String(userId);
    return this.roomModel.find({ participants: uid }).sort({ updatedAt: -1 });
  }

  async getMessages(roomId: string, limit = 50) {
    const data = await this.messageModel
      .find({ roomId: String(roomId) })
      .sort({ createdAt: 1 })
      .limit(limit);

    return data.map((m: any) => {
      const obj = m.toObject();
      return { ...obj, senderId: String(obj.senderId), roomId: String(obj.roomId) };
    });
  }

  async getUnreadCount(userId: string): Promise<number> {
    const uid = String(userId);
    return this.messageModel.countDocuments({
      senderId: { $ne: uid },
      readBy: { $nin: [uid] },
    });
  }

  async markRoomAsRead(roomId: string, userId: string): Promise<void> {
    const uid = String(userId);
    await this.messageModel.updateMany(
      { roomId: String(roomId), senderId: { $ne: uid }, readBy: { $nin: [uid] } },
      { $addToSet: { readBy: uid } },
    );
  }

  async getRoomsWithUnread(userId: string) {
    const uid = String(userId);
    const rooms = await this.roomModel.find({ participants: uid }).sort({ updatedAt: -1 });

    return Promise.all(
      rooms.map(async (room) => {
        const unread = await this.messageModel.countDocuments({
          roomId: String(room.id),
          senderId: { $ne: uid },
          readBy: { $nin: [uid] },
        });
        return { ...room.toObject(), unreadCount: unread };
      }),
    );
  }
}
