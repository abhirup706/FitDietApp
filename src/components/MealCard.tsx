import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text, IconButton } from 'react-native-paper';
import { Meal, MealType } from '../types';

interface MealCardProps {
  meal: Meal;
  onDelete?: (id: string) => void;
}

const mealTypeIcons: Record<MealType, string> = {
  breakfast: 'weather-sunny',
  lunch: 'food',
  dinner: 'food-variant',
  snack: 'cookie',
};

const mealTypeColors: Record<MealType, string> = {
  breakfast: '#FF9800',
  lunch: '#4CAF50',
  dinner: '#9C27B0',
  snack: '#2196F3',
};

export function MealCard({ meal, onDelete }: MealCardProps) {
  const icon = mealTypeIcons[meal.mealType];
  const color = mealTypeColors[meal.mealType];

  return (
    <Card style={styles.card} mode="outlined">
      <Card.Content style={styles.content}>
        <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
          <IconButton icon={icon} iconColor={color} size={24} />
        </View>
        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={1}>
            {meal.foodName}
          </Text>
          <Text style={styles.macros}>
            P: {Math.round(meal.protein)}g • C: {Math.round(meal.carbs)}g • F: {Math.round(meal.fat)}g
          </Text>
        </View>
        <View style={styles.caloriesContainer}>
          <Text style={styles.calories}>{meal.calories}</Text>
          <Text style={styles.caloriesLabel}>kcal</Text>
        </View>
        {onDelete && (
          <IconButton
            icon="close"
            size={18}
            onPress={() => onDelete(meal.id)}
            style={styles.deleteButton}
          />
        )}
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginVertical: 4,
    marginHorizontal: 16,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  iconContainer: {
    borderRadius: 8,
    marginRight: 8,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  macros: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  caloriesContainer: {
    alignItems: 'flex-end',
    marginRight: 8,
  },
  calories: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  caloriesLabel: {
    fontSize: 10,
    color: '#666',
  },
  deleteButton: {
    margin: 0,
  },
});
