import { FoodItem, NutritionInfo, FoodSuggestion, DietaryPreferences, DietType } from '../types';
import { spoonacularService } from './spoonacularService';

const OPEN_FOOD_FACTS_API = 'https://world.openfoodfacts.org/api/v2';

// Parse nutrition data from Open Food Facts response
function parseNutrition(nutriments: any): NutritionInfo {
  return {
    calories: Math.round(nutriments['energy-kcal_100g'] || nutriments['energy-kcal'] || 0),
    protein: Math.round((nutriments.proteins_100g || nutriments.proteins || 0) * 10) / 10,
    carbs: Math.round((nutriments.carbohydrates_100g || nutriments.carbohydrates || 0) * 10) / 10,
    fat: Math.round((nutriments.fat_100g || nutriments.fat || 0) * 10) / 10,
    fiber: Math.round((nutriments.fiber_100g || nutriments.fiber || 0) * 10) / 10,
    sugar: Math.round((nutriments.sugars_100g || nutriments.sugars || 0) * 10) / 10,
    sodium: Math.round((nutriments.sodium_100g || nutriments.sodium || 0) * 1000) / 1000,
  };
}

// Parse product from Open Food Facts response
function parseProduct(product: any): FoodItem | null {
  if (!product || !product.product_name) return null;

  return {
    id: product.code || product._id,
    name: product.product_name,
    brand: product.brands,
    barcode: product.code,
    nutrition: parseNutrition(product.nutriments || {}),
    servingSize: parseFloat(product.serving_quantity) || 100,
    servingUnit: product.serving_quantity_unit || 'g',
    imageUrl: product.image_url || product.image_front_url,
    category: product.categories?.split(',')[0]?.trim(),
  };
}

class FoodService {
  // Search foods by name
  async searchFoods(query: string, page: number = 1, pageSize: number = 20): Promise<FoodItem[]> {
    try {
      const url = `${OPEN_FOOD_FACTS_API}/search?search_terms=${encodeURIComponent(query)}&page=${page}&page_size=${pageSize}&fields=code,product_name,brands,nutriments,serving_quantity,serving_quantity_unit,image_url,image_front_url,categories`;

      const response = await fetch(url);
      const data = await response.json();

      if (!data.products) return [];

      return data.products
        .map(parseProduct)
        .filter((item: FoodItem | null): item is FoodItem => item !== null);
    } catch (error) {
      console.error('Food search failed:', error);
      return [];
    }
  }

  // Get food by barcode
  async getFoodByBarcode(barcode: string): Promise<FoodItem | null> {
    try {
      const url = `${OPEN_FOOD_FACTS_API}/product/${barcode}.json`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.status !== 1 || !data.product) return null;

      return parseProduct(data.product);
    } catch (error) {
      console.error('Barcode lookup failed:', error);
      return null;
    }
  }

  // Calculate health score for a food item (0-100)
  calculateHealthScore(food: FoodItem, preferences: DietaryPreferences): number {
    let score = 50; // Base score

    const { calories, protein, carbs, fat, fiber, sugar } = food.nutrition;

    // Protein is generally good
    if (protein > 10) score += 10;
    if (protein > 20) score += 5;

    // High fiber is good
    if (fiber && fiber > 3) score += 10;
    if (fiber && fiber > 6) score += 5;

    // Low sugar is good
    if (sugar && sugar < 5) score += 10;
    if (sugar && sugar > 15) score -= 15;

    // Adjust based on diet type
    switch (preferences.dietType) {
      case 'keto':
      case 'low_carb':
        if (carbs < 5) score += 20;
        else if (carbs < 10) score += 10;
        else if (carbs > 20) score -= 20;
        if (fat > 15) score += 10;
        break;

      case 'weight_loss':
        if (calories < 100) score += 15;
        else if (calories < 200) score += 5;
        else if (calories > 400) score -= 15;
        if (protein > 15) score += 10;
        break;

      case 'muscle_gain':
        if (protein > 20) score += 20;
        if (protein > 30) score += 10;
        if (calories > 200) score += 5;
        break;

      default:
        // Balanced diet - moderate everything
        if (calories < 300 && protein > 10) score += 10;
    }

    return Math.max(0, Math.min(100, score));
  }

  // Search for recipes (uses Spoonacular if available)
  async searchRecipes(
    query: string,
    preferences: DietaryPreferences,
    options: { maxCalories?: number; number?: number } = {}
  ): Promise<FoodSuggestion[]> {
    if (spoonacularService.isConfigured()) {
      try {
        return await spoonacularService.searchRecipes(query, preferences, options);
      } catch (error) {
        console.error('Spoonacular recipe search failed:', error);
      }
    }

    // Fallback to Open Food Facts search
    const foods = await this.searchFoods(query, 1, options.number || 10);
    return foods.map((food) => ({
      ...food,
      reason: this.getSuggestionReason(food, preferences),
      healthScore: this.calculateHealthScore(food, preferences),
    }));
  }

  // Get healthier alternatives based on a food item
  async getHealthierAlternatives(
    originalFood: FoodItem,
    preferences: DietaryPreferences,
    limit: number = 5
  ): Promise<FoodSuggestion[]> {
    // Try Spoonacular for better recipe alternatives
    if (spoonacularService.isConfigured()) {
      try {
        const searchTerm = originalFood.category || originalFood.name.split(' ')[0];
        const alternatives = await spoonacularService.searchRecipes(
          `healthy ${searchTerm}`,
          preferences,
          {
            maxCalories: originalFood.nutrition.calories,
            number: limit * 2,
          }
        );

        // Filter to only healthier options
        const healthierOptions = alternatives
          .filter((alt) => alt.healthScore > this.calculateHealthScore(originalFood, preferences))
          .slice(0, limit);

        if (healthierOptions.length > 0) {
          return healthierOptions.map((alt) => ({
            ...alt,
            caloriesSaved:
              originalFood.nutrition.calories > alt.nutrition.calories
                ? originalFood.nutrition.calories - alt.nutrition.calories
                : undefined,
          }));
        }
      } catch (error) {
        console.error('Spoonacular alternatives search failed:', error);
      }
    }

    // Fallback to Open Food Facts
    return this.getHealthierAlternativesFallback(originalFood, preferences, limit);
  }

  // Fallback healthier alternatives using Open Food Facts
  private async getHealthierAlternativesFallback(
    originalFood: FoodItem,
    preferences: DietaryPreferences,
    limit: number = 5
  ): Promise<FoodSuggestion[]> {
    const suggestions: FoodSuggestion[] = [];

    // Search for similar foods in the same category
    const searchTerms = originalFood.category || originalFood.name.split(' ')[0];
    const alternatives = await this.searchFoods(searchTerms, 1, 50);

    for (const food of alternatives) {
      if (food.id === originalFood.id) continue;

      const healthScore = this.calculateHealthScore(food, preferences);
      const originalScore = this.calculateHealthScore(originalFood, preferences);

      // Only suggest if it's healthier
      if (healthScore <= originalScore) continue;

      const caloriesSaved = originalFood.nutrition.calories - food.nutrition.calories;
      let reason = '';

      if (caloriesSaved > 50) {
        reason = `${caloriesSaved} fewer calories`;
      } else if (food.nutrition.protein > originalFood.nutrition.protein + 5) {
        reason = `${Math.round(food.nutrition.protein - originalFood.nutrition.protein)}g more protein`;
      } else if (
        food.nutrition.fiber &&
        originalFood.nutrition.fiber &&
        food.nutrition.fiber > originalFood.nutrition.fiber + 2
      ) {
        reason = `${Math.round(food.nutrition.fiber - originalFood.nutrition.fiber)}g more fiber`;
      } else if (
        food.nutrition.sugar &&
        originalFood.nutrition.sugar &&
        originalFood.nutrition.sugar - food.nutrition.sugar > 5
      ) {
        reason = `${Math.round(originalFood.nutrition.sugar - food.nutrition.sugar)}g less sugar`;
      } else {
        reason = 'Better macro balance';
      }

      suggestions.push({
        ...food,
        reason,
        healthScore,
        caloriesSaved: caloriesSaved > 0 ? caloriesSaved : undefined,
      });
    }

    // Sort by health score and return top results
    return suggestions.sort((a, b) => b.healthScore - a.healthScore).slice(0, limit);
  }

  // Get meal suggestions based on remaining calories and preferences
  async getMealSuggestions(
    remainingCalories: number,
    preferences: DietaryPreferences,
    mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack'
  ): Promise<FoodSuggestion[]> {
    // Try Spoonacular first (better recipe data)
    if (spoonacularService.isConfigured()) {
      try {
        const suggestions = await spoonacularService.getMealSuggestions(
          mealType,
          preferences,
          remainingCalories
        );
        if (suggestions.length > 0) {
          return suggestions;
        }
      } catch (error) {
        console.error('Spoonacular meal suggestions failed:', error);
      }
    }

    // Fallback to Open Food Facts
    return this.getMealSuggestionsFallback(remainingCalories, preferences, mealType);
  }

  // Fallback meal suggestions using Open Food Facts
  private async getMealSuggestionsFallback(
    remainingCalories: number,
    preferences: DietaryPreferences,
    mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack'
  ): Promise<FoodSuggestion[]> {
    const suggestions: FoodSuggestion[] = [];

    // Determine calorie target for this meal
    const mealCalorieTargets = {
      breakfast: 0.25,
      lunch: 0.35,
      dinner: 0.30,
      snack: 0.10,
    };

    const targetCalories = Math.min(
      remainingCalories * mealCalorieTargets[mealType],
      remainingCalories
    );

    // Search terms based on meal type and diet
    const searchTerms = this.getMealSearchTerms(mealType, preferences.dietType);

    for (const term of searchTerms) {
      const foods = await this.searchFoods(term, 1, 10);

      for (const food of foods) {
        // Filter by calorie range (within 20% of target)
        if (
          food.nutrition.calories < targetCalories * 0.8 ||
          food.nutrition.calories > targetCalories * 1.2
        ) {
          continue;
        }

        // Check dietary restrictions
        if (!this.matchesDietaryRestrictions(food, preferences)) continue;

        const healthScore = this.calculateHealthScore(food, preferences);

        suggestions.push({
          ...food,
          reason: this.getSuggestionReason(food, preferences),
          healthScore,
        });
      }
    }

    return suggestions.sort((a, b) => b.healthScore - a.healthScore).slice(0, 10);
  }

  // Get search terms based on meal type and diet
  private getMealSearchTerms(mealType: string, dietType: DietType): string[] {
    const baseTerms: Record<string, string[]> = {
      breakfast: ['oatmeal', 'eggs', 'yogurt', 'granola', 'toast'],
      lunch: ['salad', 'sandwich', 'soup', 'wrap', 'bowl'],
      dinner: ['chicken', 'fish', 'vegetables', 'rice', 'pasta'],
      snack: ['nuts', 'fruit', 'protein bar', 'crackers', 'cheese'],
    };

    const dietModifiers: Record<DietType, string[]> = {
      vegetarian: ['vegetarian', 'plant-based'],
      vegan: ['vegan', 'plant-based'],
      keto: ['keto', 'low carb', 'high fat'],
      low_carb: ['low carb', 'protein'],
      muscle_gain: ['high protein', 'protein'],
      weight_loss: ['low calorie', 'light'],
      balanced: [],
      custom: [],
    };

    const terms = baseTerms[mealType] || [];
    const modifiers = dietModifiers[dietType] || [];

    if (modifiers.length > 0) {
      return terms.map((term) => `${term} ${modifiers[0]}`);
    }

    return terms;
  }

  // Check if food matches dietary restrictions
  private matchesDietaryRestrictions(food: FoodItem, preferences: DietaryPreferences): boolean {
    const name = food.name.toLowerCase();
    const category = (food.category || '').toLowerCase();

    // Check allergies
    for (const allergy of preferences.allergies) {
      if (name.includes(allergy.toLowerCase()) || category.includes(allergy.toLowerCase())) {
        return false;
      }
    }

    // Check restrictions
    for (const restriction of preferences.restrictions) {
      if (name.includes(restriction.toLowerCase())) {
        return false;
      }
    }

    return true;
  }

  // Generate a reason for suggesting this food
  private getSuggestionReason(food: FoodItem, preferences: DietaryPreferences): string {
    const { calories, protein, carbs, fat, fiber } = food.nutrition;

    switch (preferences.dietType) {
      case 'keto':
      case 'low_carb':
        if (carbs < 5) return 'Very low carb';
        if (fat > 15 && carbs < 10) return 'High fat, low carb';
        break;
      case 'weight_loss':
        if (calories < 150) return 'Low calorie option';
        if (fiber && fiber > 5) return 'High fiber, keeps you full';
        break;
      case 'muscle_gain':
        if (protein > 25) return 'High protein';
        if (protein > 15 && calories > 200) return 'Good for muscle building';
        break;
    }

    if (protein > 15) return 'Good protein source';
    if (fiber && fiber > 5) return 'High in fiber';
    if (calories < 200) return 'Light and nutritious';

    return 'Balanced nutrition';
  }

  // Get meal suggestions based on available ingredients
  async getMealSuggestionsFromIngredients(
    ingredients: string[],
    remainingCalories: number,
    preferences: DietaryPreferences
  ): Promise<FoodSuggestion[]> {
    if (ingredients.length === 0) return [];

    // Try Spoonacular first (has dedicated ingredient-based search)
    if (spoonacularService.isConfigured()) {
      try {
        const suggestions = await spoonacularService.findByIngredients(ingredients, {
          number: 15,
          ranking: 1, // Maximize used ingredients
        });
        if (suggestions.length > 0) {
          return suggestions;
        }
      } catch (error) {
        console.error('Spoonacular ingredient search failed:', error);
      }
    }

    // Fallback to Open Food Facts
    return this.getMealSuggestionsFromIngredientsFallback(ingredients, remainingCalories, preferences);
  }

  // Fallback ingredient-based suggestions using Open Food Facts
  private async getMealSuggestionsFromIngredientsFallback(
    ingredients: string[],
    remainingCalories: number,
    preferences: DietaryPreferences
  ): Promise<FoodSuggestion[]> {
    const suggestions: FoodSuggestion[] = [];
    const seenIds = new Set<string>();

    // Search for meals containing each ingredient
    for (const ingredient of ingredients.slice(0, 5)) {
      const foods = await this.searchFoods(ingredient, 1, 15);

      for (const food of foods) {
        if (seenIds.has(food.id)) continue;
        seenIds.add(food.id);

        // Skip if too many calories
        if (food.nutrition.calories > remainingCalories) continue;

        // Check dietary restrictions
        if (!this.matchesDietaryRestrictions(food, preferences)) continue;

        // Calculate how many available ingredients are in this food
        const foodNameLower = food.name.toLowerCase();
        const matchingIngredients = ingredients.filter((ing) =>
          foodNameLower.includes(ing.toLowerCase())
        );

        // Base health score
        let healthScore = this.calculateHealthScore(food, preferences);

        // Boost score for each matching ingredient
        healthScore += matchingIngredients.length * 10;

        // Generate reason based on matching ingredients
        let reason = '';
        if (matchingIngredients.length >= 2) {
          reason = `Uses ${matchingIngredients.slice(0, 2).join(' & ')}`;
        } else if (matchingIngredients.length === 1) {
          reason = `Uses your ${matchingIngredients[0]}`;
        } else {
          reason = this.getSuggestionReason(food, preferences);
        }

        suggestions.push({
          ...food,
          reason,
          healthScore: Math.min(100, healthScore),
        });
      }
    }

    // Sort by health score and return top results
    return suggestions.sort((a, b) => b.healthScore - a.healthScore).slice(0, 15);
  }

  // Quick add common foods (cached/predefined for better UX)
  getQuickAddFoods(): FoodItem[] {
    return [
      {
        id: 'quick-apple',
        name: 'Apple (medium)',
        nutrition: { calories: 95, protein: 0.5, carbs: 25, fat: 0.3, fiber: 4, sugar: 19 },
        servingSize: 182,
        servingUnit: 'g',
      },
      {
        id: 'quick-banana',
        name: 'Banana (medium)',
        nutrition: { calories: 105, protein: 1.3, carbs: 27, fat: 0.4, fiber: 3, sugar: 14 },
        servingSize: 118,
        servingUnit: 'g',
      },
      {
        id: 'quick-chicken-breast',
        name: 'Chicken Breast (grilled)',
        nutrition: { calories: 165, protein: 31, carbs: 0, fat: 3.6, fiber: 0 },
        servingSize: 100,
        servingUnit: 'g',
      },
      {
        id: 'quick-rice',
        name: 'White Rice (cooked)',
        nutrition: { calories: 206, protein: 4.3, carbs: 45, fat: 0.4, fiber: 0.6 },
        servingSize: 158,
        servingUnit: 'g',
      },
      {
        id: 'quick-egg',
        name: 'Egg (large, boiled)',
        nutrition: { calories: 78, protein: 6, carbs: 0.6, fat: 5, fiber: 0 },
        servingSize: 50,
        servingUnit: 'g',
      },
      {
        id: 'quick-oatmeal',
        name: 'Oatmeal (cooked)',
        nutrition: { calories: 158, protein: 6, carbs: 27, fat: 3, fiber: 4 },
        servingSize: 234,
        servingUnit: 'g',
      },
      {
        id: 'quick-salad',
        name: 'Mixed Green Salad',
        nutrition: { calories: 20, protein: 2, carbs: 4, fat: 0.2, fiber: 2 },
        servingSize: 100,
        servingUnit: 'g',
      },
      {
        id: 'quick-almonds',
        name: 'Almonds (handful)',
        nutrition: { calories: 164, protein: 6, carbs: 6, fat: 14, fiber: 3.5 },
        servingSize: 28,
        servingUnit: 'g',
      },
    ];
  }
}

export const foodService = new FoodService();

// Re-export spoonacular service for direct access if needed
export { spoonacularService } from './spoonacularService';
