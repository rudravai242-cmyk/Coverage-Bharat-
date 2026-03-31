import React from 'react';
import { PROVIDERS } from '../constants';

interface ProviderSelectorProps {
  selectedProvider: string | null;
  onSelect: (providerId: string | null) => void;
}

const ProviderSelector: React.FC<ProviderSelectorProps> = ({ selectedProvider, onSelect }) => {
  return (
    <div className="absolute bottom-24 left-4 right-4 md:left-4 md:right-auto md:bottom-4 z-50">
      <div className="bg-white/90 backdrop-blur-md p-3 rounded-2xl shadow-2xl border border-gray-100 flex flex-wrap gap-2 md:flex-col md:w-48">
        <h3 className="w-full text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 px-1">
          Network Provider
        </h3>
        <button
          onClick={() => onSelect(null)}
          className={`flex-1 md:flex-none px-3 py-2 rounded-xl text-sm font-medium transition-all ${
            selectedProvider === null 
              ? 'bg-gray-800 text-white shadow-lg' 
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          All Providers
        </button>
        {PROVIDERS.map((provider) => (
          <button
            key={provider.id}
            onClick={() => onSelect(provider.id)}
            className={`flex-1 md:flex-none px-3 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${
              selectedProvider === provider.id 
                ? 'bg-blue-600 text-white shadow-lg' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <div 
              className="w-2 h-2 rounded-full" 
              style={{ backgroundColor: provider.color }} 
            />
            {provider.name}
          </button>
        ))}
      </div>
    </div>
  );
};

export default ProviderSelector;
