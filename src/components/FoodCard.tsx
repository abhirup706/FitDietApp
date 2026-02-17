import React from 'react';
import { View, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Surface, Text, Button, IconButton } from 'react-native-paper';
import { FoodItem, FoodSuggestion } from '../types';

interface FoodCardProps {
  food: FoodItem | FoodSuggestion;
  onAdd?: (food: FoodItem) => void;
  showSuggestionInfo?: boolean;
}

export function FoodCard({ food, onAdd, showSuggestionInfo = false }: FoodCardProps) {
  const isSuggestion = 'reason' in food;
  const suggestion = food as FoodSuggestion;

  return (
    <Surface style={styles.card} elevation={2}>
      <View style={styles.content}>
        {/* Food Info Row */}
        <View style={styles.mainRow}>
          {food.imageUrl ? (
            <Image source={{ uri: food.imageUrl }} style={styles.image} />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Text style={styles.imagePlaceholderText}>🍽️</Text>
            </View>
          )}
          <View style={styles.info}>
            <Text style={styles.name} numberOfLines={2}>
              {food.name}
            </Text>
            {food.brand && (
              <Text style={styles.brand} numberOfLines={1}>
                {food.brand}
              </Text>
            )}
            <View style={styles.servingRow}>
              <IconButton icon="scale" iconColor="#999" size={12} style={styles.servingIcon} />
              <Text style={styles.serving}>
                {food.servingSize}{food.servingUnit} per serving
              </Text>
            </View>
          </View>
        </View>

        {/* Nutrition Grid */}
        <View style={styles.nutritionGrid}>
          <View style={styles.nutritionItem}>
            <Text style={styles.nutritionValue}>{food.nutrition.calories}</Text>
            <Text style={styles.nutritionLabel}>kcal</Text>
          </View>
          <View style={styles.nutritionDivider} />
          <View style={styles.nutritionItem}>
            <Text style={[styles.nutritionValue, { color: '#e91e63' }]}>{food.nutrition.protein}g</Text>
            <Text style={styles.nutritionLabel}>Protein</Text>
          </View>
          <View style={styles.nutritionDivider} />
          <View style={styles.nutritionItem}>
            <Text style={[styles.nutritionValue, { color: '#667eea' }]}>{food.nutrition.carbs}g</Text>
            <Text style={styles.nutritionLabel}>Carbs</Text>
          </View>
          <View style={styles.nutritionDivider} />
          <View style={styles.nutritionItem}>
            <Text style={[styles.nutritionValue, { color: '#ff9800' }]}>{food.nutrition.fat}g</Text>
            <Text style={styles.nutritionLabel}>Fat</Text>
          </View>
        </View>

        {/* Suggestion Info */}
        {showSuggestionInfo && isSuggestion && (
          <View style={styles.suggestionInfo}>
            <View style={styles.reasonChip}>
              <IconButton icon="lightbulb-outline" iconColor="#1976D2" size={14} style={styles.chipIcon} />
              <Text style={styles.reasonText}>{suggestion.reason}</Text>
            </View>
            {suggestion.caloriesSaved && suggestion.caloriesSaved > 0 && (
              <View style={styles.savingsChip}>
                <IconButton icon="arrow-down" iconColor="#388E3C" size={14} style={styles.chipIcon} />
                <Text style={styles.savingsText}>Save {suggestion.caloriesSaved} kcal</Text>
              </View>
            )}
          </View>
        )}

        {/* Add Button */}
        {onAdd && (
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => onAdd(food)}
            activeOpacity={0.8}
          >
            <IconButton icon="plus" iconColor="#fff" size={20} />
            <Text style={styles.addButtonText}>Add</Text>
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
    borderRadius: 20,
    backgroundColor: '#fff',
  },
  content: {
    padding: 16,
  },
  mainRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  image: {
    width: 64,
    height: 64,
    borderRadius: 16,
    marginRight: 14,
    backgroundColor: '#f5f5f5',
  },
  imagePlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 16,
    marginRight: 14,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePlaceholderText: {
    fontSize: 28,
  },
  info: {
    flex: 1,
    justifyContent: 'center',
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a2e',
    lineHeight: 22,
  },
  brand: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  servingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  servingIcon: {
    margin: 0,
    marginLeft: -4,
    marginRight: -2,
  },
  serving: {
    fontSize: 12,
    color: '#999',
  },
  nutritionGrid: {
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    padding: 14,
  },
  nutritionItem: {
    flex: 1,
    alignItems: 'center',
  },
  nutritionDivider: {
    width: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 4,
  },
  nutritionValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a1a2e',
  },
  nutritionLabel: {
    fontSize: 10,
    color: '#666',
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  suggestionInfo: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  reasonChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    borderRadius: 20,
    paddingRight: 12,
    paddingVertical: 2,
  },
  chipIcon: {
    margin: 0,
    marginRight: -4,
  },
  reasonText: {
    fontSize: 12,
    color: '#1976D2',
    fontWeight: '500',
  },
  savingsChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    borderRadius: 20,
    paddingRight: 12,
    paddingVertical: 2,
  },
  savingsText: {
    fontSize: 12,
    color: '#388E3C',
    fontWeight: '500',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#667eea',
    borderRadius: 14,
    marginTop: 12,
    paddingVertical: 4,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    marginLeft: -4,
    marginRight: 8,
  },
});
