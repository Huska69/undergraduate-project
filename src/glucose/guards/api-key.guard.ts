import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
import { UserApiKeyService } from '../user-api-key.service';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private userApiKeyService: UserApiKeyService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    
    // Check header for API key
    const apiKey = request.headers['x-api-key'] as string;
    
    // Check body for API key as fallback
    const bodyApiKey = request.body?.apiKey;
    
    // Use header API key first, fallback to body
    const key = apiKey || bodyApiKey;

    if (!key) {
      throw new UnauthorizedException('API key is required');
    }
    
    // Validate API key
    const user = await this.userApiKeyService.getUserByApiKey(key);
    
    if (!user) {
      throw new UnauthorizedException('Invalid API key');
    }
    
    // Add user to request for later use
    request['user'] = { userId: user.id, email: user.email };
    
    return true;
  }
}