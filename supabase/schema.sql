-- FitDiet App Database Schema for Supabase
-- Run this in the Supabase SQL Editor to create all tables

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    name TEXT NOT NULL,
    age INTEGER DEFAULT 0,
    height DECIMAL(5,2) DEFAULT 0, -- in cm
    weight DECIMAL(5,2) DEFAULT 0, -- in kg
    gender TEXT DEFAULT 'other' CHECK (gender IN ('male', 'female', 'other')),
    activity_level TEXT DEFAULT 'moderate' CHECK (activity_level IN ('sedentary', 'light', 'moderate', 'active', 'very_active')),
    goal TEXT DEFAULT 'maintain' CHECK (goal IN ('lose', 'maintain', 'gain')),
    dietary_preferences JSONB DEFAULT '{"dietType": "balanced", "allergies": [], "restrictions": []}'::jsonb,
    daily_calorie_target INTEGER DEFAULT 2000,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Meals table
CREATE TABLE IF NOT EXISTS public.meals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    food_name TEXT NOT NULL,
    calories INTEGER NOT NULL DEFAULT 0,
    protein DECIMAL(6,2) DEFAULT 0,
    carbs DECIMAL(6,2) DEFAULT 0,
    fat DECIMAL(6,2) DEFAULT 0,
    meal_type TEXT NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
    barcode TEXT,
    serving_size DECIMAL(8,2),
    serving_unit TEXT DEFAULT 'g',
    logged_at TIMESTAMPTZ DEFAULT NOW()
);

-- Fitness data table
CREATE TABLE IF NOT EXISTS public.fitness_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    steps INTEGER DEFAULT 0,
    calories_burned INTEGER DEFAULT 0,
    active_minutes INTEGER DEFAULT 0,
    heart_rate_avg INTEGER,
    sleep_hours DECIMAL(4,2),
    source TEXT DEFAULT 'manual' CHECK (source IN ('apple_watch', 'fitbit', 'google_fit', 'manual')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, date, source)
);

-- Food preferences table
CREATE TABLE IF NOT EXISTS public.food_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    food_name TEXT NOT NULL,
    rating INTEGER DEFAULT 3 CHECK (rating >= 1 AND rating <= 5),
    is_favorite BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, food_name)
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_meals_user_id ON public.meals(user_id);
CREATE INDEX IF NOT EXISTS idx_meals_logged_at ON public.meals(logged_at);
CREATE INDEX IF NOT EXISTS idx_meals_user_date ON public.meals(user_id, logged_at);
CREATE INDEX IF NOT EXISTS idx_fitness_user_id ON public.fitness_data(user_id);
CREATE INDEX IF NOT EXISTS idx_fitness_date ON public.fitness_data(date);
CREATE INDEX IF NOT EXISTS idx_fitness_user_date ON public.fitness_data(user_id, date);
CREATE INDEX IF NOT EXISTS idx_food_prefs_user ON public.food_preferences(user_id);

-- Row Level Security (RLS) Policies
-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fitness_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.food_preferences ENABLE ROW LEVEL SECURITY;

-- Users: Users can only see and edit their own profile
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.users
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Meals: Users can only CRUD their own meals
CREATE POLICY "Users can view own meals" ON public.meals
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own meals" ON public.meals
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own meals" ON public.meals
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own meals" ON public.meals
    FOR DELETE USING (auth.uid() = user_id);

-- Fitness data: Users can only CRUD their own fitness data
CREATE POLICY "Users can view own fitness data" ON public.fitness_data
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own fitness data" ON public.fitness_data
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own fitness data" ON public.fitness_data
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own fitness data" ON public.fitness_data
    FOR DELETE USING (auth.uid() = user_id);

-- Food preferences: Users can only CRUD their own preferences
CREATE POLICY "Users can view own food preferences" ON public.food_preferences
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own food preferences" ON public.food_preferences
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own food preferences" ON public.food_preferences
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own food preferences" ON public.food_preferences
    FOR DELETE USING (auth.uid() = user_id);

-- Function to automatically create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1))
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create user profile on auth.users insert
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for users table updated_at
DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Grant permissions
GRANT ALL ON public.users TO authenticated;
GRANT ALL ON public.meals TO authenticated;
GRANT ALL ON public.fitness_data TO authenticated;
GRANT ALL ON public.food_preferences TO authenticated;
