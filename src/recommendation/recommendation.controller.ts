import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { RecommendationService } from './recommendation.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UnauthorizedException } from '@nestjs/common';

@Controller('recommendations')
@UseGuards(JwtAuthGuard) 
export class RecommendationController {
  constructor(private readonly recommendationService: RecommendationService) {}

  @Get()
  async getRecommendations(@Req() req: Request) {
    console.log('User from JWT:', req.user);
    const userId = req.user?.['sub'] || req.user?.['userId'];
  if (!userId) {
    throw new UnauthorizedException('User ID not found in JWT');
  }
    if (!userId) {
      throw new Error('User ID not found in request');
    }
    return this.recommendationService.getRecommendations(userId);
  }
}