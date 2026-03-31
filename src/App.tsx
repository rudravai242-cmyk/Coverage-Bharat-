import React, { useState, useCallback, useEffect, useMemo } from 'react';
import Map from './components/Map';
import SearchBox from './components/SearchBox';
import ProviderSelector from './components/ProviderSelector';
import Controls from './components/Controls';
import Legend from './components/Legend';
import HistoricalPlayback from './components/HistoricalPlayback';
import Chatbot from './components/Chatbot';
import ReportModal from './components/ReportModal';
import { INITIAL_CENTER, INITIAL_ZOOM, PROVIDERS } from './constants';
import { CoveragePoint, NetworkTech, NetworkReport } from './types';
import { motion, AnimatePresence } from 'motion/react';
import { Info, Wifi, MapPin } from 'lucide-react';

// Mock data generator with timestamps
const generateMockPoints = (center: { lat: number; lng: number }, count: number, timeRangeDays: number = 30): CoveragePoint[] => {
  const techs: NetworkTech[] = ['5G', '4G', '3G', '2G'];
  const providerNames = PROVIDERS.map(p => p.name);
  const now = Date.now();
  const rangeMs = timeRangeDays * 24 * 60 * 60 * 1000;
  
  return Array.from({ length: count }).map((_, i) => ({
    id: `mock-${i}-${Math.random()}`,
    lat: center.lat + (Math.random() - 0.5) * 0.2,
    lng: center.lng + (Math.random() - 0.5) * 0.2,
    tech: techs[Math.floor(Math.random() * techs.length)],
    provider: providerNames[Math.floor(Math.random() * providerNames.length)],
    accuracy: Math.random() * 45 + 5,
    timestamp: now - Math.random() * rangeMs,
  }));
};

export default function App() {
  const [center, setCenter] = useState(INITIAL_CENTER);
  const [zoom, setZoom] = useState(INITIAL_ZOOM);
  const [allPoints, setAllPoints] = useState<CoveragePoint[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [mapInstance, setMapInstance] = useState<any>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);

  // Historical Playback State
  const now = useMemo(() => Date.now(), []);
  const minTimestamp = useMemo(() => now - 30 * 24 * 60 * 60 * 1000, [now]);
  const [currentTimestamp, setCurrentTimestamp] = useState(now);
  const [isPlaying, setIsPlaying] = useState(false);

  // Reporting State
  const [reportingLocation, setReportingLocation] = useState<{ lat: number; lng: number } | null>(null);

  // Initialize mock data
  useEffect(() => {
    setAllPoints(generateMockPoints(INITIAL_CENTER, 200));
  }, []);

  // Playback timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentTimestamp(prev => {
          const next = prev + 12 * 60 * 60 * 1000; // Advance 12 hours
          if (next >= now) {
            setIsPlaying(false);
            return now;
          }
          return next;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, now]);

  const handleMapLoad = useCallback((map: any) => {
    setMapInstance(map);
  }, []);

  const handleMapClick = (lat: number, lng: number) => {
    setReportingLocation({ lat, lng });
  };

  const handleSearch = (query: string) => {
    if (!window.mappls || !query) return;

    try {
      const searchOptions = {
        location: [center.lat, center.lng],
        bridge: true,
        hyperLocal: true
      };
      
      window.mappls.search(query, (data: any) => {
        if (data && data.length > 0) {
          const firstResult = data[0];
          const lat = parseFloat(firstResult.lat || firstResult.latitude);
          const lng = parseFloat(firstResult.lng || firstResult.longitude);
          
          if (!isNaN(lat) && !isNaN(lng)) {
            const newCenter = { lat, lng };
            setCenter(newCenter);
            setZoom(15);
            setAllPoints(prev => [...prev, ...generateMockPoints(newCenter, 50)]);
          }
        }
      }, searchOptions);
    } catch (e) {
      console.error("Search failed:", e);
    }
  };

  const handleMyLocation = () => {
    if (!navigator.geolocation) return;
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        const newCenter = { lat: latitude, lng: longitude };
        setCenter(newCenter);
        setZoom(16);
        setIsLocating(false);
        
        const newPoint: CoveragePoint = {
          id: `real-${Date.now()}`,
          lat: latitude,
          lng: longitude,
          tech: '5G',
          provider: 'Current Location',
          accuracy: accuracy,
          timestamp: Date.now(),
        };
        setAllPoints(prev => [newPoint, ...prev]);
      },
      () => setIsLocating(false),
      { enableHighAccuracy: true }
    );
  };

  const handleReportSubmit = (report: { issue: string; photo?: File }) => {
    console.log("New Report Submitted:", {
      ...report,
      location: reportingLocation,
      timestamp: Date.now()
    });
    // In a real app, this would go to Firestore
  };

  // Filter points by provider AND timestamp
  const filteredPoints = useMemo(() => {
    return allPoints.filter(p => {
      const matchesProvider = !selectedProvider || p.provider.toLowerCase().includes(selectedProvider.toLowerCase());
      const matchesTime = p.timestamp <= currentTimestamp;
      return matchesProvider && matchesTime;
    });
  }, [allPoints, selectedProvider, currentTimestamp]);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-gray-900 font-sans">
      <Map 
        center={center} 
        zoom={zoom} 
        points={filteredPoints} 
        onMapLoad={handleMapLoad} 
        onMapClick={handleMapClick}
      />

      <SearchBox onSearch={handleSearch} onClear={() => setZoom(INITIAL_ZOOM)} />
      
      <Legend />
      
      <ProviderSelector 
        selectedProvider={selectedProvider} 
        onSelect={setSelectedProvider} 
      />
      
      <Controls 
        onZoomIn={() => setZoom(prev => Math.min(prev + 1, 20))}
        onZoomOut={() => setZoom(prev => Math.max(prev - 1, 4))}
        onMyLocation={handleMyLocation}
      />

      <HistoricalPlayback 
        currentTimestamp={currentTimestamp}
        minTimestamp={minTimestamp}
        maxTimestamp={now}
        onTimestampChange={setCurrentTimestamp}
        isPlaying={isPlaying}
        onTogglePlay={() => setIsPlaying(!isPlaying)}
      />

      <Chatbot />

      <AnimatePresence>
        {reportingLocation && (
          <ReportModal 
            lat={reportingLocation.lat}
            lng={reportingLocation.lng}
            onClose={() => setReportingLocation(null)}
            onSubmit={handleReportSubmit}
          />
        )}
      </AnimatePresence>

      {/* Loading & Welcome Overlays */}
      <AnimatePresence>
        {isLocating && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/20 backdrop-blur-sm z-[100] flex items-center justify-center"
          >
            <div className="bg-white p-6 rounded-3xl shadow-2xl flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <p className="font-bold text-gray-800">Locating you...</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showWelcome && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }}
            className="absolute bottom-32 left-1/2 -translate-x-1/2 w-[90%] max-w-md z-50"
          >
            <div className="bg-white/95 backdrop-blur-lg p-5 rounded-3xl shadow-2xl border border-blue-100 relative">
              <button onClick={() => setShowWelcome(false)} className="absolute top-3 right-3 text-gray-400 hover:text-gray-600">
                <Info className="h-5 w-5" />
              </button>
              <div className="flex items-start gap-4">
                <div className="p-3 bg-blue-100 rounded-2xl text-blue-600">
                  <Wifi className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="font-bold text-gray-900">Coverage Bharat Pro</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Tap anywhere on the map to report issues. Use the slider below to view historical coverage data.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-black/20 to-transparent pointer-events-none z-[60]" />
    </div>
  );
}
