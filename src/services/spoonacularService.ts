import { FoodItem, FoodSuggestion, DietaryPreferences, DietType, NutritionInfo } from '../types';

const SPOONACULAR_API_KEY = process.env.EXPO_PUBLIC_SPOONACULAR_API_KEY || '';
const BASE_URL = 'https://api.spoonacular.com';

// Map our diet types to Spoonacular diet parameters
const dietTypeMap: Record<DietType, string | undefined> = {
  vegetarian: 'vegetarian',
  vegan: 'vegan',
  keto: 'ketogenic',
  low_carb: 'low carb',
  balanced: undefined,
  weight_loss: undefined,
  muscle_gain: 'high protein',
  custom: undefined,
};

// Spoonacular response types
interface SpoonacularRecipe {
  id: number;
  title: string;
  image: string;
  imageType: string;
  nutrition?: {
    nutrients: Array<{
      name: string;
      amount: number;
      unit: string;
    }>;
  };
  servings?: number;
  readyInMinutes?: number;
  healthScore?: number;
  diets?: string[];
  dishTypes?: string[];
}

interface SpoonacularSearchResult {
  results: SpoonacularRecipe[];
  offset: number;
  number: number;
  totalResults: number;
}

interface SpoonacularIngredientResult {
  id: number;
  title: string;
  image: string;
  usedIngredientCount: number;
  missedIngredientCount: number;
  likes: number;
}

interface RecipeNutrition {
  calories: string;
  carbs: string;
  fat: string;
  protein: string;
}

// Parse nutrition from Spoonacular nutrients array
function parseNutrients(nutrients: Array<{ name: string; amount: number }>): NutritionInfo {
  const findNutrient = (name: string) => {
    const nutrient = nutrients.find((n) => n.name.toLowerCase() === name.toLowerCase());
    return nutrient ? Math.round(nutrient.amount * 10) / 10 : 0;
  };

  return {
    calories: Math.round(findNutrient('Calories')),
    protein: findNutrient('Protein'),
    carbs: findNutrient('Carbohydrates'),
    fat: findNutrient('Fat'),
    fiber: findNutrient('Fiber'),
    sugar: findNutrient('Sugar'),
    sodium: findNutrient('Sodium') / 1000, // Convert mg to g
  };
}

// Parse numeric value from string like "500 kcal" or "20g"
function parseNumericValue(value: string): number {
  const match = value.match(/[\d.]+/);
  return match ? parseFloat(match[0]) : 0;
}

class SpoonacularService {
  private async fetch<T>(endpoint: string, params: Record<string, string | number | boolean> = {}): Promise<T | null> {
    if (!SPOONACULAR_API_KEY) {
      console.warn('Spoonacular API key not configured');
      return null;
    }

    const queryParams = new URLSearchParams({
      apiKey: SPOONACULAR_API_KEY,
      ...Object.fromEntries(
        Object.entries(params).map(([key, value]) => [key, String(value)])
      ),
    });

    try {
      const response = await fetch(`${BASE_URL}${endpoint}?${queryParams}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Spoonacular API error: ${response.status}`, errorText);
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error('Spoonacular fetch error:', error);
      return null;
    }
  }

  // Search recipes with filters
  async searchRecipes(
    query: string,
    preferences: DietaryPreferences,
    options: {
      maxCalories?: number;
      minProtein?: number;
      maxCarbs?: number;
      number?: number;
      offset?: number;
      type?: string; // meal type: breakfast, lunch, dinner, snack
    } = {}
  ): Promise<FoodSuggestion[]> {
    const params: Record<string, string | number | boolean> = {
      query,
      addRecipeNutrition: true,
      number: options.number || 10,
      offset: options.offset || 0,
    };

    // Add diet filter
    const diet = dietTypeMap[preferences.dietType];
    if (diet) {
      params.diet = diet;
    }

    // Add intolerances (allergies)
    if (preferences.allergies.length > 0) {
      params.intolerances = preferences.allergies.join(',');
    }

    // Add nutritional constraints
    if (options.maxCalories) {
      params.maxCalories = options.maxCalories;
    }
    if (options.minProtein) {
      params.minProtein = options.minProtein;
    }
    if (options.maxCarbs && (preferences.dietType === 'keto' || preferences.dietType === 'low_carb')) {
      params.maxCarbs = options.maxCarbs;
    }

    // Add meal type
    if (options.type) {
      params.type = options.type;
    }

    const data = await this.fetch<SpoonacularSearchResult>('/recipes/complexSearch', params);
    if (!data) return [];

    return data.results.map((recipe) => this.recipeToFoodSuggestion(recipe));
  }

  // Find recipes by ingredients (for grocery-based suggestions)
  async findByIngredients(
    ingredients: string[],
    options: {
      number?: number;
      ranking?: 1 | 2; // 1 = maximize used ingredients, 2 = minimize missing ingredients
      ignorePantry?: boolean;
    } = {}
  ): Promise<FoodSuggestion[]> {
    const params: Record<string, string | number | boolean> = {
      ingredients: ingredients.join(','),
      number: options.number || 10,
      ranking: options.ranking || 1,
      ignorePantry: options.ignorePantry ?? true,
    };

    const data = await this.fetch<SpoonacularIngredientResult[]>('/recipes/findByIngredients', params);
    if (!data) return [];

    // Get nutrition info for each recipe
    const suggestions = await Promise.all(
      data.map(async (recipe) => {
        const nutrition = await this.getRecipeNutrition(recipe.id);
        return this.ingredientResultToFoodSuggestion(recipe, nutrition);
      })
    );

    return suggestions;
  }

  // Get recipe nutrition info
  async getRecipeNutrition(recipeId: number): Promise<NutritionInfo | null> {
    const data = await this.fetch<RecipeNutrition>(`/recipes/${recipeId}/nutritionWidget.json`);
    if (!data) return null;

    return {
      calories: parseNumericValue(data.calories),
      protein: parseNumericValue(data.protein),
      carbs: parseNumericValue(data.carbs),
      fat: parseNumericValue(data.fat),
    };
  }

  // Get detailed recipe information
  async getRecipeDetails(recipeId: number): Promise<FoodItem | null> {
    const data = await this.fetch<SpoonacularRecipe & {
      summary: string;
      instructions: string;
      extendedIngredients: Array<{ original: string }>;
    }>(`/recipes/${recipeId}/information`, {
      includeNutrition: true,
    });

    if (!data) return null;

    const nutrition = data.nutrition?.nutrients
      ? parseNutrients(data.nutrition.nutrients)
      : { calories: 0, protein: 0, carbs: 0, fat: 0 };

    return {
      id: String(data.id),
      name: data.title,
      nutrition,
      servingSize: data.servings || 1,
      servingUnit: 'serving',
      imageUrl: data.image,
      category: data.dishTypes?.[0],
    };
  }

  // Get meal suggestions for a specific meal type
  async getMealSuggestions(
    mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack',
    preferences: DietaryPreferences,
    remainingCalories: number
  ): Promise<FoodSuggestion[]> {
    // Calculate target calories for this meal
    const mealCalorieRatios = {
      breakfast: 0.25,
      lunch: 0.35,
      dinner: 0.30,
      snack: 0.10,
    };

    const targetCalories = Math.round(remainingCalories * mealCalorieRatios[mealType]);
    const maxCalories = Math.round(targetCalories * 1.3); // Allow some flexibility

    // Search terms based on meal type
    const searchTerms: Record<string, string[]> = {
      breakfast: ['breakfast', 'oatmeal', 'eggs', 'smoothie', 'pancakes'],
      lunch: ['salad', 'sandwich', 'soup', 'wrap', 'bowl'],
      dinner: ['chicken dinner', 'fish', 'steak', 'pasta', 'stir fry'],
      snack: ['healthy snack', 'protein snack', 'fruit', 'nuts', 'yogurt'],
    };

    const query = searchTerms[mealType][Math.floor(Math.random() * searchTerms[mealType].length)];

    return this.searchRecipes(query, preferences, {
      maxCalories,
      type: mealType === 'snack' ? 'snack' : 'main course',
      number: 10,
    });
  }

  // Generate a meal plan
  async generateMealPlan(
    preferences: DietaryPreferences,
    targetCalories: number,
    timeFrame: 'day' | 'week' = 'day'
  ): Promise<any> {
    const params: Record<string, string | number | boolean> = {
      targetCalories,
      timeFrame,
    };

    const diet = dietTypeMap[preferences.dietType];
    if (diet) {
      params.diet = diet;
    }

    if (preferences.allergies.length > 0) {
      params.exclude = preferences.allergies.join(',');
    }

    return this.fetch('/mealplanner/generate', params);
  }

  // Convert Spoonacular recipe to FoodSuggestion
  private recipeToFoodSuggestion(recipe: SpoonacularRecipe): FoodSuggestion {
    const nutrition = recipe.nutrition?.nutrients
      ? parseNutrients(recipe.nutrition.nutrients)
      : { calories: 0, protein: 0, carbs: 0, fat: 0 };

    const healthScore = recipe.healthScore || 50;

    let reason = 'Balanced meal';
    if (healthScore >= 80) reason = 'Highly nutritious';
    else if (nutrition.protein > 25) reason = 'High protein';
    else if (nutrition.fiber && nutrition.fiber > 8) reason = 'High fiber';
    else if (nutrition.calories < 300) reason = 'Low calorie';

    return {
      id: String(recipe.id),
      name: recipe.title,
      nutrition,
      servingSize: recipe.servings || 1,
      servingUnit: 'serving',
      imageUrl: recipe.image,
      category: recipe.dishTypes?.[0],
      reason,
      healthScore,
    };
  }

  // Convert ingredient search result to FoodSuggestion
  private ingredientResultToFoodSuggestion(
    recipe: SpoonacularIngredientResult,
    nutrition: NutritionInfo | null
  ): FoodSuggestion {
    const healthScore = Math.min(100, 50 + recipe.usedIngredientCount * 15 - recipe.missedIngredientCount * 5);

    let reason: string;
    if (recipe.missedIngredientCount === 0) {
      reason = 'You have all ingredients!';
    } else if (recipe.usedIngredientCount >= 3) {
      reason = `Uses ${recipe.usedIngredientCount} of your ingredients`;
    } else {
      reason = `Only missing ${recipe.missedIngredientCount} ingredient${recipe.missedIngredientCount > 1 ? 's' : ''}`;
    }

    return {
      id: String(recipe.id),
      name: recipe.title,
      nutrition: nutrition || { calories: 0, protein: 0, carbs: 0, fat: 0 },
      servingSize: 1,
      servingUnit: 'serving',
      imageUrl: `https://spoonacular.com/recipeImages/${recipe.id}-312x231.${recipe.image.split('.').pop()}`,
      reason,
      healthScore,
    };
  }

  // Check if API key is configured
  isConfigured(): boolean {
    return !!SPOONACULAR_API_KEY;
  }
}

export const spoonacularService = new SpoonacularService();
