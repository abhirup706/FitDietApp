import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, FlatList } from 'react-native';
import {
  Text,
  Surface,
  SegmentedButtons,
  Chip,
  ActivityIndicator,
  Card,
  Button,
  IconButton,
} from 'react-native-paper';
import { useUserStore } from '../store/userStore';
import { foodService } from '../services/foodService';
import { FoodCard } from '../components';
import { FoodSuggestion, MealType, Meal } from '../types';

type SuggestionTab = 'alternatives' | 'meals';

export function SuggestionsScreen() {
  const { user, todaysMeals, dailySummary, addMeal } = useUserStore();

  const [activeTab, setActiveTab] = useState<SuggestionTab>('meals');
  const [selectedMealType, setSelectedMealType] = useState<MealType>('lunch');
  const [suggestions, setSuggestions] = useState<FoodSuggestion[]>([]);
  const [alternatives, setAlternatives] = useState<FoodSuggestion[]>([]);
  const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (activeTab === 'meals') {
      loadMealSuggestions();
    }
  }, [activeTab, selectedMealType, user?.dietaryPreferences]);

  const loadMealSuggestions = async () => {
    if (!user?.dietaryPreferences) return;

    setIsLoading(true);
    const remainingCalories = dailySummary?.caloriesRemaining || user.dailyCalorieTarget;
    const results = await foodService.getMealSuggestions(
      remainingCalories,
      user.dietaryPreferences,
      selectedMealType
    );
    setSuggestions(results);
    setIsLoading(false);
  };

  const loadAlternatives = async (meal: Meal) => {
    if (!user?.dietaryPreferences) return;

    setSelectedMeal(meal);
    setIsLoading(true);

    // Create a FoodItem from the meal
    const foodItem = {
      id: meal.id,
      name: meal.foodName,
      nutrition: {
        calories: meal.calories,
        protein: meal.protein,
        carbs: meal.carbs,
        fat: meal.fat,
      },
      servingSize: meal.servingSize || 100,
      servingUnit: meal.servingUnit || 'g',
      category: meal.mealType,
    };

    const results = await foodService.getHealthierAlternatives(
      foodItem,
      user.dietaryPreferences,
      5
    );
    setAlternatives(results);
    setIsLoading(false);
  };

  const handleAddFood = async (food: FoodSuggestion) => {
    const { error } = await addMeal({
      foodName: food.name,
      calories: food.nutrition.calories,
      protein: food.nutrition.protein,
      carbs: food.nutrition.carbs,
      fat: food.nutrition.fat,
      mealType: selectedMealType,
      barcode: food.barcode,
      servingSize: food.servingSize,
      servingUnit: food.servingUnit,
    });

    if (!error) {
      // Refresh suggestions
      loadMealSuggestions();
    }
  };

  const remainingCalories = dailySummary?.caloriesRemaining || user?.dailyCalorieTarget || 2000;

  return (
    <View style={styles.container}>
      {/* Header with remaining calories */}
      <Surface style={styles.header} elevation={0}>
        <Text style={styles.headerTitle}>Smart Suggestions</Text>
        <View style={styles.caloriesChip}>
          <Text style={styles.caloriesLabel}>Calories left:</Text>
          <Text style={styles.caloriesValue}>{remainingCalories} kcal</Text>
        </View>
      </Surface>

      {/* Tab Selector */}
      <Surface style={styles.tabContainer} elevation={0}>
        <SegmentedButtons
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as SuggestionTab)}
          buttons={[
            { value: 'meals', label: 'Meal Ideas', icon: 'food-apple' },
            { value: 'alternatives', label: 'Healthier Swaps', icon: 'swap-horizontal' },
          ]}
        />
      </Surface>

      {activeTab === 'meals' ? (
        <>
          {/* Meal Type Chips */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.chipContainer}
            contentContainerStyle={styles.chipContent}
          >
            {(['breakfast', 'lunch', 'dinner', 'snack'] as MealType[]).map((type) => (
              <Chip
                key={type}
                selected={selectedMealType === type}
                onPress={() => setSelectedMealType(type)}
                style={styles.chip}
                mode={selectedMealType === type ? 'flat' : 'outlined'}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </Chip>
            ))}
          </ScrollView>

          {/* Meal Suggestions */}
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" />
              <Text style={styles.loadingText}>Finding the best options for you...</Text>
            </View>
          ) : (
            <FlatList
              data={suggestions}
              renderItem={({ item }) => (
                <FoodCard
                  food={item}
                  onAdd={() => handleAddFood(item)}
                  showSuggestionInfo
                />
              )}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContent}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <IconButton icon="food-off" size={48} iconColor="#999" />
                  <Text style={styles.emptyText}>No suggestions available</Text>
                  <Text style={styles.emptySubtext}>
                    Try searching for foods in the Diet Log
                  </Text>
                </View>
              }
            />
          )}
        </>
      ) : (
        <>
          {/* Today's Meals for alternatives */}
          <View style={styles.mealsListContainer}>
            <Text style={styles.sectionTitle}>Select a meal to find alternatives:</Text>
            {todaysMeals.length === 0 ? (
              <Card style={styles.emptyCard}>
                <Card.Content>
                  <Text style={styles.emptyText}>No meals logged today</Text>
                  <Text style={styles.emptySubtext}>
                    Log some meals first to get healthier alternatives
                  </Text>
                </Card.Content>
              </Card>
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.mealChips}
              >
                {todaysMeals.map((meal) => (
                  <Chip
                    key={meal.id}
                    selected={selectedMeal?.id === meal.id}
                    onPress={() => loadAlternatives(meal)}
                    style={styles.mealChip}
                    mode={selectedMeal?.id === meal.id ? 'flat' : 'outlined'}
                  >
                    {meal.foodName.length > 20
                      ? meal.foodName.substring(0, 20) + '...'
                      : meal.foodName}
                  </Chip>
                ))}
              </ScrollView>
            )}
          </View>

          {/* Alternative Suggestions */}
          {selectedMeal && (
            <View style={styles.alternativesContainer}>
              <Text style={styles.sectionTitle}>
                Healthier alternatives to {selectedMeal.foodName}:
              </Text>
              {isLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" />
                </View>
              ) : (
                <FlatList
                  data={alternatives}
                  renderItem={({ item }) => (
                    <FoodCard
                      food={item}
                      onAdd={() => handleAddFood(item)}
                      showSuggestionInfo
                    />
                  )}
                  keyExtractor={(item) => item.id}
                  contentContainerStyle={styles.listContent}
                  ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                      <Text style={styles.emptyText}>No alternatives found</Text>
                      <Text style={styles.emptySubtext}>
                        This seems to be a healthy choice already!
                      </Text>
                    </View>
                  }
                />
              )}
            </View>
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 16,
    paddingBottom: 8,
    backgroundColor: '#6200EE',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  caloriesChip: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  caloriesLabel: {
    color: 'rgba(255,255,255,0.8)',
    marginRight: 8,
  },
  caloriesValue: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
  },
  tabContainer: {
    padding: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  chipContainer: {
    backgroundColor: '#fff',
    maxHeight: 60,
  },
  chipContent: {
    padding: 12,
    gap: 8,
  },
  chip: {
    marginRight: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 16,
    color: '#666',
  },
  listContent: {
    paddingVertical: 8,
    paddingBottom: 20,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyCard: {
    margin: 16,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
  mealsListContainer: {
    padding: 16,
    backgroundColor: '#fff',
  },
  sectionTitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  mealChips: {
    gap: 8,
  },
  mealChip: {
    marginRight: 8,
  },
  alternativesContainer: {
    flex: 1,
    paddingTop: 16,
  },
});
