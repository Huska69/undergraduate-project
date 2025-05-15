import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { GlucoseService } from './glucose.service';

@Controller('glucose')
export class GlucoseController {
  constructor(private readonly glucoseService: GlucoseService) {}

  @Post()
  async createReading(
    @Body() body: { userId: string; value: number },
  ) {
    return this.glucoseService.addGlucoseReading(body.userId, body.value);
  }

  @Get(':userId/readings')
  async getReadings(@Param('userId') userId: string) {
    return this.glucoseService.getReadings(userId);
  }

  @Get(':userId/predictions')
  async getPredictions(@Param('userId') userId: string) {
    return this.glucoseService.getPredictions(userId);
  }
}
