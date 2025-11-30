import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ChatRoom, ChatRoomDocument } from './schemas/chat-room.schema';
import {
  ChatMessage,
  ChatMessageDocument,
} from './schemas/chat-message.schema';
import { SendMessageDto } from './dto/send-message.dto';

@Injectable()
export class ChatService {
  constructor(
    @InjectModel(ChatRoom.name) private roomModel: Model<ChatRoomDocument>,
    @InjectModel(ChatMessage.name)
    private messageModel: Model<ChatMessageDocument>,
  ) {}

  /** FIND OR CREATE ROOM */
  async findOrCreateRoom(userId: string, otherUserId: string) {
    const uid = String(userId);
    const oid = String(otherUserId);

    console.log('[ChatService][findOrCreateRoom] uid =', uid, ', oid =', oid);

    let room = await this.roomModel.findOne({
      participants: { $all: [uid, oid] },
    });

    if (room) {
      console.log(
        '[ChatService][findOrCreateRoom] found existing room id =',
        room.id,
      );
    }

    if (!room) {
      room = await this.roomModel.create({
        participants: [uid, oid],
        lastMessageAt: new Date(),
      });
      console.log(
        '[ChatService][findOrCreateRoom] created new room id =',
        room.id,
      );
    }

    return room;
  }

  /** SEND MESSAGE */
  async sendMessage(senderId: string, dto: SendMessageDto) {
    const sender = String(senderId);
    console.log('================ CHAT SERVICE SEND =================');
    console.log('[ChatService][sendMessage] senderId =', sender);
    console.log('[ChatService][sendMessage] dto =', dto);

    let room: ChatRoomDocument | null;

    if (dto.roomId) {
      const roomId = String(dto.roomId);
      console.log('[ChatService][sendMessage] using roomId =', roomId);
      room = await this.roomModel.findById(roomId);
      if (!room) {
        console.error(
          '[ChatService][sendMessage] ❌ Room not found with id =',
          roomId,
        );
        throw new NotFoundException('Room not found');
      }
    } else if (dto.receiverId) {
      console.log(
        '[ChatService][sendMessage] no roomId, use receiverId =',
        dto.receiverId,
      );
      room = await this.findOrCreateRoom(sender, String(dto.receiverId));
    } else {
      console.error(
        '[ChatService][sendMessage] ❌ Missing roomId and receiverId',
      );
      throw new BadRequestException('roomId or receiverId is required');
    }

    console.log('[ChatService][sendMessage] final roomId =', room.id);

    const message = await this.messageModel.create({
      roomId: room.id,
      senderId: sender,
      text: dto.text,
      readBy: [sender],
    });

    console.log(
      '[ChatService][sendMessage] created message id =',
      message.id,
      ' | text =',
      message.text,
    );

    room.lastMessage = dto.text;
    room.lastMessageAt = new Date();
    await room.save();
    console.log('[ChatService][sendMessage] updated room lastMessage');

    const obj = message.toObject();

    const result = {
      ...obj,
      senderId: String(obj.senderId),
      roomId: String(obj.roomId ?? room.id),
    };

    console.log('[ChatService][sendMessage] return =', result);
    console.log('====================================================');

    return result;
  }

  /** GET USER ROOMS */
  async getUserRooms(userId: string) {
    const uid = String(userId);
    console.log('[ChatService][getUserRooms] userId =', uid);

    const rooms = await this.roomModel
      .find({ participants: uid })
      .sort({ updatedAt: -1 });

    console.log(
      '[ChatService][getUserRooms] count =',
      rooms.length,
      ' | roomIds =',
      rooms.map((r) => r.id),
    );

    return rooms;
  }

  /** GET MESSAGES */
  async getMessages(roomId: string, limit = 50) {
    const rid = String(roomId);
    console.log('[ChatService][getMessages] roomId =', rid, ', limit =', limit);

    const data = await this.messageModel
      .find({ roomId: rid })
      .sort({ createdAt: 1 })
      .limit(limit);

    console.log('[ChatService][getMessages] raw count =', data.length);

    const mapped = data.map((m: any) => {
      const obj = m.toObject();
      const converted = {
        ...obj,
        senderId: String(obj.senderId),
        roomId: String(obj.roomId),
      };
      return converted;
    });

    console.log(
      '[ChatService][getMessages] mapped count =',
      mapped.length,
      ' | sample =',
      mapped[0],
    );

    return mapped;
  }
}
