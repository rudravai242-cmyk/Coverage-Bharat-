import { NetworkTech, Provider } from './types';

export const TECH_COLORS: Record<NetworkTech, string> = {
  '5G': '#AF52DE', // Electric Purple
  '4G': '#007AFF', // Azure Blue
  '3G': '#FF9500', // Vibrant Orange
  '2G': '#FF3B30', // Vibrant Red
};

export const PROVIDERS: Provider[] = [
  { id: 'jio', name: 'Jio', color: '#0F3CC9' },
  { id: 'airtel', name: 'Airtel', color: '#ED1C24' },
  { id: 'vi', name: 'Vodafone Idea', color: '#FF0000' },
  { id: 'bsnl', name: 'BSNL', color: '#0054A6' },
];

export const INITIAL_CENTER = { lat: 28.6139, lng: 77.2090 }; // Delhi
export const INITIAL_ZOOM = 12;
