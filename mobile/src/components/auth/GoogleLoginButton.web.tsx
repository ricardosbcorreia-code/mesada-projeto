import React, { useContext, useState } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import { AuthContext } from '../../store/AuthContext';
import api from '../../services/api';

const clientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '';

export const GoogleLoginButton = () => {
  const { signIn } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);

  const handleSuccess = async (credentialResponse: any) => {
    try {
      setLoading(true);
      const token = credentialResponse.credential; // Na lib react-oauth, esse é o idToken

      if (!token) {
         throw new Error("Não foi possível obter o ID Token do Google Web.");
      }

      console.log('Token Web recebido do Google OAuth. Enviando ao Backend...');
      const response = await api.post('/auth/google', { idToken: token });

      if (response.data.success) {
        const { accessToken, refreshToken, parent } = response.data;
        await signIn(accessToken, refreshToken, parent, 'parent');
      }
    } catch (err: any) {
      console.error('Google Sign-In Web Error:', err);
      alert(err.response?.data?.error || err.message || 'Falha de conexão Web com a API.');
    } finally {
      setLoading(false);
    }
  };

  if (!clientId || clientId.includes('seu_web_client_id_aqui')) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Configure EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID no .env</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <GoogleOAuthProvider clientId={clientId}>
        {loading ? (
          <Text style={styles.loadingText}>Autenticando...</Text>
        ) : (
          <GoogleLogin
            onSuccess={handleSuccess}
            onError={() => {
              console.log('Login Falhou no Web');
              alert('O login do Google não autorizou o popup.');
            }}
            useOneTap
          />
        )}
      </GoogleOAuthProvider>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 45,
  },
  loadingText: {
    color: '#666',
    fontWeight: '600',
  },
  errorText: {
    color: 'red',
    fontSize: 12,
    textAlign: 'center'
  }
});
