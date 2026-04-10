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
  const clusterGroupRef = useRef<any>(null);
  const layersRef = useRef<Record<string, any>>({});
  const [isMapReady, setIsMapReady] = useState(false);

  useEffect(() => {
    if (!mapRef.current) return;

    // Initialize Leaflet Map
    const initMap = () => {
      if (mapInstance.current || !mapRef.current) return;

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
        if (mapInstance.current) {
          onMapLoad(mapInstance.current);
        }
      }, 800); // Faster transition to map
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
    if (clusterGroupRef.current) {
      mapInstance.current.removeLayer(clusterGroupRef.current);
    }

    if (!showHeatmap) return;

    const currentZoom = mapInstance.current.getZoom();

    // Use Marker Clustering for deep zoom (Level 15+) to show individual points with high performance
    if (currentZoom >= 15 && window.L.markerClusterGroup) {
      clusterGroupRef.current = window.L.markerClusterGroup({
        showCoverageOnHover: false,
        zoomToBoundsOnClick: true,
        spiderfyOnMaxZoom: true,
        maxClusterRadius: 50,
        iconCreateFunction: function(cluster: any) {
          const count = cluster.getChildCount();
          let colorClass = 'bg-blue-600/20 border-blue-500/50 text-blue-400';
          if (count > 50) colorClass = 'bg-purple-600/20 border-purple-500/50 text-purple-400';
          else if (count > 20) colorClass = 'bg-cyan-600/20 border-cyan-500/50 text-cyan-400';

          return window.L.divIcon({
            html: `<div class="flex items-center justify-center w-10 h-10 rounded-full ${colorClass} backdrop-blur-md border shadow-xl transition-transform hover:scale-110">
                    <span class="text-[10px] font-black tracking-tighter">${count}</span>
                   </div>`,
            className: 'custom-cluster-icon',
            iconSize: [40, 40]
          });
        }
      });

      points.forEach(p => {
        const marker = window.L.circleMarker([p.lat, p.lng], {
          radius: currentZoom > 18 ? 8 : 6,
          fillColor: viewMode === 'speed' ? (p.speed?.download ? (p.speed.download > 100 ? '#22C55E' : '#F59E0B') : '#EF4444') : TECH_COLORS[p.tech],
          color: '#fff',
          weight: 1.5,
          opacity: 1,
          fillOpacity: 0.9
        });
        
        const popupContent = `
          <div class="p-3 font-sans min-w-[140px] bg-black/90 text-white rounded-xl border border-white/10">
            <div class="text-[9px] font-black text-blue-500 uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
              <div class="w-1 h-1 bg-blue-500 rounded-full animate-pulse"></div>
              Signal_Report
            </div>
            <div class="flex flex-col gap-1">
              <div class="text-xs font-bold flex justify-between">
                <span class="text-gray-400">Carrier:</span>
                <span>${p.provider}</span>
              </div>
              <div class="text-xs font-bold flex justify-between">
                <span class="text-gray-400">Tech:</span>
                <span style="color: ${TECH_COLORS[p.tech]}">${p.tech}</span>
              </div>
              ${p.speed ? `
                <div class="mt-2 pt-2 border-t border-white/5">
                  <div class="text-[10px] font-mono text-green-400 flex justify-between">
                    <span>DL_SPEED:</span>
                    <span>${p.speed.download} Mbps</span>
                  </div>
                </div>
              ` : ''}
            </div>
          </div>
        `;
        
        marker.bindPopup(popupContent, {
          className: 'custom-popup',
          closeButton: false
        });
        clusterGroupRef.current.addLayer(marker);
      });

      mapInstance.current.addLayer(clusterGroupRef.current);
      return;
    }

    // Grid-based Aggregation Logic (Clustering for Performance & Density)
    
    // Even more granular grid at all levels to increase density and richness
    const gridSize = currentZoom > 18 ? 0.00003 : 
                     currentZoom > 16 ? 0.0001 : 
                     currentZoom > 14 ? 0.0003 : 
                     currentZoom > 11 ? 0.0012 : 
                     currentZoom > 8 ? 0.005 : 0.015;
    
    const grid: Record<string, { lat: number, lng: number, intensity: number, count: number }> = {};

    points.forEach(p => {
      const latGrid = Math.round(p.lat / gridSize) * gridSize;
      const lngGrid = Math.round(p.lng / gridSize) * gridSize;
      const key = `${latGrid},${lngGrid}`;

      let intensity = 0.15;
      if (viewMode === 'speed') {
        if (p.speed) {
          const download = p.speed.download;
          if (download > 200) intensity = 1.0;
          else if (download > 100) intensity = 0.9;
          else if (download > 50) intensity = 0.75;
          else if (download > 10) intensity = 0.55;
          else intensity = 0.35;
        } else {
          intensity = 0.15;
        }
      } else {
        if (p.tech === '5G') intensity = 1.0;
        else if (p.tech === '4G') intensity = 0.85;
        else if (p.tech === '3G') intensity = 0.7;
        else intensity = 0.5;
      }

      if (!grid[key]) {
        grid[key] = { lat: latGrid, lng: lngGrid, intensity, count: 1 };
      } else {
        // Accumulate intensity to show density, but cap it
        // Higher accumulation factor (0.5 instead of 0.3) for a more "solid" look
        grid[key].intensity = Math.min(1.0, grid[key].intensity + (intensity * 0.5));
        grid[key].count += 1;
      }
    });

    const heatData = Object.values(grid).map(g => [g.lat, g.lng, g.intensity]);

    const speedGradient = {
      0.2: '#FF0000', // Deep Red
      0.4: '#FF8C00', // Dark Orange
      0.6: '#FFD700', // Gold
      0.8: '#00FF00', // Lime
      1.0: '#00FFFF'  // Cyan
    };

    const coverageGradient = {
      0.2: '#FF0000', // 2G (Vibrant Red)
      0.4: '#FFA500', // 3G (Vibrant Orange)
      0.6: '#007FFF', // 4G (Azure Blue)
      0.8: '#00BFFF', // 4G+ (Deep Sky Blue)
      1.0: '#BF00FF'  // 5G (Electric Purple)
    };

    // nPerf Style Heatmap: Seamless "Coverage Cloud"
    // Significantly increased radius and blur for a more filled, rich look
    heatLayerRef.current = window.L.heatLayer(heatData, {
      radius: currentZoom > 18 ? 80 : 
              currentZoom > 15 ? 65 : 
              currentZoom > 12 ? 55 : 
              currentZoom > 9 ? 45 : 35,
      blur: currentZoom > 18 ? 50 : 
            currentZoom > 15 ? 45 : 
            currentZoom > 12 ? 40 : 
            currentZoom > 9 ? 35 : 25,
      maxZoom: 20,
      minOpacity: 0.55, // Higher min opacity for a more "solid" coverage look
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
