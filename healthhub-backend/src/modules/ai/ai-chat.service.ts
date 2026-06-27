import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AiChatSession, AiChatSessionDocument } from './schemas/ai-chat-session.schema';

@Injectable()
export class AiChatService {
  constructor(
    @InjectModel(AiChatSession.name)
    private readonly sessionModel: Model<AiChatSessionDocument>,
  ) {}

  async getSessions(userId: number) {
    return this.sessionModel
      .find({ userId })
      .sort({ lastActiveAt: -1 })
      .limit(30)
      .select('_id title lastActiveAt messages')
      .lean();
  }

  async createSession(userId: number, firstMessage: string) {
    const title = firstMessage.slice(0, 50) + (firstMessage.length > 50 ? '...' : '');
    const session = await this.sessionModel.create({ userId, title, messages: [] });
    return session;
  }

  async saveMessages(
    sessionId: string,
    userId: number,
    messages: { role: string; content: string }[],
  ) {
    const title = messages.find((m) => m.role === 'user')?.content ?? 'Cuộc trò chuyện';
    return this.sessionModel.findOneAndUpdate(
      { _id: sessionId, userId },
      {
        messages,
        title: title.slice(0, 50) + (title.length > 50 ? '...' : ''),
        lastActiveAt: new Date(),
      },
      { new: true, upsert: true },
    );
  }

  async deleteSession(sessionId: string, userId: number) {
    return this.sessionModel.deleteOne({ _id: sessionId, userId });
  }
}
