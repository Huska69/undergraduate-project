// src/glucose/glucose.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateGlucoseDto } from './dto/create-glucose.dto';

@Injectable()
export class GlucoseService {
  constructor(private prisma: PrismaService) {}

  async createReading(createGlucoseDto: CreateGlucoseDto) {
    // Verify user exists
    const user = await this.prisma.user.findUnique({
      where: { id: createGlucoseDto.userId },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${createGlucoseDto.userId} not found`);
    }

    // Create glucose reading
    const reading = await this.prisma.glucoseReading.create({
      data: {
        userId: createGlucoseDto.userId,
        value: createGlucoseDto.value,
      },
    });

    return reading;
  }

  async getUserReadings(userId: string, limit = 10) {
    // Verify user exists
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    // Get readings
    const readings = await this.prisma.glucoseReading.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return readings;
  }

  async getLatestReading(userId: string) {
    // Verify user exists
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    // Get latest reading
    const reading = await this.prisma.glucoseReading.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    if (!reading) {
      throw new NotFoundException(`No glucose readings found for user with ID ${userId}`);
    }

    return reading;
  }
}