import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Surface, Text, IconButton } from 'react-native-paper';
import { Meal, MealType } from '../types';

interface MealCardProps {
  meal: Meal;
  onDelete?: (id: string) => void;
}

const mealTypeConfig: Record<MealType, { icon: string; color: string; bgColor: string; label: string }> = {
  breakfast: { icon: '🌅', color: '#ff9500', bgColor: '#fff5e6', label: 'Breakfast' },
  lunch: { icon: '☀️', color: '#34c759', bgColor: '#e8f8ec', label: 'Lunch' },
  dinner: { icon: '🌙', color: '#5856d6', bgColor: '#eeeefc', label: 'Dinner' },
  snack: { icon: '🍪', color: '#ff2d55', bgColor: '#ffe8ec', label: 'Snack' },
};

export function MealCard({ meal, onDelete }: MealCardProps) {
  const config = mealTypeConfig[meal.mealType];

  return (
    <Surface style={styles.card} elevation={1}>
      <View style={styles.content}>
        <View style={[styles.iconContainer, { backgroundColor: config.bgColor }]}>
          <Text style={styles.icon}>{config.icon}</Text>
        </View>

        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={1}>
            {meal.foodName}
          </Text>
          <View style={styles.macroRow}>
            <View style={styles.macroPill}>
              <Text style={styles.macroText}>P {Math.round(meal.protein)}g</Text>
            </View>
            <View style={styles.macroPill}>
              <Text style={styles.macroText}>C {Math.round(meal.carbs)}g</Text>
            </View>
            <View style={styles.macroPill}>
              <Text style={styles.macroText}>F {Math.round(meal.fat)}g</Text>
            </View>
          </View>
        </View>

        <View style={styles.caloriesContainer}>
          <Text style={[styles.calories, { color: config.color }]}>{meal.calories}</Text>
          <Text style={styles.caloriesLabel}>kcal</Text>
        </View>

        {onDelete && (
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => onDelete(meal.id)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <IconButton icon="close" size={16} iconColor="#999" />
          </TouchableOpacity>
        )}
      </View>
    </Surface>
  );
}

const styles = StyleSheet.create({
  card: {
    marginVertical: 6,
    marginHorizontal: 16,
    borderRadius: 16,
    backgroundColor: '#fff',
    overflow: 'hidden',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  icon: {
    fontSize: 24,
  },
  info: {
    flex: 1,
    marginRight: 8,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a2e',
    marginBottom: 6,
  },
  macroRow: {
    flexDirection: 'row',
    gap: 6,
  },
  macroPill: {
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  macroText: {
    fontSize: 11,
    color: '#666',
    fontWeight: '500',
  },
  caloriesContainer: {
    alignItems: 'flex-end',
    marginRight: 4,
  },
  calories: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  caloriesLabel: {
    fontSize: 11,
    color: '#999',
    marginTop: -2,
  },
  deleteButton: {
    marginLeft: 4,
  },
});
