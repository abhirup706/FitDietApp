import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import {
  Text,
  Surface,
  Avatar,
  Button,
  List,
  Divider,
  Portal,
  Modal,
  TextInput,
  SegmentedButtons,
  Chip,
  Snackbar,
  IconButton,
} from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { useUserStore } from '../store/userStore';
import { ActivityLevel, Goal, DietType } from '../types';
import {
  calculateBMI,
  getBMICategory,
  calculateIdealWeightRange,
  getUserCalorieBreakdown,
  getActivityLevelDescription,
} from '../utils/calculations';

const DIET_TYPES: { value: DietType; label: string }[] = [
  { value: 'balanced', label: 'Balanced' },
  { value: 'weight_loss', label: 'Weight Loss' },
  { value: 'muscle_gain', label: 'Muscle Gain' },
  { value: 'vegetarian', label: 'Vegetarian' },
  { value: 'vegan', label: 'Vegan' },
  { value: 'keto', label: 'Keto' },
  { value: 'low_carb', label: 'Low Carb' },
];

const ACTIVITY_LEVELS: { value: ActivityLevel; label: string }[] = [
  { value: 'sedentary', label: 'Sedentary' },
  { value: 'light', label: 'Light' },
  { value: 'moderate', label: 'Moderate' },
  { value: 'active', label: 'Active' },
  { value: 'very_active', label: 'Very Active' },
];

export function ProfileScreen({ navigation }: any) {
  const { user, updateProfile, signOut } = useUserStore();

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editField, setEditField] = useState<string>('');
  const [editValue, setEditValue] = useState<string>('');
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  if (!user) {
    return (
      <View style={styles.container}>
        <Text>Please log in to view your profile</Text>
      </View>
    );
  }

  const bmi = calculateBMI(user.weight, user.height);
  const bmiCategory = getBMICategory(bmi);
  const idealWeight = calculateIdealWeightRange(user.height);
  const { bmr, tdee, target, macros } = getUserCalorieBreakdown(user);

  const getBMIColor = () => {
    if (bmiCategory === 'Normal weight') return '#4CAF50';
    if (bmiCategory === 'Underweight' || bmiCategory === 'Overweight') return '#ff9800';
    return '#ff6b6b';
  };

  const openEditModal = (field: string, currentValue: string) => {
    setEditField(field);
    setEditValue(currentValue);
    setEditModalVisible(true);
  };

  const saveEdit = async () => {
    let updates: any = {};

    switch (editField) {
      case 'name':
        updates.name = editValue;
        break;
      case 'age':
        updates.age = parseInt(editValue) || user.age;
        break;
      case 'weight':
        updates.weight = parseFloat(editValue) || user.weight;
        break;
      case 'height':
        updates.height = parseFloat(editValue) || user.height;
        break;
      case 'goal':
        updates.goal = editValue as Goal;
        break;
      case 'activityLevel':
        updates.activityLevel = editValue as ActivityLevel;
        break;
      case 'dietType':
        updates.dietaryPreferences = {
          ...user.dietaryPreferences,
          dietType: editValue as DietType,
        };
        break;
    }

    const { error } = await updateProfile(updates);
    setEditModalVisible(false);

    if (error) {
      showSnackbar('Failed to update profile');
    } else {
      showSnackbar('Profile updated successfully');
    }
  };

  const showSnackbar = (message: string) => {
    setSnackbarMessage(message);
    setSnackbarVisible(true);
  };

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: signOut,
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <LinearGradient
          colors={['#667eea', '#764ba2']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <View style={styles.avatarContainer}>
            <Avatar.Text
              size={100}
              label={user.name?.charAt(0).toUpperCase() || 'U'}
              style={styles.avatar}
              labelStyle={styles.avatarLabel}
            />
            <TouchableOpacity style={styles.editAvatarButton}>
              <IconButton icon="camera" iconColor="#667eea" size={16} />
            </TouchableOpacity>
          </View>
          <Text style={styles.name}>{user.name}</Text>
          <Text style={styles.email}>{user.email}</Text>

          {/* Quick Stats */}
          <View style={styles.quickStats}>
            <View style={styles.quickStatItem}>
              <Text style={styles.quickStatValue}>{user.age}</Text>
              <Text style={styles.quickStatLabel}>years</Text>
            </View>
            <View style={styles.quickStatDivider} />
            <View style={styles.quickStatItem}>
              <Text style={styles.quickStatValue}>{user.weight}</Text>
              <Text style={styles.quickStatLabel}>kg</Text>
            </View>
            <View style={styles.quickStatDivider} />
            <View style={styles.quickStatItem}>
              <Text style={styles.quickStatValue}>{user.height}</Text>
              <Text style={styles.quickStatLabel}>cm</Text>
            </View>
          </View>
        </LinearGradient>

        {/* BMI Card */}
        <Surface style={styles.bmiCard} elevation={4}>
          <View style={styles.bmiHeader}>
            <Text style={styles.bmiTitle}>Body Mass Index</Text>
            <View style={[styles.bmiChip, { backgroundColor: getBMIColor() + '20' }]}>
              <Text style={[styles.bmiChipText, { color: getBMIColor() }]}>{bmiCategory}</Text>
            </View>
          </View>
          <View style={styles.bmiContent}>
            <View style={styles.bmiValueContainer}>
              <Text style={[styles.bmiValue, { color: getBMIColor() }]}>{bmi}</Text>
              <Text style={styles.bmiUnit}>BMI</Text>
            </View>
            <View style={styles.bmiInfo}>
              <Text style={styles.idealWeightText}>
                Ideal weight: {idealWeight.min}-{idealWeight.max} kg
              </Text>
              <View style={styles.bmiScale}>
                {['#3498db', '#4CAF50', '#ff9800', '#ff6b6b'].map((color, i) => (
                  <View key={i} style={[styles.bmiScaleItem, { backgroundColor: color }]} />
                ))}
              </View>
              <View style={styles.bmiScaleLabels}>
                <Text style={styles.bmiScaleLabel}>Under</Text>
                <Text style={styles.bmiScaleLabel}>Normal</Text>
                <Text style={styles.bmiScaleLabel}>Over</Text>
                <Text style={styles.bmiScaleLabel}>Obese</Text>
              </View>
            </View>
          </View>
        </Surface>

        {/* Daily Targets Card */}
        <Surface style={styles.card} elevation={2}>
          <Text style={styles.cardTitle}>Daily Targets</Text>
          <View style={styles.targetsGrid}>
            <View style={styles.targetItem}>
              <LinearGradient
                colors={['#667eea', '#764ba2']}
                style={styles.targetIcon}
              >
                <IconButton icon="fire" iconColor="#fff" size={20} />
              </LinearGradient>
              <Text style={styles.targetValue}>{target}</Text>
              <Text style={styles.targetLabel}>kcal/day</Text>
            </View>
            <View style={styles.targetItem}>
              <View style={[styles.targetIcon, { backgroundColor: '#e91e63' }]}>
                <IconButton icon="food-steak" iconColor="#fff" size={20} />
              </View>
              <Text style={styles.targetValue}>{macros.protein}g</Text>
              <Text style={styles.targetLabel}>Protein</Text>
            </View>
            <View style={styles.targetItem}>
              <View style={[styles.targetIcon, { backgroundColor: '#2196F3' }]}>
                <IconButton icon="bread-slice" iconColor="#fff" size={20} />
              </View>
              <Text style={styles.targetValue}>{macros.carbs}g</Text>
              <Text style={styles.targetLabel}>Carbs</Text>
            </View>
            <View style={styles.targetItem}>
              <View style={[styles.targetIcon, { backgroundColor: '#ff9800' }]}>
                <IconButton icon="water" iconColor="#fff" size={20} />
              </View>
              <Text style={styles.targetValue}>{macros.fat}g</Text>
              <Text style={styles.targetLabel}>Fat</Text>
            </View>
          </View>
          <Divider style={styles.divider} />
          <View style={styles.calorieBreakdown}>
            <View style={styles.calorieItem}>
              <Text style={styles.calorieLabel}>BMR (Base Metabolic Rate)</Text>
              <Text style={styles.calorieValue}>{bmr} kcal</Text>
            </View>
            <View style={styles.calorieItem}>
              <Text style={styles.calorieLabel}>TDEE (Total Daily Energy)</Text>
              <Text style={styles.calorieValue}>{tdee} kcal</Text>
            </View>
          </View>
        </Surface>

        {/* Personal Info */}
        <Surface style={styles.card} elevation={2}>
          <Text style={styles.cardTitle}>Personal Information</Text>
          <TouchableOpacity
            style={styles.listItem}
            onPress={() => openEditModal('name', user.name)}
          >
            <View style={styles.listItemIcon}>
              <IconButton icon="account" iconColor="#667eea" size={20} />
            </View>
            <View style={styles.listItemContent}>
              <Text style={styles.listItemTitle}>Name</Text>
              <Text style={styles.listItemValue}>{user.name}</Text>
            </View>
            <IconButton icon="chevron-right" iconColor="#ccc" size={20} />
          </TouchableOpacity>
          <Divider style={styles.listDivider} />
          <TouchableOpacity
            style={styles.listItem}
            onPress={() => openEditModal('age', user.age.toString())}
          >
            <View style={styles.listItemIcon}>
              <IconButton icon="cake" iconColor="#e91e63" size={20} />
            </View>
            <View style={styles.listItemContent}>
              <Text style={styles.listItemTitle}>Age</Text>
              <Text style={styles.listItemValue}>{user.age} years</Text>
            </View>
            <IconButton icon="chevron-right" iconColor="#ccc" size={20} />
          </TouchableOpacity>
          <Divider style={styles.listDivider} />
          <TouchableOpacity
            style={styles.listItem}
            onPress={() => openEditModal('weight', user.weight.toString())}
          >
            <View style={styles.listItemIcon}>
              <IconButton icon="scale" iconColor="#4CAF50" size={20} />
            </View>
            <View style={styles.listItemContent}>
              <Text style={styles.listItemTitle}>Weight</Text>
              <Text style={styles.listItemValue}>{user.weight} kg</Text>
            </View>
            <IconButton icon="chevron-right" iconColor="#ccc" size={20} />
          </TouchableOpacity>
          <Divider style={styles.listDivider} />
          <TouchableOpacity
            style={styles.listItem}
            onPress={() => openEditModal('height', user.height.toString())}
          >
            <View style={styles.listItemIcon}>
              <IconButton icon="human-male-height" iconColor="#2196F3" size={20} />
            </View>
            <View style={styles.listItemContent}>
              <Text style={styles.listItemTitle}>Height</Text>
              <Text style={styles.listItemValue}>{user.height} cm</Text>
            </View>
            <IconButton icon="chevron-right" iconColor="#ccc" size={20} />
          </TouchableOpacity>
        </Surface>

        {/* Goals & Preferences */}
        <Surface style={styles.card} elevation={2}>
          <Text style={styles.cardTitle}>Goals & Preferences</Text>
          <TouchableOpacity
            style={styles.listItem}
            onPress={() => openEditModal('goal', user.goal)}
          >
            <View style={styles.listItemIcon}>
              <IconButton icon="target" iconColor="#ff9800" size={20} />
            </View>
            <View style={styles.listItemContent}>
              <Text style={styles.listItemTitle}>Goal</Text>
              <Text style={styles.listItemValue}>
                {user.goal.charAt(0).toUpperCase() + user.goal.slice(1)} weight
              </Text>
            </View>
            <IconButton icon="chevron-right" iconColor="#ccc" size={20} />
          </TouchableOpacity>
          <Divider style={styles.listDivider} />
          <TouchableOpacity
            style={styles.listItem}
            onPress={() => openEditModal('activityLevel', user.activityLevel)}
          >
            <View style={styles.listItemIcon}>
              <IconButton icon="run" iconColor="#9c27b0" size={20} />
            </View>
            <View style={styles.listItemContent}>
              <Text style={styles.listItemTitle}>Activity Level</Text>
              <Text style={styles.listItemValue}>
                {getActivityLevelDescription(user.activityLevel)}
              </Text>
            </View>
            <IconButton icon="chevron-right" iconColor="#ccc" size={20} />
          </TouchableOpacity>
          <Divider style={styles.listDivider} />
          <TouchableOpacity
            style={styles.listItem}
            onPress={() => openEditModal('dietType', user.dietaryPreferences?.dietType || 'balanced')}
          >
            <View style={styles.listItemIcon}>
              <IconButton icon="food-apple" iconColor="#4CAF50" size={20} />
            </View>
            <View style={styles.listItemContent}>
              <Text style={styles.listItemTitle}>Diet Type</Text>
              <Text style={styles.listItemValue}>
                {DIET_TYPES.find((d) => d.value === user.dietaryPreferences?.dietType)?.label || 'Balanced'}
              </Text>
            </View>
            <IconButton icon="chevron-right" iconColor="#ccc" size={20} />
          </TouchableOpacity>
        </Surface>

        {/* Sign Out */}
        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <IconButton icon="logout" iconColor="#ff6b6b" size={20} />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Edit Modal */}
      <Portal>
        <Modal
          visible={editModalVisible}
          onDismiss={() => setEditModalVisible(false)}
          contentContainerStyle={styles.modalContent}
        >
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              Edit {editField.charAt(0).toUpperCase() + editField.slice(1)}
            </Text>
            <IconButton
              icon="close"
              onPress={() => setEditModalVisible(false)}
              iconColor="#666"
              size={20}
            />
          </View>

          {editField === 'goal' ? (
            <View style={styles.optionsList}>
              {[
                { value: 'lose', label: 'Lose Weight', icon: '⬇️' },
                { value: 'maintain', label: 'Maintain Weight', icon: '⚖️' },
                { value: 'gain', label: 'Gain Weight', icon: '⬆️' },
              ].map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.optionItem,
                    editValue === option.value && styles.optionItemSelected,
                  ]}
                  onPress={() => setEditValue(option.value)}
                >
                  <Text style={styles.optionIcon}>{option.icon}</Text>
                  <Text style={[
                    styles.optionLabel,
                    editValue === option.value && styles.optionLabelSelected,
                  ]}>{option.label}</Text>
                  {editValue === option.value && (
                    <IconButton icon="check" iconColor="#667eea" size={20} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          ) : editField === 'activityLevel' ? (
            <View style={styles.chipGroup}>
              {ACTIVITY_LEVELS.map((level) => (
                <Chip
                  key={level.value}
                  selected={editValue === level.value}
                  onPress={() => setEditValue(level.value)}
                  style={[
                    styles.selectionChip,
                    editValue === level.value && styles.selectionChipSelected,
                  ]}
                  textStyle={editValue === level.value ? styles.chipTextSelected : undefined}
                >
                  {level.label}
                </Chip>
              ))}
            </View>
          ) : editField === 'dietType' ? (
            <View style={styles.chipGroup}>
              {DIET_TYPES.map((diet) => (
                <Chip
                  key={diet.value}
                  selected={editValue === diet.value}
                  onPress={() => setEditValue(diet.value)}
                  style={[
                    styles.selectionChip,
                    editValue === diet.value && styles.selectionChipSelected,
                  ]}
                  textStyle={editValue === diet.value ? styles.chipTextSelected : undefined}
                >
                  {diet.label}
                </Chip>
              ))}
            </View>
          ) : (
            <TextInput
              value={editValue}
              onChangeText={setEditValue}
              mode="outlined"
              keyboardType={['age', 'weight', 'height'].includes(editField) ? 'numeric' : 'default'}
              style={styles.input}
              outlineColor="#e0e0e0"
              activeOutlineColor="#667eea"
            />
          )}

          <View style={styles.modalButtons}>
            <Button
              mode="outlined"
              onPress={() => setEditModalVisible(false)}
              style={styles.cancelButton}
              textColor="#666"
            >
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={saveEdit}
              style={styles.saveButton}
              buttonColor="#667eea"
            >
              Save
            </Button>
          </View>
        </Modal>
      </Portal>

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
    paddingTop: 20,
    paddingBottom: 30,
    alignItems: 'center',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    backgroundColor: '#fff',
  },
  avatarLabel: {
    color: '#667eea',
    fontSize: 40,
    fontWeight: 'bold',
  },
  editAvatarButton: {
    position: 'absolute',
    right: -4,
    bottom: -4,
    backgroundColor: '#fff',
    borderRadius: 16,
    elevation: 2,
  },
  name: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 16,
  },
  email: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  quickStats: {
    flexDirection: 'row',
    marginTop: 24,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  quickStatItem: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  quickStatValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
  },
  quickStatLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },
  quickStatDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  bmiCard: {
    marginHorizontal: 16,
    marginTop: -15,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
  },
  bmiHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  bmiTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a2e',
  },
  bmiChip: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  bmiChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  bmiContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bmiValueContainer: {
    alignItems: 'center',
    marginRight: 24,
  },
  bmiValue: {
    fontSize: 48,
    fontWeight: 'bold',
  },
  bmiUnit: {
    fontSize: 14,
    color: '#666',
    marginTop: -4,
  },
  bmiInfo: {
    flex: 1,
  },
  idealWeightText: {
    fontSize: 13,
    color: '#666',
    marginBottom: 12,
  },
  bmiScale: {
    flexDirection: 'row',
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  bmiScaleItem: {
    flex: 1,
  },
  bmiScaleLabels: {
    flexDirection: 'row',
    marginTop: 4,
  },
  bmiScaleLabel: {
    flex: 1,
    fontSize: 10,
    color: '#999',
  },
  card: {
    margin: 16,
    marginBottom: 0,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a2e',
    marginBottom: 16,
  },
  targetsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  targetItem: {
    alignItems: 'center',
  },
  targetIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  targetValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a2e',
  },
  targetLabel: {
    fontSize: 11,
    color: '#666',
    marginTop: 2,
  },
  divider: {
    marginVertical: 16,
    backgroundColor: '#f0f0f0',
  },
  calorieBreakdown: {},
  calorieItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  calorieLabel: {
    fontSize: 14,
    color: '#666',
  },
  calorieValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a2e',
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  listItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  listItemContent: {
    flex: 1,
    marginLeft: 12,
  },
  listItemTitle: {
    fontSize: 14,
    color: '#666',
  },
  listItemValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a2e',
    marginTop: 2,
  },
  listDivider: {
    marginLeft: 52,
    backgroundColor: '#f0f0f0',
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    margin: 16,
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#ffcdd2',
  },
  signOutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ff6b6b',
  },
  bottomSpacer: {
    height: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    margin: 20,
    borderRadius: 24,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a2e',
  },
  optionsList: {},
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 8,
    backgroundColor: '#f5f5f5',
  },
  optionItemSelected: {
    backgroundColor: '#667eea15',
    borderWidth: 2,
    borderColor: '#667eea',
  },
  optionIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  optionLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a2e',
  },
  optionLabelSelected: {
    color: '#667eea',
  },
  input: {
    marginBottom: 16,
    backgroundColor: '#fff',
  },
  chipGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  selectionChip: {
    backgroundColor: '#f5f5f5',
  },
  selectionChipSelected: {
    backgroundColor: '#667eea',
  },
  chipTextSelected: {
    color: '#fff',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  cancelButton: {
    flex: 1,
    borderColor: '#e0e0e0',
  },
  saveButton: {
    flex: 1,
  },
  snackbar: {
    backgroundColor: '#1a1a2e',
  },
});
