import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import axios from 'axios';

@Injectable()
export class GlucoseService {
  constructor(private readonly prisma: PrismaService) {}

  async addGlucoseReading(userId: string, value: number) {
    const reading = await this.prisma.glucoseReading.create({
      data: { userId, value },
    });

    const history = await this.prisma.glucoseReading.findMany({
      where: { userId },
      orderBy: { timestamp: 'asc' },
      take: 30,
    });

    const values = history
      .map((r) => r.value)
      .filter((v) => typeof v === 'number' && !isNaN(v))
      .slice(-5); // ✅ Only use last 5 values

    if (values.length >= 5) {
        try {
    const apiUrl = 'https://lstm-model-9u1y.onrender.com/predict';
    console.log(`Calling prediction API at ${apiUrl} with ${values.length} values`);

    const response = await axios.post(
      apiUrl,
      { values },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 60000, // ✅ Increased timeout
      }
    );

    console.log('Raw API response:', response.data); // ✅ Log full response

    const predictions = Array.isArray(response.data?.predicted?.predictions)
      ? response.data.predicted.predictions
      : [];

    if (predictions.length > 0) {
      await this.prisma.predictedGlucose.createMany({
        data: predictions.map((p) => ({
          userId,
          value: p.value,
          predictedFor: new Date(p.timestamp),
        })),
      });
      console.log(`✅ Saved ${predictions.length} predictions`);
    }
  } catch (err) {
    console.error('🚨 Prediction failed:', {
      message: err.message,
      status: err.response?.status,
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

  async clearPredictions(userId?: string) {
    return this.prisma.predictedGlucose.deleteMany({
      where: userId ? { userId } : {}
    });
  }
}
