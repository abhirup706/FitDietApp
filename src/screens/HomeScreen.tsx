import React, { useEffect } from 'react';
import { View, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { Text, Surface, FAB, Divider } from 'react-native-paper';
import { useUserStore } from '../store/userStore';
import { ProgressRing, MacroBar, MealCard, StatCard } from '../components';
import { calculateMacroTargets, calculateProgress } from '../utils/calculations';

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

  const progressColor =
    calorieProgress > 100 ? '#F44336' : calorieProgress > 80 ? '#FF9800' : '#4CAF50';

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Header */}
        <Surface style={styles.header} elevation={0}>
          <Text style={styles.greeting}>Hello, {user?.name || 'there'}!</Text>
          <Text style={styles.date}>
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
            })}
          </Text>
        </Surface>

        {/* Calorie Overview */}
        <Surface style={styles.calorieCard} elevation={2}>
          <View style={styles.calorieHeader}>
            <ProgressRing
              progress={calorieProgress}
              size={140}
              strokeWidth={14}
              color={progressColor}
              value={caloriesRemaining.toString()}
              label="kcal left"
            />
            <View style={styles.calorieStats}>
              <View style={styles.calorieStat}>
                <Text style={styles.calorieStatLabel}>Target</Text>
                <Text style={styles.calorieStatValue}>{calorieTarget}</Text>
              </View>
              <View style={styles.calorieStat}>
                <Text style={styles.calorieStatLabel}>Consumed</Text>
                <Text style={[styles.calorieStatValue, { color: '#F44336' }]}>
                  {caloriesConsumed}
                </Text>
              </View>
              <View style={styles.calorieStat}>
                <Text style={styles.calorieStatLabel}>Burned</Text>
                <Text style={[styles.calorieStatValue, { color: '#4CAF50' }]}>
                  +{caloriesBurned}
                </Text>
              </View>
            </View>
          </View>
        </Surface>

        {/* Macro Progress */}
        <Surface style={styles.macroCard} elevation={1}>
          <Text style={styles.sectionTitle}>Macros</Text>
          <MacroBar
            label="Protein"
            current={dailySummary?.proteinConsumed || 0}
            target={macroTargets.protein}
            color="#E91E63"
          />
          <MacroBar
            label="Carbs"
            current={dailySummary?.carbsConsumed || 0}
            target={macroTargets.carbs}
            color="#2196F3"
          />
          <MacroBar
            label="Fat"
            current={dailySummary?.fatConsumed || 0}
            target={macroTargets.fat}
            color="#FF9800"
          />
        </Surface>

        {/* Activity Stats */}
        <View style={styles.statsRow}>
          <StatCard
            title="Steps"
            value={todaysFitness?.steps?.toLocaleString() || '0'}
            icon="walk"
            color="#4CAF50"
          />
          <StatCard
            title="Active"
            value={`${todaysFitness?.activeMinutes || 0}m`}
            icon="run"
            color="#2196F3"
          />
          <StatCard
            title="Heart"
            value={todaysFitness?.heartRateAvg || '--'}
            subtitle="bpm"
            icon="heart-pulse"
            color="#F44336"
          />
        </View>

        {/* Today's Meals */}
        <View style={styles.mealsSection}>
          <Text style={styles.sectionTitle}>Today's Meals</Text>
          {todaysMeals.length === 0 ? (
            <Surface style={styles.emptyState} elevation={0}>
              <Text style={styles.emptyText}>No meals logged yet today</Text>
              <Text style={styles.emptySubtext}>
                Tap the + button to add your first meal
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
        label="Log Meal"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 10,
    backgroundColor: '#6200EE',
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  date: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  calorieCard: {
    margin: 16,
    marginTop: -20,
    padding: 20,
    borderRadius: 16,
    backgroundColor: '#fff',
  },
  calorieHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  calorieStats: {
    flex: 1,
    marginLeft: 20,
  },
  calorieStat: {
    marginVertical: 6,
  },
  calorieStatLabel: {
    fontSize: 12,
    color: '#666',
  },
  calorieStatValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  macroCard: {
    margin: 16,
    marginTop: 0,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#fff',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
    marginHorizontal: 16,
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  mealsSection: {
    marginTop: 8,
  },
  emptyState: {
    margin: 16,
    padding: 32,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
  },
  bottomSpacer: {
    height: 100,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#6200EE',
  },
});
