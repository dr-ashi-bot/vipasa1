import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import HomeScreen from './src/screens/HomeScreen';
import LearningScreen from './src/screens/LearningScreen';
import { userApi } from './src/services/api';

const Stack = createStackNavigator();

// For demo purposes, we'll use a default user ID
// In production, this would come from authentication
const DEFAULT_USER_ID = 'demo-user-001';

export default function App() {
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    initializeUser();
  }, []);

  const initializeUser = async () => {
    try {
      // Try to get existing user
      let user;
      try {
        const response = await userApi.get(DEFAULT_USER_ID);
        user = response.data;
      } catch (error) {
        // User doesn't exist, create them
        const response = await userApi.create({
          first_name: 'Ashi',
          thematic_interests: ['gymnastics', 'cute puppies'],
          math_level: 6,
          ela_level: 4,
        });
        user = response.data;
      }

      setUserId(user.user_id);
    } catch (error) {
      console.error('Failed to initialize user:', error);
      // Fallback to demo user ID
      setUserId(DEFAULT_USER_ID);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <StatusBar style="auto" />
      <Stack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: '#4CAF50',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        <Stack.Screen
          name="Home"
          options={{ title: 'Adaptive Learning' }}
        >
          {(props) => <HomeScreen {...props} userId={userId || DEFAULT_USER_ID} />}
        </Stack.Screen>
        <Stack.Screen
          name="Learning"
          component={LearningScreen}
          options={{ title: 'Learning Session' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
