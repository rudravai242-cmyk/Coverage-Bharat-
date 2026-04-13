import React, { useState } from 'react';
import { Search, X } from 'lucide-react';

interface SearchBoxProps {
  onSearch: (query: string) => void;
  onClear: () => void;
  accentColor?: string;
}

const SearchBox: React.FC<SearchBoxProps> = ({ onSearch, onClear, accentColor = '#3B82F6' }) => {
  const [query, setQuery] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query);
    }
  };

  const handleClear = () => {
    setQuery('');
    onClear();
  };

  return (
    <form 
      onSubmit={handleSubmit}
      className="w-full"
    >
      <div className="relative group">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search className="h-4 w-4 group-focus-within:scale-110 transition-transform" style={{ color: accentColor }} />
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="SEARCH_LOCATION // INDIA_REGION"
          className="block w-full pl-12 pr-10 py-4 bg-black/90 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-[0_0_40px_rgba(0,0,0,0.5)] outline-none transition-all text-sm text-white placeholder:text-gray-600 font-mono uppercase tracking-tight"
          style={{ 
            boxShadow: `0 0 40px rgba(0,0,0,0.5)`,
          }}
          onFocus={(e) => {
            e.target.style.borderColor = `${accentColor}88`;
            e.target.style.boxShadow = `0 0 0 2px ${accentColor}33, 0 0 40px rgba(0,0,0,0.5)`;
          }}
          onBlur={(e) => {
            e.target.style.borderColor = 'rgba(255,255,255,0.1)';
            e.target.style.boxShadow = '0 0 40px rgba(0,0,0,0.5)';
          }}
        />
        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </form>
  );
};

export default SearchBox;
