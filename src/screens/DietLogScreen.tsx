import React, { useState, useEffect, useCallback } from 'react';
import { View, ScrollView, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import {
  Text,
  Searchbar,
  IconButton,
  Surface,
  ActivityIndicator,
  Snackbar,
  Portal,
  Modal,
  Button,
  TextInput,
} from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useUserStore } from '../store/userStore';
import { foodService } from '../services/foodService';
import { FoodCard } from '../components';
import { FoodItem, MealType } from '../types';

const mealTypes: { type: MealType; icon: string; label: string; gradient: [string, string] }[] = [
  { type: 'breakfast', icon: '🌅', label: 'Breakfast', gradient: ['#ff9a56', '#ff6b6b'] },
  { type: 'lunch', icon: '☀️', label: 'Lunch', gradient: ['#56ab2f', '#a8e063'] },
  { type: 'dinner', icon: '🌙', label: 'Dinner', gradient: ['#667eea', '#764ba2'] },
  { type: 'snack', icon: '🍪', label: 'Snack', gradient: ['#f093fb', '#f5576c'] },
];

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

  const selectedMealConfig = mealTypes.find(m => m.type === mealType)!;

  return (
    <View style={styles.container}>
      {/* Header with Gradient */}
      <LinearGradient
        colors={selectedMealConfig.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Log Meal</Text>
        <Text style={styles.headerSubtitle}>What did you eat?</Text>
      </LinearGradient>

      {/* Meal Type Selector */}
      <View style={styles.mealTypeContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.mealTypeScroll}
        >
          {mealTypes.map((meal) => (
            <TouchableOpacity
              key={meal.type}
              onPress={() => setMealType(meal.type)}
              style={[
                styles.mealTypeButton,
                mealType === meal.type && styles.mealTypeButtonSelected,
              ]}
            >
              <LinearGradient
                colors={mealType === meal.type ? meal.gradient : ['#f5f5f5', '#f5f5f5']}
                style={styles.mealTypeGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={styles.mealTypeIcon}>{meal.icon}</Text>
                <Text style={[
                  styles.mealTypeLabel,
                  mealType === meal.type && styles.mealTypeLabelSelected,
                ]}>
                  {meal.label}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchWrapper}>
          <Searchbar
            placeholder="Search foods..."
            onChangeText={setSearchQuery}
            value={searchQuery}
            style={styles.searchbar}
            inputStyle={styles.searchInput}
            iconColor="#667eea"
          />
        </View>
        <TouchableOpacity onPress={openScanner} style={styles.scanButton}>
          <LinearGradient
            colors={['#667eea', '#764ba2']}
            style={styles.scanButtonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <IconButton icon="barcode-scan" iconColor="#fff" size={24} />
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#667eea" />
          <Text style={styles.loadingText}>Searching...</Text>
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
              <Text style={styles.emptyIcon}>🔍</Text>
              <Text style={styles.emptyText}>No foods found</Text>
              <Text style={styles.emptySubtext}>Try a different search term</Text>
            </View>
          }
        />
      ) : (
        // Quick Add Foods
        <ScrollView contentContainerStyle={styles.listContent}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Quick Add</Text>
            <Text style={styles.sectionSubtitle}>Popular choices</Text>
          </View>
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
            <View style={styles.scannerHeader}>
              <Text style={styles.scannerTitle}>Scan Barcode</Text>
              <IconButton
                icon="close"
                onPress={() => setShowScanner(false)}
                iconColor="#666"
              />
            </View>
            <View style={styles.cameraContainer}>
              <CameraView
                style={styles.camera}
                facing="back"
                barcodeScannerSettings={{
                  barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e'],
                }}
                onBarcodeScanned={handleBarcodeScanned}
              />
              <View style={styles.scanOverlay}>
                <View style={styles.scanCorner} />
              </View>
            </View>
            <Text style={styles.scanHint}>Position barcode within the frame</Text>
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
              <View style={styles.servingHeader}>
                <Text style={styles.modalTitle}>{selectedFood.name}</Text>
                <IconButton
                  icon="close"
                  onPress={() => setShowServingModal(false)}
                  iconColor="#666"
                  size={20}
                />
              </View>
              <Text style={styles.servingInfo}>
                1 serving = {selectedFood.servingSize}{selectedFood.servingUnit}
              </Text>

              <Surface style={styles.nutritionPreview} elevation={0}>
                <Text style={styles.nutritionPreviewTitle}>Nutrition per serving</Text>
                <View style={styles.nutritionGrid}>
                  <View style={styles.nutritionItem}>
                    <Text style={styles.nutritionValue}>
                      {Math.round(selectedFood.nutrition.calories * (parseFloat(servingMultiplier) || 1))}
                    </Text>
                    <Text style={styles.nutritionLabel}>kcal</Text>
                  </View>
                  <View style={styles.nutritionItem}>
                    <Text style={[styles.nutritionValue, { color: '#e91e63' }]}>
                      {Math.round(selectedFood.nutrition.protein * (parseFloat(servingMultiplier) || 1))}g
                    </Text>
                    <Text style={styles.nutritionLabel}>Protein</Text>
                  </View>
                  <View style={styles.nutritionItem}>
                    <Text style={[styles.nutritionValue, { color: '#667eea' }]}>
                      {Math.round(selectedFood.nutrition.carbs * (parseFloat(servingMultiplier) || 1))}g
                    </Text>
                    <Text style={styles.nutritionLabel}>Carbs</Text>
                  </View>
                  <View style={styles.nutritionItem}>
                    <Text style={[styles.nutritionValue, { color: '#ff9800' }]}>
                      {Math.round(selectedFood.nutrition.fat * (parseFloat(servingMultiplier) || 1))}g
                    </Text>
                    <Text style={styles.nutritionLabel}>Fat</Text>
                  </View>
                </View>
              </Surface>

              <TextInput
                label="Number of servings"
                value={servingMultiplier}
                onChangeText={setServingMultiplier}
                keyboardType="decimal-pad"
                mode="outlined"
                style={styles.servingInput}
                outlineColor="#e0e0e0"
                activeOutlineColor="#667eea"
              />

              <View style={styles.modalButtons}>
                <Button
                  mode="outlined"
                  onPress={() => setShowServingModal(false)}
                  style={styles.cancelButton}
                  textColor="#666"
                >
                  Cancel
                </Button>
                <Button
                  mode="contained"
                  onPress={confirmAddFood}
                  style={styles.addButton}
                  buttonColor="#667eea"
                >
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
        style={styles.snackbar}
      >
        {snackbarMessage}
      </Snackbar>
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
    paddingBottom: 24,
    paddingHorizontal: 20,
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
  mealTypeContainer: {
    marginTop: -12,
    marginBottom: 8,
  },
  mealTypeScroll: {
    paddingHorizontal: 16,
    gap: 12,
  },
  mealTypeButton: {
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  mealTypeButtonSelected: {
    elevation: 4,
  },
  mealTypeGradient: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    minWidth: 80,
  },
  mealTypeIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  mealTypeLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  mealTypeLabelSelected: {
    color: '#fff',
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'center',
    gap: 12,
  },
  searchWrapper: {
    flex: 1,
  },
  searchbar: {
    backgroundColor: '#fff',
    borderRadius: 16,
    elevation: 2,
  },
  searchInput: {
    fontSize: 16,
  },
  scanButton: {
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 3,
  },
  scanButtonGradient: {
    width: 56,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingVertical: 8,
    paddingBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a2e',
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#666',
    fontSize: 16,
  },
  emptyContainer: {
    padding: 60,
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a2e',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
  scannerModal: {
    margin: 20,
  },
  scannerContainer: {
    backgroundColor: '#fff',
    borderRadius: 24,
    overflow: 'hidden',
  },
  scannerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingLeft: 20,
    paddingRight: 8,
    paddingTop: 8,
  },
  scannerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1a1a2e',
  },
  cameraContainer: {
    height: 280,
    margin: 16,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  camera: {
    flex: 1,
  },
  scanOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanCorner: {
    width: 200,
    height: 200,
    borderWidth: 3,
    borderColor: '#667eea',
    borderRadius: 16,
  },
  scanHint: {
    textAlign: 'center',
    color: '#666',
    fontSize: 14,
    paddingBottom: 20,
  },
  servingModal: {
    backgroundColor: '#fff',
    margin: 20,
    borderRadius: 24,
    padding: 20,
  },
  servingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a2e',
    flex: 1,
  },
  servingInfo: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  nutritionPreview: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
  },
  nutritionPreviewTitle: {
    fontWeight: '600',
    color: '#1a1a2e',
    marginBottom: 12,
    textAlign: 'center',
  },
  nutritionGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  nutritionItem: {
    alignItems: 'center',
  },
  nutritionValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a2e',
  },
  nutritionLabel: {
    fontSize: 11,
    color: '#666',
    marginTop: 2,
  },
  servingInput: {
    marginBottom: 16,
    backgroundColor: '#fff',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    borderColor: '#e0e0e0',
  },
  addButton: {
    flex: 2,
  },
  snackbar: {
    backgroundColor: '#1a1a2e',
  },
});
