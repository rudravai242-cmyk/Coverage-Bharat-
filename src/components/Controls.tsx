import React from 'react';
import { Plus, Minus, Navigation } from 'lucide-react';

interface ControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onMyLocation: () => void;
}

const Controls: React.FC<ControlsProps> = ({ onZoomIn, onZoomOut, onMyLocation }) => {
  return (
    <div className="absolute bottom-4 right-4 flex flex-col gap-3 z-50">
      <button
        onClick={onMyLocation}
        className="p-4 bg-blue-600 text-white rounded-2xl shadow-2xl hover:bg-blue-700 active:scale-95 transition-all group"
        title="My Location"
      >
        <Navigation className="h-6 w-6 group-hover:rotate-12 transition-transform" />
      </button>
      
      <div className="flex flex-col bg-white/90 backdrop-blur-md rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
        <button
          onClick={onZoomIn}
          className="p-4 text-gray-700 hover:bg-gray-100 active:bg-gray-200 transition-colors border-b border-gray-100"
          title="Zoom In"
        >
          <Plus className="h-6 w-6" />
        </button>
        <button
          onClick={onZoomOut}
          className="p-4 text-gray-700 hover:bg-gray-100 active:bg-gray-200 transition-colors"
          title="Zoom Out"
        >
          <Minus className="h-6 w-6" />
        </button>
      </div>
    </div>
  );
};

export default Controls;
