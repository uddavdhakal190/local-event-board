import React, { useState, useRef, useEffect, useCallback } from 'react';
import { MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

/* ── Curated city list (Finland + major world cities) ── */
const CITIES = [
  // Finland
  'Helsinki', 'Espoo', 'Tampere', 'Vantaa', 'Oulu', 'Turku', 'Jyväskylä',
  'Lahti', 'Kuopio', 'Pori', 'Kouvola', 'Joensuu', 'Lappeenranta', 'Hämeenlinna',
  'Vaasa', 'Seinäjoki', 'Rovaniemi', 'Mikkeli', 'Kotka', 'Salo', 'Porvoo',
  'Kokkola', 'Hyvinkää', 'Lohja', 'Järvenpää', 'Rauma', 'Kajaani', 'Savonlinna',
  'Kerava', 'Nokia', 'Kangasala', 'Ylöjärvi', 'Riihimäki', 'Raseborg',
  'Imatra', 'Sastamala', 'Raahe', 'Hollola', 'Tornio', 'Siilinjärvi',
  // Nordics
  'Stockholm', 'Gothenburg', 'Malmö', 'Uppsala', 'Oslo', 'Bergen', 'Trondheim',
  'Copenhagen', 'Aarhus', 'Odense', 'Reykjavik',
  // Europe
  'London', 'Manchester', 'Birmingham', 'Edinburgh', 'Glasgow', 'Liverpool',
  'Paris', 'Lyon', 'Marseille', 'Nice', 'Toulouse', 'Bordeaux',
  'Berlin', 'Munich', 'Hamburg', 'Frankfurt', 'Cologne', 'Stuttgart', 'Düsseldorf',
  'Amsterdam', 'Rotterdam', 'The Hague', 'Utrecht',
  'Brussels', 'Antwerp', 'Ghent',
  'Madrid', 'Barcelona', 'Valencia', 'Seville', 'Bilbao',
  'Rome', 'Milan', 'Naples', 'Florence', 'Venice', 'Turin', 'Bologna',
  'Lisbon', 'Porto',
  'Vienna', 'Salzburg', 'Graz',
  'Zurich', 'Geneva', 'Basel', 'Bern',
  'Prague', 'Brno',
  'Warsaw', 'Krakow', 'Wroclaw', 'Gdansk',
  'Budapest',
  'Bucharest', 'Cluj-Napoca',
  'Athens', 'Thessaloniki',
  'Dublin', 'Cork',
  'Tallinn', 'Tartu',
  'Riga',
  'Vilnius', 'Kaunas',
  // North America
  'New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia',
  'San Antonio', 'San Diego', 'Dallas', 'San Jose', 'Austin', 'Jacksonville',
  'San Francisco', 'Seattle', 'Denver', 'Nashville', 'Portland', 'Las Vegas',
  'Miami', 'Atlanta', 'Boston', 'Minneapolis', 'Detroit', 'Charlotte',
  'Toronto', 'Vancouver', 'Montreal', 'Calgary', 'Ottawa', 'Edmonton',
  'Mexico City', 'Guadalajara', 'Monterrey',
  // Asia
  'Tokyo', 'Osaka', 'Kyoto', 'Yokohama', 'Seoul', 'Busan',
  'Beijing', 'Shanghai', 'Shenzhen', 'Guangzhou', 'Hong Kong',
  'Singapore', 'Bangkok', 'Kuala Lumpur', 'Jakarta', 'Manila',
  'Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Kolkata',
  'Dubai', 'Abu Dhabi', 'Doha', 'Riyadh',
  'Tel Aviv', 'Jerusalem',
  'Istanbul', 'Ankara',
  // Oceania
  'Sydney', 'Melbourne', 'Brisbane', 'Perth', 'Auckland', 'Wellington',
  // South America
  'São Paulo', 'Rio de Janeiro', 'Buenos Aires', 'Bogotá', 'Lima', 'Santiago',
  // Africa
  'Cairo', 'Cape Town', 'Johannesburg', 'Nairobi', 'Lagos', 'Casablanca',
];

interface CityAutocompleteProps {
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
}

export function CityAutocomplete({ value, onChange, required }: CityAutocompleteProps) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const filtered = value.length >= 3
    ? CITIES.filter((c) =>
        c.toLowerCase().includes(value.toLowerCase())
      ).slice(0, 8)
    : [];

  const shouldShow = showSuggestions && filtered.length > 0;

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Scroll highlighted item into view
  useEffect(() => {
    if (highlightIndex >= 0 && listRef.current) {
      const el = listRef.current.children[highlightIndex] as HTMLElement;
      if (el) el.scrollIntoView({ block: 'nearest' });
    }
  }, [highlightIndex]);

  const selectCity = useCallback((city: string) => {
    onChange(city);
    setShowSuggestions(false);
    setHighlightIndex(-1);
  }, [onChange]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!shouldShow) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightIndex((prev) => (prev < filtered.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightIndex((prev) => (prev > 0 ? prev - 1 : filtered.length - 1));
    } else if (e.key === 'Enter' && highlightIndex >= 0) {
      e.preventDefault();
      selectCity(filtered[highlightIndex]);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  // Highlight matching text
  const highlightMatch = (city: string) => {
    const idx = city.toLowerCase().indexOf(value.toLowerCase());
    if (idx === -1) return <>{city}</>;
    return (
      <>
        {city.slice(0, idx)}
        <span className="font-bold text-[#5A6E60]">{city.slice(idx, idx + value.length)}</span>
        {city.slice(idx + value.length)}
      </>
    );
  };

  return (
    <div ref={containerRef} className="relative">
      <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
        City {required && <span className="text-[#FF9B51] text-xs">*</span>}
      </label>
      <div className="relative">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
          <MapPin className="w-4 h-4 text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="e.g. Helsinki"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setShowSuggestions(true);
            setHighlightIndex(-1);
          }}
          onFocus={() => { if (value.length >= 3) setShowSuggestions(true); }}
          onKeyDown={handleKeyDown}
          className="w-full bg-gray-50 border border-gray-100 rounded-xl pl-11 pr-4 py-3.5 text-sm text-gray-800 placeholder-gray-400 outline-none focus:border-[#9CAFA0] focus:ring-2 focus:ring-[#9CAFA0]/15 transition-all duration-200 hover:border-gray-200"
          autoComplete="off"
        />

        {/* Typing hint */}
        {value.length > 0 && value.length < 3 && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <span className="text-[10px] text-gray-400 font-medium bg-gray-100 px-2 py-0.5 rounded-md">
              {3 - value.length} more
            </span>
          </div>
        )}
      </div>

      {/* Suggestions dropdown */}
      <AnimatePresence>
        {shouldShow && (
          <motion.div
            ref={listRef}
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.15, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="absolute z-50 top-full left-0 right-0 mt-1.5 bg-white rounded-xl border border-gray-100 py-1.5 max-h-[260px] overflow-y-auto"
            style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.10), 0 2px 8px rgba(0,0,0,0.06)' }}
          >
            <div className="px-3 py-1.5 mb-1">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">
                Suggestions
              </p>
            </div>
            {filtered.map((city, i) => (
              <button
                key={city}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => selectCity(city)}
                onMouseEnter={() => setHighlightIndex(i)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors duration-100 ${
                  i === highlightIndex
                    ? 'bg-[#9CAFA0]/10'
                    : 'hover:bg-gray-50'
                }`}
              >
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                  i === highlightIndex ? 'bg-[#9CAFA0]/15' : 'bg-gray-100'
                }`}>
                  <MapPin className={`w-3.5 h-3.5 ${
                    i === highlightIndex ? 'text-[#9CAFA0]' : 'text-gray-400'
                  }`} />
                </div>
                <span className={`text-sm ${
                  i === highlightIndex ? 'text-gray-800' : 'text-gray-600'
                }`}>
                  {highlightMatch(city)}
                </span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
