import React, { useEffect } from 'react';
import { View, ScrollView, StyleSheet, RefreshControl, Dimensions } from 'react-native';
import { Text, Surface, FAB, IconButton, Card } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { useUserStore } from '../store/userStore';
import { ProgressRing, MacroBar, MealCard, StatCard } from '../components';
import { calculateMacroTargets, calculateProgress } from '../utils/calculations';

const { width } = Dimensions.get('window');

export function HomeScreen({ navigation }: any) {
  const {
    user,
    dailySummary,
    todaysMeals,
    todaysFitness,
    loadTodaysMeals,
    loadTodaysFitness,
    removeMeal,
  } = useUserStore();

  const [refreshing, setRefreshing] = React.useState(false);

  useEffect(() => {
    loadTodaysMeals();
    loadTodaysFitness();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadTodaysMeals(), loadTodaysFitness()]);
    setRefreshing(false);
  };

  const calorieTarget = user?.dailyCalorieTarget || 2000;
  const caloriesConsumed = dailySummary?.caloriesConsumed || 0;
  const caloriesBurned = dailySummary?.caloriesBurned || 0;
  const caloriesRemaining = calorieTarget - caloriesConsumed + caloriesBurned;

  const macroTargets = calculateMacroTargets(
    calorieTarget,
    user?.dietaryPreferences?.dietType || 'balanced'
  );

  const calorieProgress = calculateProgress(caloriesConsumed, calorieTarget);

  const getProgressColor = () => {
    if (calorieProgress > 100) return ['#ff6b6b', '#ee5a5a'];
    if (calorieProgress > 80) return ['#ffa502', '#ff7f50'];
    return ['#2ed573', '#7bed9f'];
  };

  const today = new Date();
  const greeting = () => {
    const hour = today.getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Header with Gradient */}
        <LinearGradient
          colors={['#667eea', '#764ba2']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.greeting}>{greeting()},</Text>
              <Text style={styles.userName}>{user?.name || 'there'} 👋</Text>
            </View>
            <View style={styles.dateContainer}>
              <Text style={styles.dateDay}>{today.getDate()}</Text>
              <Text style={styles.dateMonth}>
                {today.toLocaleDateString('en-US', { month: 'short' })}
              </Text>
            </View>
          </View>
        </LinearGradient>

        {/* Main Calorie Card */}
        <Surface style={styles.calorieCard} elevation={4}>
          <View style={styles.calorieContent}>
            <View style={styles.calorieRing}>
              <ProgressRing
                progress={calorieProgress}
                size={140}
                strokeWidth={12}
                color={calorieProgress > 100 ? '#ff6b6b' : '#667eea'}
                value={caloriesRemaining.toString()}
                label="kcal remaining"
              />
            </View>
            <View style={styles.calorieDetails}>
              <View style={styles.calorieRow}>
                <View style={styles.calorieDot} />
                <View>
                  <Text style={styles.calorieLabel}>Daily Goal</Text>
                  <Text style={styles.calorieValue}>{calorieTarget} kcal</Text>
                </View>
              </View>
              <View style={styles.calorieRow}>
                <View style={[styles.calorieDot, { backgroundColor: '#ff6b6b' }]} />
                <View>
                  <Text style={styles.calorieLabel}>Consumed</Text>
                  <Text style={styles.calorieValue}>{caloriesConsumed} kcal</Text>
                </View>
              </View>
              <View style={styles.calorieRow}>
                <View style={[styles.calorieDot, { backgroundColor: '#2ed573' }]} />
                <View>
                  <Text style={styles.calorieLabel}>Burned</Text>
                  <Text style={styles.calorieValue}>+{caloriesBurned} kcal</Text>
                </View>
              </View>
            </View>
          </View>
        </Surface>

        {/* Quick Stats */}
        <View style={styles.quickStats}>
          <Surface style={styles.quickStatCard} elevation={2}>
            <IconButton icon="walk" size={28} iconColor="#667eea" style={styles.statIcon} />
            <Text style={styles.quickStatValue}>
              {(todaysFitness?.steps || 0).toLocaleString()}
            </Text>
            <Text style={styles.quickStatLabel}>Steps</Text>
          </Surface>
          <Surface style={styles.quickStatCard} elevation={2}>
            <IconButton icon="fire" size={28} iconColor="#ff6b6b" style={styles.statIcon} />
            <Text style={styles.quickStatValue}>{caloriesBurned}</Text>
            <Text style={styles.quickStatLabel}>Burned</Text>
          </Surface>
          <Surface style={styles.quickStatCard} elevation={2}>
            <IconButton icon="water" size={28} iconColor="#3498db" style={styles.statIcon} />
            <Text style={styles.quickStatValue}>8</Text>
            <Text style={styles.quickStatLabel}>Glasses</Text>
          </Surface>
        </View>

        {/* Macros Card */}
        <Surface style={styles.macroCard} elevation={2}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Macros</Text>
            <Text style={styles.sectionSubtitle}>Daily Progress</Text>
          </View>
          <MacroBar
            label="Protein"
            current={dailySummary?.proteinConsumed || 0}
            target={macroTargets.protein}
            color="#e91e63"
          />
          <MacroBar
            label="Carbs"
            current={dailySummary?.carbsConsumed || 0}
            target={macroTargets.carbs}
            color="#667eea"
          />
          <MacroBar
            label="Fat"
            current={dailySummary?.fatConsumed || 0}
            target={macroTargets.fat}
            color="#ff9800"
          />
        </Surface>

        {/* Today's Meals */}
        <View style={styles.mealsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Today's Meals</Text>
            <Text style={styles.mealCount}>{todaysMeals.length} items</Text>
          </View>
          {todaysMeals.length === 0 ? (
            <Surface style={styles.emptyState} elevation={1}>
              <Text style={styles.emptyIcon}>🍽️</Text>
              <Text style={styles.emptyTitle}>No meals logged yet</Text>
              <Text style={styles.emptySubtext}>
                Start tracking your nutrition by adding your first meal
              </Text>
            </Surface>
          ) : (
            todaysMeals.map((meal) => (
              <MealCard key={meal.id} meal={meal} onDelete={removeMeal} />
            ))
          )}
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => navigation.navigate('DietLog')}
        color="#fff"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingTop: 20,
    paddingBottom: 60,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
  },
  userName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 4,
  },
  dateContainer: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    minWidth: 56,
  },
  dateDay: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  dateMonth: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    textTransform: 'uppercase',
  },
  calorieCard: {
    marginHorizontal: 16,
    marginTop: -40,
    padding: 20,
    borderRadius: 24,
    backgroundColor: '#fff',
  },
  calorieContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  calorieRing: {
    marginRight: 20,
  },
  calorieDetails: {
    flex: 1,
  },
  calorieRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  calorieDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#667eea',
    marginRight: 12,
  },
  calorieLabel: {
    fontSize: 12,
    color: '#666',
  },
  calorieValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a2e',
  },
  quickStats: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginTop: 20,
    gap: 12,
  },
  quickStatCard: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
    backgroundColor: '#fff',
  },
  statIcon: {
    margin: 0,
  },
  quickStatValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a2e',
    marginTop: 4,
  },
  quickStatLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  macroCard: {
    margin: 16,
    padding: 20,
    borderRadius: 20,
    backgroundColor: '#fff',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a2e',
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  mealCount: {
    fontSize: 14,
    color: '#667eea',
    fontWeight: '600',
  },
  mealsSection: {
    marginTop: 8,
  },
  emptyState: {
    margin: 16,
    padding: 40,
    borderRadius: 20,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a2e',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
  bottomSpacer: {
    height: 100,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    backgroundColor: '#667eea',
    borderRadius: 16,
  },
});
