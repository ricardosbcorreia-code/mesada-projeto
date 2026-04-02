import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { ActivityIndicator, View } from 'react-native';

import { AuthContext } from '../store/AuthContext';
import { RootStackParamList } from './types';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import ParentStack from './ParentStack';
import ChildNavigator from './ChildNavigator';
import { Colors } from '../utils/theme';
import { usePushNotifications } from '../hooks/usePushNotifications';

const Stack = createStackNavigator<RootStackParamList>();

export default function AppNavigation() {
  const { signed, role, loading } = React.useContext(AuthContext);
  usePushNotifications(signed);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background }}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!signed ? (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        ) : role === 'parent' ? (
          <Stack.Screen name="ParentTabs" component={ParentStack} />
        ) : (
          <Stack.Screen name="ChildTabs" component={ChildNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
