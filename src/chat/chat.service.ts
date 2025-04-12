import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OpenAIService } from './openai.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { CreateChatDto } from './dto/create-chat.dto';

@Injectable()
export class ChatService {
  constructor(
    private prisma: PrismaService,
    private openaiService: OpenAIService,
  ) {}

  async createChat(userId: string, dto: CreateChatDto) {
    return this.prisma.chat.create({
      data: {
        userId,
        title: dto.title || 'New Conversation',
      },
    });
  }

  async getChats(userId: string) {
    return this.prisma.chat.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  }

  async getChat(id: string, userId: string) {
    return this.prisma.chat.findFirst({
      where: { id, userId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });
  }

  async sendMessage(chatId: string, userId: string, dto: CreateMessageDto) {
    // Validate chat belongs to user
    const chat = await this.prisma.chat.findFirst({
      where: { id: chatId, userId },
      include: { messages: true },
    });

    if (!chat) {
      throw new Error('Chat not found');
    }

    // Add user message
    await this.prisma.message.create({
      data: {
        chatId,
        content: dto.content,
        role: 'user',
      },
    });

    // Format all messages for AI
    const messages = chat.messages.map(msg => ({
      role: msg.role as 'system' | 'user' | 'assistant',
      content: msg.content,
    }));
    messages.push({ role: 'user', content: dto.content });

    // Get AI response
    const aiResponse = await this.openaiService.generateResponse(messages);

    // Save AI response
    await this.prisma.message.create({
      data: {
        chatId,
        content: aiResponse.content ?? 'No response',
        role: 'assistant',
      },
    });

    // Update chat title if it's the first message
    if (chat.messages.length === 0) {
      await this.prisma.chat.update({
        where: { id: chatId },
        data: {
          title: dto.content.slice(0, 30) + (dto.content.length > 30 ? '...' : ''),
        },
      });
    }

    // Return updated chat
    return this.getChat(chatId, userId);
  }

  async deleteChat(id: string, userId: string) {
    await this.prisma.chat.deleteMany({
      where: { id, userId },
    });
    return { success: true };
  }
}