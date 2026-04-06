import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../utils/config';

const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('@auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Se o erro for 401 e não for uma tentativa de refresh recursiva
    if (error.response?.status === 401 && !originalRequest._retry && !originalRequest.url?.includes('/auth/refresh')) {
      originalRequest._retry = true;

      try {
        const refreshToken = await AsyncStorage.getItem('@auth_refresh_token');
        
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        // Tenta renovar o token
        const response = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
        const { accessToken, refreshToken: newRefreshToken } = response.data;

        // Salva os novos tokens
        await AsyncStorage.setItem('@auth_token', accessToken);
        await AsyncStorage.setItem('@auth_refresh_token', newRefreshToken);

        // Atualiza o header da requisição original e tenta novamente
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Se falhar o refresh, limpa tudo e desloga
        await AsyncStorage.multiRemove([
          '@auth_token', 
          '@auth_refresh_token', 
          '@auth_user', 
          '@auth_role'
        ]);
        
        if (typeof window !== 'undefined') {
          window.location.reload();
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
