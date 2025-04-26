// src/glucose/glucose.controller.ts
import { Controller, Post, Get, Body, Param, Query, UseGuards, ParseIntPipe } from '@nestjs/common';
import { GlucoseService } from './glucose.service';
import { CreateGlucoseDto } from './dto/create-glucose.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('api/glucose')
@UseGuards(JwtAuthGuard)
export class GlucoseController {
  constructor(private readonly glucoseService: GlucoseService) {}

  @Post()
  async createReading(@Body() createGlucoseDto: CreateGlucoseDto) {
    return this.glucoseService.createReading(createGlucoseDto);
  }

  @Get('user/:userId')
  async getUserReadings(
    @Param('userId') userId: string,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
  ) {
    return this.glucoseService.getUserReadings(userId, limit);
  }

  @Get('latest/:userId')
  async getLatestReading(@Param('userId') userId: string) {
    return this.glucoseService.getLatestReading(userId);
  }
}