# FitDiet

A cross-platform fitness and diet tracking app built with React Native and Expo. Track your meals, sync health data from wearables, and get smart suggestions for healthier eating.

## Features

- **Diet Logging** - Search foods via Open Food Facts API or scan barcodes
- **Calorie & Macro Tracking** - Daily targets based on your goals (lose/maintain/gain weight)
- **Health Data Sync** - Connect Apple Health (iOS) or Google Health Connect (Android)
- **Smart Suggestions** - Get healthier food alternatives based on your preferences
- **Multiple Diet Types** - Support for balanced, keto, vegetarian, vegan, and more
- **Progress Dashboard** - Visual tracking with progress rings and charts

## Tech Stack

- **Frontend**: React Native + Expo
- **UI Library**: React Native Paper (Material Design 3)
- **State Management**: Zustand
- **Backend**: Supabase (PostgreSQL + Auth)
- **Food API**: Open Food Facts (free, open-source)
- **Navigation**: React Navigation

## Prerequisites

- Node.js 18+
- Expo CLI (`npm install -g expo-cli`)
- Xcode (for iOS) or Android Studio (for Android)
- Supabase account (free tier available)

## Setup

### 1. Clone and Install Dependencies

```bash
cd FitDietApp
npm install
```

### 2. Set Up Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the contents of `supabase/schema.sql`
3. Go to **Settings → API** and copy your project URL and anon key

### 3. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with your Supabase credentials:

```
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 4. Run the App

```bash
# Start development server
npx expo start

# Run on iOS Simulator
npx expo start --ios

# Run on Android Emulator
npx expo start --android

# Run on physical device
# Install Expo Go app and scan the QR code
```

## Project Structure

```
FitDietApp/
├── App.tsx                    # Entry point with navigation
├── app.json                   # Expo configuration
├── supabase/
│   └── schema.sql             # Database schema
└── src/
    ├── components/            # Reusable UI components
    │   ├── ProgressRing.tsx   # Circular progress indicator
    │   ├── MacroBar.tsx       # Macro nutrient bars
    │   ├── MealCard.tsx       # Meal display card
    │   ├── FoodCard.tsx       # Food item with nutrition
    │   └── StatCard.tsx       # Fitness stat card
    ├── screens/               # App screens
    │   ├── AuthScreen.tsx     # Login/signup
    │   ├── OnboardingScreen.tsx # Profile setup
    │   ├── HomeScreen.tsx     # Dashboard
    │   ├── DietLogScreen.tsx  # Food search + scanner
    │   ├── FitnessScreen.tsx  # Health data
    │   ├── SuggestionsScreen.tsx # Food suggestions
    │   └── ProfileScreen.tsx  # User settings
    ├── services/              # External integrations
    │   ├── supabaseClient.ts  # Database operations
    │   ├── healthService.ts   # HealthKit/Health Connect
    │   └── foodService.ts     # Open Food Facts API
    ├── store/
    │   └── userStore.ts       # Zustand state management
    ├── hooks/                 # Custom React hooks
    ├── types/                 # TypeScript definitions
    └── utils/
        └── calculations.ts    # BMR, TDEE, macro calculations
```

## Database Schema

| Table | Description |
|-------|-------------|
| `users` | User profiles (age, weight, height, goals, preferences) |
| `meals` | Logged meals with nutrition info |
| `fitness_data` | Daily fitness metrics (steps, calories burned, etc.) |
| `food_preferences` | User food ratings and favorites |

## Calorie Calculations

The app uses the **Mifflin-St Jeor equation** for BMR calculation:

- **Men**: BMR = 10W + 6.25H - 5A + 5
- **Women**: BMR = 10W + 6.25H - 5A - 161

Where W = weight (kg), H = height (cm), A = age (years)

TDEE is calculated by multiplying BMR by an activity factor:
- Sedentary: 1.2
- Light: 1.375
- Moderate: 1.55
- Active: 1.725
- Very Active: 1.9

## Supported Diet Types

| Diet Type | Protein | Carbs | Fat |
|-----------|---------|-------|-----|
| Balanced | 25% | 50% | 25% |
| Weight Loss | 35% | 40% | 25% |
| Muscle Gain | 35% | 45% | 20% |
| Keto | 25% | 5% | 70% |
| Low Carb | 30% | 20% | 50% |

## Health Data Integration

### iOS (Apple HealthKit)

Requires Apple Developer account and native build:

```bash
npx expo prebuild --platform ios
cd ios && pod install && cd ..
npx expo run:ios
```

### Android (Health Connect)

Requires Health Connect app installed on device:

```bash
npx expo prebuild --platform android
npx expo run:android
```

## API Reference

### Open Food Facts

The app uses [Open Food Facts API](https://world.openfoodfacts.org/) for food data:

- **Search**: `GET /api/v2/search?search_terms={query}`
- **Barcode**: `GET /api/v2/product/{barcode}.json`

No API key required. Please respect their rate limits.

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Acknowledgments

- [Open Food Facts](https://world.openfoodfacts.org/) for the free food database
- [Supabase](https://supabase.com/) for backend infrastructure
- [Expo](https://expo.dev/) for the development platform
