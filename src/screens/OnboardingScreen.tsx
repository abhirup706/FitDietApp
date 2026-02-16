import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, Dimensions } from 'react-native';
import {
  Text,
  Button,
  Surface,
  TextInput,
  SegmentedButtons,
  Chip,
  ProgressBar,
  Snackbar,
} from 'react-native-paper';
import { useUserStore } from '../store/userStore';
import { ActivityLevel, Goal, DietType } from '../types';
import { calculateDailyCalorieTarget, calculateMacroTargets } from '../utils/calculations';

const { width } = Dimensions.get('window');

const STEPS = [
  { title: 'Basic Info', subtitle: 'Tell us about yourself' },
  { title: 'Body Stats', subtitle: 'Your current measurements' },
  { title: 'Activity Level', subtitle: 'How active are you?' },
  { title: 'Goals', subtitle: 'What do you want to achieve?' },
  { title: 'Diet Preferences', subtitle: 'Customize your diet' },
];

const ACTIVITY_LEVELS: { value: ActivityLevel; label: string; description: string }[] = [
  { value: 'sedentary', label: 'Sedentary', description: 'Little or no exercise' },
  { value: 'light', label: 'Light', description: 'Exercise 1-3 days/week' },
  { value: 'moderate', label: 'Moderate', description: 'Exercise 3-5 days/week' },
  { value: 'active', label: 'Active', description: 'Exercise 6-7 days/week' },
  { value: 'very_active', label: 'Very Active', description: 'Hard exercise daily' },
];

const DIET_TYPES: { value: DietType; label: string }[] = [
  { value: 'balanced', label: 'Balanced' },
  { value: 'weight_loss', label: 'Weight Loss' },
  { value: 'muscle_gain', label: 'Muscle Gain' },
  { value: 'vegetarian', label: 'Vegetarian' },
  { value: 'vegan', label: 'Vegan' },
  { value: 'keto', label: 'Keto' },
  { value: 'low_carb', label: 'Low Carb' },
];

export function OnboardingScreen({ navigation }: any) {
  const { user, completeOnboarding, isLoading } = useUserStore();

  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    age: '',
    gender: 'other' as 'male' | 'female' | 'other',
    height: '',
    weight: '',
    activityLevel: 'moderate' as ActivityLevel,
    goal: 'maintain' as Goal,
    dietType: 'balanced' as DietType,
    allergies: [] as string[],
  });
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  const progress = (currentStep + 1) / STEPS.length;

  const updateField = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const toggleAllergy = (allergy: string) => {
    setFormData((prev) => ({
      ...prev,
      allergies: prev.allergies.includes(allergy)
        ? prev.allergies.filter((a) => a !== allergy)
        : [...prev.allergies, allergy],
    }));
  };

  const validateStep = (): boolean => {
    switch (currentStep) {
      case 0:
        if (!formData.name.trim()) {
          showSnackbar('Please enter your name');
          return false;
        }
        break;
      case 1:
        if (!formData.age || !formData.height || !formData.weight) {
          showSnackbar('Please fill in all fields');
          return false;
        }
        if (parseInt(formData.age) < 13 || parseInt(formData.age) > 120) {
          showSnackbar('Please enter a valid age');
          return false;
        }
        break;
    }
    return true;
  };

  const nextStep = () => {
    if (!validateStep()) return;

    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    const dailyCalorieTarget = calculateDailyCalorieTarget(
      parseFloat(formData.weight),
      parseFloat(formData.height),
      parseInt(formData.age),
      formData.gender,
      formData.activityLevel,
      formData.goal
    );

    const { error } = await completeOnboarding({
      name: formData.name,
      age: parseInt(formData.age),
      height: parseFloat(formData.height),
      weight: parseFloat(formData.weight),
      gender: formData.gender,
      activityLevel: formData.activityLevel,
      goal: formData.goal,
      dietaryPreferences: {
        dietType: formData.dietType,
        allergies: formData.allergies,
        restrictions: [],
      },
      dailyCalorieTarget,
    });

    if (error) {
      showSnackbar('Failed to save profile. Please try again.');
    }
  };

  const showSnackbar = (message: string) => {
    setSnackbarMessage(message);
    setSnackbarVisible(true);
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <View style={styles.stepContent}>
            <TextInput
              label="Your Name"
              value={formData.name}
              onChangeText={(value) => updateField('name', value)}
              mode="outlined"
              style={styles.input}
            />
            <Text style={styles.label}>Gender</Text>
            <SegmentedButtons
              value={formData.gender}
              onValueChange={(value) => updateField('gender', value)}
              buttons={[
                { value: 'male', label: 'Male' },
                { value: 'female', label: 'Female' },
                { value: 'other', label: 'Other' },
              ]}
              style={styles.segmented}
            />
          </View>
        );

      case 1:
        return (
          <View style={styles.stepContent}>
            <TextInput
              label="Age"
              value={formData.age}
              onChangeText={(value) => updateField('age', value)}
              mode="outlined"
              keyboardType="numeric"
              style={styles.input}
              right={<TextInput.Affix text="years" />}
            />
            <TextInput
              label="Height"
              value={formData.height}
              onChangeText={(value) => updateField('height', value)}
              mode="outlined"
              keyboardType="numeric"
              style={styles.input}
              right={<TextInput.Affix text="cm" />}
            />
            <TextInput
              label="Weight"
              value={formData.weight}
              onChangeText={(value) => updateField('weight', value)}
              mode="outlined"
              keyboardType="numeric"
              style={styles.input}
              right={<TextInput.Affix text="kg" />}
            />
          </View>
        );

      case 2:
        return (
          <View style={styles.stepContent}>
            {ACTIVITY_LEVELS.map((level) => (
              <Surface
                key={level.value}
                style={[
                  styles.activityCard,
                  formData.activityLevel === level.value && styles.activityCardSelected,
                ]}
                elevation={formData.activityLevel === level.value ? 2 : 0}
                onTouchEnd={() => updateField('activityLevel', level.value)}
              >
                <Text
                  style={[
                    styles.activityLabel,
                    formData.activityLevel === level.value && styles.activityLabelSelected,
                  ]}
                >
                  {level.label}
                </Text>
                <Text style={styles.activityDescription}>{level.description}</Text>
              </Surface>
            ))}
          </View>
        );

      case 3:
        return (
          <View style={styles.stepContent}>
            <Surface
              style={[styles.goalCard, formData.goal === 'lose' && styles.goalCardSelected]}
              elevation={formData.goal === 'lose' ? 2 : 0}
              onTouchEnd={() => updateField('goal', 'lose')}
            >
              <Text style={styles.goalIcon}>⬇️</Text>
              <Text style={styles.goalLabel}>Lose Weight</Text>
              <Text style={styles.goalDescription}>Calorie deficit for weight loss</Text>
            </Surface>

            <Surface
              style={[styles.goalCard, formData.goal === 'maintain' && styles.goalCardSelected]}
              elevation={formData.goal === 'maintain' ? 2 : 0}
              onTouchEnd={() => updateField('goal', 'maintain')}
            >
              <Text style={styles.goalIcon}>⚖️</Text>
              <Text style={styles.goalLabel}>Maintain Weight</Text>
              <Text style={styles.goalDescription}>Stay at your current weight</Text>
            </Surface>

            <Surface
              style={[styles.goalCard, formData.goal === 'gain' && styles.goalCardSelected]}
              elevation={formData.goal === 'gain' ? 2 : 0}
              onTouchEnd={() => updateField('goal', 'gain')}
            >
              <Text style={styles.goalIcon}>⬆️</Text>
              <Text style={styles.goalLabel}>Gain Weight</Text>
              <Text style={styles.goalDescription}>Calorie surplus for muscle gain</Text>
            </Surface>
          </View>
        );

      case 4:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.label}>Diet Type</Text>
            <View style={styles.chipContainer}>
              {DIET_TYPES.map((diet) => (
                <Chip
                  key={diet.value}
                  selected={formData.dietType === diet.value}
                  onPress={() => updateField('dietType', diet.value)}
                  style={styles.chip}
                >
                  {diet.label}
                </Chip>
              ))}
            </View>

            <Text style={[styles.label, { marginTop: 24 }]}>Allergies (optional)</Text>
            <View style={styles.chipContainer}>
              {['Nuts', 'Dairy', 'Gluten', 'Eggs', 'Soy', 'Shellfish'].map((allergy) => (
                <Chip
                  key={allergy}
                  selected={formData.allergies.includes(allergy.toLowerCase())}
                  onPress={() => toggleAllergy(allergy.toLowerCase())}
                  style={styles.chip}
                >
                  {allergy}
                </Chip>
              ))}
            </View>

            {/* Preview */}
            {formData.age && formData.height && formData.weight && (
              <Surface style={styles.previewCard} elevation={1}>
                <Text style={styles.previewTitle}>Your Daily Target</Text>
                <Text style={styles.previewCalories}>
                  {calculateDailyCalorieTarget(
                    parseFloat(formData.weight),
                    parseFloat(formData.height),
                    parseInt(formData.age),
                    formData.gender,
                    formData.activityLevel,
                    formData.goal
                  )}{' '}
                  kcal
                </Text>
                <View style={styles.previewMacros}>
                  {(() => {
                    const target = calculateDailyCalorieTarget(
                      parseFloat(formData.weight),
                      parseFloat(formData.height),
                      parseInt(formData.age),
                      formData.gender,
                      formData.activityLevel,
                      formData.goal
                    );
                    const macros = calculateMacroTargets(target, formData.dietType);
                    return (
                      <>
                        <Chip compact>P: {macros.protein}g</Chip>
                        <Chip compact>C: {macros.carbs}g</Chip>
                        <Chip compact>F: {macros.fat}g</Chip>
                      </>
                    );
                  })()}
                </View>
              </Surface>
            )}
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      {/* Progress */}
      <View style={styles.progressContainer}>
        <ProgressBar progress={progress} color="#6200EE" style={styles.progressBar} />
        <Text style={styles.stepIndicator}>
          Step {currentStep + 1} of {STEPS.length}
        </Text>
      </View>

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{STEPS[currentStep].title}</Text>
        <Text style={styles.subtitle}>{STEPS[currentStep].subtitle}</Text>
      </View>

      {/* Content */}
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {renderStepContent()}
      </ScrollView>

      {/* Navigation */}
      <View style={styles.navigation}>
        {currentStep > 0 && (
          <Button mode="outlined" onPress={prevStep} style={styles.navButton}>
            Back
          </Button>
        )}
        <Button
          mode="contained"
          onPress={nextStep}
          loading={isLoading}
          disabled={isLoading}
          style={[styles.navButton, styles.nextButton]}
        >
          {currentStep === STEPS.length - 1 ? 'Complete' : 'Next'}
        </Button>
      </View>

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
    backgroundColor: '#fff',
  },
  progressContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
  },
  stepIndicator: {
    textAlign: 'center',
    marginTop: 8,
    color: '#666',
    fontSize: 12,
  },
  header: {
    padding: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  stepContent: {
    flex: 1,
  },
  input: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  segmented: {
    marginBottom: 16,
  },
  activityCard: {
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    backgroundColor: '#f5f5f5',
  },
  activityCardSelected: {
    backgroundColor: '#E8DEF8',
    borderWidth: 2,
    borderColor: '#6200EE',
  },
  activityLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  activityLabelSelected: {
    color: '#6200EE',
  },
  activityDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  goalCard: {
    padding: 20,
    marginBottom: 12,
    borderRadius: 12,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
  },
  goalCardSelected: {
    backgroundColor: '#E8DEF8',
    borderWidth: 2,
    borderColor: '#6200EE',
  },
  goalIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  goalLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  goalDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    marginBottom: 4,
  },
  previewCard: {
    marginTop: 24,
    padding: 20,
    borderRadius: 12,
    backgroundColor: '#E8DEF8',
    alignItems: 'center',
  },
  previewTitle: {
    fontSize: 14,
    color: '#666',
  },
  previewCalories: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#6200EE',
    marginVertical: 8,
  },
  previewMacros: {
    flexDirection: 'row',
    gap: 8,
  },
  navigation: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  navButton: {
    flex: 1,
    marginHorizontal: 8,
  },
  nextButton: {
    flex: 2,
  },
});
