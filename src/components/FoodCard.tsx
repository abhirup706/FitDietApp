import React from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { Card, Text, Button, Chip } from 'react-native-paper';
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
    <Card style={styles.card} mode="outlined">
      <Card.Content style={styles.content}>
        <View style={styles.mainContent}>
          {food.imageUrl && (
            <Image source={{ uri: food.imageUrl }} style={styles.image} />
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
            <Text style={styles.serving}>
              Serving: {food.servingSize}{food.servingUnit}
            </Text>
          </View>
        </View>

        <View style={styles.nutrition}>
          <View style={styles.nutritionItem}>
            <Text style={styles.nutritionValue}>{food.nutrition.calories}</Text>
            <Text style={styles.nutritionLabel}>kcal</Text>
          </View>
          <View style={styles.nutritionItem}>
            <Text style={styles.nutritionValue}>{food.nutrition.protein}g</Text>
            <Text style={styles.nutritionLabel}>protein</Text>
          </View>
          <View style={styles.nutritionItem}>
            <Text style={styles.nutritionValue}>{food.nutrition.carbs}g</Text>
            <Text style={styles.nutritionLabel}>carbs</Text>
          </View>
          <View style={styles.nutritionItem}>
            <Text style={styles.nutritionValue}>{food.nutrition.fat}g</Text>
            <Text style={styles.nutritionLabel}>fat</Text>
          </View>
        </View>

        {showSuggestionInfo && isSuggestion && (
          <View style={styles.suggestionInfo}>
            <Chip
              mode="flat"
              style={styles.reasonChip}
              textStyle={styles.reasonText}
            >
              {suggestion.reason}
            </Chip>
            {suggestion.caloriesSaved && suggestion.caloriesSaved > 0 && (
              <Chip
                mode="flat"
                style={styles.savingsChip}
                textStyle={styles.savingsText}
              >
                Save {suggestion.caloriesSaved} kcal
              </Chip>
            )}
          </View>
        )}

        {onAdd && (
          <Button
            mode="contained"
            onPress={() => onAdd(food)}
            style={styles.addButton}
            compact
          >
            Add
          </Button>
        )}
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginVertical: 6,
    marginHorizontal: 16,
  },
  content: {
    padding: 12,
  },
  mainContent: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  image: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: '#f0f0f0',
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  brand: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  serving: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  nutrition: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  nutritionItem: {
    alignItems: 'center',
  },
  nutritionValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  nutritionLabel: {
    fontSize: 11,
    color: '#666',
    marginTop: 2,
  },
  suggestionInfo: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  reasonChip: {
    backgroundColor: '#E3F2FD',
  },
  reasonText: {
    fontSize: 12,
    color: '#1976D2',
  },
  savingsChip: {
    backgroundColor: '#E8F5E9',
  },
  savingsText: {
    fontSize: 12,
    color: '#388E3C',
  },
  addButton: {
    marginTop: 4,
  },
});
