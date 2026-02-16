// User types
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
export type Goal = 'lose' | 'maintain' | 'gain';
export type DietType = 'balanced' | 'weight_loss' | 'muscle_gain' | 'vegetarian' | 'vegan' | 'keto' | 'low_carb' | 'custom';
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';
export type HealthSource = 'apple_watch' | 'fitbit' | 'google_fit' | 'manual';

export interface DietaryPreferences {
  dietType: DietType;
  allergies: string[];
  restrictions: string[];
  customMacros?: {
    protein: number;
    carbs: number;
    fat: number;
  };
}

export interface User {
  id: string;
  email: string;
  name: string;
  age: number;
  height: number; // cm
  weight: number; // kg
  gender: 'male' | 'female' | 'other';
  activityLevel: ActivityLevel;
  goal: Goal;
  dietaryPreferences: DietaryPreferences;
  dailyCalorieTarget: number;
  createdAt: string;
  updatedAt: string;
}

export interface Meal {
  id: string;
  userId: string;
  foodName: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  mealType: MealType;
  barcode?: string;
  servingSize?: number;
  servingUnit?: string;
  loggedAt: string;
}

export interface FitnessData {
  id: string;
  userId: string;
  date: string;
  steps: number;
  caloriesBurned: number;
  activeMinutes: number;
  heartRateAvg?: number;
  sleepHours?: number;
  source: HealthSource;
}

export interface FoodPreference {
  id: string;
  userId: string;
  foodName: string;
  rating: number;
  isFavorite: boolean;
}

// Food API types
export interface NutritionInfo {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
}

export interface FoodItem {
  id: string;
  name: string;
  brand?: string;
  barcode?: string;
  nutrition: NutritionInfo;
  servingSize: number;
  servingUnit: string;
  imageUrl?: string;
  category?: string;
}

export interface FoodSuggestion extends FoodItem {
  reason: string;
  healthScore: number;
  caloriesSaved?: number;
}

// Daily summary
export interface DailySummary {
  date: string;
  caloriesConsumed: number;
  caloriesBurned: number;
  caloriesRemaining: number;
  proteinConsumed: number;
  carbsConsumed: number;
  fatConsumed: number;
  steps: number;
  activeMinutes: number;
  meals: Meal[];
}

// Auth types
export interface AuthState {
  user: User | null;
  session: any | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

// Navigation types
export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  Onboarding: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  DietLog: undefined;
  Fitness: undefined;
  Suggestions: undefined;
  Profile: undefined;
};
