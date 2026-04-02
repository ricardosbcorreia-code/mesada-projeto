import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { ParentStackParamList } from './types';
import ParentNavigator from './ParentNavigator';
import AddChildScreen from '../screens/parent/AddChildScreen';

const Stack = createStackNavigator<ParentStackParamList>();

export default function ParentStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ParentMain" component={ParentNavigator} />
      <Stack.Screen name="AddChild" component={AddChildScreen} />
    </Stack.Navigator>
  );
}
