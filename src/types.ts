export type NetworkTech = '5G' | '4G' | '3G' | '2G';

export interface CoveragePoint {
  id: string;
  lat: number;
  lng: number;
  tech: NetworkTech;
  provider: string;
  accuracy: number;
  timestamp: number;
  speed?: {
    download: number; // Mbps
    upload: number;   // Mbps
    latency: number;  // ms
  };
}

export interface Provider {
  id: string;
  name: string;
  color: string;
}

export interface NetworkReport {
  id: string;
  lat: number;
  lng: number;
  issue: string;
  photoUrl?: string;
  timestamp: number;
  userLocation: { lat: number; lng: number };
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}
