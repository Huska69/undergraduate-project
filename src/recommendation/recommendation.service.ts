import { Injectable, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FoodDto } from './dto/food.dto';

@Injectable()
export class RecommendationService {
  constructor(private prisma: PrismaService) {}

  async getRecommendations(userId: string): Promise<{ recommendations: FoodDto[], glucoseTrend: string }> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      const latestReadings = await this.prisma.glucoseReading.findMany({
        where: { userId },
        orderBy: { timestamp: 'desc' },
        take: 1,
        skip: 0
      });

      const latestPredictions = await this.prisma.predictedGlucose.findMany({
        where: { userId },
        orderBy: { predictedFor: 'desc' },
        take: 1,
      });

      if (!latestReadings.length) {
        return { 
          recommendations: await this.getDefaultRecommendations(user),
          glucoseTrend: 'unknown'
        };
      }

      const latestReading = latestReadings[0];
      let isTrendUp = false;
      let glucoseTrend = 'stable';

      if (latestPredictions.length) {
        const latestPrediction = latestPredictions[0];
        isTrendUp = latestPrediction.value > latestReading.value;
        glucoseTrend = isTrendUp ? 'rising' : 'falling';
      } else {
        isTrendUp = false; 
      }

      const [giMin, giMax] = isTrendUp ? [0, 55] : [56, 70];
      
      const userAllergens = user.allergies 
        ? user.allergies.split(',').map(a => a.trim()).filter(a => a.length > 0)
        : [];

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
          id: food.id,
          name: food.name,
          giValue: food.giValue,
          mealType: food.mealType,
          imageUrl: food.imageUrl,
          recipeLink: food.recipeLink,
          nutrition: {
            calories: food.calories,
            protein: food.protein,
            fat: food.fat,
            sugar: food.sugar,
          },
          allergens: food.allergens,
          tags: food.tags
        }));
        
        recommendations.push(...mappedFoods);
      }

      return { 
        recommendations: recommendations.slice(0, 10),
        glucoseTrend 
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error('Error generating recommendations:', error);
      throw new InternalServerErrorException('Failed to generate food recommendations');
    }
  }

  private async getDefaultRecommendations(user: any): Promise<FoodDto[]> {
    const userAllergens = user.allergies 
      ? user.allergies.split(',').map(a => a.trim()).filter(a => a.length > 0)
      : [];
    
    const foods = await this.prisma.food.findMany({
      where: {
        giValue: { gte: 45, lte: 60 }, 
        NOT: {
          allergens: {
            hasSome: userAllergens,
          },
        },
      },
      take: 10,
    });

    return foods.map(food => ({
      id: food.id,
      name: food.name,
      giValue: food.giValue,
      mealType: food.mealType,
      imageUrl: food.imageUrl,
      recipeLink: food.recipeLink,
      nutrition: {
        calories: food.calories,
        protein: food.protein,
        fat: food.fat,
        sugar: food.sugar,
      },
      allergens: food.allergens,
      tags: food.tags
    }));
  }
}