import { ActivityLevel, Goal, User } from '../types';

// Activity level multipliers for TDEE calculation
const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

// Goal adjustments (calories per day)
const GOAL_ADJUSTMENTS: Record<Goal, number> = {
  lose: -500, // ~0.5kg/week loss
  maintain: 0,
  gain: 300, // ~0.3kg/week gain
};

/**
 * Calculate Basal Metabolic Rate using Mifflin-St Jeor equation
 * More accurate than Harris-Benedict for most people
 */
export function calculateBMR(
  weight: number, // kg
  height: number, // cm
  age: number,
  gender: 'male' | 'female' | 'other'
): number {
  // Mifflin-St Jeor Equation
  // Men: BMR = 10W + 6.25H - 5A + 5
  // Women: BMR = 10W + 6.25H - 5A - 161
  const baseBMR = 10 * weight + 6.25 * height - 5 * age;

  switch (gender) {
    case 'male':
      return Math.round(baseBMR + 5);
    case 'female':
      return Math.round(baseBMR - 161);
    case 'other':
      // Use average of male and female calculations
      return Math.round(baseBMR - 78);
    default:
      return Math.round(baseBMR - 78);
  }
}

/**
 * Calculate Total Daily Energy Expenditure
 */
export function calculateTDEE(bmr: number, activityLevel: ActivityLevel): number {
  return Math.round(bmr * ACTIVITY_MULTIPLIERS[activityLevel]);
}

/**
 * Calculate daily calorie target based on user profile and goal
 */
export function calculateDailyCalorieTarget(
  weight: number,
  height: number,
  age: number,
  gender: 'male' | 'female' | 'other',
  activityLevel: ActivityLevel,
  goal: Goal
): number {
  const bmr = calculateBMR(weight, height, age, gender);
  const tdee = calculateTDEE(bmr, activityLevel);
  const target = tdee + GOAL_ADJUSTMENTS[goal];

  // Ensure minimum safe calorie intake
  const minCalories = gender === 'male' ? 1500 : 1200;
  return Math.max(target, minCalories);
}

/**
 * Calculate macro targets based on calorie target and diet type
 */
export function calculateMacroTargets(
  calorieTarget: number,
  dietType: string
): { protein: number; carbs: number; fat: number } {
  // Macro ratios by diet type (protein/carbs/fat percentages)
  const macroRatios: Record<string, [number, number, number]> = {
    balanced: [0.25, 0.50, 0.25],
    weight_loss: [0.35, 0.40, 0.25],
    muscle_gain: [0.35, 0.45, 0.20],
    vegetarian: [0.20, 0.55, 0.25],
    vegan: [0.18, 0.57, 0.25],
    keto: [0.25, 0.05, 0.70],
    low_carb: [0.30, 0.20, 0.50],
    custom: [0.25, 0.50, 0.25],
  };

  const [proteinRatio, carbsRatio, fatRatio] = macroRatios[dietType] || macroRatios.balanced;

  // Calories per gram: protein=4, carbs=4, fat=9
  return {
    protein: Math.round((calorieTarget * proteinRatio) / 4),
    carbs: Math.round((calorieTarget * carbsRatio) / 4),
    fat: Math.round((calorieTarget * fatRatio) / 9),
  };
}

/**
 * Calculate BMI (Body Mass Index)
 */
export function calculateBMI(weight: number, height: number): number {
  // BMI = weight(kg) / height(m)^2
  const heightInMeters = height / 100;
  return Math.round((weight / (heightInMeters * heightInMeters)) * 10) / 10;
}

/**
 * Get BMI category
 */
export function getBMICategory(bmi: number): string {
  if (bmi < 18.5) return 'Underweight';
  if (bmi < 25) return 'Normal weight';
  if (bmi < 30) return 'Overweight';
  return 'Obese';
}

/**
 * Calculate ideal weight range based on height (using BMI 18.5-24.9)
 */
export function calculateIdealWeightRange(height: number): { min: number; max: number } {
  const heightInMeters = height / 100;
  return {
    min: Math.round(18.5 * heightInMeters * heightInMeters),
    max: Math.round(24.9 * heightInMeters * heightInMeters),
  };
}

/**
 * Calculate remaining calories for the day
 */
export function calculateRemainingCalories(
  dailyTarget: number,
  consumed: number,
  burned: number
): number {
  // Remaining = Target - Consumed + Exercise Calories
  return dailyTarget - consumed + burned;
}

/**
 * Calculate progress percentage for daily goals
 */
export function calculateProgress(current: number, target: number): number {
  if (target <= 0) return 0;
  return Math.min(Math.round((current / target) * 100), 100);
}

/**
 * Format calories for display
 */
export function formatCalories(calories: number): string {
  if (calories >= 1000) {
    return `${(calories / 1000).toFixed(1)}k`;
  }
  return calories.toString();
}

/**
 * Get activity level description
 */
export function getActivityLevelDescription(level: ActivityLevel): string {
  const descriptions: Record<ActivityLevel, string> = {
    sedentary: 'Little or no exercise, desk job',
    light: 'Light exercise 1-3 days/week',
    moderate: 'Moderate exercise 3-5 days/week',
    active: 'Hard exercise 6-7 days/week',
    very_active: 'Very hard exercise, physical job',
  };
  return descriptions[level];
}

/**
 * Calculate streak days
 */
export function calculateStreak(dates: string[]): number {
  if (dates.length === 0) return 0;

  const sortedDates = [...dates].sort().reverse();
  const today = new Date().toISOString().split('T')[0];

  // Check if the most recent date is today or yesterday
  const mostRecent = sortedDates[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  if (mostRecent !== today && mostRecent !== yesterday) {
    return 0;
  }

  let streak = 1;
  for (let i = 1; i < sortedDates.length; i++) {
    const currentDate = new Date(sortedDates[i - 1]);
    const previousDate = new Date(sortedDates[i]);
    const diffDays = Math.floor(
      (currentDate.getTime() - previousDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffDays === 1) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

/**
 * Get user's full calorie breakdown
 */
export function getUserCalorieBreakdown(user: Partial<User>): {
  bmr: number;
  tdee: number;
  target: number;
  macros: { protein: number; carbs: number; fat: number };
} {
  const bmr = calculateBMR(
    user.weight || 70,
    user.height || 170,
    user.age || 30,
    user.gender || 'other'
  );

  const tdee = calculateTDEE(bmr, user.activityLevel || 'moderate');

  const target = calculateDailyCalorieTarget(
    user.weight || 70,
    user.height || 170,
    user.age || 30,
    user.gender || 'other',
    user.activityLevel || 'moderate',
    user.goal || 'maintain'
  );

  const macros = calculateMacroTargets(
    target,
    user.dietaryPreferences?.dietType || 'balanced'
  );

  return { bmr, tdee, target, macros };
}
