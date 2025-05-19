// src/recommendation/dto/food.dto.ts

class NutritionDto {
  calories?: number;
  protein?: number;
  fat?: number;
  sugar?: number;
}

export class CreateFoodDto {
  name: string;
  giValue: number;
  mealType: string;
  imageUrl: string;
  recipeLink: string;
  calories: number;
  protein: number;
  fat: number;
  sugar: number;
  allergens: string[];
  tags: string[];
}

export class FoodDto {
  id: string;
  name: string;
  giValue: number;
  mealType: string;
  imageUrl: string;
  recipeLink: string;
  nutrition: NutritionDto;
  allergens: string[];
  tags: string[];
}

export class RecommendationResponseDto {
  recommendations: FoodDto[];
  glucoseTrend: string;
}