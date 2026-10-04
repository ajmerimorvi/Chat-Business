import React, { useRef } from 'react';
import { Search, X, Mic, SlidersHorizontal } from 'lucide-react';
import { Language } from '../../domain/types';
import { getTranslation } from '../i18n/translations';

interface UniversalSearchBarProps {
  query: string;
  onQueryChange: (query: string) => void;
  activeFilter: 'all' | 'people' | 'businesses' | 'products' | 'services';
  onFilterChange: (filter: 'all' | 'people' | 'businesses' | 'products' | 'services') => void;
  onFocus?: () => void;
  lang?: Language;
  counts?: {
    people: number;
    businesses: number;
    products: number;
    services: number;
  };
}

export const UniversalSearchBar: React.FC<UniversalSearchBarProps> = ({
  query,
  onQueryChange,
  activeFilter,
  onFilterChange,
  onFocus,
  lang = 'en',
  counts,
}) => {
  const t = getTranslation(lang);
  const inputRef = useRef<HTMLInputElement>(null);

  const filters: Array<{ id: 'all' | 'people' | 'businesses' | 'products' | 'services'; label: string; count?: number }> = [
    { id: 'all', label: t.all },
    { id: 'people', label: t.peopleAndChats, count: counts?.people },
    { id: 'businesses', label: t.businesses, count: counts?.businesses },
    { id: 'products', label: t.products, count: counts?.products },
    { id: 'services', label: t.services, count: counts?.services },
  ];

  const handleClear = () => {
    onQueryChange('');
    inputRef.current?.focus();
  };

  return (
    <div className="w-full bg-white border-b border-gray-100 shadow-xs">
      <div className="px-3 pt-2.5 pb-2">
        <div className="relative flex items-center bg-gray-100 rounded-xl px-3 py-2 text-gray-800 focus-within:bg-white focus-within:ring-2 focus-within:ring-emerald-600 focus-within:shadow-sm transition-all">
          <Search size={18} className="text-gray-400 mr-2.5 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            onFocus={onFocus}
            placeholder={t.searchPlaceholder}
            className="w-full bg-transparent text-sm placeholder:text-gray-400 text-gray-900 focus:outline-hidden"
          />

          {query ? (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 text-gray-400 hover:text-gray-700 transition-colors"
              title="Clear search"
            >
              <X size={16} />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onQueryChange('Raj')}
              className="text-xs text-emerald-700 font-medium px-1.5 py-0.5 rounded bg-emerald-50 hover:bg-emerald-100 transition-colors shrink-0"
              title="Quick demo search for 'Raj'"
            >
              Try "Raj"
            </button>
          )}
        </div>
      </div>

      {/* Horizontal Filter Chips when search has query or is active */}
      {query.trim().length > 0 && (
        <div className="flex items-center gap-1.5 px-3 pb-2 overflow-x-auto no-scrollbar text-xs">
          {filters.map((f) => {
            const isActive = activeFilter === f.id;
            return (
              <button
                key={f.id}
                onClick={() => onFilterChange(f.id)}
                className={`px-2.5 py-1 rounded-full whitespace-nowrap font-medium transition-colors ${
                  isActive
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {f.label}
                {f.count !== undefined && f.count > 0 && (
                  <span className={`ml-1 text-[10px] ${isActive ? 'text-emerald-100' : 'text-gray-400'}`}>
                    ({f.count})
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
