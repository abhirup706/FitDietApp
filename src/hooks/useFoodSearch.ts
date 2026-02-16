import { useState, useCallback } from 'react';
import { foodService } from '../services/foodService';
import { FoodItem, FoodSuggestion, DietaryPreferences, MealType } from '../types';

interface UseFoodSearchReturn {
  searchResults: FoodItem[];
  isSearching: boolean;
  searchError: string | null;
  search: (query: string) => Promise<void>;
  searchByBarcode: (barcode: string) => Promise<FoodItem | null>;
  clearResults: () => void;
}

export function useFoodSearch(): UseFoodSearchReturn {
  const [searchResults, setSearchResults] = useState<FoodItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const search = useCallback(async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    setSearchError(null);

    try {
      const results = await foodService.searchFoods(query);
      setSearchResults(results);
    } catch (error) {
      setSearchError('Failed to search foods');
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const searchByBarcode = useCallback(async (barcode: string): Promise<FoodItem | null> => {
    setIsSearching(true);
    setSearchError(null);

    try {
      const result = await foodService.getFoodByBarcode(barcode);
      if (result) {
        setSearchResults([result]);
      } else {
        setSearchError('Product not found');
      }
      return result;
    } catch (error) {
      setSearchError('Failed to scan barcode');
      return null;
    } finally {
      setIsSearching(false);
    }
  }, []);

  const clearResults = useCallback(() => {
    setSearchResults([]);
    setSearchError(null);
  }, []);

  return {
    searchResults,
    isSearching,
    searchError,
    search,
    searchByBarcode,
    clearResults,
  };
}

interface UseSuggestionsReturn {
  suggestions: FoodSuggestion[];
  isLoading: boolean;
  getMealSuggestions: (
    remainingCalories: number,
    preferences: DietaryPreferences,
    mealType: MealType
  ) => Promise<void>;
  getAlternatives: (
    food: FoodItem,
    preferences: DietaryPreferences
  ) => Promise<FoodSuggestion[]>;
}

export function useSuggestions(): UseSuggestionsReturn {
  const [suggestions, setSuggestions] = useState<FoodSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const getMealSuggestions = useCallback(
    async (
      remainingCalories: number,
      preferences: DietaryPreferences,
      mealType: MealType
    ) => {
      setIsLoading(true);
      try {
        const results = await foodService.getMealSuggestions(
          remainingCalories,
          preferences,
          mealType
        );
        setSuggestions(results);
      } catch (error) {
        console.error('Failed to get suggestions:', error);
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const getAlternatives = useCallback(
    async (
      food: FoodItem,
      preferences: DietaryPreferences
    ): Promise<FoodSuggestion[]> => {
      setIsLoading(true);
      try {
        const results = await foodService.getHealthierAlternatives(
          food,
          preferences
        );
        return results;
      } catch (error) {
        console.error('Failed to get alternatives:', error);
        return [];
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  return {
    suggestions,
    isLoading,
    getMealSuggestions,
    getAlternatives,
  };
}
