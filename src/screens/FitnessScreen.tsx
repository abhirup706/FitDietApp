import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Platform } from 'react-native';
import {
  Text,
  Surface,
  Button,
  Card,
  IconButton,
  Divider,
  ActivityIndicator,
  Snackbar,
} from 'react-native-paper';
import { useUserStore } from '../store/userStore';
import { healthService } from '../services/healthService';
import { StatCard, ProgressRing } from '../components';
import { calculateProgress } from '../utils/calculations';

export function FitnessScreen() {
  const { user, todaysFitness, syncFitnessData, loadTodaysFitness } = useUserStore();

  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [healthPermissions, setHealthPermissions] = useState<string[]>([]);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  useEffect(() => {
    initializeHealth();
  }, []);

  const initializeHealth = async () => {
    setIsLoading(true);
    const initialized = await healthService.initialize();
    if (initialized) {
      setHealthPermissions(healthService.getPermissions());
      await loadTodaysFitness();
    }
    setIsLoading(false);
  };

  const handleSyncHealth = async () => {
    setIsSyncing(true);
    try {
      const data = await healthService.getHealthData(new Date());
      if (data && user) {
        const fitnessData = healthService.formatForStorage(user.id, new Date(), data);
        const { error } = await syncFitnessData(fitnessData);
        if (error) {
          showSnackbar('Failed to sync health data');
        } else {
          showSnackbar('Health data synced successfully!');
        }
      }
    } catch (error) {
      showSnackbar('Error syncing health data');
    }
    setIsSyncing(false);
  };

  const showSnackbar = (message: string) => {
    setSnackbarMessage(message);
    setSnackbarVisible(true);
  };

  const steps = todaysFitness?.steps || 0;
  const stepsGoal = 10000;
  const stepsProgress = calculateProgress(steps, stepsGoal);

  const activeMinutes = todaysFitness?.activeMinutes || 0;
  const activeGoal = 30;
  const activeProgress = calculateProgress(activeMinutes, activeGoal);

  const caloriesBurned = todaysFitness?.caloriesBurned || 0;

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Connecting to health services...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Health Source Info */}
        <Surface style={styles.sourceCard} elevation={1}>
          <View style={styles.sourceHeader}>
            <IconButton
              icon={Platform.OS === 'ios' ? 'apple' : 'google-fit'}
              size={24}
              iconColor="#6200EE"
            />
            <View style={styles.sourceInfo}>
              <Text style={styles.sourceTitle}>
                {Platform.OS === 'ios' ? 'Apple Health' : 'Google Fit'}
              </Text>
              <Text style={styles.sourceStatus}>
                {healthPermissions.length > 0 ? 'Connected' : 'Not connected'}
              </Text>
            </View>
            <Button
              mode="contained"
              onPress={handleSyncHealth}
              loading={isSyncing}
              disabled={isSyncing}
              compact
            >
              Sync
            </Button>
          </View>
          {todaysFitness && (
            <Text style={styles.lastSync}>
              Last synced: {new Date(todaysFitness.date).toLocaleDateString()}
            </Text>
          )}
        </Surface>

        {/* Progress Rings */}
        <View style={styles.ringsContainer}>
          <View style={styles.ringItem}>
            <ProgressRing
              progress={stepsProgress}
              size={130}
              strokeWidth={14}
              color="#4CAF50"
              value={steps.toLocaleString()}
              label={`/ ${(stepsGoal / 1000).toFixed(0)}k steps`}
            />
          </View>
          <View style={styles.ringItem}>
            <ProgressRing
              progress={activeProgress}
              size={130}
              strokeWidth={14}
              color="#2196F3"
              value={`${activeMinutes}`}
              label={`/ ${activeGoal} min`}
            />
          </View>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsRow}>
          <StatCard
            title="Calories Burned"
            value={caloriesBurned}
            subtitle="kcal"
            icon="fire"
            color="#FF5722"
          />
          <StatCard
            title="Avg Heart Rate"
            value={todaysFitness?.heartRateAvg || '--'}
            subtitle="bpm"
            icon="heart-pulse"
            color="#F44336"
          />
        </View>

        <View style={styles.statsRow}>
          <StatCard
            title="Sleep"
            value={todaysFitness?.sleepHours?.toFixed(1) || '--'}
            subtitle="hours"
            icon="sleep"
            color="#9C27B0"
          />
          <StatCard
            title="Distance"
            value={((steps * 0.0008).toFixed(1))}
            subtitle="km (est.)"
            icon="map-marker-distance"
            color="#00BCD4"
          />
        </View>

        {/* Activity Breakdown */}
        <Card style={styles.breakdownCard}>
          <Card.Title title="Today's Activity" />
          <Card.Content>
            <View style={styles.breakdownItem}>
              <Text style={styles.breakdownLabel}>Morning (6am-12pm)</Text>
              <Text style={styles.breakdownValue}>
                {Math.floor(steps * 0.35).toLocaleString()} steps
              </Text>
            </View>
            <Divider style={styles.divider} />
            <View style={styles.breakdownItem}>
              <Text style={styles.breakdownLabel}>Afternoon (12pm-6pm)</Text>
              <Text style={styles.breakdownValue}>
                {Math.floor(steps * 0.45).toLocaleString()} steps
              </Text>
            </View>
            <Divider style={styles.divider} />
            <View style={styles.breakdownItem}>
              <Text style={styles.breakdownLabel}>Evening (6pm-12am)</Text>
              <Text style={styles.breakdownValue}>
                {Math.floor(steps * 0.2).toLocaleString()} steps
              </Text>
            </View>
          </Card.Content>
        </Card>

        {/* Weekly Summary */}
        <Card style={styles.weeklyCard}>
          <Card.Title title="This Week" />
          <Card.Content>
            <View style={styles.weekDays}>
              {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, index) => {
                const isToday = index === new Date().getDay() - 1;
                const isFuture = index > new Date().getDay() - 1;
                return (
                  <View key={index} style={styles.weekDay}>
                    <Text style={[styles.dayLabel, isToday && styles.todayLabel]}>
                      {day}
                    </Text>
                    <View
                      style={[
                        styles.dayIndicator,
                        isToday && styles.todayIndicator,
                        isFuture && styles.futureIndicator,
                      ]}
                    />
                  </View>
                );
              })}
            </View>
            <View style={styles.weekStats}>
              <View style={styles.weekStat}>
                <Text style={styles.weekStatValue}>45,230</Text>
                <Text style={styles.weekStatLabel}>Total Steps</Text>
              </View>
              <View style={styles.weekStat}>
                <Text style={styles.weekStatValue}>1,890</Text>
                <Text style={styles.weekStatLabel}>Calories Burned</Text>
              </View>
              <View style={styles.weekStat}>
                <Text style={styles.weekStatValue}>3h 45m</Text>
                <Text style={styles.weekStatLabel}>Active Time</Text>
              </View>
            </View>
          </Card.Content>
        </Card>
      </ScrollView>

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
      >
        {snackbarMessage}
      </Snackbar>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    color: '#666',
  },
  sourceCard: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#fff',
    marginBottom: 16,
  },
  sourceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sourceInfo: {
    flex: 1,
    marginLeft: 8,
  },
  sourceTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  sourceStatus: {
    fontSize: 12,
    color: '#4CAF50',
  },
  lastSync: {
    fontSize: 12,
    color: '#999',
    marginTop: 8,
    marginLeft: 48,
  },
  ringsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 16,
  },
  ringItem: {
    alignItems: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  breakdownCard: {
    marginVertical: 8,
  },
  breakdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  breakdownLabel: {
    color: '#666',
  },
  breakdownValue: {
    fontWeight: '600',
  },
  divider: {
    marginVertical: 4,
  },
  weeklyCard: {
    marginVertical: 8,
  },
  weekDays: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  weekDay: {
    alignItems: 'center',
  },
  dayLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  todayLabel: {
    color: '#6200EE',
    fontWeight: 'bold',
  },
  dayIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#4CAF50',
  },
  todayIndicator: {
    backgroundColor: '#6200EE',
  },
  futureIndicator: {
    backgroundColor: '#E0E0E0',
  },
  weekStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  weekStat: {
    alignItems: 'center',
  },
  weekStatValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  weekStatLabel: {
    fontSize: 11,
    color: '#666',
    marginTop: 4,
  },
});
