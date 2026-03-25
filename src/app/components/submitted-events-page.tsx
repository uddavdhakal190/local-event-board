import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router';
import { 
  Calendar, 
  MapPin, 
  Clock, 
  Users, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Loader, 
  Eye, 
  ArrowRight,
  FileText,
  Search,
  X,
  LayoutGrid,
  List,
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
  Sparkles,
  Facebook,
  Instagram,
  Twitter,
  Mail,
  Phone,
  BarChart3,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from './auth-context';
import { supabase } from './auth-context';

const categoryMap: Record<string, { icon: React.ElementType; color: string }> = {
  Festival: { icon: PartyPopper, color: 'text-green-600' },
  Music: { icon: Music, color: 'text-blue-600' },
  Workshop: { icon: Wrench, color: 'text-purple-600' },
  Sports: { icon: Dumbbell, color: 'text-red-600' },
  'Food & Drink': { icon: UtensilsCrossed, color: 'text-amber-600' },
  Art: { icon: Palette, color: 'text-pink-600' },
  Tech: { icon: Laptop, color: 'text-indigo-600' },
  Comedy: { icon: Laugh, color: 'text-yellow-600' },
  Kids: { icon: Baby, color: 'text-teal-600' },
  Wellness: { icon: Leaf, color: 'text-emerald-600' },
  Outdoor: { icon: TreePine, color: 'text-lime-700' },
};

interface Event {
  id: string;
  title: string;
  description: string;
  category: string;
  startDate: string;
  endDate?: string;
  startTime: string;
  endTime?: string;
  venueName: string;
  address?: string;
  city: string;
  pricingType: string;
  price?: string;
  capacity?: number;
  coverImage?: string;
  organizerName: string;
  organizerEmail: string;
  submittedBy: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  reviewedAt?: string;
  rsvpCount?: number;
}

const PLACEHOLDER_IMAGE = 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=800';

function GridCard({ event, index }: { event: Event; index: number }) {
  const config = categoryMap[event.category];
  const tagColor = config?.color || 'text-gray-600';
  const TagIcon = config?.icon || Sparkles;

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00');
    const dayName = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][d.getDay()];
    const dayNum = d.getDate();
    const monthName = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][d.getMonth()];
    return { dayName, dayNum, monthName };
  };

  const { dayName, dayNum, monthName } = formatDate(event.startDate);

  const getStatusBadge = () => {
    switch (event.status) {
      case 'approved':
        return (
          <div className="absolute top-4 right-4 inline-flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-50/95 backdrop-blur-md px-2.5 py-1.5 rounded-full border border-green-200 shadow-sm">
            <CheckCircle className="w-3 h-3" />
            Approved
          </div>
        );
      case 'rejected':
        return (
          <div className="absolute top-4 right-4 inline-flex items-center gap-1 text-xs font-semibold text-red-700 bg-red-50/95 backdrop-blur-md px-2.5 py-1.5 rounded-full border border-red-200 shadow-sm">
            <XCircle className="w-3 h-3" />
            Rejected
          </div>
        );
      case 'pending':
        return (
          <div className="absolute top-4 right-4 inline-flex items-center gap-1 text-xs font-semibold text-orange-700 bg-orange-50/95 backdrop-blur-md px-2.5 py-1.5 rounded-full border border-orange-200 shadow-sm">
            <AlertCircle className="w-3 h-3" />
            Pending
          </div>
        );
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.92, transition: { duration: 0.25 } }}
      transition={{ duration: 0.45, delay: index * 0.05, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="group relative bg-white rounded-3xl overflow-hidden border border-gray-100/80 flex flex-col h-full hover:shadow-2xl hover:shadow-black/8 hover:-translate-y-1.5 transition-all duration-500"
      style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.03)' }}
    >
      <div className="relative h-52 overflow-hidden">
        <img 
          src={event.coverImage || PLACEHOLDER_IMAGE} 
          alt={event.title} 
          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110" 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/5 to-transparent opacity-60 group-hover:opacity-40 transition-opacity duration-500" />

        {/* Tag + Status Badge */}
        <div className="absolute top-4 left-4">
          <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full backdrop-blur-md bg-white/90 shadow-sm ${tagColor}`}>
            <TagIcon className="w-3 h-3" />
            {event.category}
          </span>
        </div>
        {getStatusBadge()}

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
          {event.pricingType === 'free' ? (
            <span className="bg-emerald-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg shadow-emerald-500/30">Free</span>
          ) : event.price ? (
            <span className="bg-white text-gray-900 text-sm font-bold px-3 py-1.5 rounded-full shadow-lg">{event.price}€</span>
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
            <span className="text-sm">{event.endTime ? `${event.startTime} – ${event.endTime}` : event.startTime}</span>
          </div>
          <div className="flex items-center gap-2.5 text-gray-500">
            <div className="w-7 h-7 rounded-lg bg-gray-50 flex items-center justify-center shrink-0">
              <MapPin className="w-3.5 h-3.5 text-gray-400" />
            </div>
            <span className="text-sm line-clamp-1">{event.venueName}, {event.city}</span>
          </div>
          {event.status === 'approved' && event.rsvpCount !== undefined && (
            <div className="flex items-center gap-2.5 text-gray-500">
              <div className="w-7 h-7 rounded-lg bg-gray-50 flex items-center justify-center shrink-0">
                <Users className="w-3.5 h-3.5 text-gray-400" />
              </div>
              <span className="text-sm">{event.rsvpCount} going</span>
            </div>
          )}
        </div>
        {/* Footer */}
        <div className="mt-auto pt-4 border-t border-gray-100">
          <div className="text-xs text-gray-400">
            Submitted {new Date(event.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function ListCard({ event, index, onViewDetails }: { event: Event; index: number; onViewDetails: (eventId: string) => void }) {
  const config = categoryMap[event.category];
  const tagColor = config?.color || 'text-gray-600';
  const TagIcon = config?.icon || Sparkles;

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getStatusBadge = () => {
    switch (event.status) {
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-50 px-2.5 py-1 rounded-full border border-green-200">
            <CheckCircle className="w-3 h-3" />
            Approved
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-700 bg-red-50 px-2.5 py-1 rounded-full border border-red-200">
            <XCircle className="w-3 h-3" />
            Rejected
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-orange-700 bg-orange-50 px-2.5 py-1 rounded-full border border-orange-200">
            <AlertCircle className="w-3 h-3" />
            Pending
          </span>
        );
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20, transition: { duration: 0.2 } }}
      transition={{ duration: 0.4, delay: index * 0.03, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="group bg-white rounded-2xl overflow-hidden border border-gray-100/80 hover:shadow-xl hover:shadow-black/5 transition-all duration-300"
      style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.03)' }}
    >
      <div className="flex flex-col md:flex-row gap-5 p-5">
        {/* Image */}
        <div className="w-full md:w-40 h-32 rounded-xl overflow-hidden bg-gradient-to-br from-[#9CAFA0] to-[#7A8E80] flex-shrink-0">
          <img
            src={event.coverImage || PLACEHOLDER_IMAGE}
            alt={event.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4 mb-2">
            <h3 className="text-lg font-bold text-gray-900 group-hover:text-[#7A8E80] transition-colors line-clamp-1">
              {event.title}
            </h3>
            {getStatusBadge()}
          </div>

          <div className="flex items-center gap-2 mb-3">
            <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${tagColor} bg-gray-50`}>
              <TagIcon className="w-3 h-3" />
              {event.category}
            </span>
            {event.pricingType === 'free' && (
              <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">Free</span>
            )}
            {event.pricingType === 'paid' && event.price && (
              <span className="text-xs font-semibold text-gray-700 bg-gray-100 px-2.5 py-1 rounded-full">{event.price}€</span>
            )}
          </div>

          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
            {event.description}
          </p>

          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-gray-500">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-gray-400" />
              {formatDate(event.startDate)}
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-gray-400" />
              {event.endTime ? `${event.startTime} – ${event.endTime}` : event.startTime}
            </div>
            <div className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-gray-400" />
              {event.venueName}, {event.city}
            </div>
            {event.status === 'approved' && event.rsvpCount !== undefined && (
              <div className="flex items-center gap-1.5">
                <Users className="w-4 h-4 text-gray-400" />
                {event.rsvpCount} going
              </div>
            )}
            <div className="text-xs text-gray-400 ml-auto">
              Submitted {new Date(event.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </div>
          </div>

          <div className="flex items-center justify-between">
            {event.status === 'approved' && (
              <button
                onClick={() => onViewDetails(event.id)}
                className="group/btn inline-flex items-center gap-1.5 text-sm font-semibold text-[#FF9B51] hover:text-[#E88A3E] transition-colors"
              >
                <BarChart3 className="w-4 h-4" />
                View Analytics
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export function SubmittedEventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const { user, isLoggedIn } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }
    if (!user?.id) return;
    loadEvents();
  }, [isLoggedIn, navigate, user?.id]);

  const loadEvents = async () => {
    try {
      setIsLoading(true);
      if (!user) return;

      const { data: rows, error } = await supabase
        .from('events')
        .select('*')
        .eq('author_id', user.id)
        .eq('is_draft', false)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      const eventIds = (rows || []).map((row: any) => row.id);
      let rsvpCountByEvent: Record<string, number> = {};
      if (eventIds.length > 0) {
        const { data: counts } = await supabase.rpc('rsvp_counts_by_event_ids', { event_ids: eventIds });
        rsvpCountByEvent = (counts || []).reduce((acc: Record<string, number>, row: any) => {
          acc[row.event_id] = Number(row.rsvp_count || 0);
          return acc;
        }, {});
      }

      const mapped: Event[] = (rows || []).map((row: any) => ({
        id: row.id,
        title: row.title || 'Untitled Event',
        description: row.description || '',
        category: row.category || 'Event',
        startDate: row.start_date || row.startDate || '',
        endDate: row.end_date || row.endDate || undefined,
        startTime: row.start_time || row.startTime || 'TBD',
        endTime: row.end_time || row.endTime || undefined,
        venueName: row.venue_name || row.venueName || 'Venue TBA',
        address: row.address || undefined,
        city: row.city || 'Unknown',
        pricingType: row.pricing_type || row.pricingType || 'free',
        price: row.price != null ? String(row.price) : undefined,
        capacity: row.capacity != null ? Number(row.capacity) : undefined,
        coverImage: row.cover_image || row.coverImage || undefined,
        organizerName: row.organizer_name || row.organizerName || '',
        organizerEmail: row.organizer_email || row.organizerEmail || '',
        submittedBy: row.author_id || user.id,
        status: row.status === 'approved' || row.status === 'rejected' || row.status === 'pending' ? row.status : 'pending',
        createdAt: row.created_at || row.createdAt || new Date().toISOString(),
        reviewedAt: row.reviewed_at || row.reviewedAt || undefined,
        rsvpCount: rsvpCountByEvent[row.id] || 0,
      }));

      setEvents(mapped);
    } catch (err) {
      console.error('Failed to load submitted events:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const stats = {
    all: events.length,
    pending: events.filter(e => e.status === 'pending').length,
    approved: events.filter(e => e.status === 'approved').length,
    rejected: events.filter(e => e.status === 'rejected').length,
  };

  let filteredEvents = selectedFilter === 'all' 
    ? events 
    : events.filter(e => e.status === selectedFilter);

  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    filteredEvents = filteredEvents.filter(e => 
      e.title.toLowerCase().includes(q) || 
      e.category.toLowerCase().includes(q) ||
      e.city.toLowerCase().includes(q)
    );
  }

  const onViewDetails = (eventId: string) => {
    navigate(`/event/${eventId}/analytics`);
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
            <FileText className="w-3.5 h-3.5 text-[#FFB070]" />
            <span className="text-xs font-medium text-white/80 tracking-wide uppercase">
              {stats.all} {stats.all === 1 ? 'Event' : 'Events'} Submitted
            </span>
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.6, delay: 0.05 }} 
            className="text-4xl md:text-[56px] font-bold tracking-tight text-white leading-[1.08] text-center mb-4"
          >
            My <span className="text-[#FFB070]">Submitted Events</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.5, delay: 0.1 }} 
            className="text-lg text-white/60 max-w-md mx-auto text-center mb-10"
          >
            Track and manage all the events you've submitted
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
                    placeholder="Search your events..." 
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
                <FileText className="w-9 h-9 text-[#9CAFA0]/60" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">No events submitted yet</h3>
              <p className="text-gray-500 text-sm max-w-sm mx-auto mb-8 leading-relaxed">
                Submit your first event to get started! Share your events with the community and track their approval status.
              </p>
              <Link 
                to="/submit" 
                className="group inline-flex items-center gap-2 bg-[#FF9B51] hover:bg-[#E88A3E] text-white px-8 py-3.5 rounded-xl font-semibold shadow-lg shadow-orange-500/15 hover:shadow-orange-500/25 transition-all duration-200 active:scale-[0.98] text-sm"
              >
                Submit an Event
                <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5" />
              </Link>
            </motion.div>
          ) : (
            <>
              {/* Filter Pills */}
              <div className="flex items-center gap-3 mb-8 flex-wrap">
                <button
                  onClick={() => setSelectedFilter('all')}
                  className={`px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 ${
                    selectedFilter === 'all'
                      ? 'bg-[#9CAFA0] text-white shadow-lg shadow-[#9CAFA0]/25'
                      : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-100'
                  }`}
                >
                  All Events ({stats.all})
                </button>
                <button
                  onClick={() => setSelectedFilter('pending')}
                  className={`px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 ${
                    selectedFilter === 'pending'
                      ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/25'
                      : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-100'
                  }`}
                >
                  Pending ({stats.pending})
                </button>
                <button
                  onClick={() => setSelectedFilter('approved')}
                  className={`px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 ${
                    selectedFilter === 'approved'
                      ? 'bg-green-500 text-white shadow-lg shadow-green-500/25'
                      : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-100'
                  }`}
                >
                  Approved ({stats.approved})
                </button>
                <button
                  onClick={() => setSelectedFilter('rejected')}
                  className={`px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 ${
                    selectedFilter === 'rejected'
                      ? 'bg-red-500 text-white shadow-lg shadow-red-500/25'
                      : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-100'
                  }`}
                >
                  Rejected ({stats.rejected})
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
                      {filteredEvents.map((e, i) => (
                        <GridCard key={e.id} event={e} index={i} />
                      ))}
                    </motion.div>
                  ) : (
                    <motion.div layout className="space-y-5">
                      {filteredEvents.map((e, i) => (
                        <ListCard key={e.id} event={e} index={i} onViewDetails={onViewDetails} />
                      ))}
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
                    {searchQuery 
                      ? `No events match "${searchQuery}"` 
                      : `You don't have any ${selectedFilter.replace('_', ' ')} events`}
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