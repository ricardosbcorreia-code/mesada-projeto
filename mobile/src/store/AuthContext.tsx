import React, { createContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type UserRole = 'parent' | 'child' | null;

interface UserData {
  id: string;
  name: string;
  email?: string;
  base_allowance?: string | number;
}

interface AuthContextData {
  signed: boolean;
  role: UserRole;
  user: UserData | null;
  loading: boolean;
  signIn: (accessToken: string, refreshToken: string, userData: UserData, role: UserRole) => Promise<void>;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserData | null>(null);
  const [role, setRole] = useState<UserRole>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStorageData() {
      const storageUser = await AsyncStorage.getItem('@auth_user');
      const storageRole = await AsyncStorage.getItem('@auth_role');
      const storageToken = await AsyncStorage.getItem('@auth_token');
      const storageRefreshToken = await AsyncStorage.getItem('@auth_refresh_token');

      if (storageUser && storageRole && storageToken && storageRefreshToken) {
        setUser(JSON.parse(storageUser));
        setRole(storageRole as UserRole);
      }
      setLoading(false);
    }

    loadStorageData();
  }, []);

  const signIn = async (accessToken: string, refreshToken: string, userData: UserData, userRole: UserRole) => {
    setUser(userData);
    setRole(userRole);

    await AsyncStorage.setItem('@auth_token', accessToken);
    await AsyncStorage.setItem('@auth_refresh_token', refreshToken);
    await AsyncStorage.setItem('@auth_user', JSON.stringify(userData));
    if (userRole) {
      await AsyncStorage.setItem('@auth_role', userRole);
    }
  };

  const signOut = async () => {
    await AsyncStorage.multiRemove([
      '@auth_token',
      '@auth_refresh_token',
      '@auth_user',
      '@auth_role'
    ]);
    setUser(null);
    setRole(null);
  };

  return (
    <AuthContext.Provider value={{ signed: !!user, user, role, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
