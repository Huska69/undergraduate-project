import { IsOptional, IsString, IsBoolean } from 'class-validator';

export class CreateChatDto {
  @IsString()
  @IsOptional()
  title?: string;
  
  @IsBoolean()
  @IsOptional()
  isHealthAssistant?: boolean;
}