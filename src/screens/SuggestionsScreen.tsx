import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import {
  Text,
  Surface,
  ActivityIndicator,
} from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useUserStore } from '../store/userStore';
import { foodService } from '../services/foodService';
import { FoodCard } from '../components';
import { FoodSuggestion, MealType, Meal } from '../types';

type SuggestionTab = 'alternatives' | 'meals' | 'groceries';

export function SuggestionsScreen() {
  const { user, todaysMeals, dailySummary, addMeal, availableIngredients } = useUserStore();

  const [activeTab, setActiveTab] = useState<SuggestionTab>('meals');
  const [selectedMealType, setSelectedMealType] = useState<MealType>('lunch');
  const [suggestions, setSuggestions] = useState<FoodSuggestion[]>([]);
  const [alternatives, setAlternatives] = useState<FoodSuggestion[]>([]);
  const [grocerySuggestions, setGrocerySuggestions] = useState<FoodSuggestion[]>([]);
  const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (activeTab === 'meals') {
      loadMealSuggestions();
    } else if (activeTab === 'groceries') {
      loadGrocerySuggestions();
    }
  }, [activeTab, selectedMealType, user?.dietaryPreferences, availableIngredients]);

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

  const loadGrocerySuggestions = async () => {
    if (!user?.dietaryPreferences || availableIngredients.length === 0) {
      setGrocerySuggestions([]);
      return;
    }

    setIsLoading(true);
    const remainingCalories = dailySummary?.caloriesRemaining || user.dailyCalorieTarget;
    const results = await foodService.getMealSuggestionsFromIngredients(
      availableIngredients,
      remainingCalories,
      user.dietaryPreferences
    );
    setGrocerySuggestions(results);
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
    { type: 'breakfast' as MealType, icon: 'weather-sunset-up', label: 'Breakfast' },
    { type: 'lunch' as MealType, icon: 'weather-sunny', label: 'Lunch' },
    { type: 'dinner' as MealType, icon: 'weather-night', label: 'Dinner' },
    { type: 'snack' as MealType, icon: 'cookie', label: 'Snack' },
  ];

  const getMealTypeIcon = (mealType: MealType) => {
    switch (mealType) {
      case 'breakfast': return 'weather-sunset-up';
      case 'lunch': return 'weather-sunny';
      case 'dinner': return 'weather-night';
      case 'snack': return 'cookie';
      default: return 'food';
    }
  };

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
            <Icon
              name="food-apple"
              color={activeTab === 'meals' ? '#667eea' : '#fff'}
              size={18}
            />
            <Text style={[styles.tabLabel, activeTab === 'meals' && styles.tabLabelActive]}>
              Ideas
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'alternatives' && styles.tabActive]}
            onPress={() => setActiveTab('alternatives')}
          >
            <Icon
              name="swap-horizontal"
              color={activeTab === 'alternatives' ? '#667eea' : '#fff'}
              size={18}
            />
            <Text style={[styles.tabLabel, activeTab === 'alternatives' && styles.tabLabelActive]}>
              Swaps
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'groceries' && styles.tabActive]}
            onPress={() => setActiveTab('groceries')}
          >
            <Icon
              name="cart"
              color={activeTab === 'groceries' ? '#667eea' : '#fff'}
              size={18}
            />
            <Text style={[styles.tabLabel, activeTab === 'groceries' && styles.tabLabelActive]}>
              Groceries
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
                  <Icon
                    name={meal.icon}
                    size={18}
                    color={selectedMealType === meal.type ? '#fff' : '#666'}
                    style={styles.mealTypeIcon}
                  />
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
                    <Icon name="silverware-fork-knife" size={40} color="#667eea" />
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
                <Icon name="food-variant" size={40} color="#667eea" style={styles.noMealsIcon} />
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
                    <View style={styles.mealChipIconContainer}>
                      <Icon
                        name={getMealTypeIcon(meal.mealType)}
                        size={20}
                        color={selectedMeal?.id === meal.id ? '#667eea' : '#666'}
                      />
                    </View>
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
                        <Icon name="star-circle" size={40} color="#667eea" />
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
                <Icon name="gesture-tap" color="#667eea" size={32} />
              </View>
              <Text style={styles.selectPromptText}>
                Tap on a meal above to see healthier alternatives
              </Text>
            </View>
          )}
        </>
      )}

      {activeTab === 'groceries' && (
        <>
          {/* Ingredients Info */}
          <Surface style={styles.mealsSection} elevation={0}>
            <Text style={styles.sectionTitle}>
              {availableIngredients.length > 0
                ? `Meals you can make with your ${availableIngredients.length} purchased item${availableIngredients.length > 1 ? 's' : ''}`
                : 'Purchase items from your grocery list to see meal ideas'}
            </Text>
            {availableIngredients.length > 0 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.ingredientChipsScroll}
              >
                {availableIngredients.slice(0, 10).map((ingredient, index) => (
                  <View key={index} style={styles.ingredientChip}>
                    <Text style={styles.ingredientChipText}>{ingredient}</Text>
                  </View>
                ))}
                {availableIngredients.length > 10 && (
                  <View style={styles.ingredientChip}>
                    <Text style={styles.ingredientChipText}>+{availableIngredients.length - 10} more</Text>
                  </View>
                )}
              </ScrollView>
            )}
          </Surface>

          {/* Grocery-based Suggestions */}
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#667eea" />
              <Text style={styles.loadingText}>Finding recipes with your ingredients...</Text>
            </View>
          ) : availableIngredients.length === 0 ? (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconContainer}>
                <Icon name="cart-outline" size={40} color="#667eea" />
              </View>
              <Text style={styles.emptyTitle}>No purchased ingredients</Text>
              <Text style={styles.emptySubtext}>
                Go to your Grocery list and check off items as you buy them to see meal suggestions here
              </Text>
            </View>
          ) : (
            <FlatList
              data={grocerySuggestions}
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
                    <Icon name="magnify" size={40} color="#667eea" />
                  </View>
                  <Text style={styles.emptyTitle}>No matches found</Text>
                  <Text style={styles.emptySubtext}>
                    Try purchasing different ingredients to see more meal ideas
                  </Text>
                </View>
              }
            />
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
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 12,
    gap: 6,
  },
  tabActive: {
    backgroundColor: '#fff',
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
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
  mealChipIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#e8e8e8',
    justifyContent: 'center',
    alignItems: 'center',
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
  ingredientChipsScroll: {
    gap: 8,
    flexDirection: 'row',
  },
  ingredientChip: {
    backgroundColor: '#e8f5e9',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  ingredientChipText: {
    fontSize: 13,
    color: '#2e7d32',
    fontWeight: '500',
    textTransform: 'capitalize',
  },
});
