import { NetworkTech, Provider } from './types';

export const TECH_COLORS: Record<NetworkTech, string> = {
  '5G': '#A855F7', // Purple
  '4G': '#3B82F6', // Blue
  '3G': '#F59E0B', // Amber/Orange
  '2G': '#EF4444', // Red
};

export const PROVIDERS: Provider[] = [
  { id: 'jio', name: 'Jio', color: '#0F3CC9' },
  { id: 'airtel', name: 'Airtel', color: '#ED1C24' },
  { id: 'vi', name: 'Vodafone Idea', color: '#FF0000' },
  { id: 'bsnl', name: 'BSNL', color: '#0054A6' },
];

export const INITIAL_CENTER = { lat: 28.6139, lng: 77.2090 }; // Delhi
export const INITIAL_ZOOM = 12;
