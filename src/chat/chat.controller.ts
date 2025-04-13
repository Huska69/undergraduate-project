import { Controller, Get, Post, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ChatService } from './chat.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { CreateChatDto } from './dto/create-chat.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('api/chat')
@UseGuards(JwtAuthGuard) // Ensure users are authenticated
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post()
  async createChat(@Request() req, @Body() dto: CreateChatDto) {
    return this.chatService.createChat(req.user.userId, dto);
  }

  @Post('health-assistant')
  async createHealthAssistantChat(@Request() req) {
    const dto = new CreateChatDto();
    dto.isHealthAssistant = true;
    dto.title = 'Health Assistant';
    return this.chatService.createChat(req.user.userId, dto);
  }

  @Get()
  async getChats(@Request() req) {
    return this.chatService.getChats(req.user.userId);
  }

  @Get(':id')
  async getChat(@Param('id') id: string, @Request() req) {
    return this.chatService.getChat(id, req.user.userId);
  }

  @Post(':id/messages')
  async sendMessage(
    @Param('id') id: string,
    @Request() req,
    @Body() dto: CreateMessageDto,
  ) {
    return this.chatService.sendMessage(id, req.user.userId, dto);
  }

  @Delete(':id')
  async deleteChat(@Param('id') id: string, @Request() req) {
    return this.chatService.deleteChat(id, req.user.userId);
  }
}