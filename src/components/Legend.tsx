import React from 'react';
import { TECH_COLORS } from '../constants';
import { NetworkTech } from '../types';

interface LegendProps {
  viewMode: 'coverage' | 'speed';
  accentColor?: string;
}

const Legend: React.FC<LegendProps> = ({ viewMode, accentColor = '#3B82F6' }) => {
  const speedLegend = [
    { label: '> 200 Mbps', color: '#007AFF' },
    { label: '100-200 Mbps', color: '#34C759' },
    { label: '50-100 Mbps', color: '#FFCC00' },
    { label: '10-50 Mbps', color: '#FF9500' },
    { label: '< 10 Mbps', color: '#FF3B30' },
  ];

  return (
    <div className="bg-black/90 backdrop-blur-2xl p-5 rounded-3xl border border-white/10 flex flex-col gap-4 shadow-[0_0_40px_rgba(0,0,0,0.5)] w-full">
      <h3 className="text-[10px] font-black uppercase tracking-[0.2em] mb-1 flex items-center gap-2 transition-colors duration-500" style={{ color: accentColor }}>
        <div 
          className="w-1.5 h-1.5 rounded-full transition-all duration-500" 
          style={{ 
            backgroundColor: accentColor,
            boxShadow: `0 0 8px ${accentColor}88`
          }} 
        />
        {viewMode === 'coverage' ? 'Signal_Tech' : 'Network_Speed'}
      </h3>
      <div className="flex flex-col gap-3">
        {viewMode === 'coverage' ? (
          (Object.keys(TECH_COLORS) as NetworkTech[]).map((tech) => (
            <div key={tech} className="flex items-center gap-4 px-1 group">
              <div 
                className="w-2.5 h-2.5 rounded-full border border-white/10 shadow-lg transition-transform group-hover:scale-125" 
                style={{ backgroundColor: TECH_COLORS[tech] }} 
              />
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest group-hover:text-white transition-colors">{tech}</span>
            </div>
          ))
        ) : (
          speedLegend.map((item) => (
            <div key={item.label} className="flex items-center gap-4 px-1 group">
              <div 
                className="w-2.5 h-2.5 rounded-full border border-white/10 shadow-lg transition-transform group-hover:scale-125" 
                style={{ backgroundColor: item.color }} 
              />
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest group-hover:text-white transition-colors">{item.label}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Legend;
