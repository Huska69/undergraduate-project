import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import axios from 'axios';

@Injectable()
export class GlucoseService {
  constructor(private readonly prisma: PrismaService) {}

  async addGlucoseReading(userId: string, value: number) {
    // 1. Store the new reading
    const reading = await this.prisma.glucoseReading.create({
      data: { userId, value },
    });

    // 2. Fetch recent readings (last 30 for example)
    const history = await this.prisma.glucoseReading.findMany({
      where: { userId },
      orderBy: { timestamp: 'asc' },
      take: 30, // Adjust based on your model's needs
    });

    const values = history.map((r) => r.value);

    // 3. Call prediction API
    try {
      const response = await axios.post('https://lstm-model-9u1y.onrender.com/predict', {
        glucose_levels: values,
      });

      const predictions = response.data.predictions; // Assume this is an array of { time, value }

      // 4. Store predictions in DB
      await this.prisma.predictedGlucose.createMany({
        data: predictions.map((p) => ({
          userId,
          value: p.value,
          predictedFor: new Date(p.time),
        })),
      });
    } catch (err) {
      console.error('Prediction API error:', err.message);
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
