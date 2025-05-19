import { Controller, Get, Req } from '@nestjs/common';
import { Request } from 'express';
import { RecommendationService } from './recommendation.service';

@Controller('recommendations')
export class RecommendationController {
  constructor(private readonly recommendationService: RecommendationService) {}

  @Get()
  async getRecommendations(@Req() req: Request) {
    const userId = req.user?.['userId']; // From JWT
    if (!userId) {
      throw new Error('User ID not found in request');
    }
    return this.recommendationService.getRecommendations(userId);
  }
}