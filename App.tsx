import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Provider as PaperProvider, MD3LightTheme, ActivityIndicator, Text } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import { useUserStore } from './src/store/userStore';
import {
  HomeScreen,
  DietLogScreen,
  FitnessScreen,
  GroceryScreen,
  SuggestionsScreen,
  ProfileScreen,
  AuthScreen,
  OnboardingScreen,
} from './src/screens';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#6200EE',
    secondary: '#03DAC6',
    background: '#f5f5f5',
  },
};

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName = 'circle';
          if (route.name === 'Home') iconName = focused ? 'home' : 'home-outline';
          else if (route.name === 'DietLog') iconName = focused ? 'food-apple' : 'food-apple-outline';
          else if (route.name === 'Fitness') iconName = 'run';
          else if (route.name === 'Grocery') iconName = focused ? 'cart' : 'cart-outline';
          else if (route.name === 'Suggestions') iconName = focused ? 'lightbulb' : 'lightbulb-outline';
          else if (route.name === 'Profile') iconName = focused ? 'account' : 'account-outline';
          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#6200EE',
        tabBarInactiveTintColor: 'gray',
        headerStyle: { backgroundColor: '#6200EE' },
        headerTintColor: '#fff',
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'Dashboard', headerShown: false }} />
      <Tab.Screen name="DietLog" component={DietLogScreen} options={{ title: 'Log Meal', headerShown: false }} />
      <Tab.Screen name="Fitness" component={FitnessScreen} options={{ title: 'Fitness', headerShown: false }} />
      <Tab.Screen name="Grocery" component={GroceryScreen} options={{ title: 'Grocery', headerShown: false }} />
      <Tab.Screen name="Suggestions" component={SuggestionsScreen} options={{ title: 'Suggestions', headerShown: false }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profile', headerShown: false }} />
    </Tab.Navigator>
  );
}

function LoadingScreen() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
      <ActivityIndicator size="large" color="#6200EE" />
      <Text style={{ marginTop: 16 }}>Loading...</Text>
    </View>
  );
}

function RootNavigator() {
  const [isReady, setIsReady] = useState(false);
  const store = useUserStore();

  useEffect(() => {
    const init = async () => {
      try {
        await store.checkSession();
      } catch (e) {
        console.log('Session check error:', e);
      }
      setIsReady(true);
    };
    init();
  }, []);

  if (!isReady) {
    return <LoadingScreen />;
  }

  const isAuth = store.isAuthenticated === true;
  const needsOnboarding = isAuth && store.user && (!store.user.age || !store.user.height || !store.user.weight);

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!isAuth ? (
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
