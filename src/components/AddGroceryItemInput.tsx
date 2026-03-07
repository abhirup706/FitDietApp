import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, Modal } from 'react-native';
import { TextInput, Text, IconButton, Surface } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { GroceryCategory, NewGroceryItem } from '../types';
import { autoDetectCategory, categoryConfig, allCategories } from '../utils/groceryCategories';

interface AddGroceryItemInputProps {
  onAdd: (item: NewGroceryItem) => void;
}

const commonUnits = ['item', 'lb', 'oz', 'kg', 'g', 'L', 'ml', 'cup', 'bunch', 'pack', 'dozen', 'bag', 'bottle', 'can'];

export function AddGroceryItemInput({ onAdd }: AddGroceryItemInputProps) {
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [unit, setUnit] = useState('item');
  const [category, setCategory] = useState<GroceryCategory | null>(null);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [showUnitPicker, setShowUnitPicker] = useState(false);

  const handleAdd = () => {
    if (!name.trim()) return;

    const detectedCategory = category || autoDetectCategory(name);

    onAdd({
      name: name.trim(),
      quantity: parseFloat(quantity) || 1,
      unit,
      category: detectedCategory,
      purchased: false,
    });

    setName('');
    setQuantity('1');
    setUnit('item');
    setCategory(null);
  };

  const selectedCategory = category || (name ? autoDetectCategory(name) : 'other');
  const categoryInfo = categoryConfig[selectedCategory];

  return (
    <View style={styles.container}>
      <View style={styles.inputRow}>
        <TextInput
          mode="outlined"
          placeholder="Add item..."
          value={name}
          onChangeText={setName}
          style={styles.nameInput}
          outlineColor="#e0e0e0"
          activeOutlineColor="#00b894"
          dense
          right={
            name ? (
              <TextInput.Icon
                icon={() => (
                  <View style={[styles.categoryBadge, { backgroundColor: `${categoryInfo.color}20` }]}>
                    <Icon name={categoryInfo.icon} size={16} color={categoryInfo.color} />
                  </View>
                )}
                onPress={() => setShowCategoryPicker(true)}
              />
            ) : undefined
          }
        />
        <TouchableOpacity
          style={styles.addButton}
          onPress={handleAdd}
          disabled={!name.trim()}
        >
          <Icon name="plus" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.optionsRow}>
        <TouchableOpacity
          style={styles.quantityPicker}
          onPress={() => {}}
        >
          <TextInput
            mode="outlined"
            value={quantity}
            onChangeText={setQuantity}
            keyboardType="numeric"
            style={styles.quantityInput}
            outlineColor="#e0e0e0"
            activeOutlineColor="#00b894"
            dense
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.unitPicker}
          onPress={() => setShowUnitPicker(true)}
        >
          <Text style={styles.unitText}>{unit}</Text>
          <Icon name="chevron-down" size={18} color="#666" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.categoryPicker}
          onPress={() => setShowCategoryPicker(true)}
        >
          <Icon name={categoryInfo.icon} size={18} color={categoryInfo.color} />
          <Text style={[styles.categoryText, { color: categoryInfo.color }]}>{categoryInfo.label}</Text>
          <Icon name="chevron-down" size={18} color="#666" />
        </TouchableOpacity>
      </View>

      {/* Unit Picker Modal */}
      <Modal
        visible={showUnitPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowUnitPicker(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowUnitPicker(false)}
        >
          <Surface style={styles.pickerModal} elevation={4}>
            <Text style={styles.pickerTitle}>Select Unit</Text>
            <ScrollView style={styles.pickerScroll}>
              {commonUnits.map((u) => (
                <TouchableOpacity
                  key={u}
                  style={[styles.pickerItem, unit === u && styles.pickerItemSelected]}
                  onPress={() => {
                    setUnit(u);
                    setShowUnitPicker(false);
                  }}
                >
                  <Text style={[styles.pickerItemText, unit === u && styles.pickerItemTextSelected]}>
                    {u}
                  </Text>
                  {unit === u && <Icon name="check" size={20} color="#00b894" />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Surface>
        </TouchableOpacity>
      </Modal>

      {/* Category Picker Modal */}
      <Modal
        visible={showCategoryPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCategoryPicker(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowCategoryPicker(false)}
        >
          <Surface style={styles.pickerModal} elevation={4}>
            <Text style={styles.pickerTitle}>Select Category</Text>
            <ScrollView style={styles.pickerScroll}>
              {allCategories.map((cat) => {
                const config = categoryConfig[cat];
                const isSelected = selectedCategory === cat;
                return (
                  <TouchableOpacity
                    key={cat}
                    style={[styles.pickerItem, isSelected && styles.pickerItemSelected]}
                    onPress={() => {
                      setCategory(cat);
                      setShowCategoryPicker(false);
                    }}
                  >
                    <View style={[styles.categoryIconSmall, { backgroundColor: `${config.color}20` }]}>
                      <Icon name={config.icon} size={18} color={config.color} />
                    </View>
                    <Text style={[styles.pickerItemText, isSelected && styles.pickerItemTextSelected]}>
                      {config.label}
                    </Text>
                    {isSelected && <Icon name="check" size={20} color="#00b894" />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </Surface>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  nameInput: {
    flex: 1,
    backgroundColor: '#fff',
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#00b894',
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryBadge: {
    width: 28,
    height: 28,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 12,
  },
  quantityPicker: {
    width: 60,
  },
  quantityInput: {
    backgroundColor: '#fff',
    textAlign: 'center',
  },
  unitPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 4,
  },
  unitText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  categoryPicker: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 6,
  },
  categoryText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  pickerModal: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    width: '100%',
    maxHeight: 400,
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a2e',
    marginBottom: 12,
  },
  pickerScroll: {
    maxHeight: 320,
  },
  pickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  pickerItemSelected: {
    backgroundColor: '#e8f8f5',
  },
  pickerItemText: {
    flex: 1,
    fontSize: 15,
    color: '#333',
  },
  pickerItemTextSelected: {
    color: '#00b894',
    fontWeight: '600',
  },
  categoryIconSmall: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
});
