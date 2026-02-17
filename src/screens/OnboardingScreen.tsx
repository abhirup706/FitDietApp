import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import {
  Text,
  Button,
  Surface,
  TextInput,
  SegmentedButtons,
  Chip,
  Snackbar,
  IconButton,
} from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { useUserStore } from '../store/userStore';
import { ActivityLevel, Goal, DietType } from '../types';
import { calculateDailyCalorieTarget, calculateMacroTargets } from '../utils/calculations';

const { width } = Dimensions.get('window');

const STEPS = [
  { title: 'Welcome', subtitle: "Let's get to know you", icon: '👋' },
  { title: 'Body Stats', subtitle: 'Your current measurements', icon: '📏' },
  { title: 'Activity', subtitle: 'How active are you?', icon: '🏃' },
  { title: 'Goals', subtitle: 'What do you want to achieve?', icon: '🎯' },
  { title: 'Diet', subtitle: 'Customize your preferences', icon: '🥗' },
];

const ACTIVITY_LEVELS: { value: ActivityLevel; label: string; description: string; icon: string }[] = [
  { value: 'sedentary', label: 'Sedentary', description: 'Little or no exercise', icon: '🪑' },
  { value: 'light', label: 'Light', description: 'Exercise 1-3 days/week', icon: '🚶' },
  { value: 'moderate', label: 'Moderate', description: 'Exercise 3-5 days/week', icon: '🏃' },
  { value: 'active', label: 'Active', description: 'Exercise 6-7 days/week', icon: '💪' },
  { value: 'very_active', label: 'Very Active', description: 'Hard exercise daily', icon: '🔥' },
];

const DIET_TYPES: { value: DietType; label: string; icon: string }[] = [
  { value: 'balanced', label: 'Balanced', icon: '⚖️' },
  { value: 'weight_loss', label: 'Weight Loss', icon: '📉' },
  { value: 'muscle_gain', label: 'Muscle Gain', icon: '💪' },
  { value: 'vegetarian', label: 'Vegetarian', icon: '🥬' },
  { value: 'vegan', label: 'Vegan', icon: '🌱' },
  { value: 'keto', label: 'Keto', icon: '🥑' },
  { value: 'low_carb', label: 'Low Carb', icon: '🍖' },
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
            <Surface style={styles.inputCard} elevation={2}>
              <TextInput
                label="Your Name"
                value={formData.name}
                onChangeText={(value) => updateField('name', value)}
                mode="outlined"
                style={styles.input}
                outlineColor="#e0e0e0"
                activeOutlineColor="#667eea"
                left={<TextInput.Icon icon="account" color="#667eea" />}
              />
            </Surface>

            <Text style={styles.label}>Gender</Text>
            <View style={styles.genderContainer}>
              {[
                { value: 'male', label: 'Male', icon: '👨' },
                { value: 'female', label: 'Female', icon: '👩' },
                { value: 'other', label: 'Other', icon: '👤' },
              ].map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.genderOption,
                    formData.gender === option.value && styles.genderOptionSelected,
                  ]}
                  onPress={() => updateField('gender', option.value)}
                >
                  <Text style={styles.genderIcon}>{option.icon}</Text>
                  <Text style={[
                    styles.genderLabel,
                    formData.gender === option.value && styles.genderLabelSelected,
                  ]}>{option.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );

      case 1:
        return (
          <View style={styles.stepContent}>
            <Surface style={styles.inputCard} elevation={2}>
              <TextInput
                label="Age"
                value={formData.age}
                onChangeText={(value) => updateField('age', value)}
                mode="outlined"
                keyboardType="numeric"
                style={styles.input}
                outlineColor="#e0e0e0"
                activeOutlineColor="#667eea"
                left={<TextInput.Icon icon="cake" color="#e91e63" />}
                right={<TextInput.Affix text="years" />}
              />
              <TextInput
                label="Height"
                value={formData.height}
                onChangeText={(value) => updateField('height', value)}
                mode="outlined"
                keyboardType="numeric"
                style={styles.input}
                outlineColor="#e0e0e0"
                activeOutlineColor="#667eea"
                left={<TextInput.Icon icon="human-male-height" color="#2196F3" />}
                right={<TextInput.Affix text="cm" />}
              />
              <TextInput
                label="Weight"
                value={formData.weight}
                onChangeText={(value) => updateField('weight', value)}
                mode="outlined"
                keyboardType="numeric"
                style={[styles.input, { marginBottom: 0 }]}
                outlineColor="#e0e0e0"
                activeOutlineColor="#667eea"
                left={<TextInput.Icon icon="scale" color="#4CAF50" />}
                right={<TextInput.Affix text="kg" />}
              />
            </Surface>
          </View>
        );

      case 2:
        return (
          <View style={styles.stepContent}>
            {ACTIVITY_LEVELS.map((level) => (
              <TouchableOpacity
                key={level.value}
                style={[
                  styles.activityCard,
                  formData.activityLevel === level.value && styles.activityCardSelected,
                ]}
                onPress={() => updateField('activityLevel', level.value)}
              >
                <Text style={styles.activityIcon}>{level.icon}</Text>
                <View style={styles.activityInfo}>
                  <Text style={[
                    styles.activityLabel,
                    formData.activityLevel === level.value && styles.activityLabelSelected,
                  ]}>
                    {level.label}
                  </Text>
                  <Text style={styles.activityDescription}>{level.description}</Text>
                </View>
                {formData.activityLevel === level.value && (
                  <IconButton icon="check-circle" iconColor="#667eea" size={24} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        );

      case 3:
        return (
          <View style={styles.stepContent}>
            {[
              { value: 'lose', label: 'Lose Weight', icon: '⬇️', desc: 'Calorie deficit for weight loss', gradient: ['#ff6b6b', '#ff8e8e'] },
              { value: 'maintain', label: 'Maintain Weight', icon: '⚖️', desc: 'Stay at your current weight', gradient: ['#667eea', '#764ba2'] },
              { value: 'gain', label: 'Gain Weight', icon: '⬆️', desc: 'Calorie surplus for muscle gain', gradient: ['#4CAF50', '#81c784'] },
            ].map((goal) => (
              <TouchableOpacity
                key={goal.value}
                style={[
                  styles.goalCard,
                  formData.goal === goal.value && styles.goalCardSelected,
                ]}
                onPress={() => updateField('goal', goal.value)}
              >
                {formData.goal === goal.value ? (
                  <LinearGradient
                    colors={goal.gradient as [string, string]}
                    style={styles.goalIconContainer}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Text style={styles.goalIcon}>{goal.icon}</Text>
                  </LinearGradient>
                ) : (
                  <View style={styles.goalIconContainerInactive}>
                    <Text style={styles.goalIcon}>{goal.icon}</Text>
                  </View>
                )}
                <View style={styles.goalInfo}>
                  <Text style={[
                    styles.goalLabel,
                    formData.goal === goal.value && styles.goalLabelSelected,
                  ]}>
                    {goal.label}
                  </Text>
                  <Text style={styles.goalDescription}>{goal.desc}</Text>
                </View>
                {formData.goal === goal.value && (
                  <IconButton icon="check-circle" iconColor="#667eea" size={24} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        );

      case 4:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.label}>Diet Type</Text>
            <View style={styles.dietGrid}>
              {DIET_TYPES.map((diet) => (
                <TouchableOpacity
                  key={diet.value}
                  style={[
                    styles.dietChip,
                    formData.dietType === diet.value && styles.dietChipSelected,
                  ]}
                  onPress={() => updateField('dietType', diet.value)}
                >
                  <Text style={styles.dietIcon}>{diet.icon}</Text>
                  <Text style={[
                    styles.dietLabel,
                    formData.dietType === diet.value && styles.dietLabelSelected,
                  ]}>{diet.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.label, { marginTop: 24 }]}>Allergies (optional)</Text>
            <View style={styles.allergyGrid}>
              {[
                { name: 'Nuts', icon: '🥜' },
                { name: 'Dairy', icon: '🥛' },
                { name: 'Gluten', icon: '🌾' },
                { name: 'Eggs', icon: '🥚' },
                { name: 'Soy', icon: '🫘' },
                { name: 'Shellfish', icon: '🦐' },
              ].map((allergy) => (
                <TouchableOpacity
                  key={allergy.name}
                  style={[
                    styles.allergyChip,
                    formData.allergies.includes(allergy.name.toLowerCase()) && styles.allergyChipSelected,
                  ]}
                  onPress={() => toggleAllergy(allergy.name.toLowerCase())}
                >
                  <Text style={styles.allergyIcon}>{allergy.icon}</Text>
                  <Text style={[
                    styles.allergyLabel,
                    formData.allergies.includes(allergy.name.toLowerCase()) && styles.allergyLabelSelected,
                  ]}>{allergy.name}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Preview */}
            {formData.age && formData.height && formData.weight && (
              <Surface style={styles.previewCard} elevation={3}>
                <LinearGradient
                  colors={['#667eea', '#764ba2']}
                  style={styles.previewGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Text style={styles.previewTitle}>Your Daily Target</Text>
                  <Text style={styles.previewCalories}>
                    {calculateDailyCalorieTarget(
                      parseFloat(formData.weight),
                      parseFloat(formData.height),
                      parseInt(formData.age),
                      formData.gender,
                      formData.activityLevel,
                      formData.goal
                    )}
                  </Text>
                  <Text style={styles.previewUnit}>calories per day</Text>
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
                          <View style={styles.previewMacro}>
                            <Text style={styles.previewMacroValue}>{macros.protein}g</Text>
                            <Text style={styles.previewMacroLabel}>Protein</Text>
                          </View>
                          <View style={styles.previewMacroDivider} />
                          <View style={styles.previewMacro}>
                            <Text style={styles.previewMacroValue}>{macros.carbs}g</Text>
                            <Text style={styles.previewMacroLabel}>Carbs</Text>
                          </View>
                          <View style={styles.previewMacroDivider} />
                          <View style={styles.previewMacro}>
                            <Text style={styles.previewMacroValue}>{macros.fat}g</Text>
                            <Text style={styles.previewMacroLabel}>Fat</Text>
                          </View>
                        </>
                      );
                    })()}
                  </View>
                </LinearGradient>
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
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.headerGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Progress Indicators */}
        <View style={styles.progressContainer}>
          {STEPS.map((_, index) => (
            <View
              key={index}
              style={[
                styles.progressDot,
                index <= currentStep && styles.progressDotActive,
              ]}
            />
          ))}
        </View>

        {/* Step Header */}
        <View style={styles.stepHeader}>
          <Text style={styles.stepIcon}>{STEPS[currentStep].icon}</Text>
          <Text style={styles.stepTitle}>{STEPS[currentStep].title}</Text>
          <Text style={styles.stepSubtitle}>{STEPS[currentStep].subtitle}</Text>
        </View>
      </LinearGradient>

      {/* Content */}
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {renderStepContent()}
      </ScrollView>

      {/* Navigation */}
      <View style={styles.navigation}>
        {currentStep > 0 && (
          <Button
            mode="outlined"
            onPress={prevStep}
            style={styles.backButton}
            textColor="#666"
          >
            Back
          </Button>
        )}
        <Button
          mode="contained"
          onPress={nextStep}
          loading={isLoading}
          disabled={isLoading}
          style={[styles.nextButton, currentStep === 0 && { flex: 1, marginLeft: 0 }]}
          buttonColor="#667eea"
        >
          {currentStep === STEPS.length - 1 ? 'Get Started' : 'Continue'}
        </Button>
      </View>

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
  headerGradient: {
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 24,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  progressDotActive: {
    backgroundColor: '#fff',
    width: 24,
  },
  stepHeader: {
    alignItems: 'center',
  },
  stepIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  stepTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  stepSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
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
  inputCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    marginBottom: 20,
  },
  input: {
    marginBottom: 12,
    backgroundColor: '#fff',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a2e',
    marginBottom: 12,
  },
  genderContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  genderOption: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  genderOptionSelected: {
    borderColor: '#667eea',
    backgroundColor: '#667eea10',
  },
  genderIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  genderLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  genderLabelSelected: {
    color: '#667eea',
  },
  activityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  activityCardSelected: {
    borderColor: '#667eea',
    backgroundColor: '#667eea10',
  },
  activityIcon: {
    fontSize: 32,
    marginRight: 16,
  },
  activityInfo: {
    flex: 1,
  },
  activityLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a2e',
  },
  activityLabelSelected: {
    color: '#667eea',
  },
  activityDescription: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  goalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  goalCardSelected: {
    borderColor: '#667eea',
    backgroundColor: '#667eea10',
  },
  goalIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  goalIconContainerInactive: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  goalIcon: {
    fontSize: 28,
  },
  goalInfo: {
    flex: 1,
  },
  goalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a2e',
  },
  goalLabelSelected: {
    color: '#667eea',
  },
  goalDescription: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  dietGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  dietChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  dietChipSelected: {
    borderColor: '#667eea',
    backgroundColor: '#667eea10',
  },
  dietIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  dietLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  dietLabelSelected: {
    color: '#667eea',
    fontWeight: '600',
  },
  allergyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  allergyChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  allergyChipSelected: {
    borderColor: '#ff6b6b',
    backgroundColor: '#ff6b6b10',
  },
  allergyIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  allergyLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#666',
  },
  allergyLabelSelected: {
    color: '#ff6b6b',
    fontWeight: '600',
  },
  previewCard: {
    marginTop: 24,
    borderRadius: 20,
    overflow: 'hidden',
  },
  previewGradient: {
    padding: 24,
    alignItems: 'center',
  },
  previewTitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  previewCalories: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#fff',
    marginVertical: 8,
  },
  previewUnit: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 20,
  },
  previewMacros: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  previewMacro: {
    alignItems: 'center',
    flex: 1,
  },
  previewMacroDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  previewMacroValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  previewMacroLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },
  navigation: {
    flexDirection: 'row',
    padding: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    gap: 12,
  },
  backButton: {
    flex: 1,
    borderColor: '#e0e0e0',
  },
  nextButton: {
    flex: 2,
  },
  snackbar: {
    backgroundColor: '#1a1a2e',
  },
});
