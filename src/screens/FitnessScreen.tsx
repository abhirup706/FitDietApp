import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Platform, TouchableOpacity } from 'react-native';
import {
  Text,
  Surface,
  Button,
  IconButton,
  Divider,
  ActivityIndicator,
  Snackbar,
} from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { useUserStore } from '../store/userStore';
import { healthService } from '../services/healthService';
import { ProgressRing } from '../components';
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
        <LinearGradient
          colors={['#667eea', '#764ba2']}
          style={styles.loadingGradient}
        >
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.loadingText}>Connecting to health services...</Text>
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <LinearGradient
          colors={['#667eea', '#764ba2']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.headerTitle}>Fitness</Text>
              <Text style={styles.headerSubtitle}>Track your activity</Text>
            </View>
            <TouchableOpacity
              onPress={handleSyncHealth}
              disabled={isSyncing}
              style={styles.syncButton}
            >
              <View style={styles.syncButtonInner}>
                {isSyncing ? (
                  <ActivityIndicator size="small" color="#667eea" />
                ) : (
                  <IconButton icon="sync" iconColor="#667eea" size={24} />
                )}
              </View>
            </TouchableOpacity>
          </View>

          {/* Health Source */}
          <Surface style={styles.sourceCard} elevation={4}>
            <View style={styles.sourceRow}>
              <View style={styles.sourceIconContainer}>
                <IconButton
                  icon={Platform.OS === 'ios' ? 'apple' : 'google'}
                  size={28}
                  iconColor="#fff"
                />
              </View>
              <View style={styles.sourceInfo}>
                <Text style={styles.sourceTitle}>
                  {Platform.OS === 'ios' ? 'Apple Health' : 'Google Fit'}
                </Text>
                <Text style={[
                  styles.sourceStatus,
                  { color: healthPermissions.length > 0 ? '#4CAF50' : '#ff6b6b' }
                ]}>
                  {healthPermissions.length > 0 ? 'Connected' : 'Not connected'}
                </Text>
              </View>
              {todaysFitness && (
                <Text style={styles.lastSync}>
                  Updated {new Date(todaysFitness.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </Text>
              )}
            </View>
          </Surface>
        </LinearGradient>

        {/* Progress Rings */}
        <View style={styles.ringsContainer}>
          <Surface style={styles.ringCard} elevation={2}>
            <ProgressRing
              progress={stepsProgress}
              size={120}
              strokeWidth={12}
              color="#4CAF50"
              value={steps.toLocaleString()}
              label="steps"
            />
            <View style={styles.ringGoal}>
              <Text style={styles.ringGoalText}>Goal: {(stepsGoal / 1000)}k</Text>
            </View>
          </Surface>
          <Surface style={styles.ringCard} elevation={2}>
            <ProgressRing
              progress={activeProgress}
              size={120}
              strokeWidth={12}
              color="#2196F3"
              value={`${activeMinutes}`}
              label="active min"
            />
            <View style={styles.ringGoal}>
              <Text style={styles.ringGoalText}>Goal: {activeGoal} min</Text>
            </View>
          </Surface>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <Surface style={styles.statCard} elevation={2}>
            <LinearGradient
              colors={['#ff6b6b', '#ff8e8e']}
              style={styles.statIconBg}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <IconButton icon="fire" iconColor="#fff" size={24} />
            </LinearGradient>
            <Text style={styles.statValue}>{caloriesBurned}</Text>
            <Text style={styles.statLabel}>Calories Burned</Text>
          </Surface>

          <Surface style={styles.statCard} elevation={2}>
            <LinearGradient
              colors={['#e91e63', '#f48fb1']}
              style={styles.statIconBg}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <IconButton icon="heart-pulse" iconColor="#fff" size={24} />
            </LinearGradient>
            <Text style={styles.statValue}>{todaysFitness?.heartRateAvg || '--'}</Text>
            <Text style={styles.statLabel}>Avg Heart Rate</Text>
          </Surface>

          <Surface style={styles.statCard} elevation={2}>
            <LinearGradient
              colors={['#9c27b0', '#ce93d8']}
              style={styles.statIconBg}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <IconButton icon="sleep" iconColor="#fff" size={24} />
            </LinearGradient>
            <Text style={styles.statValue}>{todaysFitness?.sleepHours?.toFixed(1) || '--'}</Text>
            <Text style={styles.statLabel}>Hours Sleep</Text>
          </Surface>

          <Surface style={styles.statCard} elevation={2}>
            <LinearGradient
              colors={['#00bcd4', '#80deea']}
              style={styles.statIconBg}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <IconButton icon="map-marker-distance" iconColor="#fff" size={24} />
            </LinearGradient>
            <Text style={styles.statValue}>{(steps * 0.0008).toFixed(1)}</Text>
            <Text style={styles.statLabel}>Km (est.)</Text>
          </Surface>
        </View>

        {/* Activity Breakdown */}
        <Surface style={styles.breakdownCard} elevation={2}>
          <Text style={styles.cardTitle}>Today's Activity</Text>
          <View style={styles.breakdownContent}>
            <View style={styles.breakdownItem}>
              <View style={styles.breakdownIconContainer}>
                <Text style={styles.breakdownIcon}>🌅</Text>
              </View>
              <View style={styles.breakdownInfo}>
                <Text style={styles.breakdownLabel}>Morning</Text>
                <Text style={styles.breakdownTime}>6am - 12pm</Text>
              </View>
              <Text style={styles.breakdownValue}>
                {Math.floor(steps * 0.35).toLocaleString()} steps
              </Text>
            </View>
            <Divider style={styles.divider} />
            <View style={styles.breakdownItem}>
              <View style={styles.breakdownIconContainer}>
                <Text style={styles.breakdownIcon}>☀️</Text>
              </View>
              <View style={styles.breakdownInfo}>
                <Text style={styles.breakdownLabel}>Afternoon</Text>
                <Text style={styles.breakdownTime}>12pm - 6pm</Text>
              </View>
              <Text style={styles.breakdownValue}>
                {Math.floor(steps * 0.45).toLocaleString()} steps
              </Text>
            </View>
            <Divider style={styles.divider} />
            <View style={styles.breakdownItem}>
              <View style={styles.breakdownIconContainer}>
                <Text style={styles.breakdownIcon}>🌙</Text>
              </View>
              <View style={styles.breakdownInfo}>
                <Text style={styles.breakdownLabel}>Evening</Text>
                <Text style={styles.breakdownTime}>6pm - 12am</Text>
              </View>
              <Text style={styles.breakdownValue}>
                {Math.floor(steps * 0.2).toLocaleString()} steps
              </Text>
            </View>
          </View>
        </Surface>

        {/* Weekly Summary */}
        <Surface style={styles.weeklyCard} elevation={2}>
          <Text style={styles.cardTitle}>This Week</Text>
          <View style={styles.weekDays}>
            {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, index) => {
              const isToday = index === (new Date().getDay() + 6) % 7;
              const isFuture = index > (new Date().getDay() + 6) % 7;
              const completed = !isFuture && Math.random() > 0.3;
              return (
                <View key={index} style={styles.weekDay}>
                  <Text style={[styles.dayLabel, isToday && styles.todayLabel]}>
                    {day}
                  </Text>
                  <LinearGradient
                    colors={
                      isToday
                        ? ['#667eea', '#764ba2']
                        : isFuture
                        ? ['#e0e0e0', '#e0e0e0']
                        : completed
                        ? ['#4CAF50', '#81c784']
                        : ['#ffcdd2', '#ffcdd2']
                    }
                    style={styles.dayIndicator}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    {isToday && (
                      <IconButton icon="check" iconColor="#fff" size={16} />
                    )}
                    {!isToday && !isFuture && completed && (
                      <IconButton icon="check" iconColor="#fff" size={16} />
                    )}
                  </LinearGradient>
                </View>
              );
            })}
          </View>
          <Divider style={styles.divider} />
          <View style={styles.weekStats}>
            <View style={styles.weekStat}>
              <Text style={styles.weekStatValue}>45,230</Text>
              <Text style={styles.weekStatLabel}>Total Steps</Text>
            </View>
            <View style={styles.weekStatDivider} />
            <View style={styles.weekStat}>
              <Text style={styles.weekStatValue}>1,890</Text>
              <Text style={styles.weekStatLabel}>Cal Burned</Text>
            </View>
            <View style={styles.weekStatDivider} />
            <View style={styles.weekStat}>
              <Text style={styles.weekStatValue}>3h 45m</Text>
              <Text style={styles.weekStatLabel}>Active</Text>
            </View>
          </View>
        </Surface>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
        style={styles.snackbar}
      >
        {snackbarMessage}
      </Snackbar>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
  },
  loadingGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    color: '#fff',
    fontSize: 16,
  },
  header: {
    paddingTop: 16,
    paddingBottom: 80,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  syncButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  syncButtonInner: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sourceCard: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 16,
    padding: 16,
  },
  sourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sourceIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sourceInfo: {
    flex: 1,
    marginLeft: 12,
  },
  sourceTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  sourceStatus: {
    fontSize: 13,
    marginTop: 2,
  },
  lastSync: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
  },
  ringsContainer: {
    flexDirection: 'row',
    marginTop: -50,
    paddingHorizontal: 16,
    gap: 12,
  },
  ringCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
  },
  ringGoal: {
    marginTop: 12,
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  ringGoalText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 12,
  },
  statCard: {
    width: '47%',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
  },
  statIconBg: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a2e',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  breakdownCard: {
    margin: 16,
    marginTop: 0,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a2e',
    marginBottom: 16,
  },
  breakdownContent: {},
  breakdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  breakdownIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  breakdownIcon: {
    fontSize: 20,
  },
  breakdownInfo: {
    flex: 1,
    marginLeft: 12,
  },
  breakdownLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a2e',
  },
  breakdownTime: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  breakdownValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#667eea',
  },
  divider: {
    backgroundColor: '#f0f0f0',
  },
  weeklyCard: {
    margin: 16,
    marginTop: 0,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
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
    fontWeight: '500',
  },
  todayLabel: {
    color: '#667eea',
    fontWeight: 'bold',
  },
  dayIndicator: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  weekStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 16,
  },
  weekStat: {
    alignItems: 'center',
    flex: 1,
  },
  weekStatDivider: {
    width: 1,
    backgroundColor: '#f0f0f0',
  },
  weekStatValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a2e',
  },
  weekStatLabel: {
    fontSize: 11,
    color: '#666',
    marginTop: 4,
  },
  bottomSpacer: {
    height: 20,
  },
  snackbar: {
    backgroundColor: '#1a1a2e',
  },
});
