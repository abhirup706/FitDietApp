import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Provider as PaperProvider, MD3LightTheme } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import { useUserStore } from './src/store/userStore';
import {
  HomeScreen,
  DietLogScreen,
  FitnessScreen,
  SuggestionsScreen,
  ProfileScreen,
  AuthScreen,
  OnboardingScreen,
} from './src/screens';
import { RootStackParamList, MainTabParamList } from './src/types';
import { ActivityIndicator, View } from 'react-native';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

// Custom theme
const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#6200EE',
    secondary: '#03DAC6',
    background: '#f5f5f5',
  },
};

// Main tab navigator
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: string;

          switch (route.name) {
            case 'Home':
              iconName = focused ? 'home' : 'home-outline';
              break;
            case 'DietLog':
              iconName = focused ? 'food-apple' : 'food-apple-outline';
              break;
            case 'Fitness':
              iconName = focused ? 'run' : 'run';
              break;
            case 'Suggestions':
              iconName = focused ? 'lightbulb' : 'lightbulb-outline';
              break;
            case 'Profile':
              iconName = focused ? 'account' : 'account-outline';
              break;
            default:
              iconName = 'circle';
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#6200EE',
        tabBarInactiveTintColor: 'gray',
        headerStyle: {
          backgroundColor: '#6200EE',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ title: 'Dashboard' }}
      />
      <Tab.Screen
        name="DietLog"
        component={DietLogScreen}
        options={{ title: 'Log Meal' }}
      />
      <Tab.Screen
        name="Fitness"
        component={FitnessScreen}
        options={{ title: 'Fitness' }}
      />
      <Tab.Screen
        name="Suggestions"
        component={SuggestionsScreen}
        options={{ title: 'Suggestions' }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: 'Profile' }}
      />
    </Tab.Navigator>
  );
}

// Loading screen
function LoadingScreen() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" color="#6200EE" />
    </View>
  );
}

// Root navigator
function RootNavigator() {
  const { isAuthenticated, isLoading, user, checkSession } = useUserStore();

  useEffect(() => {
    checkSession();
  }, []);

  if (isLoading) {
    return <LoadingScreen />;
  }

  // Check if user needs onboarding (no profile data)
  const needsOnboarding = isAuthenticated && user && (!user.age || !user.height || !user.weight);

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!isAuthenticated ? (
        <Stack.Screen name="Auth" component={AuthScreen} />
      ) : needsOnboarding ? (
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      ) : (
        <Stack.Screen name="Main" component={MainTabs} />
      )}
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <PaperProvider theme={theme}>
        <NavigationContainer>
          <RootNavigator />
          <StatusBar style="light" />
        </NavigationContainer>
      </PaperProvider>
    </SafeAreaProvider>
  );
}
