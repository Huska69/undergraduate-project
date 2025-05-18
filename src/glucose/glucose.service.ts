import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import axios from 'axios';

@Injectable()
export class GlucoseService {
  constructor(private readonly prisma: PrismaService) {}

  async addGlucoseReading(userId: string, value: number) {
    // 1. Save new reading
    const reading = await this.prisma.glucoseReading.create({
      data: { userId, value },
    });

    // 2. Fetch recent readings (ordered by timestamp)
    const history = await this.prisma.glucoseReading.findMany({
      where: { userId },
      orderBy: { timestamp: 'asc' },
      take: 30,
    });

    // Clean and validate values
    const values = history
      .map((r) => r.value)
      .filter((v) => typeof v === 'number' && !isNaN(v));

    // 3. Call prediction API if enough data
    if (values.length >= 5) {
      try {
        // ✅ Fixed: Removed duplicate axios call and cleaned URL
        const response = await axios.post(
          'https://lstm-model-9u1y.onrender.com/predict ', // Removed trailing spaces
          { values },
          {
            headers: { 'Content-Type': 'application/json' },
            timeout: 30000, // 30 second timeout
          }
        );

        // ✅ Safe response handling
        const predictions = Array.isArray(response.data)
          ? response.data.map((v) => ({ value: v, time: new Date(Date.now() + 3600000) }))
          : Array.isArray(response.data?.predictions)
          ? response.data.predictions
          : [];

        // ✅ Store predictions
        if (predictions.length > 0) {
          await this.prisma.predictedGlucose.createMany({
            data: predictions.map((p) => ({
              userId,
              value: p.value,
              predictedFor: new Date(p.time),
            })),
          });
        }
      } catch (err) {
        // ✅ Improved error logging
        console.error('Prediction failed:', {
          message: err.message,
          status: err.response?.status,
          request_data: values,
          response_data: err.response?.data,
          stack: err.stack,
        });
      }
    }

    return reading;
  }

  async getReadings(userId: string) {
    return this.prisma.glucoseReading.findMany({
      where: { userId },
      orderBy: { timestamp: 'asc' },
    });
  }

  async getPredictions(userId: string) {
    return this.prisma.predictedGlucose.findMany({
      where: { userId },
      orderBy: { predictedFor: 'asc' },
    });
  }
}