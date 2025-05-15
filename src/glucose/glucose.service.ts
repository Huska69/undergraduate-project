import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import axios from 'axios';

@Injectable()
export class GlucoseService {
  constructor(private prisma: PrismaService) {}

  async addGlucoseReading(userId: string, value: number) {
    // 1. Store the new reading
    const newReading = await this.prisma.glucoseReading.create({
      data: { userId, value },
    });

    // 2. Fetch user's past readings
    const history = await this.prisma.glucoseReading.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
      select: { value: true },
    });

    const values = history.map(r => r.value);

    // 3. Call the prediction API
    const response = await axios.post('http://localhost:5000/predict', {
      values: values,
    });

    const predictions = response.data.predictions;

    // 4. Store predicted values
    for (const p of predictions) {
      await this.prisma.predictedGlucose.create({
        data: {
          userId,
          value: p.value,
          predictedFor: new Date(p.timestamp),
        },
      });
    }

    return {
      message: 'Glucose reading and predictions stored.',
      newReading,
      predictions,
    };
  }
}
