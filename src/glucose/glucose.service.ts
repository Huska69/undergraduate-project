import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateGlucoseDto } from './dto/create-glucose.dto';
import { CreateBulkGlucoseDto } from './dto/create-bulk-glucose.dto';

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

    // Create glucose reading, optionally with provided timestamp
    const data: any = {
      userId: createGlucoseDto.userId,
      value: createGlucoseDto.value,
    };
    
    // If timestamp provided, use it for createdAt
    if (createGlucoseDto.timestamp) {
      data.createdAt = new Date(createGlucoseDto.timestamp);
    }

    const reading = await this.prisma.glucoseReading.create({ data });

    return reading;
  }

  async createBulkReadings(dto: CreateBulkGlucoseDto) {
    // Verify user exists
    const user = await this.prisma.user.findUnique({
      where: { id: dto.userId },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${dto.userId} not found`);
    }

    if (!dto.readings || dto.readings.length === 0) {
      throw new BadRequestException('No readings provided');
    }

    // Create multiple glucose readings
    const results = await this.prisma.$transaction(
      dto.readings.map(reading => {
        const data: any = {
          userId: dto.userId,
          value: reading.value,
        };
        
        // If timestamp provided, use it for createdAt
        if (reading.timestamp) {
          data.createdAt = new Date(reading.timestamp);
        }
        
        return this.prisma.glucoseReading.create({ data });
      })
    );

    return results;
  }

  async getUserReadings(
    userId: string, 
    limit = 100,
    fromDate?: Date,
    toDate?: Date,
  ) {
    // Verify user exists
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    // Build where condition
    const where: any = { userId };
    
    // Add date range filters if provided
    if (fromDate || toDate) {
      where.createdAt = {};
      
      if (fromDate) {
        where.createdAt.gte = fromDate;
      }
      
      if (toDate) {
        where.createdAt.lte = toDate;
      }
    }

    // Get readings
    const readings = await this.prisma.glucoseReading.findMany({
      where,
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