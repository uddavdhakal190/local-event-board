import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router';
import { Calendar, MapPin, Search, Grid3x3, List, Heart, Loader, Users, X, CheckCircle2, LayoutGrid } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from './auth-context';
import { useFavorites } from './favorites-context';
import { supabase } from '../../utils/supabaseClient';
import { toast } from 'sonner';
import { removeRsvp } from './rsvp-helpers';

type Event = {
  id: string;
  title: string;
  description: string;
  category: string;
  startDate: string;
  startTime: string;
  endTime?: string;
  city: string;
  venueName: string;
  coverImage?: string;
  pricingType: 'free' | 'paid';
  price?: number;
  status: string;
  rsvpCount: number;
  rsvpAt: string;
};

const PLACEHOLDER_IMAGE = 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=800';

export function MyRsvpsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { favorites, toggleFavorite } = useFavorites();
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'past'>('all');
  const [cancelingId, setCancelingId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const fetchRsvps = async () => {
      try {
        const { data: rsvpRows, error: rsvpError } = await supabase
          .from('rsvps')
          .select('event_id, user_id')
          .eq('user_id', user.id);

        if (rsvpError) {
          throw rsvpError;
        }

        const eventIds = Array.from(new Set((rsvpRows || []).map((row: any) => row.event_id)));
        if (eventIds.length === 0) {
          setEvents([]);
          return;
        }

        const { data: eventRows, error: eventsError } = await supabase
          .from('events')
          .select('*')
          .in('id', eventIds)
          .eq('status', 'approved')
          .eq('is_draft', false);

        if (eventsError) {
          throw eventsError;
        }

        const { data: allRsvps, error: allRsvpsError } = await supabase
          .from('rsvps')
          .select('event_id')
          .in('event_id', eventIds);

        if (allRsvpsError) {
          throw allRsvpsError;
        }

        const rsvpCountByEvent = (allRsvps || []).reduce((acc: Record<string, number>, row: any) => {
          acc[row.event_id] = (acc[row.event_id] || 0) + 1;
          return acc;
        }, {});

        const eventById = (eventRows || []).reduce((acc: Record<string, any>, row: any) => {
          acc[row.id] = row;
          return acc;
        }, {});

        const normalized: Event[] = eventIds
          .map((id) => eventById[id])
          .filter(Boolean)
          .map((row: any) => ({
            id: row.id,
            title: row.title || 'Untitled Event',
            description: row.description || '',
            category: row.category || 'Event',
            startDate: row.start_date || row.startDate || new Date().toISOString().slice(0, 10),
            startTime: row.start_time || row.startTime || 'TBD',
            endTime: row.end_time || row.endTime || undefined,
            city: row.city || 'Unknown',
            venueName: row.venue_name || row.venueName || 'Venue TBA',
            coverImage: row.cover_image || row.coverImage || undefined,
            pricingType: (row.pricing_type || row.pricingType || 'free') === 'paid' ? 'paid' : 'free',
            price: row.price != null ? Number(row.price) : undefined,
            status: row.status === 'approved' || row.status === 'pending' || row.status === 'rejected' ? row.status : 'pending',
            rsvpCount: rsvpCountByEvent[row.id] || 0,
            rsvpAt: '',
          }));

        setEvents(normalized);
      } catch (error) {
        console.error('Error fetching RSVPs:', error);
        toast.error('Failed to load your RSVPs');
      } finally {
        setIsLoading(false);
      }
    };

    fetchRsvps();
  }, [user, navigate]);

  useEffect(() => {
    let filtered = [...events];

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (filter === 'upcoming') {
      filtered = filtered.filter(event => {
        const eventDate = new Date(event.startDate);
        return eventDate >= today;
      });
    } else if (filter === 'past') {
      filtered = filtered.filter(event => {
        const eventDate = new Date(event.startDate);
        return eventDate < today;
      });
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (event) =>
          event.title.toLowerCase().includes(query) ||
          event.category.toLowerCase().includes(query) ||
          event.city.toLowerCase().includes(query) ||
          event.venueName.toLowerCase().includes(query)
      );
    }

    filtered.sort((a, b) => {
      const dateA = new Date(a.startDate).getTime();
      const dateB = new Date(b.startDate).getTime();
      return filter === 'past' ? dateB - dateA : dateA - dateB;
    });

    setFilteredEvents(filtered);
  }, [events, searchQuery, filter]);

  const handleCancelRsvp = async (eventId: string, eventTitle: string) => {
    if (cancelingId) return;

    if (!window.confirm(`Are you sure you want to cancel your RSVP for "${eventTitle}"?`)) return;

    setCancelingId(eventId);
    try {
      const result = await removeRsvp(eventId);
      if (result.success) {
        setEvents(prev => prev.filter(e => e.id !== eventId));
        toast.success('RSVP cancelled successfully');
      } else {
        toast.error('Failed to cancel RSVP');
      }
    } catch (error) {
      console.error('Error canceling RSVP:', error);
      toast.error('Failed to cancel RSVP');
    } finally {
      setCancelingId(null);
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      Music: 'bg-purple-100 text-purple-700',
      Festival: 'bg-pink-100 text-pink-700',
      Workshop: 'bg-blue-100 text-blue-700',
      Sports: 'bg-green-100 text-green-700',
      'Food & Drink': 'bg-orange-100 text-orange-700',
      Art: 'bg-red-100 text-red-700',
      Tech: 'bg-indigo-100 text-indigo-700',
      Comedy: 'bg-yellow-100 text-yellow-700',
      Kids: 'bg-teal-100 text-teal-700',
      Wellness: 'bg-emerald-100 text-emerald-700',
      Outdoor: 'bg-lime-100 text-lime-700',
    };
    return colors[category] || 'bg-gray-100 text-gray-700';
  };

  const isEventPast = (date: string) => {
    const eventDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return eventDate < today;
  };

  const stats = {
    all: events.length,
    upcoming: events.filter(e => !isEventPast(e.startDate)).length,
    past: events.filter(e => isEventPast(e.startDate)).length,
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero Section */}
      <section className="relative w-full overflow-hidden bg-[#9CAFA0]">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full bg-white/[0.04]" />
          <div className="absolute -bottom-24 -left-24 w-[380px] h-[380px] rounded-full bg-white/[0.04]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] rounded-full bg-white/[0.02]" />
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
        </div>
        <div className="relative pt-36 pb-24 md:pt-44 md:pb-32 px-6 flex flex-col items-center">
          <motion.div 
            initial={{ opacity: 0, y: 16 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.5 }} 
            className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/15 rounded-full px-4 py-1.5 mb-5"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-[#FFB070]" />
            <span className="text-xs font-medium text-white/80 tracking-wide uppercase">
              {stats.all} {stats.all === 1 ? 'RSVP' : 'RSVPs'}
            </span>
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.6, delay: 0.05 }} 
            className="text-4xl md:text-[56px] font-bold tracking-tight text-white leading-[1.08] text-center mb-4"
          >
            My <span className="text-[#FFB070]">RSVPs</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.5, delay: 0.1 }} 
            className="text-lg text-white/60 max-w-md mx-auto text-center mb-10"
          >
            Track all the events you're attending
          </motion.p>

          {/* Search Bar */}
          {stats.all > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 24 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ duration: 0.5, delay: 0.2 }} 
              className="w-full max-w-2xl"
            >
              <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl shadow-black/10 p-1.5 flex items-center gap-1.5">
                <div className="flex-1 px-4 py-3 flex items-center gap-3">
                  <Search className="text-gray-400 w-5 h-5 shrink-0" />
                  <input 
                    type="text" 
                    value={searchQuery} 
                    onChange={(e) => setSearchQuery(e.target.value)} 
                    placeholder="Search your RSVPs..." 
                    className="w-full outline-none text-gray-800 placeholder-gray-400 text-sm bg-transparent" 
                  />
                  {searchQuery && (
                    <button 
                      onClick={() => setSearchQuery('')} 
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </div>
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 60" fill="none" className="w-full" preserveAspectRatio="none">
            <path d="M0 60V30C240 0 480 0 720 30C960 60 1200 60 1440 30V60H0Z" fill="#FCFCFC" />
          </svg>
        </div>
      </section>

      {/* Content Section */}
      <div className="flex-1 bg-[#FCFCFC]">
        <div className="max-w-6xl mx-auto w-full px-6 md:px-10 py-10">
          {isLoading ? (
            <div className="flex items-center justify-center py-32">
              <Loader className="w-8 h-8 text-[#9CAFA0] animate-spin" />
            </div>
          ) : stats.all === 0 ? (
            <motion.div 
              initial={{ opacity: 0, y: 24 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ duration: 0.5 }} 
              className="text-center py-28 bg-white rounded-3xl border border-gray-100/80" 
              style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.03)' }}
            >
              <div className="w-20 h-20 bg-[#9CAFA0]/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-9 h-9 text-[#9CAFA0]/60" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">No RSVPs yet</h3>
              <p className="text-gray-500 text-sm max-w-sm mx-auto mb-8 leading-relaxed">
                Browse events and RSVP to get started! Your upcoming events will appear here.
              </p>
              <Link 
                to="/browse" 
                className="inline-flex items-center gap-2 bg-[#FF9B51] hover:bg-[#E88A3E] text-white px-8 py-3.5 rounded-xl font-semibold shadow-lg shadow-orange-500/15 hover:shadow-orange-500/25 transition-all duration-200"
              >
                Browse Events
              </Link>
            </motion.div>
          ) : (
            <>
              {/* Filter Pills */}
              <div className="flex items-center gap-3 mb-8 flex-wrap">
                <button
                  onClick={() => setFilter('all')}
                  className={`px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 ${
                    filter === 'all'
                      ? 'bg-[#9CAFA0] text-white shadow-lg shadow-[#9CAFA0]/25'
                      : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-100'
                  }`}
                >
                  All Events ({stats.all})
                </button>
                <button
                  onClick={() => setFilter('upcoming')}
                  className={`px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 ${
                    filter === 'upcoming'
                      ? 'bg-[#FF9B51] text-white shadow-lg shadow-orange-500/25'
                      : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-100'
                  }`}
                >
                  Upcoming ({stats.upcoming})
                </button>
                <button
                  onClick={() => setFilter('past')}
                  className={`px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 ${
                    filter === 'past'
                      ? 'bg-gray-600 text-white shadow-lg shadow-gray-600/25'
                      : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-100'
                  }`}
                >
                  Past ({stats.past})
                </button>
              </div>

              {/* Results count + View toggle */}
              <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
                <span className="text-sm text-gray-500">
                  <span className="font-semibold text-gray-800">{filteredEvents.length}</span>{' '}
                  {filteredEvents.length === 1 ? 'event' : 'events'}
                  {searchQuery && ` matching "${searchQuery}"`}
                </span>
                <div className="flex bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm">
                  <button 
                    onClick={() => setViewMode('grid')} 
                    className={`flex items-center gap-1.5 px-3.5 py-2.5 text-sm font-medium transition-all duration-200 ${
                      viewMode === 'grid' 
                        ? 'bg-[#9CAFA0] text-white' 
                        : 'text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => setViewMode('list')} 
                    className={`flex items-center gap-1.5 px-3.5 py-2.5 text-sm font-medium transition-all duration-200 ${
                      viewMode === 'list' 
                        ? 'bg-[#9CAFA0] text-white' 
                        : 'text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Events Grid/List */}
              {filteredEvents.length > 0 ? (
                <AnimatePresence mode="popLayout">
                  {viewMode === 'grid' ? (
                    <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
                      {filteredEvents.map((event, index) => {
                        const isPast = isEventPast(event.startDate);
                        const isFavorite = favorites.includes(event.id);
                        const isCanceling = cancelingId === event.id;

                        return (
                          <motion.div
                            key={event.id}
                            layout
                            initial={{ opacity: 0, y: 24 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.92 }}
                            transition={{ duration: 0.45, delay: index * 0.05 }}
                            className={`group relative bg-white rounded-3xl overflow-hidden border border-gray-100/80 flex flex-col h-full hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-500 ${isPast ? 'opacity-75' : ''}`}
                            style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.03)' }}
                          >
                            <div className="relative h-52 overflow-hidden">
                              <img 
                                src={event.coverImage || PLACEHOLDER_IMAGE} 
                                alt={event.title} 
                                className={`w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110 ${isPast ? 'grayscale' : ''}`} 
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/5 to-transparent opacity-60 group-hover:opacity-40 transition-opacity duration-500" />

                              {/* Category Badge */}
                              <div className="absolute top-4 left-4">
                                <span className={`px-3 py-1.5 rounded-full text-xs font-semibold backdrop-blur-md bg-white/90 shadow-sm ${getCategoryColor(event.category)}`}>
                                  {event.category}
                                </span>
                              </div>

                              {/* Favorite Button */}
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  toggleFavorite(event.id);
                                }}
                                className="absolute top-4 right-4 p-2 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white transition-all shadow-lg"
                              >
                                <Heart className={`w-4 h-4 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-600'}`} />
                              </button>

                              {/* Price Badge */}
                              <div className="absolute bottom-4 right-4">
                                {event.pricingType === 'free' ? (
                                  <span className="bg-emerald-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg shadow-emerald-500/30">Free</span>
                                ) : (
                                  <span className="bg-white text-gray-900 text-sm font-bold px-3 py-1.5 rounded-full shadow-lg">€{event.price}</span>
                                )}
                              </div>

                              {isPast && (
                                <div className="absolute bottom-4 left-4 right-20">
                                  <div className="bg-gray-900/80 backdrop-blur-sm text-white px-3 py-1.5 rounded-lg text-xs font-semibold text-center">
                                    Event Completed
                                  </div>
                                </div>
                              )}
                            </div>

                            <div className="p-5 flex flex-col flex-grow">
                              <Link to={`/event/${event.id}`}>
                                <h3 className="text-[17px] font-bold text-gray-900 mb-3 leading-snug line-clamp-2 min-h-[3rem] group-hover:text-[#7A8E80] transition-colors duration-300">
                                  {event.title}
                                </h3>
                              </Link>
                              <div className="space-y-2.5 mb-5">
                                <div className="flex items-center gap-2.5 text-gray-500">
                                  <div className="w-7 h-7 rounded-lg bg-gray-50 flex items-center justify-center shrink-0">
                                    <Calendar className="w-3.5 h-3.5 text-gray-400" />
                                  </div>
                                  <span className="text-sm">
                                    {new Date(event.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} • {event.startTime}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2.5 text-gray-500">
                                  <div className="w-7 h-7 rounded-lg bg-gray-50 flex items-center justify-center shrink-0">
                                    <MapPin className="w-3.5 h-3.5 text-gray-400" />
                                  </div>
                                  <span className="text-sm line-clamp-1">{event.venueName}, {event.city}</span>
                                </div>
                                <div className="flex items-center gap-2.5 text-gray-500">
                                  <div className="w-7 h-7 rounded-lg bg-gray-50 flex items-center justify-center shrink-0">
                                    <Users className="w-3.5 h-3.5 text-gray-400" />
                                  </div>
                                  <span className="text-sm">{event.rsvpCount} going</span>
                                </div>
                              </div>

                              <div className="mt-auto pt-4 border-t border-gray-100 flex items-center justify-between">
                                <div className="text-xs text-gray-400">
                                  RSVP'd {new Date(event.rsvpAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                </div>
                                <button
                                  onClick={() => handleCancelRsvp(event.id, event.title)}
                                  disabled={isCanceling}
                                  className="text-xs font-semibold text-red-600 hover:text-red-700 transition-colors disabled:opacity-50"
                                >
                                  {isCanceling ? 'Canceling...' : 'Cancel'}
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </motion.div>
                  ) : (
                    <motion.div layout className="space-y-5">
                      {filteredEvents.map((event, index) => {
                        const isPast = isEventPast(event.startDate);
                        const isFavorite = favorites.includes(event.id);
                        const isCanceling = cancelingId === event.id;

                        return (
                          <motion.div
                            key={event.id}
                            layout
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.4, delay: index * 0.03 }}
                            className={`group bg-white rounded-2xl overflow-hidden border border-gray-100/80 hover:shadow-xl transition-all duration-300 ${isPast ? 'opacity-75' : ''}`}
                            style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.03)' }}
                          >
                            <div className="flex flex-col md:flex-row gap-5 p-5">
                              <div className="w-full md:w-40 h-32 rounded-xl overflow-hidden bg-gradient-to-br from-[#9CAFA0] to-[#7A8E80] flex-shrink-0 relative">
                                <img
                                  src={event.coverImage || PLACEHOLDER_IMAGE}
                                  alt={event.title}
                                  className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ${isPast ? 'grayscale' : ''}`}
                                />
                                {isPast && (
                                  <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-[1px] flex items-center justify-center">
                                    <span className="text-white text-xs font-semibold">Completed</span>
                                  </div>
                                )}
                              </div>

                              <div className="flex-1 min-w-0 flex flex-col">
                                <Link to={`/event/${event.id}`}>
                                  <h3 className="text-lg font-bold text-gray-900 group-hover:text-[#7A8E80] transition-colors line-clamp-1 mb-2">
                                    {event.title}
                                  </h3>
                                </Link>

                                <div className="flex items-center gap-2 mb-3">
                                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${getCategoryColor(event.category)}`}>
                                    {event.category}
                                  </span>
                                  {event.pricingType === 'free' ? (
                                    <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">Free</span>
                                  ) : (
                                    <span className="text-xs font-semibold text-gray-700 bg-gray-100 px-2.5 py-1 rounded-full">€{event.price}</span>
                                  )}
                                </div>

                                <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-gray-500 mb-3">
                                  <div className="flex items-center gap-1.5">
                                    <Calendar className="w-4 h-4 text-gray-400" />
                                    {new Date(event.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} • {event.startTime}
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    <MapPin className="w-4 h-4 text-gray-400" />
                                    {event.venueName}, {event.city}
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    <Users className="w-4 h-4 text-gray-400" />
                                    {event.rsvpCount} going
                                  </div>
                                </div>

                                <div className="mt-auto flex items-center justify-between gap-4">
                                  <div className="text-xs text-gray-400">
                                    RSVP'd {new Date(event.rsvpAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <button
                                      onClick={() => toggleFavorite(event.id)}
                                      className="p-2 hover:bg-gray-50 rounded-lg transition-colors"
                                    >
                                      <Heart className={`w-4 h-4 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-400'}`} />
                                    </button>
                                    <button
                                      onClick={() => handleCancelRsvp(event.id, event.title)}
                                      disabled={isCanceling}
                                      className="text-sm font-semibold text-red-600 hover:text-red-700 px-3 py-1.5 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                                    >
                                      {isCanceling ? 'Canceling...' : 'Cancel RSVP'}
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              ) : (
                <motion.div 
                  initial={{ opacity: 0, y: 16 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  className="text-center py-24 bg-white rounded-3xl border border-gray-100/80" 
                  style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.03)' }}
                >
                  <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
                    <Search className="w-7 h-7 text-gray-300" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">No matches found</h3>
                  <p className="text-gray-500 text-sm max-w-xs mx-auto">
                    Try adjusting your search or filters
                  </p>
                </motion.div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
