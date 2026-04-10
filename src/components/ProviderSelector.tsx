import React from 'react';
import { PROVIDERS } from '../constants';

interface ProviderSelectorProps {
  selectedProvider: string | null;
  onSelect: (providerId: string | null) => void;
}

const ProviderSelector: React.FC<ProviderSelectorProps> = ({ selectedProvider, onSelect }) => {
  return (
    <div className="bg-black/80 backdrop-blur-md p-4 rounded-2xl border border-white/5 flex flex-col gap-2 shadow-2xl w-full">
      <h3 className="text-[9px] font-black text-blue-500 uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
        <div className="w-1 h-1 bg-blue-500 rounded-full animate-pulse" />
        Network_Carriers
      </h3>
      <button
        onClick={() => onSelect(null)}
        className={`px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all border ${
          selectedProvider === null 
            ? 'bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-500/20' 
            : 'bg-white/5 text-gray-500 border-white/5 hover:bg-white/10 hover:text-white'
        }`}
      >
        All_Nodes
      </button>
      {PROVIDERS.map((provider) => (
        <button
          key={provider.id}
          onClick={() => onSelect(provider.id)}
          className={`px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all flex items-center gap-3 border ${
            selectedProvider === provider.id 
              ? 'bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-500/20' 
              : 'bg-white/5 text-gray-500 border-white/5 hover:bg-white/10 hover:text-white'
          }`}
        >
          <div 
            className="w-1.5 h-1.5 rounded-full shadow-sm" 
            style={{ backgroundColor: provider.color }} 
          />
          {provider.name}
        </button>
      ))}
    </div>
  );
};

export default ProviderSelector;
