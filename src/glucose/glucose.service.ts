import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import axios from 'axios';

@Injectable()
export class GlucoseService {
  constructor(private readonly prisma: PrismaService) {}

// src/glucose/glucose.service.ts

async addGlucoseReading(userId: string, value: number) {
  // 1. Save new reading
  const reading = await this.prisma.glucoseReading.create({
    data: { userId, value },
  });

  // 2. Fetch recent readings
  const history = await this.prisma.glucoseReading.findMany({
    where: { userId },
    orderBy: { timestamp: 'asc' },
    take: 30,
  });

  const values = history
    .map((r) => r.value)
    .filter((v) => typeof v === 'number' && !isNaN(v));

  // 3. Call prediction API if enough data
  if (values.length >= 5) {
    try {
      const response = await axios.post(
        'https://lstm-model-9u1y.onrender.com/predict ',
        { values },
        {
          headers: { 'Content-Type': 'application/json' },
        }
      );

      // ✅ Safely extract predictions
      const predictions = Array.isArray(response.data)
        ? response.data
        : Array.isArray(response.data?.predictions)
        ? response.data.predictions
        : [];

      // ✅ Store predictions
      if (predictions.length > 0) {
        await this.prisma.predictedGlucose.createMany({
          data: predictions.map((p) => ({
            userId,
            value: typeof p === 'number' ? p : p.value,
            predictedFor: new Date(
              typeof p === 'number' 
                ? Date.now() + 3600000  // Default to 1h ahead
                : p.time
            ),
          })),
        });
      }
    } catch (err) {
      console.error('Prediction failed:', {
        message: err.message,
        request_data: values,
        status: err.response?.status,
        response_data: err.response?.data,
      });
    }
  }

  return reading;
}

  async getReadings(userId: string) {
    return this.prisma.glucoseReading.findMany({
      where: { userId },
//      orderBy: { createdAt: 'asc' },
    });
  }

  async getPredictions(userId: string) {
    return this.prisma.predictedGlucose.findMany({
      where: { userId },
      orderBy: { predictedFor: 'asc' },
    });
  }
}
