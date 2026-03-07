import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Surface, Text, IconButton, Checkbox } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { GroceryItem } from '../types';
import { categoryConfig } from '../utils/groceryCategories';

interface GroceryItemCardProps {
  item: GroceryItem;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}

export function GroceryItemCard({ item, onToggle, onDelete }: GroceryItemCardProps) {
  const config = categoryConfig[item.category];

  return (
    <Surface style={[styles.card, item.purchased && styles.cardPurchased]} elevation={1}>
      <TouchableOpacity
        style={styles.content}
        onPress={() => onToggle(item.id)}
        activeOpacity={0.7}
      >
        <View style={styles.checkboxContainer}>
          <Checkbox
            status={item.purchased ? 'checked' : 'unchecked'}
            onPress={() => onToggle(item.id)}
            color="#00b894"
          />
        </View>

        <View style={[styles.categoryIcon, { backgroundColor: `${config.color}20` }]}>
          <Icon name={config.icon} size={20} color={config.color} />
        </View>

        <View style={styles.info}>
          <Text
            style={[styles.name, item.purchased && styles.namePurchased]}
            numberOfLines={1}
          >
            {item.name}
          </Text>
          <Text style={styles.quantity}>
            {item.quantity} {item.unit}
          </Text>
        </View>

        <IconButton
          icon="delete-outline"
          iconColor="#999"
          size={20}
          onPress={() => onDelete(item.id)}
          style={styles.deleteButton}
        />
      </TouchableOpacity>
    </Surface>
  );
}

const styles = StyleSheet.create({
  card: {
    marginVertical: 4,
    marginHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#fff',
  },
  cardPurchased: {
    opacity: 0.7,
    backgroundColor: '#f8f9fa',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    paddingRight: 4,
  },
  checkboxContainer: {
    marginRight: 4,
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a2e',
  },
  namePurchased: {
    textDecorationLine: 'line-through',
    color: '#999',
  },
  quantity: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  deleteButton: {
    margin: 0,
  },
});
