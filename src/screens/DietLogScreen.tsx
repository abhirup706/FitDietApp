import React, { useState, useEffect, useCallback } from 'react';
import { View, ScrollView, StyleSheet, FlatList } from 'react-native';
import {
  Text,
  Searchbar,
  SegmentedButtons,
  IconButton,
  Surface,
  ActivityIndicator,
  Snackbar,
  Portal,
  Modal,
  Button,
  TextInput,
} from 'react-native-paper';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useUserStore } from '../store/userStore';
import { foodService } from '../services/foodService';
import { FoodCard } from '../components';
import { FoodItem, MealType } from '../types';

export function DietLogScreen({ navigation }: any) {
  const { addMeal } = useUserStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [mealType, setMealType] = useState<MealType>('lunch');
  const [searchResults, setSearchResults] = useState<FoodItem[]>([]);
  const [quickAddFoods, setQuickAddFoods] = useState<FoodItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  // Custom serving modal
  const [showServingModal, setShowServingModal] = useState(false);
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);
  const [servingMultiplier, setServingMultiplier] = useState('1');

  useEffect(() => {
    setQuickAddFoods(foodService.getQuickAddFoods());
  }, []);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.length >= 2) {
        handleSearch();
      } else {
        setSearchResults([]);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSearch = async () => {
    setIsLoading(true);
    const results = await foodService.searchFoods(searchQuery);
    setSearchResults(results);
    setIsLoading(false);
  };

  const handleBarcodeScanned = async ({ data }: { data: string }) => {
    setShowScanner(false);
    setIsLoading(true);

    const food = await foodService.getFoodByBarcode(data);
    if (food) {
      setSelectedFood(food);
      setShowServingModal(true);
    } else {
      showSnackbar('Product not found. Try manual search.');
    }
    setIsLoading(false);
  };

  const handleAddFood = (food: FoodItem) => {
    setSelectedFood(food);
    setServingMultiplier('1');
    setShowServingModal(true);
  };

  const confirmAddFood = async () => {
    if (!selectedFood) return;

    const multiplier = parseFloat(servingMultiplier) || 1;
    const { error } = await addMeal({
      foodName: selectedFood.name,
      calories: Math.round(selectedFood.nutrition.calories * multiplier),
      protein: Math.round(selectedFood.nutrition.protein * multiplier * 10) / 10,
      carbs: Math.round(selectedFood.nutrition.carbs * multiplier * 10) / 10,
      fat: Math.round(selectedFood.nutrition.fat * multiplier * 10) / 10,
      mealType,
      barcode: selectedFood.barcode,
      servingSize: selectedFood.servingSize * multiplier,
      servingUnit: selectedFood.servingUnit,
    });

    if (error) {
      showSnackbar('Failed to add meal. Please try again.');
    } else {
      showSnackbar(`${selectedFood.name} added to ${mealType}!`);
      setShowServingModal(false);
      setSelectedFood(null);
    }
  };

  const showSnackbar = (message: string) => {
    setSnackbarMessage(message);
    setSnackbarVisible(true);
  };

  const openScanner = async () => {
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        showSnackbar('Camera permission is required for barcode scanning');
        return;
      }
    }
    setShowScanner(true);
  };

  const renderFoodItem = useCallback(
    ({ item }: { item: FoodItem }) => <FoodCard food={item} onAdd={handleAddFood} />,
    [mealType]
  );

  return (
    <View style={styles.container}>
      {/* Meal Type Selector */}
      <Surface style={styles.mealTypeContainer} elevation={0}>
        <SegmentedButtons
          value={mealType}
          onValueChange={(value) => setMealType(value as MealType)}
          buttons={[
            { value: 'breakfast', label: 'Breakfast', icon: 'weather-sunny' },
            { value: 'lunch', label: 'Lunch', icon: 'food' },
            { value: 'dinner', label: 'Dinner', icon: 'food-variant' },
            { value: 'snack', label: 'Snack', icon: 'cookie' },
          ]}
          style={styles.segmentedButtons}
        />
      </Surface>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="Search foods..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchbar}
        />
        <IconButton
          icon="barcode-scan"
          mode="contained"
          onPress={openScanner}
          style={styles.scanButton}
        />
      </View>

      {/* Content */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
        </View>
      ) : searchQuery.length >= 2 ? (
        // Search Results
        <FlatList
          data={searchResults}
          renderItem={renderFoodItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No foods found</Text>
              <Text style={styles.emptySubtext}>Try a different search term</Text>
            </View>
          }
        />
      ) : (
        // Quick Add Foods
        <ScrollView contentContainerStyle={styles.listContent}>
          <Text style={styles.sectionTitle}>Quick Add</Text>
          {quickAddFoods.map((food) => (
            <FoodCard key={food.id} food={food} onAdd={handleAddFood} />
          ))}
        </ScrollView>
      )}

      {/* Barcode Scanner Modal */}
      <Portal>
        <Modal
          visible={showScanner}
          onDismiss={() => setShowScanner(false)}
          contentContainerStyle={styles.scannerModal}
        >
          <View style={styles.scannerContainer}>
            <Text style={styles.scannerTitle}>Scan Barcode</Text>
            <View style={styles.cameraContainer}>
              <CameraView
                style={styles.camera}
                facing="back"
                barcodeScannerSettings={{
                  barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e'],
                }}
                onBarcodeScanned={handleBarcodeScanned}
              />
            </View>
            <Button mode="outlined" onPress={() => setShowScanner(false)}>
              Cancel
            </Button>
          </View>
        </Modal>
      </Portal>

      {/* Serving Size Modal */}
      <Portal>
        <Modal
          visible={showServingModal}
          onDismiss={() => setShowServingModal(false)}
          contentContainerStyle={styles.servingModal}
        >
          {selectedFood && (
            <View>
              <Text style={styles.modalTitle}>Add {selectedFood.name}</Text>
              <Text style={styles.servingInfo}>
                Serving: {selectedFood.servingSize}{selectedFood.servingUnit}
              </Text>

              <View style={styles.nutritionPreview}>
                <Text style={styles.nutritionPreviewTitle}>Per serving:</Text>
                <Text>
                  Calories: {Math.round(selectedFood.nutrition.calories * (parseFloat(servingMultiplier) || 1))} kcal
                </Text>
                <Text>
                  P: {Math.round(selectedFood.nutrition.protein * (parseFloat(servingMultiplier) || 1))}g |
                  C: {Math.round(selectedFood.nutrition.carbs * (parseFloat(servingMultiplier) || 1))}g |
                  F: {Math.round(selectedFood.nutrition.fat * (parseFloat(servingMultiplier) || 1))}g
                </Text>
              </View>

              <TextInput
                label="Number of servings"
                value={servingMultiplier}
                onChangeText={setServingMultiplier}
                keyboardType="decimal-pad"
                mode="outlined"
                style={styles.servingInput}
              />

              <View style={styles.modalButtons}>
                <Button mode="outlined" onPress={() => setShowServingModal(false)}>
                  Cancel
                </Button>
                <Button mode="contained" onPress={confirmAddFood}>
                  Add to {mealType}
                </Button>
              </View>
            </View>
          )}
        </Modal>
      </Portal>

      {/* Snackbar */}
      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
      >
        {snackbarMessage}
      </Snackbar>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  mealTypeContainer: {
    padding: 12,
    backgroundColor: '#fff',
  },
  segmentedButtons: {
    marginHorizontal: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    padding: 12,
    alignItems: 'center',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  searchbar: {
    flex: 1,
    marginRight: 8,
  },
  scanButton: {
    margin: 0,
  },
  listContent: {
    paddingVertical: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginHorizontal: 16,
    marginVertical: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
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
  scannerModal: {
    margin: 20,
  },
  scannerContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
  },
  scannerTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
  },
  cameraContainer: {
    width: 280,
    height: 280,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
  },
  camera: {
    flex: 1,
  },
  servingModal: {
    backgroundColor: '#fff',
    margin: 20,
    padding: 20,
    borderRadius: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  servingInfo: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  nutritionPreview: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  nutritionPreviewTitle: {
    fontWeight: '600',
    marginBottom: 4,
  },
  servingInput: {
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
});
