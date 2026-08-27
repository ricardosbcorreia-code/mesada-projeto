import React, { useCallback, useState, useContext } from 'react';
import { AuthContext } from '../../store/AuthContext';
import { Button } from '../ui';
import { StyleSheet, Alert, View, Text } from 'react-native';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import api from '../../services/api';

const GOOGLE_WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;

if (GOOGLE_WEB_CLIENT_ID) {
  GoogleSignin.configure({
    webClientId: GOOGLE_WEB_CLIENT_ID,
    offlineAccess: true,
  });
}

export const GoogleLoginButton = () => {
  const { signIn } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);

  // Se o Client ID não está configurado, não renderiza o botão
  if (!GOOGLE_WEB_CLIENT_ID) {
    return null;
  }

  const onPress = useCallback(async () => {
    try {
      setLoading(true);
      
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      
      let token = userInfo.data?.idToken || (userInfo as any).idToken;
      
      if (!token) {
         throw new Error("Não foi possível obter o ID Token do Google.");
      }
      
      const response = await api.post('/auth/google', { idToken: token });
      
      if (response.data.success) {
        const { accessToken, refreshToken, parent } = response.data;
        await signIn(accessToken, refreshToken, parent, 'parent');
      }

    } catch (err: any) {
      if (err.code === statusCodes.SIGN_IN_CANCELLED) {
        console.log('Login cancelado pelo usuário');
      } else if (err.code === statusCodes.IN_PROGRESS) {
        console.log('Login em progresso');
      } else if (err.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        Alert.alert('Erro', 'Google Play Services não disponível no dispositivo.');
      } else {
        console.error('Google Sign-In Error:', err);
        Alert.alert('Erro', err.response?.data?.error || err.message || 'Falha de conexão.');
      }
    } finally {
      setLoading(false);
    }
  }, [signIn]);

  return (
    <Button
      title="Entrar com Google"
      onPress={onPress}
      variant="outline"
      loading={loading}
      style={styles.button}
      textStyle={styles.buttonText}
    />
  );
};

const styles = StyleSheet.create({
  button: {
    marginTop: 12,
    borderColor: '#ddd',
    borderWidth: 1,
    backgroundColor: '#fff',
  },
  buttonText: {
    color: '#444',
    fontWeight: '600',
  },
});
