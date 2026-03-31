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
      className="absolute top-4 left-4 right-4 md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-md z-50"
    >
      <div className="relative group">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for an address..."
          className="block w-full pl-10 pr-10 py-3 bg-white/90 backdrop-blur-md border border-gray-200 rounded-2xl shadow-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-gray-800"
        />
        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>
    </form>
  );
};

export default SearchBox;
