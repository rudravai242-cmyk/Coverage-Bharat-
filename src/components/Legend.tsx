import React from 'react';
import { TECH_COLORS } from '../constants';
import { NetworkTech } from '../types';

interface LegendProps {
  viewMode: 'coverage' | 'speed';
}

const Legend: React.FC<LegendProps> = ({ viewMode }) => {
  const speedLegend = [
    { label: '> 200 Mbps', color: '#06B6D4' },
    { label: '100-200 Mbps', color: '#22C55E' },
    { label: '50-100 Mbps', color: '#EAB308' },
    { label: '10-50 Mbps', color: '#F59E0B' },
    { label: '< 10 Mbps', color: '#EF4444' },
  ];

  return (
    <div className="bg-black/80 backdrop-blur-md p-4 rounded-2xl border border-white/5 flex flex-col gap-2 shadow-2xl w-full">
      <h3 className="text-[9px] font-black text-blue-500 uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
        <div className="w-1 h-1 bg-blue-500 rounded-full" />
        {viewMode === 'coverage' ? 'Signal_Tech' : 'Network_Speed'}
      </h3>
      <div className="flex flex-col gap-2">
        {viewMode === 'coverage' ? (
          (Object.keys(TECH_COLORS) as NetworkTech[]).map((tech) => (
            <div key={tech} className="flex items-center gap-3 px-1">
              <div 
                className="w-2 h-2 rounded-full border border-white/10 shadow-lg" 
                style={{ backgroundColor: TECH_COLORS[tech] }} 
              />
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{tech}</span>
            </div>
          ))
        ) : (
          speedLegend.map((item) => (
            <div key={item.label} className="flex items-center gap-3 px-1">
              <div 
                className="w-2 h-2 rounded-full border border-white/10 shadow-lg" 
                style={{ backgroundColor: item.color }} 
              />
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{item.label}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Legend;
