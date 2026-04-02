import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../utils/theme';
import { ChildTabParamList } from './types';

import ChildDashboard from '../screens/child/ChildDashboard';
import ChecklistScreen from '../screens/child/ChecklistScreen';

const Tab = createBottomTabNavigator<ChildTabParamList>();

export default function ChildNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: Colors.secondary,
        tabBarInactiveTintColor: Colors.textLight,
        tabBarStyle: {
          backgroundColor: '#1A1A2E',
          borderTopColor: '#2D2D4E',
          paddingBottom: 4,
          height: 60,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '700', color: '#fff' },
        tabBarIcon: ({ focused, color, size }) => {
          const icons: Record<string, keyof typeof Ionicons.glyphMap> = {
            Inicio: focused ? 'star' : 'star-outline',
            Checklist: focused ? 'checkmark-circle' : 'checkmark-circle-outline',
          };
          return <Ionicons name={icons[route.name]} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Inicio" component={ChildDashboard} options={{ tabBarLabel: 'Início' }} />
      <Tab.Screen name="Checklist" component={ChecklistScreen} options={{ tabBarLabel: 'Tarefas do Dia' }} />
    </Tab.Navigator>
  );
}
