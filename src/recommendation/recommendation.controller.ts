// src/recommendation/recommendation.controller.ts
import { Controller, Get, Query, HttpException, HttpStatus } from '@nestjs/common';
import { RecommendationService } from './recommendation.service';

@Controller('recommendations')
export class RecommendationController {
  constructor(private readonly recommendationService: RecommendationService) {}

  @Get()
  async getRecommendations(@Query('userId') userId: string) {
    if (!userId) {
      throw new HttpException('userId required', HttpStatus.BAD_REQUEST);
    }

    try {
      return await this.recommendationService.getRecommendations(userId);
    } catch (error) {
      throw new HttpException(
        `Failed to generate recommendations: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}