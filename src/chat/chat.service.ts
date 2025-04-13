import { Injectable, NotFoundException } from '@nestjs/common';
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
    const chat = await this.prisma.chat.create({
      data: {
        userId,
        title: dto.title || 'New Conversation',
      },
    });
    
    // If this is a health assistant chat, add an initial message
    if (dto.isHealthAssistant) {
      await this.prisma.message.create({
        data: {
          chatId: chat.id,
          content: "Hello! I'm your health assistant. I can help with diet recommendations, glucose management, and general health advice based on your profile. How can I assist you today?",
          role: 'assistant',
        },
      });
      
      // Update the chat title
      await this.prisma.chat.update({
        where: { id: chat.id },
        data: { title: 'Health Assistant' },
      });
    }
    
    return this.getChat(chat.id, userId);
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
    const chat = await this.prisma.chat.findFirst({
      where: { id, userId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });
    
    if (!chat) {
      throw new NotFoundException('Chat not found');
    }
    
    return chat;
  }

  async sendMessage(chatId: string, userId: string, dto: CreateMessageDto) {
    try {
      // Validate chat belongs to user
      const chat = await this.prisma.chat.findFirst({
        where: { id: chatId, userId },
        include: { messages: true },
      });

      if (!chat) {
        throw new NotFoundException('Chat not found');
      }

      // Get user information for context
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new NotFoundException('User not found');
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
      
      // Add the new message if it's not already included
      if (!messages.some(msg => msg.content === dto.content && msg.role === 'user')) {
        messages.push({ 
          role: 'user', 
          content: dto.content 
        });
      }

      // Get AI response with user context
      const aiResponse = await this.openaiService.generateContextAwareResponse(
        messages, 
        user
      );

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
    } catch (error) {
      // Handle specific errors
      if (error instanceof NotFoundException) {
        throw error;
      }
      
      console.error('Error generating AI response:', error);
      
      // Save a fallback message
      await this.prisma.message.create({
        data: {
          chatId,
          content: "I'm sorry, I couldn't process your request right now. Please try again later.",
          role: 'assistant',
        },
      });
      
      // Return the chat anyway, with the error message
      return this.getChat(chatId, userId);
    }
  }

  async deleteChat(id: string, userId: string) {
    const chat = await this.prisma.chat.findFirst({
      where: { id, userId },
    });
    
    if (!chat) {
      throw new NotFoundException('Chat not found');
    }
    
    await this.prisma.chat.delete({
      where: { id },
    });
    
    return { success: true };
  }
}