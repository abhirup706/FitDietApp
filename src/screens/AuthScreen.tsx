import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Dimensions,
  ImageBackground,
} from 'react-native';
import {
  Text,
  TextInput,
  Button,
  Surface,
  HelperText,
  Snackbar,
  IconButton,
} from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { useUserStore } from '../store/userStore';

const { height } = Dimensions.get('window');

type AuthMode = 'signin' | 'signup';

export function AuthScreen({ navigation }: any) {
  const { signIn, signUp, isLoading } = useUserStore();

  const [mode, setMode] = useState<AuthMode>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (mode === 'signup' && !name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Invalid email address';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (mode === 'signup' && password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    let result;
    if (mode === 'signin') {
      result = await signIn(email, password);
    } else {
      result = await signUp(email, password, name);
    }

    if (result.error) {
      setSnackbarMessage(result.error.message || 'Authentication failed');
      setSnackbarVisible(true);
    } else if (mode === 'signup') {
      setSnackbarMessage('Account created successfully!');
      setSnackbarVisible(true);
      setMode('signin');
    }
  };

  const toggleMode = () => {
    setMode(mode === 'signin' ? 'signup' : 'signin');
    setErrors({});
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Logo Section */}
            <View style={styles.logoSection}>
              <View style={styles.logoCircle}>
                <Text style={styles.logoIcon}>🥗</Text>
              </View>
              <Text style={styles.appName}>FitDiet</Text>
              <Text style={styles.tagline}>Your personal nutrition companion</Text>
            </View>

            {/* Form Card */}
            <Surface style={styles.card} elevation={4}>
              <Text style={styles.cardTitle}>
                {mode === 'signin' ? 'Welcome Back' : 'Create Account'}
              </Text>
              <Text style={styles.cardSubtitle}>
                {mode === 'signin'
                  ? 'Sign in to continue your journey'
                  : 'Start your health journey today'}
              </Text>

              {mode === 'signup' && (
                <View style={styles.inputContainer}>
                  <TextInput
                    label="Full Name"
                    value={name}
                    onChangeText={setName}
                    mode="outlined"
                    error={!!errors.name}
                    autoCapitalize="words"
                    left={<TextInput.Icon icon="account-outline" />}
                    style={styles.input}
                    outlineStyle={styles.inputOutline}
                  />
                  {errors.name && <HelperText type="error">{errors.name}</HelperText>}
                </View>
              )}

              <View style={styles.inputContainer}>
                <TextInput
                  label="Email"
                  value={email}
                  onChangeText={setEmail}
                  mode="outlined"
                  error={!!errors.email}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  left={<TextInput.Icon icon="email-outline" />}
                  style={styles.input}
                  outlineStyle={styles.inputOutline}
                />
                {errors.email && <HelperText type="error">{errors.email}</HelperText>}
              </View>

              <View style={styles.inputContainer}>
                <TextInput
                  label="Password"
                  value={password}
                  onChangeText={setPassword}
                  mode="outlined"
                  error={!!errors.password}
                  secureTextEntry={!showPassword}
                  left={<TextInput.Icon icon="lock-outline" />}
                  right={
                    <TextInput.Icon
                      icon={showPassword ? 'eye-off' : 'eye'}
                      onPress={() => setShowPassword(!showPassword)}
                    />
                  }
                  style={styles.input}
                  outlineStyle={styles.inputOutline}
                />
                {errors.password && <HelperText type="error">{errors.password}</HelperText>}
              </View>

              {mode === 'signup' && (
                <View style={styles.inputContainer}>
                  <TextInput
                    label="Confirm Password"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    mode="outlined"
                    error={!!errors.confirmPassword}
                    secureTextEntry={!showPassword}
                    left={<TextInput.Icon icon="lock-check-outline" />}
                    style={styles.input}
                    outlineStyle={styles.inputOutline}
                  />
                  {errors.confirmPassword && (
                    <HelperText type="error">{errors.confirmPassword}</HelperText>
                  )}
                </View>
              )}

              <Button
                mode="contained"
                onPress={handleSubmit}
                loading={isLoading}
                disabled={isLoading}
                style={styles.submitButton}
                contentStyle={styles.submitButtonContent}
                labelStyle={styles.submitButtonLabel}
              >
                {mode === 'signin' ? 'Sign In' : 'Create Account'}
              </Button>

              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>or</Text>
                <View style={styles.dividerLine} />
              </View>

              <Button
                mode="outlined"
                onPress={toggleMode}
                style={styles.toggleButton}
                labelStyle={styles.toggleButtonLabel}
              >
                {mode === 'signin'
                  ? "Don't have an account? Sign Up"
                  : 'Already have an account? Sign In'}
              </Button>
            </Surface>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={4000}
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
  },
  gradient: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
    minHeight: height,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  logoIcon: {
    fontSize: 40,
  },
  appName: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: 1,
  },
  tagline: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 8,
  },
  card: {
    padding: 24,
    borderRadius: 24,
    backgroundColor: '#fff',
  },
  cardTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a2e',
    textAlign: 'center',
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  inputContainer: {
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
  },
  inputOutline: {
    borderRadius: 12,
  },
  submitButton: {
    marginTop: 16,
    borderRadius: 12,
    backgroundColor: '#667eea',
  },
  submitButtonContent: {
    paddingVertical: 8,
  },
  submitButtonLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e0e0e0',
  },
  dividerText: {
    marginHorizontal: 16,
    color: '#999',
    fontSize: 14,
  },
  toggleButton: {
    borderRadius: 12,
    borderColor: '#667eea',
  },
  toggleButtonLabel: {
    color: '#667eea',
    fontSize: 14,
  },
  snackbar: {
    backgroundColor: '#333',
  },
});
