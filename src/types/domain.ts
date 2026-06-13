export type MealType = "breakfast" | "lunch" | "dinner" | "snack";

export type RecipeIngredient = {
  ingredientName: string;
  normalizedName: string;
  quantity: number;
  unit: string;
  category: string;
};

export type Recipe = {
  externalId: string;
  title: string;
  image: string;
  preparationTime: number;
  servings: number;
  missingCount?: number;
  missingIngredients?: RecipeIngredient[];
  nutrition: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  ingredients: RecipeIngredient[];
};

export type InventoryItem = {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  category: string;
  expirationDate: string;
};

export type ShoppingItem = {
  id: string;
  ingredientName: string;
  quantity: number;
  unit: string;
  category: string;
  checked: boolean;
};
