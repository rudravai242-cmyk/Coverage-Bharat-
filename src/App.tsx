import React, { useState, useCallback, useEffect, useMemo } from 'react';
import Map from './components/Map';
import SearchBox from './components/SearchBox';
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
  const [hasSelectedCarrier, setHasSelectedCarrier] = useState(false);
  const [mapInstance, setMapInstance] = useState<any>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [mapStyle, setMapStyle] = useState<'satellite' | 'streets' | 'dark' | 'light'>('satellite');
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [showUI, setShowUI] = useState(true);
  const [viewMode, setViewMode] = useState<'coverage' | 'speed'>('coverage');
  const [showSpeedTest, setShowSpeedTest] = useState(false);

  // Reporting State
  const [reportingLocation, setReportingLocation] = useState<{ lat: number; lng: number } | null>(null);

  const handleProviderSelect = (providerId: string | null) => {
    setSelectedProvider(providerId);
    if (providerId) {
      setHasSelectedCarrier(true);
    }
  };

  // Initialize mock data across India
  useEffect(() => {
    let points: CoveragePoint[] = [];
    
    // 1. Generate dense clusters around major cities
    MAJOR_CITIES.forEach(city => {
      // City center: very dense
      points = [...points, ...generateMockPoints({ lat: city.lat, lng: city.lng }, 200, 0.15)];
      // Suburban areas: medium density
      points = [...points, ...generateMockPoints({ lat: city.lat, lng: city.lng }, 100, 0.5)];
    });
    
    // 2. Generate points along "Highways/Corridors" (Connecting major cities)
    // This creates the "organic" look seen in nPerf
    const corridors = [
      [MAJOR_CITIES[0], MAJOR_CITIES[1]], // Delhi - Mumbai
      [MAJOR_CITIES[0], MAJOR_CITIES[4]], // Delhi - Kolkata
      [MAJOR_CITIES[1], MAJOR_CITIES[2]], // Mumbai - Bangalore
      [MAJOR_CITIES[2], MAJOR_CITIES[3]], // Bangalore - Chennai
      [MAJOR_CITIES[3], MAJOR_CITIES[5]], // Chennai - Hyderabad
      [MAJOR_CITIES[5], MAJOR_CITIES[0]], // Hyderabad - Delhi
      [MAJOR_CITIES[1], MAJOR_CITIES[7]], // Mumbai - Pune
      [MAJOR_CITIES[0], MAJOR_CITIES[8]], // Delhi - Lucknow
    ];

    corridors.forEach(([start, end]) => {
      const steps = 15;
      for (let i = 0; i <= steps; i++) {
        const lat = start.lat + (end.lat - start.lat) * (i / steps);
        const lng = start.lng + (end.lng - start.lng) * (i / steps);
        // Add points along the path with some jitter
        points = [...points, ...generateMockPoints({ lat, lng }, 30, 0.3)];
      }
    });
    
    // 3. Add sparse random points for "rural" coverage (much fewer than before)
    for (let i = 0; i < 300; i++) {
      const lat = 8.4 + Math.random() * (37.6 - 8.4);
      const lng = 68.7 + Math.random() * (97.2 - 68.7);
      // Only add if it's likely within India (rough check)
      points.push(...generateMockPoints({ lat, lng }, 1, 0.05));
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
      <header className="absolute top-0 left-0 right-0 h-16 bg-black/90 backdrop-blur-xl border-b border-white/10 flex items-center justify-between px-4 z-[3000]">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20 ring-1 ring-blue-400/30">
              <Activity className="h-6 w-6 text-white" />
            </div>
            <div className="hidden xs:block">
              <h1 className="font-black text-base tracking-tight text-white uppercase leading-none">Coverage Bharat <span className="text-blue-500">OS</span></h1>
              <p className="text-[10px] text-gray-500 font-mono uppercase tracking-[0.2em] mt-1">v2.5.0 // LIVE_NETWORK_CORE</p>
            </div>
          </div>
          
          <div className="h-8 w-[1px] bg-white/10 hidden lg:block" />
          
          {/* Carrier Selector in Header */}
          <div className="hidden md:flex items-center gap-2">
            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest mr-2">Carrier:</span>
            <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
              {PROVIDERS.map((provider) => (
                <button
                  key={provider.id}
                  onClick={() => handleProviderSelect(provider.id)}
                  className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                    selectedProvider === provider.id 
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' 
                      : 'text-gray-500 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {provider.name}
                </button>
              ))}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="hidden lg:flex flex-col items-end mr-4">
            <span className="text-[9px] text-gray-500 font-bold uppercase tracking-tighter">System Status</span>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
              <span className="text-[10px] font-mono text-green-500 font-bold">ENCRYPTED_LINK_STABLE</span>
            </div>
          </div>
          
          <button 
            onClick={() => setShowSpeedTest(true)}
            className="px-4 py-2 bg-blue-600/10 border border-blue-500/30 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all flex items-center gap-2 shadow-lg shadow-blue-500/5 group"
          >
            <Gauge className="h-4 w-4 group-hover:rotate-12 transition-transform" />
            <span className="hidden sm:inline">Run Diagnostics</span>
            <span className="sm:hidden">Test</span>
          </button>
        </div>
      </header>

      {/* Main Map Container */}
      <main className="absolute inset-0 pt-16 flex flex-col">
        <div className="relative flex-1 bg-[#0a0a0a] overflow-hidden group">
          <Map 
            center={center} 
            zoom={zoom} 
            points={filteredPoints} 
            mapStyle={mapStyle}
            showHeatmap={showHeatmap && hasSelectedCarrier}
            viewMode={viewMode}
            onMapLoad={handleMapLoad} 
            onMapClick={handleMapClick}
          />

          {/* Carrier Selection Overlay - nPerf Style */}
          <AnimatePresence>
            {!hasSelectedCarrier && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-[4000] flex items-center justify-center p-6"
              >
                {/* Diamond Blur Backdrop */}
                <div className="absolute inset-0 bg-black/40 backdrop-blur-[12px] bg-diamond [mask-image:radial-gradient(circle,black_0%,transparent_100%)]" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.8)_100%)]" />
                
                <motion.div 
                  initial={{ scale: 0.9, y: 20 }}
                  animate={{ scale: 1, y: 0 }}
                  className="relative bg-black/80 backdrop-blur-2xl border border-white/10 p-8 md:p-12 rounded-[2.5rem] shadow-[0_0_100px_rgba(0,0,0,0.5)] max-w-lg w-full text-center"
                >
                  <div className="w-20 h-20 bg-blue-600/20 rounded-3xl flex items-center justify-center mx-auto mb-8 border border-blue-500/30 shadow-2xl shadow-blue-500/10">
                    <Wifi className="h-10 w-10 text-blue-500 animate-pulse" />
                  </div>
                  
                  <h2 className="text-3xl font-black text-white mb-4 tracking-tight uppercase">Select a carrier!</h2>
                  <p className="text-gray-400 text-sm mb-10 leading-relaxed font-medium">
                    Please select a network carrier from the list below to visualize real-time coverage data across India.
                  </p>
                  
                  <div className="grid grid-cols-2 gap-4">
                    {PROVIDERS.map((provider) => (
                      <button
                        key={provider.id}
                        onClick={() => handleProviderSelect(provider.id)}
                        className="group relative p-4 rounded-2xl border border-white/5 bg-white/[0.03] hover:bg-blue-600 hover:border-blue-500 transition-all duration-300 text-left overflow-hidden"
                      >
                        <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                          <Activity className="h-12 w-12" />
                        </div>
                        <div 
                          className="w-2 h-2 rounded-full mb-3 shadow-[0_0_8px_rgba(255,255,255,0.3)]" 
                          style={{ backgroundColor: provider.color }} 
                        />
                        <span className="block text-xs font-black uppercase tracking-widest text-gray-400 group-hover:text-white transition-colors">
                          {provider.name}
                        </span>
                        <span className="block text-[9px] text-gray-600 group-hover:text-blue-200 mt-1 uppercase font-bold">
                          Network Core
                        </span>
                      </button>
                    ))}
                  </div>
                  
                  <div className="mt-10 pt-8 border-t border-white/5">
                    <p className="text-[10px] text-gray-600 font-mono uppercase tracking-[0.3em]">
                      Coverage Bharat OS // Secure_Data_Stream
                    </p>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* UI Toggle - Sleek Pill Design */}
          <div className="absolute top-20 md:top-4 left-4 z-[2001] flex items-center gap-2">
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
                <div className="absolute top-20 left-4 bottom-8 w-64 hidden md:flex flex-col gap-4 z-[1001]">
                  <div className="flex-1 overflow-y-auto no-scrollbar flex flex-col gap-4">
                    <Legend viewMode={viewMode} />
                    
                    {/* View Mode Switcher - Integrated in Sidebar */}
                    <div className="bg-black/90 backdrop-blur-2xl p-5 rounded-3xl border border-white/10 flex flex-col gap-4 shadow-[0_0_40px_rgba(0,0,0,0.5)]">
                      <h3 className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em] mb-1 flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                        Visualization_Core
                      </h3>
                      <div className="flex flex-col gap-2.5">
                        <button
                          onClick={() => setViewMode('coverage')}
                          className={`w-full py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border flex items-center justify-center gap-3 ${
                            viewMode === 'coverage' 
                              ? 'bg-blue-600 border-blue-500 text-white shadow-xl shadow-blue-500/20' 
                              : 'bg-white/[0.03] border-white/5 text-gray-500 hover:text-white hover:bg-white/10'
                          }`}
                        >
                          <Wifi className="h-4 w-4" />
                          Coverage Mode
                        </button>
                        <button
                          onClick={() => setViewMode('speed')}
                          className={`w-full py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border flex items-center justify-center gap-3 ${
                            viewMode === 'speed' 
                              ? 'bg-purple-600 border-purple-500 text-white shadow-xl shadow-purple-500/20' 
                              : 'bg-white/[0.03] border-white/5 text-gray-500 hover:text-white hover:bg-white/10'
                          }`}
                        >
                          <Gauge className="h-4 w-4" />
                          Speed Mode
                        </button>
                      </div>
                    </div>
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
