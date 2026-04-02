import { Platform } from 'react-native';

// For Android Emulator localhost is 10.0.2.2. For iOS it is localhost.
// Replace with your local network IP if testing on a physical device.
export const API_URL = Platform.OS === 'android' ? 'http://10.0.2.2:3000/api' : 'http://localhost:3000/api';
