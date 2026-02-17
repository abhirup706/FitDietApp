import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import {
  Text,
  Surface,
  Chip,
  ActivityIndicator,
  IconButton,
} from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
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

  const mealTypeConfig = [
    { type: 'breakfast' as MealType, icon: '🌅', label: 'Breakfast' },
    { type: 'lunch' as MealType, icon: '☀️', label: 'Lunch' },
    { type: 'dinner' as MealType, icon: '🌙', label: 'Dinner' },
    { type: 'snack' as MealType, icon: '🍪', label: 'Snack' },
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.headerTitle}>Smart Suggestions</Text>
            <Text style={styles.headerSubtitle}>Personalized for you</Text>
          </View>
          <Surface style={styles.caloriesCard} elevation={2}>
            <Text style={styles.caloriesLabel}>Remaining</Text>
            <Text style={styles.caloriesValue}>{remainingCalories}</Text>
            <Text style={styles.caloriesUnit}>kcal</Text>
          </Surface>
        </View>

        {/* Tab Selector */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'meals' && styles.tabActive]}
            onPress={() => setActiveTab('meals')}
          >
            <IconButton
              icon="food-apple"
              iconColor={activeTab === 'meals' ? '#667eea' : '#fff'}
              size={20}
            />
            <Text style={[styles.tabLabel, activeTab === 'meals' && styles.tabLabelActive]}>
              Meal Ideas
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'alternatives' && styles.tabActive]}
            onPress={() => setActiveTab('alternatives')}
          >
            <IconButton
              icon="swap-horizontal"
              iconColor={activeTab === 'alternatives' ? '#667eea' : '#fff'}
              size={20}
            />
            <Text style={[styles.tabLabel, activeTab === 'alternatives' && styles.tabLabelActive]}>
              Healthier Swaps
            </Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {activeTab === 'meals' ? (
        <>
          {/* Meal Type Chips */}
          <View style={styles.mealTypeContainer}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.mealTypeScroll}
            >
              {mealTypeConfig.map((meal) => (
                <TouchableOpacity
                  key={meal.type}
                  onPress={() => setSelectedMealType(meal.type)}
                  style={[
                    styles.mealTypeChip,
                    selectedMealType === meal.type && styles.mealTypeChipSelected,
                  ]}
                >
                  <Text style={styles.mealTypeIcon}>{meal.icon}</Text>
                  <Text style={[
                    styles.mealTypeLabel,
                    selectedMealType === meal.type && styles.mealTypeLabelSelected,
                  ]}>
                    {meal.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Meal Suggestions */}
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#667eea" />
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
                  <View style={styles.emptyIconContainer}>
                    <Text style={styles.emptyIcon}>🍽️</Text>
                  </View>
                  <Text style={styles.emptyTitle}>No suggestions available</Text>
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
          <Surface style={styles.mealsSection} elevation={0}>
            <Text style={styles.sectionTitle}>Select a meal to find alternatives</Text>
            {todaysMeals.length === 0 ? (
              <View style={styles.noMealsCard}>
                <Text style={styles.noMealsIcon}>🥗</Text>
                <Text style={styles.noMealsText}>No meals logged today</Text>
                <Text style={styles.noMealsSubtext}>
                  Log some meals first to get healthier alternatives
                </Text>
              </View>
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.mealChipsScroll}
              >
                {todaysMeals.map((meal) => (
                  <TouchableOpacity
                    key={meal.id}
                    onPress={() => loadAlternatives(meal)}
                    style={[
                      styles.mealChip,
                      selectedMeal?.id === meal.id && styles.mealChipSelected,
                    ]}
                  >
                    <Text style={styles.mealChipIcon}>
                      {meal.mealType === 'breakfast' ? '🌅' :
                       meal.mealType === 'lunch' ? '☀️' :
                       meal.mealType === 'dinner' ? '🌙' : '🍪'}
                    </Text>
                    <View style={styles.mealChipContent}>
                      <Text style={[
                        styles.mealChipName,
                        selectedMeal?.id === meal.id && styles.mealChipNameSelected,
                      ]} numberOfLines={1}>
                        {meal.foodName}
                      </Text>
                      <Text style={styles.mealChipCalories}>{meal.calories} kcal</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </Surface>

          {/* Alternative Suggestions */}
          {selectedMeal && (
            <View style={styles.alternativesContainer}>
              <View style={styles.alternativesHeader}>
                <Text style={styles.alternativesTitle}>Healthier alternatives to</Text>
                <Text style={styles.alternativesFor}>{selectedMeal.foodName}</Text>
              </View>
              {isLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#667eea" />
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
                      <View style={styles.emptyIconContainer}>
                        <Text style={styles.emptyIcon}>✨</Text>
                      </View>
                      <Text style={styles.emptyTitle}>Great choice!</Text>
                      <Text style={styles.emptySubtext}>
                        This seems to be a healthy option already
                      </Text>
                    </View>
                  }
                />
              )}
            </View>
          )}

          {!selectedMeal && todaysMeals.length > 0 && (
            <View style={styles.selectPrompt}>
              <View style={styles.selectPromptIcon}>
                <IconButton icon="gesture-tap" iconColor="#667eea" size={32} />
              </View>
              <Text style={styles.selectPromptText}>
                Tap on a meal above to see healthier alternatives
              </Text>
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
    backgroundColor: '#f8f9fa',
  },
  header: {
    paddingTop: 16,
    paddingBottom: 20,
    paddingHorizontal: 20,
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
  caloriesCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    minWidth: 80,
  },
  caloriesLabel: {
    fontSize: 10,
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  caloriesValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#667eea',
  },
  caloriesUnit: {
    fontSize: 11,
    color: '#999',
    marginTop: -2,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 16,
    padding: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 12,
  },
  tabActive: {
    backgroundColor: '#fff',
  },
  tabLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginLeft: -4,
  },
  tabLabelActive: {
    color: '#667eea',
  },
  mealTypeContainer: {
    backgroundColor: '#fff',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  mealTypeScroll: {
    paddingHorizontal: 16,
    gap: 12,
  },
  mealTypeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
  },
  mealTypeChipSelected: {
    backgroundColor: '#667eea',
  },
  mealTypeIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  mealTypeLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  mealTypeLabelSelected: {
    color: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 60,
  },
  loadingText: {
    marginTop: 16,
    color: '#666',
    fontSize: 15,
    textAlign: 'center',
  },
  listContent: {
    paddingVertical: 12,
    paddingBottom: 24,
  },
  emptyContainer: {
    padding: 60,
    alignItems: 'center',
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyIcon: {
    fontSize: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a2e',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  mealsSection: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  sectionTitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  noMealsCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  noMealsIcon: {
    fontSize: 40,
    marginBottom: 12,
  },
  noMealsText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a2e',
  },
  noMealsSubtext: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
  mealChipsScroll: {
    gap: 12,
  },
  mealChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 16,
    padding: 12,
    minWidth: 160,
  },
  mealChipSelected: {
    backgroundColor: '#667eea15',
    borderWidth: 2,
    borderColor: '#667eea',
  },
  mealChipIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  mealChipContent: {
    flex: 1,
  },
  mealChipName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a2e',
  },
  mealChipNameSelected: {
    color: '#667eea',
  },
  mealChipCalories: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  alternativesContainer: {
    flex: 1,
  },
  alternativesHeader: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  alternativesTitle: {
    fontSize: 14,
    color: '#666',
  },
  alternativesFor: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a2e',
    marginTop: 4,
  },
  selectPrompt: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  selectPromptIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#667eea15',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  selectPromptText: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
  },
});
