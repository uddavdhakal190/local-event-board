import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Search,
  Calendar,
  MapPin,
  Heart,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  X,
  SlidersHorizontal,
  Sparkles,
  Music,
  Palette,
  Dumbbell,
  UtensilsCrossed,
  Laptop,
  Laugh,
  Baby,
  Leaf,
  TreePine,
  PartyPopper,
  Wrench,
  LayoutGrid,
  List,
  ArrowRight,
  Clock,
  Users,
  Facebook,
  Instagram,
  Twitter,
  Mail,
  Phone,
  Check,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useSearchParams } from 'react-router';
import { useFavorites } from './favorites-context';
import { CustomDatePicker } from './custom-date-picker';
import { EventDetailModal, type EventDetailData } from './event-detail-modal';
import { supabase } from '../../utils/supabaseClient';
import { AttendeeAvatars, fetchRsvpBatch, type RsvpData } from './rsvp-helpers';

/* ──────────────────────────────────────────────────── */
/*  Category config                                     */
/* ──────────────────────────────────────────────────── */

interface CategoryConfig {
  label: string;
  icon: React.ElementType;
  color: string;
}

const categoryMap: Record<string, CategoryConfig> = {
  Festival: { label: 'Festival', icon: PartyPopper, color: 'text-green-600' },
  Music: { label: 'Music', icon: Music, color: 'text-blue-600' },
  Workshop: { label: 'Workshop', icon: Wrench, color: 'text-purple-600' },
  Sports: { label: 'Sports', icon: Dumbbell, color: 'text-red-600' },
  'Food & Drink': { label: 'Food & Drink', icon: UtensilsCrossed, color: 'text-amber-600' },
  Art: { label: 'Art', icon: Palette, color: 'text-pink-600' },
  Tech: { label: 'Tech', icon: Laptop, color: 'text-indigo-600' },
  Comedy: { label: 'Comedy', icon: Laugh, color: 'text-yellow-600' },
  Kids: { label: 'Kids', icon: Baby, color: 'text-teal-600' },
  Wellness: { label: 'Wellness', icon: Leaf, color: 'text-emerald-600' },
  Outdoor: { label: 'Outdoor', icon: TreePine, color: 'text-lime-700' },
};

const categoryKeys = Object.keys(categoryMap);

/* ──────────────────────────────────────────────────── */
/*  Event data                                          */
/* ──────────────────────────────────────────────────── */

interface Event {
  id: number;
  image: string;
  title: string;
  date: string;
  time: string;
  location: string;
  tag: string;
  price?: string;
  isFree?: boolean;
  attendees?: number;
  serverEventId?: string;
}

// No hardcoded events — all events are fetched from the database

const PLACEHOLDER_IMAGE = 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=800';

const EVENTS_PER_PAGE = 6;

/* ──────────────────────────────────────────────────── */
/*  Helpers                                             */
/* ──────────────────────────────────────────────────── */

function extractCity(location: string): string {
  const parts = location.split(',').map((s) => s.trim());
  return parts[parts.length - 1] || location;
}
function extractMonth(date: string): string { return date.split(' ')[2] || ''; }
function getPriceNum(event: Event): number {
  if (event.isFree) return 0;
  if (!event.price) return 0;
  const n = parseFloat(event.price.replace(/[^0-9.]/g, '')); return isNaN(n) ? 0 : n;
}

type SortOption = 'date' | 'name' | 'price-low' | 'price-high' | 'popular';
type PriceRange = 'free' | '1-25' | '26-50' | '51+';

const priceRanges: { value: PriceRange; label: string }[] = [
  { value: 'free', label: 'Free' },
  { value: '1-25', label: '€1 – €25' },
  { value: '26-50', label: '€26 – €50' },
  { value: '51+', label: '€51+' },
];
const monthOptions = [
  { value: 'Mar', label: 'March 2026' },
  { value: 'Apr', label: 'April 2026' },
  { value: 'May', label: 'May 2026' },
  { value: 'Jun', label: 'June 2026' },
];
// allCities is computed dynamically inside BrowseEventsPage to include server events

function matchesPriceRange(event: Event, range: PriceRange): boolean {
  if (range === 'free') return !!event.isFree;
  const p = getPriceNum(event);
  if (event.isFree) return false;
  if (range === '1-25') return p >= 1 && p <= 25;
  if (range === '26-50') return p >= 26 && p <= 50;
  if (range === '51+') return p > 50;
  return true;
}

/* ──────────────────────────────────────────────────── */
/*  Checkbox (matches home page design tokens)          */
/* ─────────────────────────────────────────────────── */

function FilterCheckbox({ checked, onChange, label, count }: { checked: boolean; onChange: () => void; label: string; count?: number }) {
  return (
    <label className="flex items-center gap-3 cursor-pointer group py-1.5">
      <div
        onClick={onChange}
        className={`w-[18px] h-[18px] rounded-[5px] flex items-center justify-center transition-all duration-200 shrink-0 ${
          checked ? 'bg-[#9CAFA0] shadow-sm shadow-[#9CAFA0]/30' : 'border-2 border-gray-200 group-hover:border-[#9CAFA0]/50'
        }`}
      >
        {checked && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
      </div>
      <span className="text-sm text-gray-600 group-hover:text-gray-900 transition-colors select-none flex-1">{label}</span>
      {count !== undefined && (
        <span className="text-[11px] text-gray-400 tabular-nums">{count}</span>
      )}
    </label>
  );
}

/* ──────────────────────────────────────────────────── */
/*  Event Card – Grid (matches home page card exactly)  */
/* ──────────────────────────────────────────────────── */

function EventCardGrid({ event, index, onViewDetails, rsvpData }: { event: Event; index: number; onViewDetails: (event: EventDetailData) => void; rsvpData?: RsvpData }) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const favId = event.serverEventId || String(event.id);
  const liked = isFavorite(favId);
  const config = categoryMap[event.tag];
  const tagColor = config?.color || 'text-gray-600';
  const TagIcon = config?.icon || Sparkles;

  const dateParts = event.date.split(' ');
  const dayName = dateParts[0] || '';
  const dayNum = dateParts[1] || '';
  const monthName = dateParts[2] || '';

  const handleToggle = () => {
    toggleFavorite(favId);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: index * 0.05, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="group relative bg-white rounded-3xl overflow-hidden border border-gray-100/80 flex flex-col h-full hover:shadow-2xl hover:shadow-black/8 hover:-translate-y-1.5 transition-all duration-500"
      style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.03)' }}
    >
      <div className="relative h-52 overflow-hidden">
        <img src={event.image} alt={event.title} className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/5 to-transparent opacity-60 group-hover:opacity-40 transition-opacity duration-500" />

        {/* Tag + Heart */}
        <div className="absolute top-4 left-4 right-4 flex items-start justify-between">
          <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full backdrop-blur-md bg-white/90 shadow-sm ${tagColor}`}>
            <TagIcon className="w-3 h-3" />
            {event.tag}
          </span>
          <motion.button
            whileTap={{ scale: 0.8 }}
            onClick={handleToggle}
            className={`w-9 h-9 rounded-full flex items-center justify-center backdrop-blur-md transition-all duration-300 shadow-sm ${
              liked ? 'bg-red-500 text-white shadow-red-500/30' : 'bg-white/90 text-gray-500 hover:text-red-500 hover:bg-white'
            }`}
          >
            <Heart className={`w-4 h-4 transition-transform duration-300 ${liked ? 'fill-current scale-110' : ''}`} />
          </motion.button>
        </div>

        {/* Floating date badge */}
        <div className="absolute bottom-4 left-4">
          <div className="bg-white rounded-xl px-3 py-2 shadow-lg shadow-black/10 text-center min-w-[52px]">
            <div className="text-[10px] tracking-widest uppercase text-gray-500">{dayName}</div>
            <div className="text-lg font-bold text-gray-900 -mt-0.5 leading-tight">{dayNum}</div>
            <div className="text-[10px] uppercase text-gray-500 tracking-wide">{monthName}</div>
          </div>
        </div>

        {/* Price badge */}
        <div className="absolute bottom-4 right-4">
          {event.isFree ? (
            <span className="bg-emerald-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg shadow-emerald-500/30">Free</span>
          ) : event.price ? (
            <span className="bg-white text-gray-900 text-sm font-bold px-3 py-1.5 rounded-full shadow-lg cursor-default relative" title="Price set by organizer. EventGo does not sell tickets.">
              {event.price}
              <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[9px] text-white/80 whitespace-nowrap font-medium drop-shadow-sm">by organizer</span>
            </span>
          ) : null}
        </div>
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col flex-grow">
        <h3 className="text-[17px] font-bold text-gray-900 mb-3 leading-snug line-clamp-2 min-h-[3rem] group-hover:text-[#7A8E80] transition-colors duration-300">
          {event.title}
        </h3>
        <div className="space-y-2.5 mb-5">
          <div className="flex items-center gap-2.5 text-gray-500">
            <div className="w-7 h-7 rounded-lg bg-gray-50 flex items-center justify-center shrink-0">
              <Clock className="w-3.5 h-3.5 text-gray-400" />
            </div>
            <span className="text-sm">{event.time}</span>
          </div>
          <div className="flex items-center gap-2.5 text-gray-500">
            <div className="w-7 h-7 rounded-lg bg-gray-50 flex items-center justify-center shrink-0">
              <MapPin className="w-3.5 h-3.5 text-gray-400" />
            </div>
            <span className="text-sm line-clamp-1">{event.location}</span>
          </div>
        </div>
        {/* Footer */}
        <div className="mt-auto pt-4 border-t border-gray-100 flex items-center justify-between">
          <AttendeeAvatars users={rsvpData?.users || []} count={rsvpData?.count || 0} size="sm" />
          <button onClick={() => onViewDetails({ id: event.serverEventId || favId, image: event.image, title: event.title, date: event.date, time: event.time, location: event.location, tag: event.tag, price: event.price, isFree: event.isFree, attendees: rsvpData?.count || 0 })} className="group/btn inline-flex items-center gap-1 text-sm font-semibold text-[#FF9B51] hover:text-[#E88A3E] transition-colors duration-200 cursor-pointer">
            Details
            <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover/btn:translate-x-0.5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

/* ──────────────────────────────────────────────────── */
/*  Event Card – List                                   */
/* ─────────────────────────────────────────────────── */

function EventCardList({ event, index, onViewDetails, rsvpData }: { event: Event; index: number; onViewDetails: (event: EventDetailData) => void; rsvpData?: RsvpData }) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const favId = event.serverEventId || String(event.id);
  const liked = isFavorite(favId);
  const config = categoryMap[event.tag];
  const tagColor = config?.color || 'text-gray-600';
  const TagIcon = config?.icon || Sparkles;

  const handleToggle = () => {
    toggleFavorite(favId);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.35, delay: index * 0.04 }}
      className="group bg-white rounded-3xl overflow-hidden border border-gray-100/80 flex flex-row hover:shadow-xl hover:shadow-black/5 transition-all duration-400"
      style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.03)' }}
    >
      <div className="relative w-56 shrink-0 overflow-hidden">
        <img src={event.image} alt={event.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
        <motion.button
          whileTap={{ scale: 0.8 }}
          onClick={handleToggle}
          className={`absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-md transition-all shadow-sm ${
            liked ? 'bg-red-500 text-white' : 'bg-white/90 text-gray-500 hover:text-red-500'
          }`}
        >
          <Heart className={`w-3.5 h-3.5 ${liked ? 'fill-current' : ''}`} />
        </motion.button>
        <div className="absolute bottom-3 left-3">
          {event.isFree ? (
            <span className="bg-emerald-500 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-md">Free</span>
          ) : event.price ? (
            <span className="bg-white text-gray-900 text-xs font-bold px-2.5 py-1 rounded-full shadow-md cursor-default relative" title="Price set by organizer. EventGo does not sell tickets.">
              {event.price}
              <span className="absolute -bottom-4.5 left-1/2 -translate-x-1/2 text-[8px] text-white/80 whitespace-nowrap font-medium drop-shadow-sm">by organizer</span>
            </span>
          ) : null}
        </div>
      </div>

      <div className="flex-1 p-6 flex flex-col justify-center">
        <div className="flex items-start justify-between gap-4 mb-3">
          <h3 className="text-[17px] font-bold text-gray-900 leading-snug group-hover:text-[#7A8E80] transition-colors duration-300">{event.title}</h3>
          <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-white border border-gray-100 shadow-sm shrink-0 ${tagColor}`}>
            <TagIcon className="w-3 h-3" />
            {event.tag}
          </span>
        </div>
        <div className="flex flex-wrap gap-x-5 gap-y-2 mb-4">
          <div className="flex items-center gap-2 text-gray-500">
            <div className="w-6 h-6 rounded-md bg-gray-50 flex items-center justify-center"><Calendar className="w-3 h-3 text-[#FF9B51]" /></div>
            <span className="text-sm">{event.date}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-500">
            <div className="w-6 h-6 rounded-md bg-gray-50 flex items-center justify-center"><Clock className="w-3 h-3 text-gray-400" /></div>
            <span className="text-sm">{event.time}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-500">
            <div className="w-6 h-6 rounded-md bg-gray-50 flex items-center justify-center"><MapPin className="w-3 h-3 text-gray-400" /></div>
            <span className="text-sm">{event.location}</span>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <AttendeeAvatars users={rsvpData?.users || []} count={rsvpData?.count || 0} size="sm" />
          <button onClick={() => onViewDetails({ id: event.serverEventId || favId, image: event.image, title: event.title, date: event.date, time: event.time, location: event.location, tag: event.tag, price: event.price, isFree: event.isFree, attendees: rsvpData?.count || 0 })} className="group/btn inline-flex items-center gap-1.5 text-sm font-semibold text-[#FF9B51] hover:text-[#E88A3E] transition-colors cursor-pointer">
            Details <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover/btn:translate-x-0.5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

/* ──────────────────────────────────────────────────── */
/*  Sidebar (same visual system as home page cards)     */
/* ──────────────────────────────────────────────────── */

interface SidebarProps {
  selectedCategories: Set<string>;
  toggleCategory: (c: string) => void;
  selectedDate: string;
  setSelectedDate: (d: string) => void;
  selectedPriceRanges: Set<PriceRange>;
  togglePriceRange: (r: PriceRange) => void;
  selectedCities: Set<string>;
  toggleCity: (c: string) => void;
  clearAll: () => void;
  activeCount: number;
  show: boolean;
  setShow: (v: boolean) => void;
  allEvents: Event[];
  allCities: string[];
}

function FilterSidebar(props: SidebarProps) {
  const { selectedCategories, toggleCategory, selectedDate, setSelectedDate, selectedPriceRanges, togglePriceRange, selectedCities, toggleCity, clearAll, activeCount, show, setShow, allEvents, allCities } = props;
  const [showAllCities, setShowAllCities] = useState(false);
  const cities = showAllCities ? allCities : allCities.slice(0, 5);

  const inner = (
    <div className="space-y-7">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#9CAFA0]/10 flex items-center justify-center">
            <SlidersHorizontal className="w-4 h-4 text-[#9CAFA0]" />
          </div>
          <span className="text-sm font-bold text-gray-900">Filters</span>
          {activeCount > 0 && (
            <span className="w-5 h-5 bg-[#FF9B51] text-white text-[10px] font-bold rounded-full flex items-center justify-center">{activeCount}</span>
          )}
        </div>
        {activeCount > 0 && (
          <button onClick={clearAll} className="text-xs font-semibold text-[#FF9B51] hover:text-[#E88A3E] transition-colors">Clear all</button>
        )}
      </div>

      {/* Date */}
      <div>
        <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">Date</h4>
        <div className="bg-gray-50 border border-gray-100 rounded-xl hover:border-[#9CAFA0]/40 transition-colors">
          <CustomDatePicker
            value={selectedDate}
            onChange={(dateStr) => setSelectedDate(dateStr)}
          />
        </div>
      </div>

      <div className="h-px bg-gray-100" />

      {/* Category */}
      <div>
        <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">Category</h4>
        <div className="space-y-0.5">
          {categoryKeys.map((cat) => {
            const count = allEvents.filter((e) => e.tag === cat).length;
            return <FilterCheckbox key={cat} checked={selectedCategories.has(cat)} onChange={() => toggleCategory(cat)} label={cat} count={count} />;
          })}
        </div>
      </div>

      <div className="h-px bg-gray-100" />

      {/* City */}
      <div>
        <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">City</h4>
        <div className="space-y-0.5">
          {cities.map((city) => {
            const count = allEvents.filter((e) => extractCity(e.location) === city).length;
            return <FilterCheckbox key={city} checked={selectedCities.has(city)} onChange={() => toggleCity(city)} label={city} count={count} />;
          })}
        </div>
        {allCities.length > 5 && (
          <button onClick={() => setShowAllCities(!showAllCities)} className="text-xs font-semibold text-[#9CAFA0] hover:text-[#7A8E80] mt-2 transition-colors">
            {showAllCities ? 'Show less' : `+ ${allCities.length - 5} more cities`}
          </button>
        )}
      </div>

      <div className="h-px bg-gray-100" />

      {/* Price */}
      <div>
        <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">Price Range</h4>
        <div className="space-y-0.5">
          {priceRanges.map((r) => {
            const count = allEvents.filter((e) => matchesPriceRange(e, r.value)).length;
            return <FilterCheckbox key={r.value} checked={selectedPriceRanges.has(r.value)} onChange={() => togglePriceRange(r.value)} label={r.label} count={count} />;
          })}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop */}
      <aside className="hidden lg:block w-[270px] shrink-0">
        <div className="sticky top-28 bg-white rounded-3xl border border-gray-100/80 p-6"
          style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.03)' }}>
          {inner}
        </div>
      </aside>
      {/* Mobile overlay */}
      <AnimatePresence>
        {show && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={() => setShow(false)} />
            <motion.div initial={{ x: -320 }} animate={{ x: 0 }} exit={{ x: -320 }} transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed left-0 top-0 bottom-0 w-[310px] bg-white z-50 p-6 overflow-y-auto lg:hidden shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <span className="text-sm font-bold text-gray-900">Filters</span>
                <button onClick={() => setShow(false)} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors"><X className="w-4 h-4" /></button>
              </div>
              {inner}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

/* ──────────────────────────────────────────────────── */
/*  Footer (identical to home page)                     */
/* ──────────────────────────────────────────────────── */

function Footer() {
  return (
    <footer className="relative bg-[#1A1A1C] text-white overflow-hidden">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-white/[0.015] -translate-y-1/2 translate-x-1/3 pointer-events-none" />
      <div className="relative py-20 px-6 md:px-12">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-8">
            <div className="md:col-span-5 space-y-6">
              <div className="flex items-center gap-1">
                <span className="text-2xl font-bold tracking-tight text-white">Event</span>
                <span className="text-2xl font-bold tracking-tight text-[#FFB070]">Go</span>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed max-w-xs">Discover and share amazing events across the world. From cultural festivals to outdoor adventures, find your next experience.</p>
              <div className="flex gap-3 pt-2">
                {[{ icon: Facebook, bg: 'bg-blue-600/10 hover:bg-blue-600/20 text-blue-400' }, { icon: Instagram, bg: 'bg-pink-600/10 hover:bg-pink-600/20 text-pink-400' }, { icon: Twitter, bg: 'bg-sky-500/10 hover:bg-sky-500/20 text-sky-400' }].map(({ icon: Icon, bg }, i) => (
                  <a key={i} href="#" className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors duration-200 ${bg}`}><Icon className="w-4 h-4" /></a>
                ))}
              </div>
            </div>
            <div className="md:col-span-3 md:pl-8">
              <h4 className="text-[#FF9B51] font-bold text-xs uppercase tracking-widest mb-6">Quick Links</h4>
              <ul className="space-y-3.5">
                {['Browse Events', 'Submit Event', 'Help Center', 'Terms of Service', 'Privacy Policy'].map((item) => (
                  <li key={item}><a href="#" className="text-gray-400 hover:text-white transition-colors text-sm inline-flex items-center gap-1 group"><span className="w-0 h-px bg-[#FF9B51] group-hover:w-3 transition-all duration-200" />{item}</a></li>
                ))}
              </ul>
            </div>
            <div className="md:col-span-4">
              <h4 className="text-[#FF9B51] font-bold text-xs uppercase tracking-widest mb-6">Contact Us</h4>
              <ul className="space-y-4">
                {[{ icon: Mail, text: 'contact@eventgo.com' }, { icon: Phone, text: '+358 78 465 4387' }, { icon: MapPin, text: 'Kokkola, Finland' }].map(({ icon: Icon, text }) => (
                  <li key={text} className="flex items-center gap-3 text-gray-400 text-sm"><div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center shrink-0"><Icon className="w-4 h-4 text-gray-500" /></div><span>{text}</span></li>
                ))}
              </ul>
            </div>
          </div>
          <div className="mt-16 pt-8 border-t border-white/[0.06] flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-gray-500 text-xs">&copy;2026 EventGo. All rights reserved.</p>
            <div className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /><span className="text-gray-500 text-xs">All systems operational</span></div>
          </div>
        </div>
      </div>
    </footer>
  );
}

/* ──────────────────────────────────────────────────── */
/*  Main page                                           */
/* ──────────────────────────────────────────────────── */

/* ── Helper: convert server event to local Event shape ── */
function mapServerEvent(se: any, index: number): Event {
  const startDate = se.start_date || se.startDate || null;
  const startTime = se.start_time || se.startTime || 'TBD';
  const endTime = se.end_time || se.endTime || '';
  const venueName = se.venue_name || se.venueName || 'Venue TBA';
  const coverImage = se.cover_image || se.coverImage;
  const pricingType = se.pricing_type || se.pricingType || 'free';
  const d = startDate ? new Date(`${startDate}T00:00:00`) : new Date();
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const dateStr = `${dayNames[d.getDay()]} ${d.getDate()} ${monthNames[d.getMonth()]}`;
  const timeStr = endTime ? `${startTime} – ${endTime}` : startTime;
  const locationStr = se.address ? `${venueName}, ${se.address}, ${se.city || ''}` : `${venueName}, ${se.city || ''}`;

  return {
    id: 1000 + index,
    image: coverImage || PLACEHOLDER_IMAGE,
    title: se.title || 'Untitled Event',
    date: dateStr,
    time: timeStr,
    location: locationStr,
    tag: se.category || 'Event',
    price: pricingType === 'paid' && se.price ? `${se.price}€` : undefined,
    isFree: pricingType === 'free',
    attendees: 0,
    serverEventId: se.id,
  };
}

export function BrowseEventsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedPriceRanges, setSelectedPriceRanges] = useState<Set<PriceRange>>(new Set());
  const [selectedCities, setSelectedCities] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<SortOption>('date');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<EventDetailData | null>(null);
  const [serverEvents, setServerEvents] = useState<Event[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(true);
  const [rsvpMap, setRsvpMap] = useState<Record<string, RsvpData>>({});
  const gridRef = useRef<HTMLDivElement>(null);
  const sortRef = useRef<HTMLDivElement>(null);

  // Fetch approved events directly from Postgres via Supabase
  useEffect(() => {
    const loadEvents = async () => {
      setIsLoadingEvents(true);
      try {
        const { data: rows, error } = await supabase
          .from('events')
          .select('*')
          .eq('status', 'approved')
          .eq('is_draft', false);

        if (error) {
          throw error;
        }

        if (Array.isArray(rows)) {
          const mapped = rows.map((e: any, i: number) => mapServerEvent(e, i));
          setServerEvents(mapped);
          console.log(`Loaded ${mapped.length} approved events from database`);

          // Fetch RSVP data for all events
          const eventIds = rows.map((e: any) => e.id);
          const rsvps = await fetchRsvpBatch(eventIds);
          setRsvpMap(rsvps);
        }
      } catch (err) {
        console.error('Failed to fetch events from database:', err);
      }
      setIsLoadingEvents(false);
    };
    loadEvents();
  }, []);

  // All events come from the database — no hardcoded data
  const allEvents = useMemo(() => serverEvents, [serverEvents]);
  const allCities = useMemo(() => Array.from(new Set(allEvents.map((e) => extractCity(e.location)))).sort(), [allEvents]);

  // Read URL params from home page search and auto-apply filters
  const initializedRef = useRef(false);
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    const locationParam = searchParams.get('location');
    const dateParam = searchParams.get('date');

    if (locationParam) {
      // Try to match to a city in the sidebar filter
      const matchedCity = allCities.find(
        (c: string) => c.toLowerCase() === locationParam.toLowerCase()
      );
      if (matchedCity) {
        setSelectedCities(new Set([matchedCity]));
      } else {
        // Fall back to text search so it still filters results
        setSearchQuery(locationParam);
      }
    }

    if (dateParam) {
      // dateParam is YYYY-MM-DD — set directly as the selected date
      const dateObj = new Date(dateParam + 'T00:00:00');
      if (!isNaN(dateObj.getTime())) {
        setSelectedDate(dateParam);
      }
    }

    // Clean URL params after applying them
    if (locationParam || dateParam) {
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams, allCities]);

  const toggle = <T,>(set: Set<T>, item: T): Set<T> => { const n = new Set(set); n.has(item) ? n.delete(item) : n.add(item); return n; };
  const toggleCategory = (c: string) => { setSelectedCategories((p) => toggle(p, c)); setCurrentPage(1); };
  const togglePriceRange = (r: PriceRange) => { setSelectedPriceRanges((p) => toggle(p, r)); setCurrentPage(1); };
  const toggleCity = (c: string) => { setSelectedCities((p) => toggle(p, c)); setCurrentPage(1); };
  const clearAll = () => { setSelectedCategories(new Set()); setSelectedDate(''); setSelectedPriceRanges(new Set()); setSelectedCities(new Set()); setSearchQuery(''); setSortBy('date'); setCurrentPage(1); };

  const activeCount = selectedCategories.size + (selectedDate ? 1 : 0) + selectedPriceRanges.size + selectedCities.size;

  const filteredEvents = useMemo(() => {
    let result = allEvents.filter((e) => {
      if (searchQuery) { const q = searchQuery.toLowerCase(); if (!(e.title.toLowerCase().includes(q) || e.location.toLowerCase().includes(q) || e.tag.toLowerCase().includes(q))) return false; }
      if (selectedCategories.size > 0 && !selectedCategories.has(e.tag)) return false;
      if (selectedDate) { const filterMonth = new Date(selectedDate + 'T00:00:00').toLocaleString('en-US', { month: 'short' }); if (extractMonth(e.date) !== filterMonth) return false; }
      if (selectedCities.size > 0 && !selectedCities.has(extractCity(e.location))) return false;
      if (selectedPriceRanges.size > 0 && !Array.from(selectedPriceRanges).some((r) => matchesPriceRange(e, r))) return false;
      return true;
    });
    if (sortBy === 'name') result = [...result].sort((a, b) => a.title.localeCompare(b.title));
    else if (sortBy === 'price-low') result = [...result].sort((a, b) => getPriceNum(a) - getPriceNum(b));
    else if (sortBy === 'price-high') result = [...result].sort((a, b) => getPriceNum(b) - getPriceNum(a));
    else if (sortBy === 'popular') result = [...result].sort((a, b) => (b.attendees || 0) - (a.attendees || 0));
    return result;
  }, [allEvents, searchQuery, selectedCategories, selectedDate, selectedPriceRanges, selectedCities, sortBy]);

  const totalPages = Math.ceil(filteredEvents.length / EVENTS_PER_PAGE);
  const paginatedEvents = filteredEvents.slice((currentPage - 1) * EVENTS_PER_PAGE, currentPage * EVENTS_PER_PAGE);

  const handlePageChange = (page: number) => { setCurrentPage(page); gridRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }); };

  const sortLabels: Record<SortOption, string> = { date: 'Date', name: 'Name (A–Z)', 'price-low': 'Price: Low → High', 'price-high': 'Price: High → Low', popular: 'Most Popular' };

  React.useEffect(() => {
    const h = (e: MouseEvent) => { if (sortRef.current && !sortRef.current.contains(e.target as Node)) setShowSortDropdown(false); };
    document.addEventListener('mousedown', h); return () => document.removeEventListener('mousedown', h);
  }, []);

  // Active filter tags
  const tags: { label: string; remove: () => void }[] = [];
  selectedCategories.forEach((c) => tags.push({ label: c, remove: () => toggleCategory(c) }));
  if (selectedDate) { const d = new Date(selectedDate + 'T00:00:00'); const dateLabel = d.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' }); tags.push({ label: dateLabel, remove: () => { setSelectedDate(''); setCurrentPage(1); } }); }
  selectedCities.forEach((c) => tags.push({ label: c, remove: () => toggleCity(c) }));
  selectedPriceRanges.forEach((r) => tags.push({ label: priceRanges.find((p) => p.value === r)?.label || r, remove: () => togglePriceRange(r) }));

  return (
    <div className="min-h-screen flex flex-col">
      {/* ── Hero (same as home page) ── */}
      <section className="relative w-full overflow-hidden bg-[#9CAFA0]">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full bg-white/[0.04]" />
          <div className="absolute -bottom-24 -left-24 w-[380px] h-[380px] rounded-full bg-white/[0.04]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] rounded-full bg-white/[0.02]" />
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
        </div>

        <div className="relative pt-36 pb-24 md:pt-44 md:pb-32 px-6 flex flex-col items-center">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/15 rounded-full px-4 py-1.5 mb-5">
            <Sparkles className="w-3.5 h-3.5 text-[#FFB070]" />
            <span className="text-xs font-medium text-white/80 tracking-wide uppercase">{allEvents.length} Curated Events</span>
          </motion.div>

          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.05 }}
            className="text-4xl md:text-[56px] font-bold tracking-tight text-white leading-[1.08] text-center mb-4">
            Browse <span className="text-[#FFB070]">Events</span>
          </motion.h1>

          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}
            className="text-lg text-white/60 max-w-md mx-auto text-center mb-10">
            Find your next unforgettable experience across Finland
          </motion.p>

          {/* Glassmorphic search bar */}
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}
            className="w-full max-w-2xl">
            <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl shadow-black/10 p-1.5 flex items-center gap-1.5">
              <div className="flex-1 px-4 py-3 flex items-center gap-3">
                <Search className="text-gray-400 w-5 h-5 shrink-0" />
                <input type="text" value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                  placeholder="Search events, venues, cities..." className="w-full outline-none text-gray-800 placeholder-gray-400 text-sm bg-transparent" />
                {searchQuery && (
                  <button onClick={() => { setSearchQuery(''); setCurrentPage(1); }} className="text-gray-400 hover:text-gray-600 transition-colors"><X className="w-4 h-4" /></button>
                )}
              </div>
              <button className="bg-[#FF9B51] hover:bg-[#E88A3E] text-white px-6 py-3 rounded-xl font-semibold shadow-lg shadow-orange-500/20 transition-all duration-200 active:scale-[0.98] text-sm flex items-center gap-2 m-0.5">
                <Search className="w-4 h-4" />
                <span className="hidden sm:inline">Search</span>
              </button>
            </div>
          </motion.div>
        </div>

        {/* Wave divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 60" fill="none" className="w-full" preserveAspectRatio="none">
            <path d="M0 60V30C240 0 480 0 720 30C960 60 1200 60 1440 30V60H0Z" fill="#FCFCFC" />
          </svg>
        </div>
      </section>

      {/* ── Sidebar + Content ── */}
      <div className="flex-1 bg-[#FCFCFC]">
        <div className="max-w-7xl mx-auto w-full px-6 md:px-10 py-10 flex gap-8">
          {/* Sidebar */}
          <FilterSidebar
            selectedCategories={selectedCategories} toggleCategory={toggleCategory}
            selectedDate={selectedDate} setSelectedDate={(d) => { setSelectedDate(d); setCurrentPage(1); }}
            selectedPriceRanges={selectedPriceRanges} togglePriceRange={togglePriceRange}
            selectedCities={selectedCities} toggleCity={toggleCity}
            clearAll={clearAll} activeCount={activeCount}
            show={showMobileSidebar} setShow={setShowMobileSidebar}
            allEvents={allEvents} allCities={allCities}
          />

          {/* Main content */}
          <div className="flex-1 min-w-0">
            {/* Toolbar */}
            <div ref={gridRef} className="flex items-center justify-between mb-6 scroll-mt-24 flex-wrap gap-3">
              <div className="flex items-center gap-3">
                {/* Mobile filter toggle */}
                <button onClick={() => setShowMobileSidebar(true)}
                  className="lg:hidden flex items-center gap-2 bg-white border border-gray-100 rounded-xl px-4 py-2.5 text-sm font-medium text-gray-600 hover:border-gray-200 transition-colors shadow-sm">
                  <SlidersHorizontal className="w-4 h-4" /> Filters
                  {activeCount > 0 && <span className="w-5 h-5 bg-[#FF9B51] text-white text-[10px] font-bold rounded-full flex items-center justify-center">{activeCount}</span>}
                </button>
                {/* Count */}
                <span className="text-sm text-gray-500">
                  <span className="font-semibold text-gray-800">{filteredEvents.length}</span> events found
                </span>
              </div>

              <div className="flex items-center gap-2">
                {/* View toggle */}
                <div className="flex bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm">
                  <button onClick={() => setViewMode('grid')}
                    className={`flex items-center gap-1.5 px-3.5 py-2.5 text-sm font-medium transition-all duration-200 ${viewMode === 'grid' ? 'bg-[#9CAFA0] text-white' : 'text-gray-400 hover:text-gray-600'}`}>
                    <LayoutGrid className="w-4 h-4" />
                  </button>
                  <button onClick={() => setViewMode('list')}
                    className={`flex items-center gap-1.5 px-3.5 py-2.5 text-sm font-medium transition-all duration-200 ${viewMode === 'list' ? 'bg-[#9CAFA0] text-white' : 'text-gray-400 hover:text-gray-600'}`}>
                    <List className="w-4 h-4" />
                  </button>
                </div>

                {/* Sort */}
                <div ref={sortRef} className="relative">
                  <button onClick={() => setShowSortDropdown(!showSortDropdown)}
                    className="flex items-center gap-2 bg-white border border-gray-100 rounded-xl px-4 py-2.5 text-sm font-medium text-gray-600 hover:border-gray-200 transition-colors shadow-sm">
                    {sortLabels[sortBy]}
                    <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${showSortDropdown ? 'rotate-180' : ''}`} />
                  </button>
                  <AnimatePresence>
                    {showSortDropdown && (
                      <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.15 }}
                        className="absolute right-0 top-full mt-2 bg-white border border-gray-100 rounded-2xl shadow-xl shadow-black/8 z-30 py-2 min-w-[200px]">
                        {(Object.keys(sortLabels) as SortOption[]).map((opt) => (
                          <button key={opt} onClick={() => { setSortBy(opt); setShowSortDropdown(false); setCurrentPage(1); }}
                            className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${sortBy === opt ? 'text-[#FF9B51] font-semibold bg-orange-50/50' : 'text-gray-600 hover:bg-gray-50'}`}>
                            {sortLabels[opt]}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>

            {/* Active filter tags */}
            {tags.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 mb-6">
                {tags.map((t) => (
                  <span key={t.label} className="inline-flex items-center gap-1.5 bg-[#9CAFA0]/10 text-[#5A6E60] text-xs font-semibold px-3 py-1.5 rounded-full border border-[#9CAFA0]/15">
                    {t.label}
                    <button onClick={t.remove} className="hover:text-red-500 transition-colors"><X className="w-3 h-3" /></button>
                  </span>
                ))}
                <button onClick={clearAll} className="text-xs font-semibold text-gray-400 hover:text-[#FF9B51] transition-colors ml-1">Clear all</button>
              </div>
            )}

            {/* Events */}
            {isLoadingEvents ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-7">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-white rounded-3xl overflow-hidden border border-gray-100/80 animate-pulse" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                    <div className="h-52 bg-gray-100" />
                    <div className="p-5 space-y-3">
                      <div className="h-5 bg-gray-100 rounded-lg w-3/4" />
                      <div className="h-4 bg-gray-50 rounded-lg w-1/2" />
                      <div className="h-4 bg-gray-50 rounded-lg w-2/3" />
                      <div className="pt-4 border-t border-gray-50 flex justify-between">
                        <div className="h-4 bg-gray-50 rounded-lg w-24" />
                        <div className="h-4 bg-gray-50 rounded-lg w-16" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : paginatedEvents.length > 0 ? (
              <AnimatePresence mode="wait">
                <motion.div key={`${viewMode}-${currentPage}-${sortBy}-${searchQuery}-${activeCount}`}
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                  {viewMode === 'grid' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-7">
                      {paginatedEvents.map((e, i) => <EventCardGrid key={e.id} event={e} index={i} onViewDetails={setSelectedEvent} rsvpData={rsvpMap[e.serverEventId || '']} />)}
                    </div>
                  ) : (
                    <div className="space-y-5">
                      {paginatedEvents.map((e, i) => <EventCardList key={e.id} event={e} index={i} onViewDetails={setSelectedEvent} rsvpData={rsvpMap[e.serverEventId || '']} />)}
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            ) : (
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                className="text-center py-24 bg-white rounded-3xl border border-gray-100/80" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.03)' }}>
                <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
                  <Search className="w-7 h-7 text-gray-300" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">No events found</h3>
                <p className="text-gray-500 mb-6 text-sm max-w-xs mx-auto">Try adjusting your filters or search query</p>
                <button onClick={clearAll} className="bg-[#FF9B51] hover:bg-[#E88A3E] text-white px-7 py-3 rounded-xl font-semibold text-sm transition-all duration-200 shadow-lg shadow-orange-500/15 hover:shadow-orange-500/25">
                  Clear All Filters
                </button>
              </motion.div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-1.5 mt-16">
                <button onClick={() => handlePageChange(Math.max(1, currentPage - 1))} disabled={currentPage === 1}
                  className="w-10 h-10 rounded-xl flex items-center justify-center bg-white border border-gray-100 text-gray-400 hover:text-gray-600 hover:border-gray-200 disabled:opacity-25 disabled:cursor-not-allowed transition-all shadow-sm">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button key={page} onClick={() => handlePageChange(page)}
                    className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-semibold transition-all duration-200 ${
                      currentPage === page ? 'bg-[#9CAFA0] text-white shadow-lg shadow-[#9CAFA0]/25' : 'bg-white border border-gray-100 text-gray-500 hover:border-gray-200 shadow-sm'
                    }`}>{page}</button>
                ))}
                <button onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages}
                  className="w-10 h-10 rounded-xl flex items-center justify-center bg-white border border-gray-100 text-gray-400 hover:text-gray-600 hover:border-gray-200 disabled:opacity-25 disabled:cursor-not-allowed transition-all shadow-sm">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}

      {/* Event detail modal */}
      <EventDetailModal event={selectedEvent} onClose={() => setSelectedEvent(null)} />
    </div>
  );
}      
