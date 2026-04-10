import React, { useState } from 'react';
import { Plus, Minus, Navigation, Layers, Eye, EyeOff, Map as MapIcon, Satellite, Moon, Sun } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onMyLocation: () => void;
  mapStyle: 'satellite' | 'streets' | 'dark' | 'light';
  onStyleChange: (style: 'satellite' | 'streets' | 'dark' | 'light') => void;
  showHeatmap: boolean;
  onToggleHeatmap: () => void;
}

const Controls: React.FC<ControlsProps> = ({ 
  onZoomIn, onZoomOut, onMyLocation, 
  mapStyle, onStyleChange, 
  showHeatmap, onToggleHeatmap 
}) => {
  const [showStyles, setShowStyles] = useState(false);

  const styles = [
    { id: 'satellite', label: 'SATELLITE', icon: <Satellite className="h-3.5 w-3.5" /> },
    { id: 'streets', label: 'STREETS', icon: <MapIcon className="h-3.5 w-3.5" /> },
    { id: 'dark', label: 'DARK_MODE', icon: <Moon className="h-3.5 w-3.5" /> },
    { id: 'light', label: 'LIGHT_MODE', icon: <Sun className="h-3.5 w-3.5" /> },
  ] as const;

  return (
    <div className="flex flex-col gap-2">
      {/* Map Style Selector */}
      <div className="relative">
        <AnimatePresence>
          {showStyles && (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="absolute bottom-0 right-14 flex flex-col gap-1 bg-black/90 backdrop-blur-md p-1.5 rounded-xl shadow-2xl border border-white/10 min-w-[140px]"
            >
              {styles.map((style) => (
                <button
                  key={style.id}
                  onClick={() => {
                    onStyleChange(style.id);
                    setShowStyles(false);
                  }}
                  className={`flex items-center gap-3 p-2.5 rounded-lg transition-all ${
                    mapStyle === style.id ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  {style.icon}
                  <span className="text-[10px] font-bold uppercase tracking-widest">{style.label}</span>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <button
          onClick={() => setShowStyles(!showStyles)}
          className={`w-10 h-10 rounded-xl shadow-2xl transition-all active:scale-95 border border-white/10 flex items-center justify-center ${
            showStyles ? 'bg-blue-600 text-white' : 'bg-black/80 backdrop-blur-md text-gray-400 hover:text-white'
          }`}
          title="Map Style"
        >
          <Layers className="h-4 w-4" />
        </button>
      </div>

      {/* Heatmap Toggle */}
      <button
        onClick={onToggleHeatmap}
        className={`w-10 h-10 rounded-xl shadow-2xl transition-all active:scale-95 border border-white/10 flex items-center justify-center ${
          showHeatmap ? 'bg-blue-600 text-white' : 'bg-black/80 backdrop-blur-md text-gray-400 hover:text-white'
        }`}
        title={showHeatmap ? "Hide Coverage" : "Show Coverage"}
      >
        {showHeatmap ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
      </button>

      <button
        onClick={onMyLocation}
        className="w-10 h-10 bg-blue-600 text-white rounded-xl shadow-2xl hover:bg-blue-700 active:scale-95 transition-all group border border-white/10 flex items-center justify-center"
        title="My Location"
      >
        <Navigation className="h-4 w-4 group-hover:rotate-12 transition-transform" />
      </button>
      
      <div className="flex flex-col bg-black/80 backdrop-blur-md rounded-xl shadow-2xl border border-white/10 overflow-hidden">
        <button
          onClick={onZoomIn}
          className="w-10 h-10 text-gray-400 hover:text-white hover:bg-white/5 active:bg-white/10 transition-colors border-b border-white/5 flex items-center justify-center"
          title="Zoom In"
        >
          <Plus className="h-4 w-4" />
        </button>
        <button
          onClick={onZoomOut}
          className="w-10 h-10 text-gray-400 hover:text-white hover:bg-white/5 active:bg-white/10 transition-colors flex items-center justify-center"
          title="Zoom Out"
        >
          <Minus className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default Controls;
