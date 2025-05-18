// src/recommendation/recommendation.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FoodDto } from './dto/food.dto';

@Injectable()
export class RecommendationService {
  constructor(private prisma: PrismaService) {}

  async getRecommendations(userId: string): Promise<{ recommendations: FoodDto[] }> {
    // Step 1: Get user
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        glucoseReadings: { orderBy: { timestamp: 'desc' }, take: 1 },
        predictedGlucose: { orderBy: { predictedFor: 'desc' }, take: 1 },
      },
    });

    if (!user || !user.glucoseReadings.length || !user.predictedGlucose.length) {
      throw new Error('Missing glucose data');
    }

    const latestReading = user.glucoseReadings[0];
    const latestPrediction = user.predictedGlucose[0];

    // Step 2: Determine trend
    const isTrendUp = latestPrediction.value > latestReading.value;
    const [giMin, giMax] = isTrendUp ? [0, 55] : [56, 70];

    // Step 3: Get user-specific filters
    const userAllergens = (user.allergies || '').split(',').map(a => a.trim());

    // Step 4: Get 3 foods each for breakfast, lunch, dinner + 4 snacks
    const mealTypes = ['breakfast', 'lunch', 'dinner', 'snack'];
    const recommendations: FoodDto[] = [];

    for (const mealType of mealTypes) {
      const count = mealType === 'snack' ? 4 : 3;
      const foods = await this.prisma.food.findMany({
        where: {
          giValue: { gte: giMin, lte: giMax },
          mealType,
          NOT: {
            allergens: {
              hasSome: userAllergens,
            },
          },
        },
        take: count,
      });

      const mappedFoods = foods.map(food => ({
        ...food,
        nutrition: {
          calories: food.calories,
          protein: food.protein,
          fat: food.fat,
          sugar: food.sugar,
        },
        // Remove top-level nutrition fields
        calories: undefined,
        protein: undefined,
        fat: undefined,
        sugar: undefined,
      }));
      
      recommendations.push(...mappedFoods);
    }

    return { recommendations: recommendations.slice(0, 10) };
  }
}