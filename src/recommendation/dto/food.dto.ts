// src/recommendation/dto/food.dto.ts
export class FoodDto {
  id: string;
  name: string;
  giValue: number;
  mealType: string;
  imageUrl: string;
  recipeLink: string;
  nutrition: {
    calories?: number;   // Optional for flexibility
    protein?: number;
    fat?: number;
    sugar?: number;
  };
  allergens: string[];
  tags: string[];
}