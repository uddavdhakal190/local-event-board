import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  Search,
  Calendar,
  MapPin,
  ArrowRight,
  ArrowLeft,
  Heart,
  Facebook,
  Twitter,
  Instagram,
  Mail,
  Phone,
  Sparkles,
  Clock,
  Users,
  Music,
  Palette,
  HandHeart,
  PartyPopper,
  Star,
  Zap,
  TrendingUp,
  X,
  Laptop,
  Dumbbell,
  UtensilsCrossed,
  Leaf,
  Theater,
  Flame,
  ShieldCheck,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Link, useNavigate } from 'react-router';
import { useFavorites } from './favorites-context';
import { CustomDatePicker } from './custom-date-picker';
import { EventDetailModal, type EventDetailData } from './event-detail-modal';
import { supabase } from '../../utils/supabaseClient';
import { AttendeeAvatars, fetchRsvpBatch, type RsvpData } from './rsvp-helpers';

// Import images for fallback usage
import imgFeatured from "../../assets/c212d3ee398fea2ccc51ef0a22fc96464924d411.png";
import imgUpcoming1 from "../../assets/b94c129aca3f804170770d4fbfe0c32c36453de7.png";
import imgUpcoming2 from "../../assets/08e55f9c2d182fcd2f13dc9e04de5a67e7991374.png";
import imgUpcoming3 from "../../assets/d0f6a8fe0a6e0f7d90a6b21a1850f60b17053106.png";

/* ──────────────────────────────────────────────────── */
/*  Hero                                                */
/* ─────────────────────────────────────────────────── */

function Hero() {
  const [heroLocation, setHeroLocation] = useState('');
  const [heroDate, setHeroDate] = useState('');
  const [showCitySuggestions, setShowCitySuggestions] = useState(false);
  const locationWrapperRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // --- City autocomplete data ---
  const cities = [
    'Kokkola', 'Helsinki', 'Tampere', 'Turku', 'Oulu', 'Jyväskylä', 'Lahti',
    'Kuopio', 'Pori', 'Joensuu', 'Lappeenranta', 'Hämeenlinna', 'Vaasa',
    'Rovaniemi', 'Seinäjoki', 'Mikkeli', 'Kotka', 'Salo', 'Porvoo', 'Kouvola',
    'Rauma', 'Kajaani', 'Savonlinna', 'Kemi', 'Tornio', 'Iisalmi', 'Varkaus',
    'Pietarsaari', 'Raahe', 'Ylivieska', 'Lohja', 'Hyvinkää', 'Järvenpää',
    'Kerava', 'Nurmijärvi', 'Kirkkonummi', 'Espoo', 'Vantaa', 'Kangasala',
    'Stockholm', 'Oslo', 'Copenhagen', 'Berlin', 'London', 'Paris', 'Amsterdam',
    'Barcelona', 'Madrid', 'Rome', 'Vienna', 'Prague', 'Warsaw', 'Zurich',
    'Munich', 'Hamburg', 'Dublin', 'Brussels', 'Lisbon', 'Budapest',
  ];

  const filteredCities = heroLocation.length >= 3
    ? cities.filter((c) => c.toLowerCase().includes(heroLocation.toLowerCase())).slice(0, 6)
    : [];

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (locationWrapperRef.current && !locationWrapperRef.current.contains(e.target as Node)) {
        setShowCitySuggestions(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (heroLocation.trim()) params.set('location', heroLocation.trim());
    if (heroDate) params.set('date', heroDate);
    const query = params.toString();
    navigate(query ? `/browse?${query}` : '/browse');
  };

  return (
    <section className="relative w-full bg-[#9CAFA0]">
      {/* Decorative shapes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full bg-white/[0.04]" />
        <div className="absolute -bottom-24 -left-24 w-[380px] h-[380px] rounded-full bg-white/[0.04]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] rounded-full bg-white/[0.02]" />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}
        />
      </div>

      <div className="relative pt-36 pb-32 md:pt-48 md:pb-44 px-6 flex flex-col items-center">
        <div className="max-w-4xl text-center space-y-6">
          

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.05 }}
            className="text-4xl md:text-[64px] font-bold tracking-tight text-white leading-[1.08]"
          >
            Discover Local
            <br />
            <span className="text-[#FFB070]">Events</span> Near You
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-lg md:text-xl text-white/70 max-w-xl mx-auto leading-relaxed"
          >
            Find amazing events in your area — from cultural festivals to outdoor adventures.
          </motion.p>
        </div>

        {/* Search bar */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="w-full max-w-3xl mt-12"
        >
          <div className="bg-white/95 backdrop-blur-2xl rounded-2xl md:rounded-full shadow-2xl shadow-black/12 border border-white/60 px-3 py-3 md:px-2 md:py-1 flex flex-col md:flex-row gap-0 items-stretch md:items-center transition-all duration-300 hover:shadow-[0_20px_60px_-12px_rgba(0,0,0,0.15)] hover:scale-[1.01]">
            {/* Location with autocomplete */}
            <div className="relative w-full md:w-1/2" ref={locationWrapperRef}>
              <div className="px-5 py-3.5 md:py-3 flex items-center gap-3 border-b md:border-b-0 md:border-r border-gray-200/40 h-full group">
                <MapPin className="text-[#9CAFA0] w-[18px] h-[18px] shrink-0 transition-transform duration-300 group-focus-within:scale-110" />
                <div className="relative flex-1">
                  <input
                    type="text"
                    placeholder="Enter a location..."
                    className="outline-none text-gray-800 placeholder-gray-400/80 text-[15px] md:text-sm bg-transparent w-full transition-all duration-200 focus:placeholder-gray-300"
                    value={heroLocation}
                    onChange={(e) => {
                      setHeroLocation(e.target.value);
                      setShowCitySuggestions(true);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSearch();
                      if (e.key === 'Escape') setShowCitySuggestions(false);
                    }}
                    onFocus={() => setShowCitySuggestions(true)}
                  />
                </div>
                {heroLocation && (
                  <button
                    onClick={() => { setHeroLocation(''); setShowCitySuggestions(false); }}
                    className="text-gray-300 hover:text-[#9CAFA0] hover:bg-[#9CAFA0]/10 transition-all duration-200 shrink-0 ml-auto p-1.5 rounded-full hover:scale-110"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* City suggestions dropdown */}
              {showCitySuggestions && filteredCities.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-2 bg-white/98 backdrop-blur-xl rounded-2xl border border-gray-100/80 shadow-2xl shadow-black/12 z-20 overflow-hidden max-h-60 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="px-4 pt-3 pb-2 border-b border-gray-100/60">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Popular Locations</span>
                  </div>
                  <div className="py-1">
                    {filteredCities.map((city, i) => {
                      const idx = city.toLowerCase().indexOf(heroLocation.toLowerCase());
                      const before = city.slice(0, idx);
                      const match = city.slice(idx, idx + heroLocation.length);
                      const after = city.slice(idx + heroLocation.length);
                      return (
                        <button
                          key={city}
                          onClick={() => {
                            setHeroLocation(city);
                            setShowCitySuggestions(false);
                          }}
                          className={`w-full text-left px-4 py-3 md:py-2.5 flex items-center gap-3.5 text-sm transition-all duration-150 hover:bg-gradient-to-r hover:from-[#9CAFA0]/12 hover:to-[#9CAFA0]/5 hover:pl-5 group ${i === 0 ? 'bg-gray-50/40' : ''}`}
                        >
                          <MapPin className="w-4 h-4 text-gray-300 group-hover:text-[#9CAFA0] shrink-0 transition-colors duration-200" />
                          <span className="text-gray-700 group-hover:text-gray-900 transition-colors duration-150">
                            {before}<span className="font-bold text-[#9CAFA0] bg-[#9CAFA0]/8 px-1 py-0.5 rounded">{match}</span>{after}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Date picker */}
            <div className="w-full md:w-1/2">
              <CustomDatePicker value={heroDate} onChange={setHeroDate} />
            </div>
          </div>

          {/* Search button — below the box */}
          <div className="flex justify-center mt-4">
            <button
              onClick={handleSearch}
              className="bg-[#FF9B51] hover:bg-[#E88A3E] text-white px-8 py-3 rounded-full font-semibold shadow-lg shadow-orange-500/20 hover:shadow-orange-500/30 transition-all duration-200 active:scale-[0.98] whitespace-nowrap text-sm flex items-center justify-center gap-2"
            >
              <Search className="w-4 h-4" />
              Search Event
            </button>
          </div>
        </motion.div>

        {/* Stats row */}
        
      </div>

      {/* Wave divider */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 60" fill="none" className="w-full" preserveAspectRatio="none">
          <path d="M0 60V30C240 0 480 0 720 30C960 60 1200 60 1440 30V60H0Z" fill="#FCFCFC" />
        </svg>
      </div>
    </section>
  );
}

/* ──────────────────────────────────────────────────── */
/*  Section heading                                     */
/* ──────────────────────────────────────────────────── */

function SectionHeading({ title, subtitle, centered = true }: { title: string; subtitle?: string; centered?: boolean }) {
  return (
    <div className={`mb-14 ${centered ? 'text-center' : ''}`}>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.5 }}
      >
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight">
          {title}
        </h2>
        {subtitle && (
          <p className="mt-3 text-gray-500 text-base max-w-lg mx-auto">{subtitle}</p>
        )}
      </motion.div>
    </div>
  );
}

/* ───────���────────────────────────────────────────── */
/*  Featured Events carousel                            */
/* ──────────────────────────────────────────────────── */

function FeaturedEvent({ onViewDetails }: { onViewDetails: (event: EventDetailData) => void }) {
  const [featuredEvents, setFeaturedEvents] = useState<Array<{
    id: string; image: string; title: string; date: string; time: string;
    tag: string; description: string; attendees: number; location: string;
    price?: string; isFree?: boolean;
  }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [featuredRsvpMap, setFeaturedRsvpMap] = useState<Record<string, RsvpData>>({});
  const [showingByPopularity, setShowingByPopularity] = useState(true);

  // Fallback images for featured events with no cover
  const fallbackImages = [imgFeatured, imgFeatured, imgFeatured];

  useEffect(() => {
    const load = async () => {
      try {
        const { data: rows, error } = await supabase
          .from('events')
          .select('*')
          .eq('status', 'approved')
          .eq('is_draft', false);

        if (error) {
          throw error;
        }

        if (Array.isArray(rows) && rows.length > 0) {
          const allIds = rows.map((e: any) => e.id);
          const liveRsvps = await fetchRsvpBatch(allIds).catch((err) => {
            console.log('Failed to fetch live RSVPs:', err);
            return {};
          });

          const withCounts = rows.map((row: any) => ({
            ...row,
            rsvpCount: liveRsvps[row.id]?.count || 0,
            rsvpUsers: liveRsvps[row.id]?.users || [],
          }));

          const sortedByPopularity = [...withCounts].sort((a, b) => (b.rsvpCount || 0) - (a.rsvpCount || 0));
          const hasRsvps = sortedByPopularity.some((e) => (e.rsvpCount || 0) > 0);

          let selectedRows = sortedByPopularity.slice(0, 3);
          if (!hasRsvps) {
            selectedRows = [...withCounts]
              .sort((a, b) => {
                const aDate = new Date(`${a.start_date || a.startDate || '9999-12-31'}T00:00:00`).getTime();
                const bDate = new Date(`${b.start_date || b.startDate || '9999-12-31'}T00:00:00`).getTime();
                return aDate - bDate;
              })
              .slice(0, 3);
            setShowingByPopularity(false);
          } else {
            setShowingByPopularity(true);
          }

          const mapped = selectedRows.map((e: any, i: number) => {
            const eventDate = e.start_date || e.startDate || null;
            const d = eventDate ? new Date(`${eventDate}T00:00:00`) : new Date();
            const startTime = e.start_time || e.startTime || 'TBD';
            const endTime = e.end_time || e.endTime || '';
            const venueName = e.venue_name || e.venueName || 'Venue TBA';
            const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
            const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
            return {
              id: e.id,
              image: e.cover_image || e.coverImage || fallbackImages[i] || imgFeatured,
              title: e.title || 'Untitled Event',
              date: `${days[d.getDay()]} ${d.getDate()} ${months[d.getMonth()]}`,
              time: endTime ? `${startTime} – ${endTime}` : startTime,
              tag: e.category || 'Event',
              description: e.description || '',
              attendees: e.rsvpCount || 0,
              location: e.address ? `${venueName}, ${e.address}, ${e.city || ''}` : `${venueName}, ${e.city || ''}`,
              price: (e.pricing_type === 'paid' || e.pricingType === 'paid') && e.price ? `${e.price}€` : undefined,
              isFree: (e.pricing_type || e.pricingType || 'free') === 'free',
            };
          });
          setFeaturedEvents(mapped);

          // Use live RSVP data for attendee avatars.
          const rsvpMap: Record<string, RsvpData> = {};
          selectedRows.forEach((e: any) => {
            rsvpMap[e.id] = {
              count: e.rsvpCount || 0,
              users: Array.isArray(e.rsvpUsers) ? e.rsvpUsers : [],
              hasRsvpd: false,
            };
          });
          setFeaturedRsvpMap(rsvpMap);
        }
      } catch (err) {
        console.error('Failed to fetch featured events:', err);
        // Set loading to false even on error
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const goToNext = useCallback(() => {
    if (featuredEvents.length === 0) return;
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % featuredEvents.length);
  }, [featuredEvents.length]);

  const goToPrev = useCallback(() => {
    if (featuredEvents.length === 0) return;
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + featuredEvents.length) % featuredEvents.length);
  }, [featuredEvents.length]);

  const goToSlide = (index: number) => {
    setDirection(index > currentIndex ? 1 : -1);
    setCurrentIndex(index);
  };

  const slideVariants = {
    enter: (dir: number) => ({ x: dir > 0 ? 50 : -50, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? -50 : 50, opacity: 0 }),
  };

  const tagConfig: Record<string, { icon: React.ElementType; color: string }> = {
    Music: { icon: Music, color: 'text-blue-600 bg-blue-50' },
    Festival: { icon: PartyPopper, color: 'text-green-600 bg-green-50' },
    Art: { icon: Palette, color: 'text-pink-600 bg-pink-50' },
    Tech: { icon: Laptop, color: 'text-violet-600 bg-violet-50' },
    Sports: { icon: Dumbbell, color: 'text-orange-600 bg-orange-50' },
    Wellness: { icon: Leaf, color: 'text-emerald-600 bg-emerald-50' },
    Food: { icon: UtensilsCrossed, color: 'text-amber-600 bg-amber-50' },
    Charity: { icon: HandHeart, color: 'text-teal-600 bg-teal-50' },
    Community: { icon: Users, color: 'text-indigo-600 bg-indigo-50' },
    Theater: { icon: Theater, color: 'text-rose-600 bg-rose-50' },
    Support: { icon: HandHeart, color: 'text-teal-600 bg-teal-50' },
  };

  // Loading or empty state — guard BEFORE accessing featuredEvents[currentIndex]
  if (isLoading || featuredEvents.length === 0) {
    return (
      <section className="bg-[#FCFCFC] py-28 px-6 md:px-12">
        <div className="max-w-6xl mx-auto">
          <SectionHeading title="Featured Events" subtitle="Top events with the most attendees right now" />
          <div className="flex-1 bg-white rounded-3xl overflow-hidden flex flex-col md:flex-row min-h-[420px] border border-gray-100/80 animate-pulse" style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.04)' }}>
            <div className="md:w-5/12 h-64 md:h-auto bg-gray-100" />
            <div className="md:w-7/12 p-8 md:p-12 space-y-5">
              <div className="h-6 bg-gray-100 rounded-full w-20" />
              <div className="h-8 bg-gray-100 rounded-lg w-3/4" />
              <div className="h-4 bg-gray-50 rounded-lg w-1/2" />
              <div className="h-20 bg-gray-50 rounded-lg w-full" />
              <div className="h-12 bg-gray-100 rounded-xl w-36" />
            </div>
          </div>
        </div>
      </section>
    );
  }

  const event = featuredEvents[currentIndex];
  const currentTag = tagConfig[event.tag] || tagConfig.Music;

  return (
    <section className="bg-[#FCFCFC] py-28 px-6 md:px-12">
      <div className="max-w-6xl mx-auto">
        <SectionHeading 
          title="Featured Events" 
          subtitle={showingByPopularity 
            ? "Top events with the most attendees right now" 
            : "Coming soon — don't miss these upcoming events"
          } 
        />

        <div className="relative flex items-center gap-5">
          {/* Left arrow */}
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={goToPrev}
            className="hidden md:flex shrink-0 w-12 h-12 bg-white rounded-full border border-gray-100 shadow-lg shadow-gray-200/50 items-center justify-center text-gray-500 hover:text-gray-800 hover:shadow-xl hover:border-gray-200 transition-all duration-300"
          >
            <ArrowLeft className="w-5 h-5" />
          </motion.button>

          {/* Card */}
          <div
            className="flex-1 bg-white rounded-3xl overflow-hidden flex flex-col md:flex-row min-h-[420px] border border-gray-100/80"
            style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.04), 0 1px 4px rgba(0,0,0,0.02)' }}
          >
            {/* Image side */}
            <div className="md:w-5/12 relative h-64 md:h-auto bg-gray-100 overflow-hidden">
              <AnimatePresence custom={direction} mode="wait">
                <motion.img
                  key={currentIndex}
                  src={event.image}
                  alt={event.title}
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
                  className="absolute inset-0 w-full h-full object-cover"
                />
              </AnimatePresence>

              {/* Gradient overlay on image */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent pointer-events-none" />

              {/* Pagination dots */}
              <div className="absolute bottom-5 left-0 right-0 flex justify-center gap-2 z-10">
                {featuredEvents.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => goToSlide(i)}
                    className={`rounded-full transition-all duration-300 ${
                      i === currentIndex
                        ? 'w-7 h-2 bg-white shadow-md'
                        : 'w-2 h-2 bg-white/50 hover:bg-white/80'
                    }`}
                    aria-label={`Go to slide ${i + 1}`}
                  />
                ))}
              </div>

              {/* Slide counter */}
              <div className="absolute top-5 right-5 bg-black/30 backdrop-blur-md text-white text-xs font-semibold px-3 py-1.5 rounded-full">
                {currentIndex + 1} / {featuredEvents.length}
              </div>

              {/* Going badge */}
              <div className="absolute top-5 left-5 bg-[#FF9B51]/90 backdrop-blur-md text-white text-xs font-semibold px-3 py-1.5 rounded-full inline-flex items-center gap-1.5">
                <Flame className="w-3 h-3" />
                {(featuredRsvpMap[event.id]?.count || 0).toLocaleString()} going
              </div>
            </div>

            {/* Content side */}
            <div className="md:w-7/12 p-8 md:p-12 flex flex-col justify-center">
              <AnimatePresence custom={direction} mode="wait">
                <motion.div
                  key={currentIndex}
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
                  className="space-y-5"
                >
                  {/* Tag */}
                  <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full ${currentTag.color}`}>
                    <currentTag.icon className="w-3 h-3" />
                    {event.tag}
                  </span>

                  <div>
                    <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4 leading-tight">
                      {event.title}
                    </h3>

                    <div className="flex flex-wrap gap-4 mb-5">
                      <div className="flex items-center gap-2 text-gray-500 text-sm">
                        <div className="w-7 h-7 rounded-lg bg-gray-50 flex items-center justify-center">
                          <Calendar className="w-3.5 h-3.5 text-gray-400" />
                        </div>
                        <span>{event.date}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-500 text-sm">
                        <div className="w-7 h-7 rounded-lg bg-gray-50 flex items-center justify-center">
                          <Clock className="w-3.5 h-3.5 text-gray-400" />
                        </div>
                        <span>{event.time}</span>
                      </div>
                    </div>
                  </div>

                  <p className="text-gray-500 leading-relaxed">
                    {event.description}
                  </p>

                  <div className="flex items-center justify-between pt-3">
                    <button
                      onClick={() => onViewDetails({ id: event.id, image: event.image, title: event.title, date: event.date, time: event.time, location: event.location, tag: event.tag, attendees: featuredRsvpMap[event.id]?.count || 0, description: event.description })}
                      className="bg-[#FF9B51] hover:bg-[#E88A3E] text-white px-7 py-3 rounded-xl font-semibold shadow-lg shadow-orange-500/15 hover:shadow-orange-500/25 transition-all duration-200 active:scale-[0.98] inline-flex items-center gap-2 text-sm cursor-pointer">
                      View Event
                      <ArrowRight className="w-4 h-4" />
                    </button>

                    <div className="hidden sm:flex items-center gap-2">
                      <AttendeeAvatars users={featuredRsvpMap[event.id]?.users || []} count={featuredRsvpMap[event.id]?.count || 0} size="sm" />
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* Right arrow */}
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={goToNext}
            className="hidden md:flex shrink-0 w-12 h-12 bg-white rounded-full border border-gray-100 shadow-lg shadow-gray-200/50 items-center justify-center text-gray-500 hover:text-gray-800 hover:shadow-xl hover:border-gray-200 transition-all duration-300"
          >
            <ArrowRight className="w-5 h-5" />
          </motion.button>

          {/* Mobile arrows */}
          <div className="flex md:hidden absolute -bottom-16 left-1/2 -translate-x-1/2 gap-3">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={goToPrev}
              className="w-11 h-11 bg-white rounded-full border border-gray-200 shadow-lg flex items-center justify-center text-gray-500"
            >
              <ArrowLeft className="w-4 h-4" />
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={goToNext}
              className="w-11 h-11 bg-white rounded-full border border-gray-200 shadow-lg flex items-center justify-center text-gray-500"
            >
              <ArrowRight className="w-4 h-4" />
            </motion.button>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────── */
/*  Event Card (reusable)                               */
/* ──────────────────────────────────────────────────── */

interface EventCardProps {
  id: number;
  image: string;
  title: string;
  date: string;
  location: string;
  tag?: string;
  price?: string;
  isFree?: boolean;
  index?: number;
  attendees?: number;
  serverEventId?: string;
  rsvpData?: RsvpData;
}

const tagStyles: Record<string, { icon: React.ElementType; color: string }> = {
  Support: { icon: HandHeart, color: 'text-teal-600' },
  Festival: { icon: PartyPopper, color: 'text-green-600' },
  Music: { icon: Music, color: 'text-blue-600' },
  Art: { icon: Palette, color: 'text-pink-600' },
};

function EventCard({ id, image, title, date, location, tag, price, isFree, index = 0, attendees = 0, serverEventId, rsvpData, onViewDetails }: EventCardProps & { onViewDetails?: (event: EventDetailData) => void }) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const favId = serverEventId || String(id);
  const liked = isFavorite(favId);
  const tagConf = tagStyles[tag || ''] || tagStyles.Music;

  // Parse the date for the badge (e.g., "Mon 9. Mar 2026 at 16:00 - 19:30")
  const dateParts = date.match(/(\w+)\s+(\d+)\.\s+(\w+)/);
  const dayName = dateParts?.[1] || '';
  const dayNum = dateParts?.[2] || '';
  const monthName = dateParts?.[3] || '';

  // Extract time
  const timeParts = date.match(/at\s+(\d+:\d+\s*-\s*\d+:\d+)/);
  const timeStr = timeParts?.[1]?.replace('-', '–') || '';

  const handleToggle = () => {
    toggleFavorite(favId);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.45, delay: index * 0.08, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="group relative bg-white rounded-3xl overflow-hidden border border-gray-100/80 flex flex-col h-full hover:shadow-2xl hover:shadow-black/8 hover:-translate-y-1.5 transition-all duration-500"
      style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.03)' }}
    >
      {/* Image */}
      <div className="relative h-52 overflow-hidden">
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/5 to-transparent opacity-60 group-hover:opacity-40 transition-opacity duration-500" />

        {/* Top row: tag + heart */}
        <div className="absolute top-4 left-4 right-4 flex items-start justify-between">
          {tag && (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full backdrop-blur-md bg-white/90 shadow-sm">
              <tagConf.icon className={`w-3 h-3 ${tagConf.color}`} />
              <span className={tagConf.color}>{tag}</span>
            </span>
          )}
          <motion.button
            whileTap={{ scale: 0.8 }}
            onClick={handleToggle}
            className={`w-9 h-9 rounded-full flex items-center justify-center backdrop-blur-md transition-all duration-300 shadow-sm ${
              liked
                ? 'bg-red-500 text-white shadow-red-500/30'
                : 'bg-white/90 text-gray-500 hover:text-red-500 hover:bg-white'
            }`}
          >
            <Heart className={`w-4 h-4 transition-transform duration-300 ${liked ? 'fill-current scale-110' : ''}`} />
          </motion.button>
        </div>

        {/* Bottom: date badge */}
        <div className="absolute bottom-4 left-4">
          <div className="bg-white rounded-xl px-3 py-2 shadow-lg shadow-black/10 text-center min-w-[52px]">
            <div className="text-[10px] tracking-widest uppercase text-gray-500">{dayName}</div>
            <div className="text-lg font-bold text-gray-900 -mt-0.5 leading-tight">{dayNum}</div>
            <div className="text-[10px] uppercase text-gray-500 tracking-wide">{monthName}</div>
          </div>
        </div>

        {/* Bottom right: price */}
        <div className="absolute bottom-4 right-4">
          {isFree ? (
            <span className="bg-emerald-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg shadow-emerald-500/30">
              Free
            </span>
          ) : price ? (
            <span className="bg-white text-gray-900 text-sm font-bold px-3 py-1.5 rounded-full shadow-lg cursor-default relative" title="Price set by organizer. EventGo does not sell tickets.">
              {price}
              <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[9px] text-white/80 whitespace-nowrap font-medium drop-shadow-sm">by organizer</span>
            </span>
          ) : null}
        </div>
      </div>

      {/* Content */}
      <div className="p-5 pt-5 flex flex-col flex-grow">
        <h3 className="text-[17px] font-bold text-gray-900 mb-3 leading-snug line-clamp-2 min-h-[3rem] group-hover:text-[#7A8E80] transition-colors duration-300">
          {title}
        </h3>

        <div className="space-y-2.5 mb-5">
          {timeStr && (
            <div className="flex items-center gap-2.5 text-gray-500">
              <div className="w-7 h-7 rounded-lg bg-gray-50 flex items-center justify-center shrink-0">
                <Clock className="w-3.5 h-3.5 text-gray-400" />
              </div>
              <span className="text-sm">{timeStr}</span>
            </div>
          )}
          <div className="flex items-center gap-2.5 text-gray-500">
            <div className="w-7 h-7 rounded-lg bg-gray-50 flex items-center justify-center shrink-0">
              <MapPin className="w-3.5 h-3.5 text-gray-400" />
            </div>
            <span className="text-sm line-clamp-1">{location}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-auto pt-4 border-t border-gray-100 flex items-center justify-between">
          <AttendeeAvatars users={rsvpData?.users || []} count={rsvpData?.count || 0} size="sm" />
          <button onClick={() => onViewDetails?.({ id: serverEventId || favId, image, title, date: `${dayName} ${dayNum} ${monthName}`, time: timeStr, location, tag: tag || 'Music', price, isFree, attendees: rsvpData?.count || 0 })} className="group/btn inline-flex items-center gap-1 text-sm font-semibold text-[#FF9B51] hover:text-[#E88A3E] transition-colors duration-200 cursor-pointer">
            Details
            <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover/btn:translate-x-0.5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────── */
/*  Upcoming Events                                     */
/* ─────────────────────────────────────────────────── */

function UpcomingEvents({ onViewDetails }: { onViewDetails: (event: EventDetailData) => void }) {
  const fallbackImages = [imgUpcoming1, imgUpcoming2, imgUpcoming3];
  const [events, setEvents] = useState<Array<{
    id: number; image: string; title: string; date: string;
    location: string; tag: string; price?: string; isFree?: boolean; attendees: number;
    serverEventId?: string;
  }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [rsvpMap, setRsvpMap] = useState<Record<string, RsvpData>>({});

  useEffect(() => {
    const load = async () => {
      try {
        const { data: rows, error } = await supabase
          .from('events')
          .select('*')
          .eq('status', 'approved')
          .eq('is_draft', false);

        if (error) {
          throw error;
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const upcomingRows = (rows || [])
          .filter((e: any) => {
            const raw = e.start_date || e.startDate;
            if (!raw) return true;
            const d = new Date(`${raw}T00:00:00`);
            return !Number.isNaN(d.getTime()) && d >= today;
          })
          .sort((a: any, b: any) => {
            const aDate = new Date(`${a.start_date || a.startDate || '9999-12-31'}T00:00:00`).getTime();
            const bDate = new Date(`${b.start_date || b.startDate || '9999-12-31'}T00:00:00`).getTime();
            return aDate - bDate;
          })
          .slice(0, 3);

        if (upcomingRows.length > 0) {
          const mapped = upcomingRows.map((e: any, i: number) => {
            const startDate = e.start_date || e.startDate || null;
            const startTime = e.start_time || e.startTime || 'TBD';
            const endTime = e.end_time || e.endTime || '';
            const venueName = e.venue_name || e.venueName || 'Venue TBA';
            const d = startDate ? new Date(`${startDate}T00:00:00`) : new Date();
            const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
            const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
            const location = e.address
              ? `${venueName}, ${e.address}, ${e.city || ''}`
              : `${venueName}, ${e.city || ''}`;
            const timeRange = endTime ? `${startTime} - ${endTime}` : startTime;
            return {
              id: i + 1,
              image: e.cover_image || e.coverImage || fallbackImages[i] || imgUpcoming1,
              title: e.title || 'Untitled Event',
              date: `${days[d.getDay()]} ${d.getDate()}. ${months[d.getMonth()]} 2026 at ${timeRange}`,
              location,
              tag: e.category || 'Event',
              price: (e.pricing_type === 'paid' || e.pricingType === 'paid') && e.price ? `${e.price}€` : undefined,
              isFree: (e.pricing_type || e.pricingType || 'free') === 'free',
              attendees: 0,
              serverEventId: e.id,
            };
          });
          setEvents(mapped);

          // Fetch RSVP data for all events
          const eventIds = upcomingRows.map((e: any) => e.id);
          const rsvps = await fetchRsvpBatch(eventIds).catch((err) => {
            console.log('Failed to fetch RSVPs for upcoming events:', err);
            return {};
          });
          setRsvpMap(rsvps);
        }
      } catch (err) {
        console.error('Failed to fetch upcoming events:', err);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  return (
    <section className="relative bg-[#F4F7F5] py-28 px-6 md:px-12 overflow-hidden">
      {/* Decorative */}
      <div className="absolute top-0 right-0 w-[400px] h-[400px] rounded-full bg-[#9CAFA0]/5 -translate-y-1/2 translate-x-1/2 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[300px] h-[300px] rounded-full bg-[#FF9B51]/5 translate-y-1/2 -translate-x-1/2 pointer-events-none" />

      <div className="relative max-w-6xl mx-auto">
        <SectionHeading title="Upcoming Events" subtitle="Don't miss what's happening next in your area" />

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
            {[0, 1, 2].map((i) => (
              <div key={i} className="bg-white rounded-3xl overflow-hidden border border-gray-100/80 animate-pulse" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                <div className="h-52 bg-gray-100" />
                <div className="p-5 space-y-3">
                  <div className="h-5 bg-gray-100 rounded-lg w-3/4" />
                  <div className="h-4 bg-gray-50 rounded-lg w-1/2" />
                  <div className="h-4 bg-gray-50 rounded-lg w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
            {events.map((event, i) => (
              <EventCard key={event.id} {...event} rsvpData={event.serverEventId ? rsvpMap[event.serverEventId] : undefined} index={i} onViewDetails={onViewDetails} />
            ))}
          </div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="mt-16 text-center"
        >
          <Link
            to="/browse"
            className="group inline-flex items-center gap-2 bg-[#FF9B51] hover:bg-[#E88A3E] text-white px-8 py-3.5 rounded-xl font-semibold shadow-lg shadow-orange-500/15 hover:shadow-orange-500/25 transition-all duration-200 active:scale-[0.98] text-sm"
          >
            Browse All Events
            <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

/* ──────────────────────────────────────────────────── */
/*  Footer                                              */
/* ────────────────────────────────────────────────── */

function Footer() {
  const [systemStatus, setSystemStatus] = useState<{
    status: 'operational' | 'degraded' | 'down' | 'checking';
    checks?: { server: boolean; database: boolean; auth: boolean };
    responseTime?: number;
  }>({ status: 'checking' });

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const start = Date.now();

        const [eventsProbe, authProbe] = await Promise.all([
          supabase.from('events').select('id', { head: true, count: 'exact' }).limit(1),
          supabase.auth.getSession(),
        ]);

        const checks = {
          server: true,
          database: !eventsProbe.error,
          auth: !authProbe.error,
        };

        const allHealthy = checks.server && checks.database && checks.auth;
        setSystemStatus({
          status: allHealthy ? 'operational' : 'degraded',
          checks,
          responseTime: Date.now() - start,
        });
      } catch (error) {
        console.error('Health check failed:', error);
        setSystemStatus({ status: 'down' });
      }
    };

    // Initial check
    checkHealth();

    // Check every 30 seconds
    const interval = setInterval(checkHealth, 30000);

    return () => clearInterval(interval);
  }, []);

  // Determine status display
  const statusConfig = {
    operational: {
      color: 'bg-emerald-500',
      text: 'All systems operational',
      pulse: true,
    },
    degraded: {
      color: 'bg-yellow-500',
      text: 'Some services degraded',
      pulse: true,
    },
    down: {
      color: 'bg-red-500',
      text: 'System issues detected',
      pulse: false,
    },
    checking: {
      color: 'bg-gray-400',
      text: 'Checking status...',
      pulse: true,
    },
  };

  const currentStatus = statusConfig[systemStatus.status];

  return (
    <footer className="relative bg-[#1A1A1C] text-white overflow-hidden">
      {/* Decorative */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-white/[0.015] -translate-y-1/2 translate-x-1/3 pointer-events-none" />

      <div className="relative py-20 px-6 md:px-12">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-8">
            {/* Brand column */}
            <div className="md:col-span-5 space-y-6">
              <div className="flex items-center gap-1">
                <span className="text-2xl font-bold tracking-tight text-white">Event</span>
                <span className="text-2xl font-bold tracking-tight text-[#FFB070]">Go</span>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed max-w-xs">
                Discover and share amazing events across the world. From cultural festivals to outdoor adventures, find your next experience.
              </p>
              <div className="flex gap-3 pt-2">
                {[
                  { icon: Facebook, bg: 'bg-blue-600/10 hover:bg-blue-600/20 text-blue-400' },
                  { icon: Instagram, bg: 'bg-pink-600/10 hover:bg-pink-600/20 text-pink-400' },
                  { icon: Twitter, bg: 'bg-sky-500/10 hover:bg-sky-500/20 text-sky-400' },
                ].map(({ icon: Icon, bg }, i) => (
                  <a key={i} href="#" className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors duration-200 ${bg}`}>
                    <Icon className="w-4 h-4" />
                  </a>
                ))}
              </div>
            </div>

            {/* Quick links */}
            <div className="md:col-span-3 md:pl-8">
              <h4 className="text-[#FF9B51] font-bold text-xs uppercase tracking-widest mb-6">Quick Links</h4>
              <ul className="space-y-3.5">
                {([
                  { label: 'Browse Events', to: '/browse' },
                  { label: 'Submit Event', to: '/submit' },
                  { label: 'Help Center', to: '/help' },
                  { label: 'Terms of Service', to: '/terms' },
                  { label: 'Privacy Policy', to: '/privacy' },
                ] as const).map((item) => (
                  <li key={item.label}>
                    <Link to={item.to} className="text-gray-400 hover:text-white transition-colors text-sm inline-flex items-center gap-1 group">
                      <span className="w-0 h-px bg-[#FF9B51] group-hover:w-3 transition-all duration-200" />
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact */}
            <div className="md:col-span-4">
              <h4 className="text-[#FF9B51] font-bold text-xs uppercase tracking-widest mb-6">Contact Us</h4>
              <ul className="space-y-4">
                {[
                  { icon: Mail, text: 'contact@eventgo.com' },
                  { icon: Phone, text: '+358 78 465 4387' },
                  { icon: MapPin, text: 'Kokkola, Finland' },
                ].map(({ icon: Icon, text }) => (
                  <li key={text} className="flex items-center gap-3 text-gray-400 text-sm">
                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                      <Icon className="w-4 h-4 text-gray-500" />
                    </div>
                    <span>{text}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-16 pt-8 border-t border-white/[0.06] flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-gray-500 text-xs">
              &copy;2026 EventGo. All rights reserved.
            </p>
            <div className="flex items-center gap-6">
              {/* Admin Access Link */}
              <Link 
                to="/admin" 
                className="text-gray-600 hover:text-[#9CAFA0] transition-colors text-xs flex items-center gap-1.5 group"
              >
                <ShieldCheck className="w-3 h-3 opacity-60 group-hover:opacity-100 transition-opacity" />
                <span>Admin Access</span>
              </Link>
              
              {/* System Status */}
              <div className="flex items-center gap-1.5">
                <div className={`w-1.5 h-1.5 rounded-full ${currentStatus.color} ${currentStatus.pulse ? 'animate-pulse' : ''}`} />
                <span className="text-gray-500 text-xs">{currentStatus.text}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

/* ────────────────────────────────────────────────── */
/*  Page export                                         */
/* ──────────────────────────────────────────────────── */

export function HomePage() {
  const [selectedEvent, setSelectedEvent] = useState<EventDetailData | null>(null);

  return (
    <>
      <main>
        <Hero />
        <FeaturedEvent onViewDetails={setSelectedEvent} />
        <UpcomingEvents onViewDetails={setSelectedEvent} />
      </main>
      <Footer />
      <EventDetailModal event={selectedEvent} onClose={() => setSelectedEvent(null)} />
    </>
  );
}