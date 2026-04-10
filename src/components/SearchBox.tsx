import React, { useState } from 'react';
import { Search, X } from 'lucide-react';

interface SearchBoxProps {
  onSearch: (query: string) => void;
  onClear: () => void;
}

const SearchBox: React.FC<SearchBoxProps> = ({ onSearch, onClear }) => {
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
          <Search className="h-4 w-4 text-blue-500 group-focus-within:scale-110 transition-transform" />
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="SEARCH_LOCATION // INDIA_REGION"
          className="block w-full pl-12 pr-10 py-3 bg-black/80 backdrop-blur-md border border-white/5 rounded-xl shadow-2xl focus:ring-1 focus:ring-blue-500/30 focus:border-blue-500/30 outline-none transition-all text-sm text-white placeholder:text-gray-600 font-mono uppercase tracking-tight"
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
