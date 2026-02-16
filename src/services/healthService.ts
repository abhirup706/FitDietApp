import { Platform } from 'react-native';
import { FitnessData, HealthSource } from '../types';

// Health data interface for cross-platform compatibility
export interface HealthDataPoint {
  steps: number;
  caloriesBurned: number;
  activeMinutes: number;
  heartRateAvg?: number;
  sleepHours?: number;
}

// Platform-specific health service
class HealthService {
  private isInitialized = false;
  private permissions: string[] = [];

  // Initialize health service based on platform
  async initialize(): Promise<boolean> {
    if (this.isInitialized) return true;

    try {
      if (Platform.OS === 'ios') {
        return await this.initializeAppleHealth();
      } else if (Platform.OS === 'android') {
        return await this.initializeGoogleHealthConnect();
      }
      return false;
    } catch (error) {
      console.error('Failed to initialize health service:', error);
      return false;
    }
  }

  // iOS: Apple HealthKit initialization
  private async initializeAppleHealth(): Promise<boolean> {
    try {
      // Note: react-native-health must be installed and configured
      // This is a placeholder - actual implementation requires native module
      console.log('Initializing Apple HealthKit...');

      // In a real implementation:
      // import AppleHealthKit from 'react-native-health';
      // const permissions = {
      //   permissions: {
      //     read: [
      //       AppleHealthKit.Constants.Permissions.Steps,
      //       AppleHealthKit.Constants.Permissions.ActiveEnergyBurned,
      //       AppleHealthKit.Constants.Permissions.HeartRate,
      //       AppleHealthKit.Constants.Permissions.SleepAnalysis,
      //     ],
      //   },
      // };
      // await AppleHealthKit.initHealthKit(permissions);

      this.isInitialized = true;
      this.permissions = ['steps', 'calories', 'heartRate', 'sleep'];
      return true;
    } catch (error) {
      console.error('Apple HealthKit initialization failed:', error);
      return false;
    }
  }

  // Android: Google Health Connect initialization
  private async initializeGoogleHealthConnect(): Promise<boolean> {
    try {
      // Note: react-native-health-connect must be installed and configured
      console.log('Initializing Google Health Connect...');

      // In a real implementation:
      // import { initialize, requestPermission } from 'react-native-health-connect';
      // await initialize();
      // const granted = await requestPermission([
      //   { accessType: 'read', recordType: 'Steps' },
      //   { accessType: 'read', recordType: 'ActiveCaloriesBurned' },
      //   { accessType: 'read', recordType: 'HeartRate' },
      //   { accessType: 'read', recordType: 'SleepSession' },
      // ]);

      this.isInitialized = true;
      this.permissions = ['steps', 'calories', 'heartRate', 'sleep'];
      return true;
    } catch (error) {
      console.error('Google Health Connect initialization failed:', error);
      return false;
    }
  }

  // Check if health service is available
  isAvailable(): boolean {
    return Platform.OS === 'ios' || Platform.OS === 'android';
  }

  // Get current permissions status
  getPermissions(): string[] {
    return this.permissions;
  }

  // Fetch health data for a specific date
  async getHealthData(date: Date): Promise<HealthDataPoint | null> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      if (Platform.OS === 'ios') {
        return await this.getAppleHealthData(date);
      } else if (Platform.OS === 'android') {
        return await this.getGoogleHealthData(date);
      }
      return null;
    } catch (error) {
      console.error('Failed to fetch health data:', error);
      return null;
    }
  }

  // iOS: Fetch data from Apple HealthKit
  private async getAppleHealthData(date: Date): Promise<HealthDataPoint> {
    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);

    // Placeholder - actual implementation would use react-native-health
    // const steps = await AppleHealthKit.getStepCount({ startDate, endDate });
    // const calories = await AppleHealthKit.getActiveEnergyBurned({ startDate, endDate });
    // etc.

    // Mock data for development
    return this.getMockHealthData();
  }

  // Android: Fetch data from Google Health Connect
  private async getGoogleHealthData(date: Date): Promise<HealthDataPoint> {
    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);

    // Placeholder - actual implementation would use react-native-health-connect
    // const steps = await readRecords('Steps', { timeRangeFilter: { ... } });
    // etc.

    // Mock data for development
    return this.getMockHealthData();
  }

  // Mock data for development/testing
  private getMockHealthData(): HealthDataPoint {
    return {
      steps: Math.floor(Math.random() * 5000) + 3000,
      caloriesBurned: Math.floor(Math.random() * 300) + 200,
      activeMinutes: Math.floor(Math.random() * 45) + 15,
      heartRateAvg: Math.floor(Math.random() * 20) + 65,
      sleepHours: Math.floor(Math.random() * 2) + 6,
    };
  }

  // Get health data for a date range
  async getHealthDataRange(startDate: Date, endDate: Date): Promise<HealthDataPoint[]> {
    const data: HealthDataPoint[] = [];
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const dayData = await this.getHealthData(currentDate);
      if (dayData) {
        data.push(dayData);
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return data;
  }

  // Convert health data to FitnessData format for storage
  formatForStorage(
    userId: string,
    date: Date,
    data: HealthDataPoint
  ): Omit<FitnessData, 'id'> {
    const source: HealthSource = Platform.OS === 'ios' ? 'apple_watch' : 'google_fit';

    return {
      userId,
      date: date.toISOString().split('T')[0],
      steps: data.steps,
      caloriesBurned: data.caloriesBurned,
      activeMinutes: data.activeMinutes,
      heartRateAvg: data.heartRateAvg,
      sleepHours: data.sleepHours,
      source,
    };
  }

  // Calculate estimated calories burned based on activity
  estimateCaloriesBurn(steps: number, weight: number, activeMinutes: number): number {
    // Simple estimation: ~0.04 calories per step for average person
    // Adjust based on weight
    const weightFactor = weight / 70; // normalized to 70kg
    const stepsCalories = steps * 0.04 * weightFactor;

    // Add active minutes (roughly 5 cal/min for moderate activity)
    const activeCalories = activeMinutes * 5 * weightFactor;

    return Math.round(stepsCalories + activeCalories);
  }
}

export const healthService = new HealthService();
