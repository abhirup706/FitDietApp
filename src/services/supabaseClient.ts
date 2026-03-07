import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

// Replace these with your actual Supabase credentials
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Database types for better type safety
export type Tables = {
  users: {
    id: string;
    email: string;
    name: string;
    age: number;
    height: number;
    weight: number;
    gender: 'male' | 'female' | 'other';
    activity_level: string;
    goal: string;
    dietary_preferences: object;
    daily_calorie_target: number;
    created_at: string;
    updated_at: string;
  };
  meals: {
    id: string;
    user_id: string;
    food_name: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    meal_type: string;
    barcode?: string;
    serving_size?: number;
    serving_unit?: string;
    logged_at: string;
  };
  fitness_data: {
    id: string;
    user_id: string;
    date: string;
    steps: number;
    calories_burned: number;
    active_minutes: number;
    heart_rate_avg?: number;
    sleep_hours?: number;
    source: string;
  };
  food_preferences: {
    id: string;
    user_id: string;
    food_name: string;
    rating: number;
    is_favorite: boolean;
  };
  grocery_items: {
    id: string;
    user_id: string;
    name: string;
    quantity: number;
    unit: string;
    category: string;
    purchased: boolean;
    created_at: string;
    updated_at: string;
  };
};

// Helper functions for database operations
export const db = {
  // User operations
  async getUser(userId: string) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
    return { data, error };
  },

  async updateUser(userId: string, updates: Partial<Tables['users']>) {
    const { data, error } = await supabase
      .from('users')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', userId)
      .select()
      .single();
    return { data, error };
  },

  async createUser(user: Omit<Tables['users'], 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('users')
      .insert({
        ...user,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();
    return { data, error };
  },

  // Meal operations
  async getMeals(userId: string, date?: string) {
    let query = supabase
      .from('meals')
      .select('*')
      .eq('user_id', userId)
      .order('logged_at', { ascending: false });

    if (date) {
      query = query.gte('logged_at', `${date}T00:00:00`).lt('logged_at', `${date}T23:59:59`);
    }

    const { data, error } = await query;
    return { data, error };
  },

  async addMeal(meal: Omit<Tables['meals'], 'id'>) {
    const { data, error } = await supabase
      .from('meals')
      .insert(meal)
      .select()
      .single();
    return { data, error };
  },

  async deleteMeal(mealId: string) {
    const { error } = await supabase.from('meals').delete().eq('id', mealId);
    return { error };
  },

  // Fitness data operations
  async getFitnessData(userId: string, date?: string) {
    let query = supabase
      .from('fitness_data')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false });

    if (date) {
      query = query.eq('date', date);
    }

    const { data, error } = await query;
    return { data, error };
  },

  async upsertFitnessData(fitnessData: Omit<Tables['fitness_data'], 'id'>) {
    const { data, error } = await supabase
      .from('fitness_data')
      .upsert(fitnessData, { onConflict: 'user_id,date,source' })
      .select()
      .single();
    return { data, error };
  },

  // Food preferences
  async getFoodPreferences(userId: string) {
    const { data, error } = await supabase
      .from('food_preferences')
      .select('*')
      .eq('user_id', userId);
    return { data, error };
  },

  async updateFoodPreference(
    userId: string,
    foodName: string,
    rating: number,
    isFavorite: boolean
  ) {
    const { data, error } = await supabase
      .from('food_preferences')
      .upsert(
        { user_id: userId, food_name: foodName, rating, is_favorite: isFavorite },
        { onConflict: 'user_id,food_name' }
      )
      .select()
      .single();
    return { data, error };
  },

  // Grocery operations
  async getGroceryItems(userId: string, purchasedOnly?: boolean) {
    let query = supabase
      .from('grocery_items')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (purchasedOnly !== undefined) {
      query = query.eq('purchased', purchasedOnly);
    }

    const { data, error } = await query;
    return { data, error };
  },

  async addGroceryItem(item: Omit<Tables['grocery_items'], 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('grocery_items')
      .insert({
        ...item,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();
    return { data, error };
  },

  async updateGroceryItem(itemId: string, updates: Partial<Tables['grocery_items']>) {
    const { data, error } = await supabase
      .from('grocery_items')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', itemId)
      .select()
      .single();
    return { data, error };
  },

  async deleteGroceryItem(itemId: string) {
    const { error } = await supabase.from('grocery_items').delete().eq('id', itemId);
    return { error };
  },

  async clearPurchasedItems(userId: string) {
    const { error } = await supabase
      .from('grocery_items')
      .delete()
      .eq('user_id', userId)
      .eq('purchased', true);
    return { error };
  },

  async toggleGroceryItemPurchased(itemId: string, purchased: boolean) {
    const { data, error } = await supabase
      .from('grocery_items')
      .update({ purchased, updated_at: new Date().toISOString() })
      .eq('id', itemId)
      .select()
      .single();
    return { data, error };
  },
};
