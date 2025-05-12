import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateGlucoseDto } from './dto/create-glucose.dto';

@Injectable()
export class GlucoseService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateGlucoseDto) {
    return this.prisma.glucoseReading.create({
      data: {
        userId,
        value: dto.value,
        timestamp: dto.timestamp || new Date()
      }
    });
  }

  async findAll(userId: string, limit: number = 20, since?: Date) {
    const where: any = { userId };
    
    if (since) {
      where.timestamp = { gte: since };
    }

    return this.prisma.glucoseReading.findMany({
      where,
      take: Number(limit),
      orderBy: { timestamp: 'desc' }
    });
  }
}