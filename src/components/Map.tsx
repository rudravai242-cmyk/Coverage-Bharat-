import React, { useEffect, useRef, useState } from 'react';
import { TECH_COLORS } from '../constants';
import { CoveragePoint } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Activity, Loader2 } from 'lucide-react';

interface MapProps {
  center: { lat: number; lng: number };
  zoom: number;
  points: CoveragePoint[];
  mapStyle: 'satellite' | 'streets' | 'dark' | 'light';
  showHeatmap: boolean;
  viewMode: 'coverage' | 'speed';
  onMapLoad: (map: any) => void;
  onMapClick: (lat: number, lng: number) => void;
}

declare global {
  interface Window {
    L: any;
  }
}

const Map: React.FC<MapProps> = ({ center, zoom, points, mapStyle, showHeatmap, viewMode, onMapLoad, onMapClick }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const heatLayerRef = useRef<any>(null);
  const layersRef = useRef<Record<string, any>>({});
  const [isMapReady, setIsMapReady] = useState(false);

  useEffect(() => {
    if (!mapRef.current) return;

    // Initialize Leaflet Map
    const initMap = () => {
      if (!window.L || !window.L.heatLayer) {
        setTimeout(initMap, 100);
        return;
      }

      mapInstance.current = window.L.map(mapRef.current, {
        zoomControl: false,
        attributionControl: false,
        preferCanvas: true,
        zoomAnimation: true,
        fadeAnimation: true,
        markerZoomAnimation: true,
        minZoom: 4,
        maxZoom: 20,
        worldCopyJump: true
      }).setView([center.lat, center.lng], zoom);

      // Define High-Quality Layers
      layersRef.current = {
        satellite: window.L.tileLayer('https://{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', {
          subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
          maxZoom: 20,
          detectRetina: true,
          attribution: '&copy; Google Maps'
        }),
        streets: window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 20,
          detectRetina: true,
          attribution: '&copy; OpenStreetMap'
        }),
        dark: window.L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
          maxZoom: 20,
          detectRetina: true,
          attribution: '&copy; CartoDB'
        }),
        light: window.L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
          maxZoom: 20,
          detectRetina: true,
          attribution: '&copy; CartoDB'
        }),
      };

      layersRef.current[mapStyle].addTo(mapInstance.current);

      // Sync heatmap visibility with tile loading to prevent "black sides"
      mapInstance.current.on('tileloadstart', () => {
        const heatEl = document.querySelector('.leaflet-heatmap-layer');
        if (heatEl) heatEl.classList.remove('ready');
      });

      mapInstance.current.on('click', (e: any) => {
        onMapClick(e.latlng.lat, e.latlng.lng);
      });

      // Simulate a professional initialization sequence
      setTimeout(() => {
        setIsMapReady(true);
        // Ensure onMapLoad is called only once after initialization
        onMapLoad(mapInstance.current);
      }, 1800);
    };

    initMap();

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
      }
    };
  }, []);

  // Update map style
  useEffect(() => {
    if (mapInstance.current && layersRef.current) {
      Object.values(layersRef.current).forEach(layer => {
        if (mapInstance.current.hasLayer(layer)) {
          mapInstance.current.removeLayer(layer);
        }
      });
      if (layersRef.current[mapStyle]) {
        layersRef.current[mapStyle].addTo(mapInstance.current);
      }
    }
  }, [mapStyle]);

  // Smooth update for center and zoom
  useEffect(() => {
    if (mapInstance.current) {
      const currentCenter = mapInstance.current.getCenter();
      const currentZoom = mapInstance.current.getZoom();
      
      if (
        Math.abs(currentCenter.lat - center.lat) > 0.0001 || 
        Math.abs(currentCenter.lng - center.lng) > 0.0001 ||
        currentZoom !== zoom
      ) {
        mapInstance.current.flyTo([center.lat, center.lng], zoom, {
          animate: true,
          duration: 0.8
        });
      }
    }
  }, [center, zoom]);

  // Update Heatmap with Grid-based Aggregation (Clustering)
  useEffect(() => {
    if (!mapInstance.current || !window.L || !window.L.heatLayer || !isMapReady) return;

    if (heatLayerRef.current) {
      mapInstance.current.removeLayer(heatLayerRef.current);
    }

    if (!showHeatmap) return;

    // Grid-based Aggregation Logic (Clustering for Performance)
    const currentZoom = mapInstance.current.getZoom();
    // Refined grid size for better density balance - even smaller for deep zoom
    const gridSize = currentZoom > 18 ? 0.00005 : currentZoom > 16 ? 0.00015 : currentZoom > 14 ? 0.0004 : currentZoom > 11 ? 0.0015 : 0.008;
    
    const grid: Record<string, { lat: number, lng: number, intensity: number }> = {};

    points.forEach(p => {
      const latGrid = Math.round(p.lat / gridSize) * gridSize;
      const lngGrid = Math.round(p.lng / gridSize) * gridSize;
      const key = `${latGrid},${lngGrid}`;

      let intensity = 0.1;
      if (viewMode === 'speed') {
        if (p.speed) {
          const download = p.speed.download;
          if (download > 200) intensity = 1.0;
          else if (download > 100) intensity = 0.85;
          else if (download > 50) intensity = 0.7;
          else if (download > 10) intensity = 0.5;
          else intensity = 0.3;
        } else {
          intensity = 0.1;
        }
      } else {
        if (p.tech === '5G') intensity = 1.0;
        else if (p.tech === '4G') intensity = 0.8;
        else if (p.tech === '3G') intensity = 0.6;
        else intensity = 0.4;
      }

      if (!grid[key] || intensity > grid[key].intensity) {
        grid[key] = { lat: latGrid, lng: lngGrid, intensity };
      }
    });

    const heatData = Object.values(grid).map(g => [g.lat, g.lng, g.intensity]);

    const speedGradient = {
      0.2: '#EF4444', // Red
      0.4: '#F59E0B', // Amber
      0.6: '#EAB308', // Yellow
      0.8: '#22C55E', // Green
      1.0: '#06B6D4'  // Cyan
    };

    const coverageGradient = {
      0.2: '#EF4444', // 2G (Red)
      0.4: '#F59E0B', // 3G (Amber)
      0.6: '#3B82F6', // 4G (Blue)
      0.8: '#60A5FA', // 4G+ (Light Blue)
      1.0: '#A855F7'  // 5G (Purple)
    };

    // nPerf Style Heatmap: Seamless "Coverage Cloud"
    // Increased radius and blur for a more filled look
    heatLayerRef.current = window.L.heatLayer(heatData, {
      radius: currentZoom > 18 ? 50 : currentZoom > 15 ? 35 : currentZoom > 12 ? 25 : 18,
      blur: currentZoom > 18 ? 35 : currentZoom > 15 ? 25 : currentZoom > 12 ? 20 : 15,
      maxZoom: 20,
      minOpacity: 0.55,
      gradient: viewMode === 'speed' ? speedGradient : coverageGradient
    }).addTo(mapInstance.current);

    // Fade in heatmap after tiles are likely loaded
    setTimeout(() => {
      const heatEl = document.querySelector('.leaflet-heatmap-layer');
      if (heatEl) heatEl.classList.add('ready');
    }, 400);

  }, [points, showHeatmap, zoom, viewMode, isMapReady]);

  return (
    <div className="relative w-full h-full">
      <div ref={mapRef} className="w-full h-full" id="map-container" />
      
      <AnimatePresence>
        {!isMapReady && (
          <motion.div 
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
            className="absolute inset-0 z-[5000] bg-[#050505] flex flex-col items-center justify-center gap-6"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="flex flex-col items-center gap-4"
            >
              <div className="relative">
                <div className="w-20 h-20 rounded-2xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center">
                  <Activity className="h-10 w-10 text-blue-500 animate-pulse" />
                </div>
                <div className="absolute -inset-4 border border-blue-500/10 rounded-full animate-[spin_10s_linear_infinite]" />
                <div className="absolute -inset-8 border border-blue-500/5 rounded-full animate-[spin_15s_linear_infinite_reverse]" />
              </div>
              
              <div className="flex flex-col items-center">
                <h2 className="text-white font-black tracking-[0.3em] uppercase text-sm">Initializing_System</h2>
                <div className="flex items-center gap-2 mt-2">
                  <Loader2 className="h-3 w-3 text-blue-500 animate-spin" />
                  <span className="text-[10px] text-gray-500 font-mono uppercase tracking-widest">Loading_Network_Nodes...</span>
                </div>
              </div>
            </motion.div>

            <div className="absolute bottom-12 left-1/2 -translate-x-1/2 w-48 h-[1px] bg-white/5 overflow-hidden">
              <motion.div 
                initial={{ x: "-100%" }}
                animate={{ x: "100%" }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                className="w-1/2 h-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Map;
