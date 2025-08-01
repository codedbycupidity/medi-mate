import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';

// Import screens
import HomeScreen from '../screens/HomeScreen';
import LoginScreen from '../screens/LoginScreen';
import MedicationListScreen from '../screens/MedicationListScreen';
import MedicationDetailScreen from '../screens/MedicationDetailScreen';
import ReminderListScreen from '../screens/ReminderListScreen';
import ProfileScreen from '../screens/ProfileScreen';

export type RootStackParamList = {
  Login: undefined;
  Home: undefined;
  MedicationList: undefined;
  MedicationDetail: {medicationId: string};
  ReminderList: undefined;
  Profile: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

function AppNavigator() {
  // TODO: Add authentication check
  const isAuthenticated = false;

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={isAuthenticated ? 'Home' : 'Login'}
        screenOptions={{
          headerStyle: {
            backgroundColor: '#007AFF',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}>
        {!isAuthenticated ? (
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{headerShown: false}}
          />
        ) : (
          <>
            <Stack.Screen
              name="Home"
              component={HomeScreen}
              options={{title: 'MediMate'}}
            />
            <Stack.Screen
              name="MedicationList"
              component={MedicationListScreen}
              options={{title: 'My Medications'}}
            />
            <Stack.Screen
              name="MedicationDetail"
              component={MedicationDetailScreen}
              options={{title: 'Medication Details'}}
            />
            <Stack.Screen
              name="ReminderList"
              component={ReminderListScreen}
              options={{title: 'My Reminders'}}
            />
            <Stack.Screen
              name="Profile"
              component={ProfileScreen}
              options={{title: 'Profile'}}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default AppNavigator;