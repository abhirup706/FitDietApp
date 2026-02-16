import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import {
  Text,
  TextInput,
  Button,
  Surface,
  HelperText,
  Snackbar,
} from 'react-native-paper';
import { useUserStore } from '../store/userStore';

type AuthMode = 'signin' | 'signup';

export function AuthScreen({ navigation }: any) {
  const { signIn, signUp, isLoading } = useUserStore();

  const [mode, setMode] = useState<AuthMode>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
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
      setSnackbarMessage('Account created! Please check your email to verify.');
      setSnackbarVisible(true);
      setMode('signin');
    }
  };

  const toggleMode = () => {
    setMode(mode === 'signin' ? 'signup' : 'signin');
    setErrors({});
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <Surface style={styles.content} elevation={2}>
        <Text style={styles.title}>FitDiet</Text>
        <Text style={styles.subtitle}>
          {mode === 'signin' ? 'Welcome back!' : 'Create your account'}
        </Text>

        {mode === 'signup' && (
          <View style={styles.inputContainer}>
            <TextInput
              label="Name"
              value={name}
              onChangeText={setName}
              mode="outlined"
              error={!!errors.name}
              autoCapitalize="words"
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
            secureTextEntry
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
              secureTextEntry
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
        >
          {mode === 'signin' ? 'Sign In' : 'Sign Up'}
        </Button>

        <Button mode="text" onPress={toggleMode} style={styles.toggleButton}>
          {mode === 'signin'
            ? "Don't have an account? Sign Up"
            : 'Already have an account? Sign In'}
        </Button>
      </Surface>

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={4000}
      >
        {snackbarMessage}
      </Snackbar>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#6200EE',
  },
  content: {
    padding: 24,
    borderRadius: 16,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#6200EE',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
    marginBottom: 24,
  },
  inputContainer: {
    marginBottom: 12,
  },
  submitButton: {
    marginTop: 16,
    paddingVertical: 8,
  },
  toggleButton: {
    marginTop: 12,
  },
});
