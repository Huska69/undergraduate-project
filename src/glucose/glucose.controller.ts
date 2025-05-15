import { Controller, Get, Param, Post, Body } from '@nestjs/common';
import { GlucoseService } from './glucose.service';
import { PrismaService } from '../prisma/prisma.service';

@Controller('glucose')
export class GlucoseController {
  constructor(
    private readonly glucoseService: GlucoseService,
    private readonly prisma: PrismaService
  ) {}

  @Post()
  async createGlucose(@Body() body: { userId: string; value: number }) {
    return this.glucoseService.addGlucoseReading(body.userId, body.value);
  }

  @Get(':userId/readings')
  async getUserReadings(@Param('userId') userId: string) {
    return this.prisma.glucoseReading.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
    });
  }

  @Get(':userId/predictions')
  async getUserPredictions(@Param('userId') userId: string) {
    return this.prisma.predictedGlucose.findMany({
      where: { userId },
      orderBy: { predictedFor: 'asc' },
    });
  }
}
