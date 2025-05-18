import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import axios from 'axios';

@Injectable()
export class GlucoseService {
  constructor(private readonly prisma: PrismaService) {}

// src/glucose/glucose.service.ts

<<<<<<< HEAD
async addGlucoseReading(userId: string, value: number) {
  // 1. Save new reading
  const reading = await this.prisma.glucoseReading.create({
    data: { userId, value },
  });
=======
    // 2. Fetch recent readings (last 30 for example)
    const history = await this.prisma.glucoseReading.findMany({
      where: { userId },
      orderBy: { timestamp: 'asc' },
      take: 30, // Adjust based on your model's needs
    });
>>>>>>> 64748e828f1bc46352215aa534ce8d29b36c4845

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
      const response = await axios.post('https://lstm-model-9u1y.onrender.com/predict', {
        values,
      });

      const predictions = response.data.predicted.predictions; // Assume this is an array of { time, value }

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
<<<<<<< HEAD
//      orderBy: { createdAt: 'asc' },
=======
      orderBy: { timestamp: 'asc' },
>>>>>>> 64748e828f1bc46352215aa534ce8d29b36c4845
    });
  }

  async getPredictions(userId: string) {
    return this.prisma.predictedGlucose.findMany({
      where: { userId },
      orderBy: { predictedFor: 'asc' },
    });
  }
}
