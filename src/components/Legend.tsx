import React from 'react';
import { TECH_COLORS } from '../constants';
import { NetworkTech } from '../types';

const Legend: React.FC = () => {
  return (
    <div className="absolute top-20 left-4 z-50">
      <div className="bg-white/90 backdrop-blur-md p-3 rounded-2xl shadow-2xl border border-gray-100 flex flex-col gap-2">
        <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">
          Technology
        </h3>
        {(Object.keys(TECH_COLORS) as NetworkTech[]).map((tech) => (
          <div key={tech} className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-full border border-white shadow-sm" 
              style={{ backgroundColor: TECH_COLORS[tech] }} 
            />
            <span className="text-xs font-semibold text-gray-700">{tech}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Legend;
