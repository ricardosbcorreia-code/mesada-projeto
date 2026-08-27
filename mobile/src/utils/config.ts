import { Platform } from 'react-native';

// Updated: Always use the machine's local Wi-Fi IP so both the emulator and the physical phone can access it.
export const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';
