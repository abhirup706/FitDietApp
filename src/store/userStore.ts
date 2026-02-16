import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, DietaryPreferences, Meal, FitnessData, DailySummary } from '../types';
import { supabase, db } from '../services/supabaseClient';
import { calculateDailyCalorieTarget } from '../utils/calculations';

interface UserState {
  // Auth state
  user: User | null;
  session: any | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  // Daily data
  todaysMeals: Meal[];
  todaysFitness: FitnessData | null;
  dailySummary: DailySummary | null;

  // Actions
  setUser: (user: User | null) => void;
  setSession: (session: any | null) => void;
  setLoading: (loading: boolean) => void;

  // Auth actions
  signUp: (email: string, password: string, name: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  checkSession: () => Promise<void>;

  // Profile actions
  updateProfile: (updates: Partial<User>) => Promise<{ error: any }>;
  completeOnboarding: (
    data: Omit<User, 'id' | 'email' | 'createdAt' | 'updatedAt'>
  ) => Promise<{ error: any }>;

  // Meal actions
  addMeal: (meal: Omit<Meal, 'id' | 'userId' | 'loggedAt'>) => Promise<{ error: any }>;
  removeMeal: (mealId: string) => Promise<{ error: any }>;
  loadTodaysMeals: () => Promise<void>;

  // Fitness actions
  syncFitnessData: (data: Omit<FitnessData, 'id' | 'userId'>) => Promise<{ error: any }>;
  loadTodaysFitness: () => Promise<void>;

  // Summary
  refreshDailySummary: () => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      session: null,
      isLoading: true,
      isAuthenticated: false,
      todaysMeals: [],
      todaysFitness: null,
      dailySummary: null,

      setUser: (user) => set({ user, isAuthenticated: !!user }),
      setSession: (session) => set({ session }),
      setLoading: (isLoading) => set({ isLoading }),

      // Sign up with email/password
      signUp: async (email, password, name) => {
        set({ isLoading: true });
        try {
          const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: { name },
            },
          });

          if (error) {
            set({ isLoading: false });
            return { error };
          }

          if (data.user) {
            // Create initial user profile
            const { error: profileError } = await db.createUser({
              id: data.user.id,
              email,
              name,
              age: 0,
              height: 0,
              weight: 0,
              gender: 'other',
              activity_level: 'moderate',
              goal: 'maintain',
              dietary_preferences: {
                dietType: 'balanced',
                allergies: [],
                restrictions: [],
              },
              daily_calorie_target: 2000,
            });

            if (profileError) {
              console.error('Profile creation error:', profileError);
            }

            set({ session: data.session });
          }

          set({ isLoading: false });
          return { error: null };
        } catch (error) {
          set({ isLoading: false });
          return { error };
        }
      },

      // Sign in with email/password
      signIn: async (email, password) => {
        set({ isLoading: true });
        try {
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
          });

          if (error) {
            set({ isLoading: false });
            return { error };
          }

          if (data.user) {
            // Fetch user profile
            const { data: profile } = await db.getUser(data.user.id);
            if (profile) {
              const user: User = {
                id: profile.id,
                email: profile.email,
                name: profile.name,
                age: profile.age,
                height: profile.height,
                weight: profile.weight,
                gender: profile.gender,
                activityLevel: profile.activity_level as any,
                goal: profile.goal as any,
                dietaryPreferences: profile.dietary_preferences as DietaryPreferences,
                dailyCalorieTarget: profile.daily_calorie_target,
                createdAt: profile.created_at,
                updatedAt: profile.updated_at,
              };
              set({ user, session: data.session, isAuthenticated: true });
            }
          }

          set({ isLoading: false });
          return { error: null };
        } catch (error) {
          set({ isLoading: false });
          return { error };
        }
      },

      // Sign out
      signOut: async () => {
        await supabase.auth.signOut();
        set({
          user: null,
          session: null,
          isAuthenticated: false,
          todaysMeals: [],
          todaysFitness: null,
          dailySummary: null,
        });
      },

      // Check existing session
      checkSession: async () => {
        set({ isLoading: true });
        try {
          const { data: { session } } = await supabase.auth.getSession();

          if (session?.user) {
            const { data: profile } = await db.getUser(session.user.id);
            if (profile) {
              const user: User = {
                id: profile.id,
                email: profile.email,
                name: profile.name,
                age: profile.age,
                height: profile.height,
                weight: profile.weight,
                gender: profile.gender,
                activityLevel: profile.activity_level as any,
                goal: profile.goal as any,
                dietaryPreferences: profile.dietary_preferences as DietaryPreferences,
                dailyCalorieTarget: profile.daily_calorie_target,
                createdAt: profile.created_at,
                updatedAt: profile.updated_at,
              };
              set({ user, session, isAuthenticated: true });

              // Load today's data
              get().loadTodaysMeals();
              get().loadTodaysFitness();
            }
          }
        } catch (error) {
          console.error('Session check error:', error);
        }
        set({ isLoading: false });
      },

      // Update user profile
      updateProfile: async (updates) => {
        const { user } = get();
        if (!user) return { error: new Error('Not authenticated') };

        const dbUpdates: any = {};
        if (updates.name) dbUpdates.name = updates.name;
        if (updates.age) dbUpdates.age = updates.age;
        if (updates.height) dbUpdates.height = updates.height;
        if (updates.weight) dbUpdates.weight = updates.weight;
        if (updates.gender) dbUpdates.gender = updates.gender;
        if (updates.activityLevel) dbUpdates.activity_level = updates.activityLevel;
        if (updates.goal) dbUpdates.goal = updates.goal;
        if (updates.dietaryPreferences) dbUpdates.dietary_preferences = updates.dietaryPreferences;
        if (updates.dailyCalorieTarget) dbUpdates.daily_calorie_target = updates.dailyCalorieTarget;

        const { error } = await db.updateUser(user.id, dbUpdates);

        if (!error) {
          set({ user: { ...user, ...updates } });
        }

        return { error };
      },

      // Complete onboarding
      completeOnboarding: async (data) => {
        const { user } = get();
        if (!user) return { error: new Error('Not authenticated') };

        // Calculate daily calorie target
        const dailyCalorieTarget = calculateDailyCalorieTarget(
          data.weight,
          data.height,
          data.age,
          data.gender,
          data.activityLevel,
          data.goal
        );

        const updates = {
          ...data,
          dailyCalorieTarget,
        };

        return get().updateProfile(updates);
      },

      // Add a meal
      addMeal: async (mealData) => {
        const { user, todaysMeals } = get();
        if (!user) return { error: new Error('Not authenticated') };

        const meal = {
          user_id: user.id,
          food_name: mealData.foodName,
          calories: mealData.calories,
          protein: mealData.protein,
          carbs: mealData.carbs,
          fat: mealData.fat,
          meal_type: mealData.mealType,
          barcode: mealData.barcode,
          serving_size: mealData.servingSize,
          serving_unit: mealData.servingUnit,
          logged_at: new Date().toISOString(),
        };

        const { data, error } = await db.addMeal(meal);

        if (!error && data) {
          const newMeal: Meal = {
            id: data.id,
            userId: user.id,
            foodName: mealData.foodName,
            calories: mealData.calories,
            protein: mealData.protein,
            carbs: mealData.carbs,
            fat: mealData.fat,
            mealType: mealData.mealType,
            barcode: mealData.barcode,
            servingSize: mealData.servingSize,
            servingUnit: mealData.servingUnit,
            loggedAt: data.logged_at,
          };
          set({ todaysMeals: [newMeal, ...todaysMeals] });
          get().refreshDailySummary();
        }

        return { error };
      },

      // Remove a meal
      removeMeal: async (mealId) => {
        const { todaysMeals } = get();
        const { error } = await db.deleteMeal(mealId);

        if (!error) {
          set({ todaysMeals: todaysMeals.filter((m) => m.id !== mealId) });
          get().refreshDailySummary();
        }

        return { error };
      },

      // Load today's meals
      loadTodaysMeals: async () => {
        const { user } = get();
        if (!user) return;

        const today = new Date().toISOString().split('T')[0];
        const { data } = await db.getMeals(user.id, today);

        if (data) {
          const meals: Meal[] = data.map((m: any) => ({
            id: m.id,
            userId: m.user_id,
            foodName: m.food_name,
            calories: m.calories,
            protein: m.protein,
            carbs: m.carbs,
            fat: m.fat,
            mealType: m.meal_type,
            barcode: m.barcode,
            servingSize: m.serving_size,
            servingUnit: m.serving_unit,
            loggedAt: m.logged_at,
          }));
          set({ todaysMeals: meals });
          get().refreshDailySummary();
        }
      },

      // Sync fitness data
      syncFitnessData: async (fitnessData) => {
        const { user } = get();
        if (!user) return { error: new Error('Not authenticated') };

        const data = {
          user_id: user.id,
          date: fitnessData.date,
          steps: fitnessData.steps,
          calories_burned: fitnessData.caloriesBurned,
          active_minutes: fitnessData.activeMinutes,
          heart_rate_avg: fitnessData.heartRateAvg,
          sleep_hours: fitnessData.sleepHours,
          source: fitnessData.source,
        };

        const { error } = await db.upsertFitnessData(data);

        if (!error) {
          const fitness: FitnessData = {
            id: '', // Will be set by DB
            userId: user.id,
            ...fitnessData,
          };
          set({ todaysFitness: fitness });
          get().refreshDailySummary();
        }

        return { error };
      },

      // Load today's fitness data
      loadTodaysFitness: async () => {
        const { user } = get();
        if (!user) return;

        const today = new Date().toISOString().split('T')[0];
        const { data } = await db.getFitnessData(user.id, today);

        if (data && data.length > 0) {
          const f = data[0];
          const fitness: FitnessData = {
            id: f.id,
            userId: f.user_id,
            date: f.date,
            steps: f.steps,
            caloriesBurned: f.calories_burned,
            activeMinutes: f.active_minutes,
            heartRateAvg: f.heart_rate_avg,
            sleepHours: f.sleep_hours,
            source: f.source as any,
          };
          set({ todaysFitness: fitness });
          get().refreshDailySummary();
        }
      },

      // Refresh daily summary
      refreshDailySummary: () => {
        const { user, todaysMeals, todaysFitness } = get();
        if (!user) return;

        const caloriesConsumed = todaysMeals.reduce((sum, m) => sum + m.calories, 0);
        const proteinConsumed = todaysMeals.reduce((sum, m) => sum + m.protein, 0);
        const carbsConsumed = todaysMeals.reduce((sum, m) => sum + m.carbs, 0);
        const fatConsumed = todaysMeals.reduce((sum, m) => sum + m.fat, 0);
        const caloriesBurned = todaysFitness?.caloriesBurned || 0;

        const summary: DailySummary = {
          date: new Date().toISOString().split('T')[0],
          caloriesConsumed,
          caloriesBurned,
          caloriesRemaining: user.dailyCalorieTarget - caloriesConsumed + caloriesBurned,
          proteinConsumed,
          carbsConsumed,
          fatConsumed,
          steps: todaysFitness?.steps || 0,
          activeMinutes: todaysFitness?.activeMinutes || 0,
          meals: todaysMeals,
        };

        set({ dailySummary: summary });
      },
    }),
    {
      name: 'fitdiet-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        user: state.user,
        session: state.session,
      }),
    }
  )
);
