import Constants from 'expo-constants';
import { Platform } from 'react-native';

export const COLORS = {
  PRIMARY: '#DA0037',
  SECONDARY: '#111111',
  BACKGROUND: '#FFFFFF',
  GRAY: '#999999',
  LIGHT_GRAY: '#f8f8f8',
  BORDER: '#ececec',
  TEXT_DARK: '#1a1a1a',

  // Status Badges & Accents
  RED_BG: '#ffeaea',
  RED_TEXT: '#A32D2D',

  GREEN_BG: '#eaf3de',
  GREEN_TEXT: '#27500A',

  BLUE_BG: '#e6f1fb',
  BLUE_TEXT: '#0C447C',

  AMBER_BG: '#faeeda',
  AMBER_TEXT: '#633806',

  PURPLE_BG: '#EEEDFE',
  PURPLE_TEXT: '#3C3489',

  MAP_GREEN: '#1D9E75',
  MAP_BLUE: '#378ADD',
} as const;

const activeIp = '192.168.1.33';

const getWebHost = (): string => {
  if (typeof window !== 'undefined' && window.location?.hostname) {
    const raw = window.location.hostname;
    return raw === '0.0.0.0' || raw === '::1' ? 'localhost' : raw;
  }
  return 'localhost';
};

const webHost = getWebHost();

export const API_URL =
  Platform.OS === 'web'
    ? `http://${webHost}:8000/backend`
    : `http://${activeIp}:8000/backend`;

if (Platform.OS === 'web') {
  console.log('Hub web backend API_URL:', API_URL);
}
