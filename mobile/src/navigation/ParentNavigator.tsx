import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../utils/theme';
import { ParentTabParamList } from './types';

import ParentDashboard from '../screens/parent/ParentDashboard';
import TaskListScreen from '../screens/parent/TaskListScreen';
import MonthlyReportScreen from '../screens/parent/MonthlyReportScreen';
import ParentRewardsScreen from '../screens/parent/ParentRewardsScreen';

const Tab = createBottomTabNavigator<ParentTabParamList>();

export default function ParentNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textLight,
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopColor: Colors.border,
          paddingBottom: 4,
          height: 60,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        tabBarIcon: ({ focused, color, size }) => {
          const icons: Record<string, keyof typeof Ionicons.glyphMap> = {
            Dashboard: focused ? 'home' : 'home-outline',
            Tarefas: focused ? 'list' : 'list-outline',
            Relatorio: focused ? 'bar-chart' : 'bar-chart-outline',
            Loja: focused ? 'gift' : 'gift-outline',
          };
          return <Ionicons name={icons[route.name]} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={ParentDashboard} options={{ tabBarLabel: 'Início' }} />
      <Tab.Screen name="Tarefas" component={TaskListScreen} options={{ tabBarLabel: 'Tarefas' }} />
      <Tab.Screen name="Relatorio" component={MonthlyReportScreen} options={{ tabBarLabel: 'Relatório' }} />
      <Tab.Screen name="Loja" component={ParentRewardsScreen} options={{ tabBarLabel: 'Loja' }} />
    </Tab.Navigator>
  );
}
