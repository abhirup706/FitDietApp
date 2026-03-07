import React, { useState, useEffect, useMemo } from 'react';
import { View, StyleSheet, SectionList, TouchableOpacity, Alert } from 'react-native';
import { Text, Surface, ActivityIndicator, FAB } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useUserStore } from '../store/userStore';
import { GroceryItemCard, AddGroceryItemInput } from '../components';
import { GroceryItem, GroceryCategory, NewGroceryItem } from '../types';
import { categoryConfig } from '../utils/groceryCategories';

type FilterTab = 'all' | 'pending' | 'purchased';

interface GrocerySection {
  title: string;
  category: GroceryCategory;
  data: GroceryItem[];
}

export function GroceryScreen() {
  const {
    groceryItems,
    addGroceryItem,
    removeGroceryItem,
    toggleItemPurchased,
    clearPurchasedItems,
    loadGroceryItems,
  } = useUserStore();

  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadGroceryItems();
  }, []);

  const filteredItems = useMemo(() => {
    switch (activeFilter) {
      case 'pending':
        return groceryItems.filter((item) => !item.purchased);
      case 'purchased':
        return groceryItems.filter((item) => item.purchased);
      default:
        return groceryItems;
    }
  }, [groceryItems, activeFilter]);

  const sections = useMemo(() => {
    const grouped: Record<GroceryCategory, GroceryItem[]> = {
      produce: [],
      dairy: [],
      meat: [],
      seafood: [],
      bakery: [],
      frozen: [],
      pantry: [],
      beverages: [],
      snacks: [],
      other: [],
    };

    filteredItems.forEach((item) => {
      grouped[item.category].push(item);
    });

    return Object.entries(grouped)
      .filter(([_, items]) => items.length > 0)
      .map(([category, items]) => ({
        title: categoryConfig[category as GroceryCategory].label,
        category: category as GroceryCategory,
        data: items,
      }));
  }, [filteredItems]);

  const totalItems = groceryItems.length;
  const purchasedCount = groceryItems.filter((item) => item.purchased).length;
  const progressPercent = totalItems > 0 ? Math.round((purchasedCount / totalItems) * 100) : 0;

  const handleAddItem = async (item: NewGroceryItem) => {
    setIsLoading(true);
    await addGroceryItem(item);
    setIsLoading(false);
  };

  const handleToggle = async (id: string) => {
    await toggleItemPurchased(id);
  };

  const handleDelete = async (id: string) => {
    Alert.alert(
      'Delete Item',
      'Are you sure you want to remove this item?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => removeGroceryItem(id),
        },
      ]
    );
  };

  const handleClearPurchased = () => {
    if (purchasedCount === 0) return;

    Alert.alert(
      'Clear Purchased Items',
      `Remove ${purchasedCount} purchased item${purchasedCount > 1 ? 's' : ''} from your list?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => clearPurchasedItems(),
        },
      ]
    );
  };

  const renderSectionHeader = ({ section }: { section: GrocerySection }) => {
    const config = categoryConfig[section.category];
    return (
      <View style={styles.sectionHeader}>
        <View style={[styles.sectionIcon, { backgroundColor: `${config.color}20` }]}>
          <Icon name={config.icon} size={16} color={config.color} />
        </View>
        <Text style={styles.sectionTitle}>{section.title}</Text>
        <Text style={styles.sectionCount}>{section.data.length}</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#00b894', '#00cec9']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.headerTitle}>Grocery List</Text>
            <Text style={styles.headerSubtitle}>
              {totalItems === 0
                ? 'Add items to get started'
                : `${purchasedCount} of ${totalItems} items purchased`}
            </Text>
          </View>
          {totalItems > 0 && (
            <Surface style={styles.progressCard} elevation={2}>
              <Text style={styles.progressValue}>{progressPercent}%</Text>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
              </View>
            </Surface>
          )}
        </View>

        {/* Filter Tabs */}
        <View style={styles.filterContainer}>
          {(['all', 'pending', 'purchased'] as FilterTab[]).map((filter) => (
            <TouchableOpacity
              key={filter}
              style={[styles.filterTab, activeFilter === filter && styles.filterTabActive]}
              onPress={() => setActiveFilter(filter)}
            >
              <Text style={[styles.filterLabel, activeFilter === filter && styles.filterLabelActive]}>
                {filter === 'all' ? 'All' : filter === 'pending' ? 'To Buy' : 'Purchased'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </LinearGradient>

      {/* Add Item Input */}
      <AddGroceryItemInput onAdd={handleAddItem} />

      {/* Grocery List */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#00b894" />
        </View>
      ) : sections.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconContainer}>
            <Icon name="cart-outline" size={48} color="#00b894" />
          </View>
          <Text style={styles.emptyTitle}>
            {activeFilter === 'all'
              ? 'Your list is empty'
              : activeFilter === 'pending'
              ? 'All items purchased!'
              : 'No purchased items'}
          </Text>
          <Text style={styles.emptySubtext}>
            {activeFilter === 'all'
              ? 'Add items above to build your shopping list'
              : activeFilter === 'pending'
              ? 'Great job! You have everything you need'
              : 'Items will appear here once you check them off'}
          </Text>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <GroceryItemCard
              item={item}
              onToggle={handleToggle}
              onDelete={handleDelete}
            />
          )}
          renderSectionHeader={renderSectionHeader}
          contentContainerStyle={styles.listContent}
          stickySectionHeadersEnabled={false}
        />
      )}

      {/* Clear FAB */}
      {purchasedCount > 0 && (
        <FAB
          icon="broom"
          label="Clear"
          style={styles.fab}
          onPress={handleClearPurchased}
          color="#fff"
        />
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
    paddingBottom: 16,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 4,
  },
  progressCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    minWidth: 70,
  },
  progressValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#00b894',
    marginBottom: 6,
  },
  progressBar: {
    width: 50,
    height: 4,
    backgroundColor: '#e0e0e0',
    borderRadius: 2,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#00b894',
    borderRadius: 2,
  },
  filterContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12,
    padding: 4,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  filterTabActive: {
    backgroundColor: '#fff',
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  filterLabelActive: {
    color: '#00b894',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#e8f8f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1a1a2e',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  listContent: {
    paddingVertical: 8,
    paddingBottom: 80,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    paddingTop: 16,
  },
  sectionIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  sectionTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionCount: {
    fontSize: 13,
    color: '#999',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    backgroundColor: '#e74c3c',
  },
});
