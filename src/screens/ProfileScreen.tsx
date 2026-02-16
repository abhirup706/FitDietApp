import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, Alert } from 'react-native';
import {
  Text,
  Surface,
  Avatar,
  Button,
  Card,
  List,
  Divider,
  Portal,
  Modal,
  TextInput,
  SegmentedButtons,
  Chip,
  Switch,
  Snackbar,
} from 'react-native-paper';
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
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Profile Header */}
        <Surface style={styles.header} elevation={0}>
          <Avatar.Text
            size={80}
            label={user.name?.charAt(0).toUpperCase() || 'U'}
            style={styles.avatar}
          />
          <Text style={styles.name}>{user.name}</Text>
          <Text style={styles.email}>{user.email}</Text>
        </Surface>

        {/* Stats Overview */}
        <Card style={styles.card}>
          <Card.Title title="Body Stats" />
          <Card.Content>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{bmi}</Text>
                <Text style={styles.statLabel}>BMI</Text>
                <Chip
                  compact
                  style={[
                    styles.bmiChip,
                    { backgroundColor: bmiCategory === 'Normal weight' ? '#E8F5E9' : '#FFF3E0' },
                  ]}
                >
                  {bmiCategory}
                </Chip>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{user.weight}</Text>
                <Text style={styles.statLabel}>Weight (kg)</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{user.height}</Text>
                <Text style={styles.statLabel}>Height (cm)</Text>
              </View>
            </View>
            <Text style={styles.idealWeight}>
              Ideal weight range: {idealWeight.min}-{idealWeight.max} kg
            </Text>
          </Card.Content>
        </Card>

        {/* Calorie Breakdown */}
        <Card style={styles.card}>
          <Card.Title title="Daily Targets" />
          <Card.Content>
            <View style={styles.calorieBreakdown}>
              <View style={styles.calorieItem}>
                <Text style={styles.calorieLabel}>BMR</Text>
                <Text style={styles.calorieValue}>{bmr} kcal</Text>
              </View>
              <View style={styles.calorieItem}>
                <Text style={styles.calorieLabel}>TDEE</Text>
                <Text style={styles.calorieValue}>{tdee} kcal</Text>
              </View>
              <View style={styles.calorieItem}>
                <Text style={[styles.calorieLabel, { fontWeight: 'bold' }]}>Target</Text>
                <Text style={[styles.calorieValue, { fontWeight: 'bold', color: '#6200EE' }]}>
                  {target} kcal
                </Text>
              </View>
            </View>
            <Divider style={styles.divider} />
            <Text style={styles.macroTitle}>Macro Targets</Text>
            <View style={styles.macroRow}>
              <Chip icon="food-steak" style={styles.macroChip}>
                P: {macros.protein}g
              </Chip>
              <Chip icon="bread-slice" style={styles.macroChip}>
                C: {macros.carbs}g
              </Chip>
              <Chip icon="water" style={styles.macroChip}>
                F: {macros.fat}g
              </Chip>
            </View>
          </Card.Content>
        </Card>

        {/* Personal Info */}
        <Card style={styles.card}>
          <Card.Title title="Personal Information" />
          <Card.Content>
            <List.Item
              title="Name"
              description={user.name}
              left={(props) => <List.Icon {...props} icon="account" />}
              right={() => <Button onPress={() => openEditModal('name', user.name)}>Edit</Button>}
            />
            <Divider />
            <List.Item
              title="Age"
              description={`${user.age} years`}
              left={(props) => <List.Icon {...props} icon="cake" />}
              right={() => <Button onPress={() => openEditModal('age', user.age.toString())}>Edit</Button>}
            />
            <Divider />
            <List.Item
              title="Weight"
              description={`${user.weight} kg`}
              left={(props) => <List.Icon {...props} icon="scale" />}
              right={() => <Button onPress={() => openEditModal('weight', user.weight.toString())}>Edit</Button>}
            />
            <Divider />
            <List.Item
              title="Height"
              description={`${user.height} cm`}
              left={(props) => <List.Icon {...props} icon="human-male-height" />}
              right={() => <Button onPress={() => openEditModal('height', user.height.toString())}>Edit</Button>}
            />
          </Card.Content>
        </Card>

        {/* Goals & Preferences */}
        <Card style={styles.card}>
          <Card.Title title="Goals & Preferences" />
          <Card.Content>
            <List.Item
              title="Goal"
              description={user.goal.charAt(0).toUpperCase() + user.goal.slice(1) + ' weight'}
              left={(props) => <List.Icon {...props} icon="target" />}
              right={() => <Button onPress={() => openEditModal('goal', user.goal)}>Edit</Button>}
            />
            <Divider />
            <List.Item
              title="Activity Level"
              description={getActivityLevelDescription(user.activityLevel)}
              left={(props) => <List.Icon {...props} icon="run" />}
              right={() => <Button onPress={() => openEditModal('activityLevel', user.activityLevel)}>Edit</Button>}
            />
            <Divider />
            <List.Item
              title="Diet Type"
              description={
                DIET_TYPES.find((d) => d.value === user.dietaryPreferences?.dietType)?.label ||
                'Balanced'
              }
              left={(props) => <List.Icon {...props} icon="food-apple" />}
              right={() =>
                <Button onPress={() => openEditModal('dietType', user.dietaryPreferences?.dietType || 'balanced')}>
                  Edit
                </Button>
              }
            />
          </Card.Content>
        </Card>

        {/* Sign Out */}
        <Button
          mode="outlined"
          onPress={handleSignOut}
          style={styles.signOutButton}
          textColor="#F44336"
        >
          Sign Out
        </Button>
      </ScrollView>

      {/* Edit Modal */}
      <Portal>
        <Modal
          visible={editModalVisible}
          onDismiss={() => setEditModalVisible(false)}
          contentContainerStyle={styles.modalContent}
        >
          <Text style={styles.modalTitle}>
            Edit {editField.charAt(0).toUpperCase() + editField.slice(1)}
          </Text>

          {editField === 'goal' ? (
            <SegmentedButtons
              value={editValue}
              onValueChange={setEditValue}
              buttons={[
                { value: 'lose', label: 'Lose' },
                { value: 'maintain', label: 'Maintain' },
                { value: 'gain', label: 'Gain' },
              ]}
              style={styles.segmentedButtons}
            />
          ) : editField === 'activityLevel' ? (
            <View style={styles.chipGroup}>
              {ACTIVITY_LEVELS.map((level) => (
                <Chip
                  key={level.value}
                  selected={editValue === level.value}
                  onPress={() => setEditValue(level.value)}
                  style={styles.selectionChip}
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
                  style={styles.selectionChip}
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
            />
          )}

          <View style={styles.modalButtons}>
            <Button mode="outlined" onPress={() => setEditModalVisible(false)}>
              Cancel
            </Button>
            <Button mode="contained" onPress={saveEdit}>
              Save
            </Button>
          </View>
        </Modal>
      </Portal>

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
  scrollContent: {
    paddingBottom: 20,
  },
  header: {
    padding: 24,
    alignItems: 'center',
    backgroundColor: '#6200EE',
  },
  avatar: {
    backgroundColor: '#fff',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 12,
  },
  email: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  card: {
    margin: 16,
    marginBottom: 0,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  bmiChip: {
    marginTop: 8,
  },
  idealWeight: {
    textAlign: 'center',
    color: '#666',
    fontSize: 12,
  },
  calorieBreakdown: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  calorieItem: {
    alignItems: 'center',
  },
  calorieLabel: {
    fontSize: 12,
    color: '#666',
  },
  calorieValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 4,
  },
  divider: {
    marginVertical: 16,
  },
  macroTitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  macroRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  macroChip: {
    backgroundColor: '#f0f0f0',
  },
  signOutButton: {
    margin: 16,
    borderColor: '#F44336',
  },
  modalContent: {
    backgroundColor: '#fff',
    margin: 20,
    padding: 20,
    borderRadius: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
  },
  input: {
    marginBottom: 16,
  },
  segmentedButtons: {
    marginBottom: 16,
  },
  chipGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  selectionChip: {
    marginBottom: 4,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
});
