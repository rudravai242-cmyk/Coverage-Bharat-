import React, { useState, useCallback, useEffect, useMemo } from 'react';
import Map from './components/Map';
import SearchBox from './components/SearchBox';
import ProviderSelector from './components/ProviderSelector';
import Controls from './components/Controls';
import Legend from './components/Legend';
import Chatbot from './components/Chatbot';
import ReportModal from './components/ReportModal';
import SpeedTest from './components/SpeedTest';
import { INITIAL_CENTER, INITIAL_ZOOM, PROVIDERS } from './constants';
import { CoveragePoint, NetworkTech, NetworkReport } from './types';
import { motion, AnimatePresence } from 'motion/react';
import { Info, Wifi, MapPin, Gauge, LayoutGrid, Eye, EyeOff, Activity } from 'lucide-react';

// Mock data generator with timestamps
const generateMockPoints = (center: { lat: number; lng: number }, count: number, spread: number = 0.2, timeRangeDays: number = 30): CoveragePoint[] => {
  const techs: NetworkTech[] = ['5G', '4G', '3G', '2G'];
  const providerNames = PROVIDERS.map(p => p.name);
  const now = Date.now();
  const rangeMs = timeRangeDays * 24 * 60 * 60 * 1000;
  
  return Array.from({ length: count }).map((_, i) => {
    const tech = techs[Math.floor(Math.random() * techs.length)];
    let download = 0;
    if (tech === '5G') download = Math.floor(Math.random() * 300) + 100;
    else if (tech === '4G') download = Math.floor(Math.random() * 80) + 20;
    else if (tech === '3G') download = Math.floor(Math.random() * 15) + 5;
    else download = Math.floor(Math.random() * 2) + 0.5;

    return {
      id: `mock-${i}-${Math.random()}`,
      lat: center.lat + (Math.random() - 0.5) * spread,
      lng: center.lng + (Math.random() - 0.5) * spread,
      tech,
      provider: providerNames[Math.floor(Math.random() * providerNames.length)],
      accuracy: Math.random() * 45 + 5,
      timestamp: now - Math.random() * rangeMs,
      speed: Math.random() > 0.3 ? {
        download,
        upload: download * 0.4,
        latency: Math.floor(Math.random() * 50) + 10
      } : undefined
    };
  });
};

const MAJOR_CITIES = [
  { lat: 28.6139, lng: 77.2090, name: 'Delhi' },
  { lat: 19.0760, lng: 72.8777, name: 'Mumbai' },
  { lat: 12.9716, lng: 77.5946, name: 'Bangalore' },
  { lat: 13.0827, lng: 80.2707, name: 'Chennai' },
  { lat: 22.5726, lng: 88.3639, name: 'Kolkata' },
  { lat: 17.3850, lng: 78.4867, name: 'Hyderabad' },
  { lat: 23.0225, lng: 72.5714, name: 'Ahmedabad' },
  { lat: 18.5204, lng: 73.8567, name: 'Pune' },
  { lat: 26.8467, lng: 80.9462, name: 'Lucknow' },
  { lat: 21.1458, lng: 79.0882, name: 'Nagpur' },
  { lat: 15.2993, lng: 74.1240, name: 'Goa' },
  { lat: 30.7333, lng: 76.7794, name: 'Chandigarh' },
  { lat: 26.2124, lng: 78.1772, name: 'Gwalior' },
  { lat: 20.2961, lng: 85.8245, name: 'Bhubaneswar' },
  { lat: 11.0168, lng: 76.9558, name: 'Coimbatore' },
];

export default function App() {
  const [center, setCenter] = useState(INITIAL_CENTER);
  const [zoom, setZoom] = useState(INITIAL_ZOOM);
  const [allPoints, setAllPoints] = useState<CoveragePoint[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [mapInstance, setMapInstance] = useState<any>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [mapStyle, setMapStyle] = useState<'satellite' | 'streets' | 'dark' | 'light'>('satellite');
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [showUI, setShowUI] = useState(true);
  const [viewMode, setViewMode] = useState<'coverage' | 'speed'>('coverage');
  const [showSpeedTest, setShowSpeedTest] = useState(false);

  // Reporting State
  const [reportingLocation, setReportingLocation] = useState<{ lat: number; lng: number } | null>(null);

  // Initialize mock data across India
  useEffect(() => {
    let points: CoveragePoint[] = [];
    MAJOR_CITIES.forEach(city => {
      // Generate 150 points for each major city with a wider spread
      points = [...points, ...generateMockPoints({ lat: city.lat, lng: city.lng }, 150, 0.8)];
    });
    
    // Add some random points across India
    for (let i = 0; i < 500; i++) {
      const lat = 8.4 + Math.random() * (37.6 - 8.4);
      const lng = 68.7 + Math.random() * (97.2 - 68.7);
      points.push(...generateMockPoints({ lat, lng }, 1, 0.1));
    }

    setAllPoints(points);
  }, []);

  const handleMapLoad = useCallback((map: any) => {
    setMapInstance(map);
  }, []);

  const handleMapClick = (lat: number, lng: number) => {
    setReportingLocation({ lat, lng });
  };

  const handleSearch = async (query: string) => {
    if (!query) return;

    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`);
      const data = await response.json();
      
      if (data && data.length > 0) {
        const firstResult = data[0];
        const lat = parseFloat(firstResult.lat);
        const lng = parseFloat(firstResult.lon);
        
        if (!isNaN(lat) && !isNaN(lng)) {
          const newCenter = { lat, lng };
          setCenter(newCenter);
          setZoom(15);
          setAllPoints(prev => [...prev, ...generateMockPoints(newCenter, 50)]);
        }
      }
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

  const handleSpeedTestComplete = (results: { download: number; upload: number; latency: number }) => {
    if (!navigator.geolocation) return;
    
    navigator.geolocation.getCurrentPosition((position) => {
      const { latitude, longitude } = position.coords;
      const newPoint: CoveragePoint = {
        id: `speed-${Date.now()}`,
        lat: latitude,
        lng: longitude,
        tech: '5G', // Assume 5G for speed test demo or detect it
        provider: 'Speed Test',
        accuracy: 10,
        timestamp: Date.now(),
        speed: results
      };
      setAllPoints(prev => [newPoint, ...prev]);
      setViewMode('speed'); // Switch to speed view to see the result
    });
  };

  // Filter points by provider
  const filteredPoints = useMemo(() => {
    return allPoints.filter(p => {
      return !selectedProvider || p.provider.toLowerCase().includes(selectedProvider.toLowerCase());
    });
  }, [allPoints, selectedProvider]);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#050505] font-sans text-white selection:bg-blue-500/30">
      {/* Header - Technical Dashboard Style */}
      <header className="absolute top-0 left-0 right-0 h-14 bg-black/80 backdrop-blur-md border-b border-white/5 flex items-center justify-between px-4 z-[2000]">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Activity className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-sm tracking-tight text-white uppercase">Coverage Bharat <span className="text-blue-500 font-black">OS</span></h1>
              <p className="text-[9px] text-gray-500 font-mono uppercase tracking-widest">v2.4.0 // LIVE_FEED</p>
            </div>
          </div>
          
          <div className="h-6 w-[1px] bg-white/10 hidden sm:block" />
          
          <div className="hidden sm:flex items-center gap-4">
            <div className="flex flex-col">
              <span className="text-[9px] text-gray-500 font-bold uppercase">Network Nodes</span>
              <span className="text-xs font-mono text-blue-400">{allPoints.length.toLocaleString()}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] text-gray-500 font-bold uppercase">Status</span>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                <span className="text-xs font-mono text-green-500">OPTIMAL</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setShowSpeedTest(true)}
            className="px-3 py-1.5 bg-blue-600/10 border border-blue-500/30 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all flex items-center gap-2"
          >
            <Gauge className="h-3.5 w-3.5" />
            Run Diagnostics
          </button>
          <button className="p-2 hover:bg-white/5 rounded-lg transition-colors text-gray-400 hover:text-white">
            <Info className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* Main Map Container */}
      <main className="absolute inset-0 pt-14 flex flex-col">
        <div className="relative flex-1 bg-[#0a0a0a] overflow-hidden group">
          <Map 
            center={center} 
            zoom={zoom} 
            points={filteredPoints} 
            mapStyle={mapStyle}
            showHeatmap={showHeatmap}
            viewMode={viewMode}
            onMapLoad={handleMapLoad} 
            onMapClick={handleMapClick}
          />

          {/* UI Toggle - Sleek Pill Design */}
          <div className="absolute top-4 left-4 z-[2001] flex items-center gap-2">
            <button 
              onClick={() => setShowUI(!showUI)}
              className={`px-4 py-2 rounded-full backdrop-blur-md border transition-all flex items-center gap-2 shadow-2xl ${
                showUI 
                  ? 'bg-black/80 border-white/10 text-gray-400 hover:text-white' 
                  : 'bg-blue-600 border-blue-500 text-white shadow-blue-500/20'
              }`}
            >
              {showUI ? (
                <>
                  <EyeOff className="h-3.5 w-3.5" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Hide_UI</span>
                </>
              ) : (
                <>
                  <Eye className="h-3.5 w-3.5" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Show_UI</span>
                </>
              )}
            </button>
          </div>
          
          <AnimatePresence>
            {showUI && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="contents"
              >
                {/* Search - Floating Center */}
                <div className="absolute top-4 left-1/2 -translate-x-1/2 w-[90%] max-w-md z-[1001]">
                  <SearchBox onSearch={handleSearch} onClear={() => setZoom(INITIAL_ZOOM)} />
                </div>

                {/* Left Panel - Technical Sidebar */}
                <div className="absolute top-16 left-4 bottom-8 w-64 hidden md:flex flex-col gap-4 z-[1001]">
                  <div className="flex-1 overflow-y-auto no-scrollbar flex flex-col gap-4">
                    <Legend viewMode={viewMode} />
                    <ProviderSelector 
                      selectedProvider={selectedProvider} 
                      onSelect={setSelectedProvider} 
                    />
                  </div>
                  
                  {/* View Mode Switcher - Integrated in Sidebar */}
                  <div className="bg-black/80 backdrop-blur-md p-1.5 rounded-2xl border border-white/10 flex gap-1">
                    <button
                      onClick={() => setViewMode('coverage')}
                      className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'coverage' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-gray-500 hover:text-white'}`}
                    >
                      Coverage
                    </button>
                    <button
                      onClick={() => setViewMode('speed')}
                      className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'speed' ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20' : 'text-gray-500 hover:text-white'}`}
                    >
                      Speed
                    </button>
                  </div>
                </div>

                {/* Right Side Controls */}
                <div className="absolute bottom-8 right-4 z-[1001]">
                  <Controls 
                    onZoomIn={() => setZoom(prev => Math.min(prev + 1, 20))}
                    onZoomOut={() => setZoom(prev => Math.max(prev - 1, 4))}
                    onMyLocation={handleMyLocation}
                    mapStyle={mapStyle}
                    onStyleChange={setMapStyle}
                    showHeatmap={showHeatmap}
                    onToggleHeatmap={() => setShowHeatmap(!showHeatmap)}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      <Chatbot />

      <AnimatePresence>
        {showSpeedTest && (
          <SpeedTest 
            onComplete={handleSpeedTestComplete}
            onClose={() => setShowSpeedTest(false)}
          />
        )}
      </AnimatePresence>

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

      <div className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-black/20 to-transparent pointer-events-none z-[60]" />
    </div>
  );
}
