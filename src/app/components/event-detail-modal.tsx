import React, { useEffect, useRef, useState } from 'react';
import {
  X,
  MapPin,
  Clock,
  Calendar,
  Heart,
  Users,
  Share2,
  ExternalLink,
  Info,
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
  HandHeart,
  Sparkles,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useFavorites } from './favorites-context';
import { useNavigate } from 'react-router';
import { useAuth } from './auth-context';
import { AttendeeAvatars, fetchEventRsvp, rsvpToEvent, removeRsvp, type RsvpData } from './rsvp-helpers';

/* ──────────────────────────────────────────────────── */
/*  Types                                                */
/* ──────────────────────────────────────────────────── */

export interface EventDetailData {
  id: string;
  image: string;
  title: string;
  date: string;
  time: string;
  location: string;
  tag: string;
  price?: string;
  isFree?: boolean;
  attendees?: number;
  description?: string;
  highlights?: string[];
}

interface EventDetailModalProps {
  event: EventDetailData | null;
  onClose: () => void;
}

/* ──────────────────────────────────────────────────── */
/*  Category config                                      */
/* ──────────────────────────────────────────────────── */

const categoryMap: Record<string, { icon: React.ElementType; color: string; bgColor: string; label: string }> = {
  Festival: { icon: PartyPopper, color: 'text-green-600', bgColor: 'bg-green-50', label: 'Festival' },
  Music: { icon: Music, color: 'text-blue-600', bgColor: 'bg-blue-50', label: 'Music' },
  Workshop: { icon: Wrench, color: 'text-purple-600', bgColor: 'bg-purple-50', label: 'Workshop' },
  Sports: { icon: Dumbbell, color: 'text-red-600', bgColor: 'bg-red-50', label: 'Sports' },
  'Food & Drink': { icon: UtensilsCrossed, color: 'text-amber-600', bgColor: 'bg-amber-50', label: 'Food & Drink' },
  Art: { icon: Palette, color: 'text-pink-600', bgColor: 'bg-pink-50', label: 'Art' },
  Tech: { icon: Laptop, color: 'text-indigo-600', bgColor: 'bg-indigo-50', label: 'Tech' },
  Comedy: { icon: Laugh, color: 'text-yellow-600', bgColor: 'bg-yellow-50', label: 'Comedy' },
  Kids: { icon: Baby, color: 'text-teal-600', bgColor: 'bg-teal-50', label: 'Kids & Family' },
  Wellness: { icon: Leaf, color: 'text-emerald-600', bgColor: 'bg-emerald-50', label: 'Wellness' },
  Outdoor: { icon: TreePine, color: 'text-lime-700', bgColor: 'bg-lime-50', label: 'Outdoor' },
  Support: { icon: HandHeart, color: 'text-teal-600', bgColor: 'bg-teal-50', label: 'Support' },
};

/* ──────────────────────────────────────────────────── */
/*  Mock descriptions by category                        */
/* ──────────────────────────────────────────────────── */

const mockDescriptions: Record<string, string[]> = {
  Music: [
    'Immerse yourself in an evening of extraordinary musical performances. This event brings together talented artists for a night of captivating melodies, soulful rhythms, and unforgettable live performances. Whether you\'re a longtime fan or discovering new sounds, this is an experience you won\'t want to miss.',
  ],
  Festival: [
    'Join us for a vibrant celebration that brings the community together. Enjoy a diverse lineup of performances, interactive experiences, delicious food, and a festive atmosphere that captures the spirit of togetherness. Perfect for families, friends, and anyone looking for a joyful time.',
  ],
  Art: [
    'Experience a curated showcase of artistic expression that pushes creative boundaries. From visual installations to live demonstrations, this event invites you to explore new perspectives and engage with art in meaningful ways. A must-visit for art enthusiasts and curious minds alike.',
  ],
  Tech: [
    'Dive into the future of technology at this premier event. Connect with industry leaders, discover groundbreaking innovations, and participate in hands-on workshops that will expand your knowledge and inspire new ideas. Networking opportunities abound for professionals at all levels.',
  ],
  'Food & Drink': [
    'Indulge your taste buds at this culinary celebration. Sample an array of flavors from local and regional vendors, learn from expert chefs, and discover new favorites. Whether you\'re a foodie or just looking for a delicious day out, there\'s something for every palate.',
  ],
  Sports: [
    'Get your adrenaline pumping at this exciting sporting event. Whether you\'re participating or cheering from the sidelines, the energy is contagious. Join fellow enthusiasts for a day of competition, camaraderie, and the thrill of athletic achievement.',
  ],
  Workshop: [
    'Unlock your creative potential in this hands-on workshop experience. Led by experienced instructors, you\'ll learn new skills, experiment with materials, and walk away with something you created yourself. All skill levels welcome — just bring your curiosity.',
  ],
  Comedy: [
    'Prepare for an evening of non-stop laughter. Talented comedians take the stage to deliver sharp wit, hilarious observations, and side-splitting performances. Grab your friends and enjoy a night where the only goal is to have a great time.',
  ],
  Kids: [
    'A magical experience designed for young adventurers and their families. With interactive activities, creative stations, live entertainment, and plenty of fun surprises, this event promises smiles and memories that will last. Safe, inclusive, and endlessly entertaining.',
  ],
  Wellness: [
    'Nurture your mind, body, and spirit at this wellness-focused gathering. From guided sessions to mindful activities, this event offers a peaceful escape from daily life. Discover new practices, connect with like-minded individuals, and leave feeling refreshed.',
  ],
  Outdoor: [
    'Embrace the beauty of nature at this outdoor adventure. Whether you\'re hiking, exploring, or simply soaking in the scenery, this event invites you to disconnect from the everyday and reconnect with the world around you. All fitness levels welcome.',
  ],
  Support: [
    'A welcoming community event focused on connection and support. Meet others who share your interests, participate in meaningful activities, and access helpful resources. This is a safe space designed to uplift, inform, and bring people together.',
  ],
};

function getDescription(event: EventDetailData): string {
  if (event.description) return event.description;
  const categoryDescs = mockDescriptions[event.tag] || mockDescriptions.Music;
  return categoryDescs![0]!;
}

/* ──────────────────────────────────────────────────── */
/*  Highlights data based on category                    */
/* ──────────────────────────────────────────────────── */

function getHighlights(tag: string): string[] {
  const highlights: Record<string, string[]> = {
    Music: ['Live performances', 'Professional sound system', 'Intimate venue setting'],
    Festival: ['Multiple stages', 'Food vendors', 'Family-friendly activities'],
    Art: ['Curated exhibitions', 'Artist meet & greet', 'Interactive installations'],
    Tech: ['Keynote speakers', 'Demo booths', 'Networking sessions'],
    'Food & Drink': ['Tasting sessions', 'Local vendors', 'Chef demonstrations'],
    Sports: ['Professional coaching', 'Competition brackets', 'Awards ceremony'],
    Workshop: ['Hands-on learning', 'Materials provided', 'Expert instructors'],
    Comedy: ['Multiple performers', 'Full bar service', 'VIP seating available'],
    Kids: ['Supervised activities', 'Age-appropriate fun', 'Creative workshops'],
    Wellness: ['Guided sessions', 'Relaxation areas', 'Expert practitioners'],
    Outdoor: ['Scenic trails', 'Equipment provided', 'Professional guides'],
    Support: ['Community resources', 'Expert guidance', 'Safe environment'],
  };
  return highlights[tag] || highlights.Music!;
}

/* ──────────────────────────────────────────────────── */
/*  Modal component                                      */
/* ──────────────────────────────────────────────────── */

export function EventDetailModal({ event, onClose }: EventDetailModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const { isFavorite, toggleFavorite } = useFavorites();
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();

  // RSVP state
  const [rsvpData, setRsvpData] = useState<RsvpData>({ count: 0, users: [], hasRsvpd: false });
  const [rsvpLoading, setRsvpLoading] = useState(false);

  // Fetch RSVP data when event opens
  useEffect(() => {
    if (!event) return;
    // Only fetch for real event IDs (not "home-X" or "browse-X" prefixed ones)
    const eventId = event.id;
    if (!eventId || eventId.startsWith('home-') || eventId.startsWith('browse-')) return;
    
    fetchEventRsvp(eventId).then(setRsvpData);
  }, [event?.id]);

  const handleRsvp = async () => {
    if (!event || rsvpLoading) return;
    if (!isLoggedIn) {
      onClose();
      navigate('/login');
      return;
    }
    
    const eventId = event.id;
    if (!eventId || eventId.startsWith('home-') || eventId.startsWith('browse-')) return;

    setRsvpLoading(true);
    if (rsvpData.hasRsvpd) {
      const result = await removeRsvp(eventId);
      if (result.success) {
        setRsvpData(prev => ({ ...prev, hasRsvpd: false, count: result.count ?? prev.count - 1 }));
      }
    } else {
      const result = await rsvpToEvent(eventId);
      if (result.success) {
        setRsvpData(prev => ({ ...prev, hasRsvpd: true, count: result.count ?? prev.count + 1 }));
        // Refresh to get updated user list
        fetchEventRsvp(eventId).then(setRsvpData);
      }
    }
    setRsvpLoading(false);
  };

  // Close on Escape
  useEffect(() => {
    if (!event) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [event, onClose]);

  // Close on backdrop click
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) onClose();
  };

  const liked = event ? isFavorite(event.id) : false;
  const handleToggleFavorite = () => {
    if (!event) return;
    toggleFavorite(event.id);
  };

  const handleShare = async () => {
    if (!event) return;
    if (navigator.share) {
      try {
        await navigator.share({ title: event.title, text: `Check out ${event.title} on EventGo!`, url: window.location.href });
      } catch { /* user cancelled */ }
    } else {
      await navigator.clipboard.writeText(window.location.href);
    }
  };

  return (
    <AnimatePresence>
      {event && (() => {
        const config = categoryMap[event.tag] || { icon: Sparkles, color: 'text-gray-600', bgColor: 'bg-gray-50', label: event.tag };
        const TagIcon = config.icon;
        const description = getDescription(event);
        const highlights = event.highlights || getHighlights(event.tag);

        return (
          <motion.div
            ref={overlayRef}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={handleOverlayClick}
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 md:p-8"
            style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="relative w-full max-w-3xl max-h-[90vh] bg-white rounded-3xl overflow-hidden flex flex-col"
              style={{ boxShadow: '0 32px 64px rgba(0,0,0,0.2), 0 0 0 1px rgba(0,0,0,0.05)' }}
            >
              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-5 right-5 z-20 w-10 h-10 rounded-full bg-black/30 backdrop-blur-md flex items-center justify-center text-white hover:bg-black/50 transition-colors duration-200"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Scrollable content */}
              <div className="overflow-y-auto flex-1 overscroll-contain">
                {/* Hero image */}
                <div className="relative h-64 md:h-80 overflow-hidden">
                  <img
                    src={event.image}
                    alt={event.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

                  {/* Floating badges on image */}
                  <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between">
                    {/* Tag */}
                    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-full backdrop-blur-md bg-white/90 shadow-lg ${config.color}`}>
                      <TagIcon className="w-3.5 h-3.5" />
                      {config.label}
                    </span>

                    {/* Price */}
                    <div>
                      {event.isFree ? (
                        <span className="bg-emerald-500 text-white text-sm font-bold px-4 py-2 rounded-full shadow-lg shadow-emerald-500/30">
                          Free Event
                        </span>
                      ) : event.price ? (
                        <div className="flex flex-col items-end gap-1">
                          <span className="bg-white text-gray-900 font-bold px-4 py-2 rounded-full shadow-lg" title="Price set by organizer. EventGo does not sell tickets.">
                            {event.price}
                          </span>
                          <span className="text-[10px] text-white/70 font-medium">Price set by organizer</span>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>

                {/* Content body */}
                <div className="p-6 md:p-10">
                  {/* Title + Action buttons */}
                  <div className="flex items-start justify-between gap-4 mb-6">
                    <h2 className="text-2xl md:text-3xl font-bold text-gray-900 leading-tight flex-1">
                      {event.title}
                    </h2>
                    <div className="flex items-center gap-2 shrink-0">
                      <motion.button
                        whileTap={{ scale: 0.85 }}
                        onClick={handleToggleFavorite}
                        className={`w-11 h-11 rounded-full flex items-center justify-center border transition-all duration-300 ${
                          liked
                            ? 'bg-red-50 border-red-200 text-red-500'
                            : 'bg-gray-50 border-gray-200 text-gray-400 hover:text-red-500 hover:border-red-200'
                        }`}
                      >
                        <Heart className={`w-5 h-5 ${liked ? 'fill-current' : ''}`} />
                      </motion.button>
                      <button
                        onClick={handleShare}
                        className="w-11 h-11 rounded-full flex items-center justify-center bg-gray-50 border border-gray-200 text-gray-400 hover:text-[#9CAFA0] hover:border-[#9CAFA0]/30 transition-colors duration-200"
                      >
                        <Share2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  {/* Info grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                    <div className="flex items-center gap-3 bg-gray-50 rounded-2xl p-4 border border-gray-100">
                      <div className="w-10 h-10 rounded-xl bg-[#FF9B51]/10 flex items-center justify-center shrink-0">
                        <Calendar className="w-5 h-5 text-[#FF9B51]" />
                      </div>
                      <div>
                        <p className="text-[11px] text-gray-400 uppercase tracking-wider font-medium">Date</p>
                        <p className="text-sm text-gray-800 font-semibold">{event.date}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 bg-gray-50 rounded-2xl p-4 border border-gray-100">
                      <div className="w-10 h-10 rounded-xl bg-[#9CAFA0]/10 flex items-center justify-center shrink-0">
                        <Clock className="w-5 h-5 text-[#9CAFA0]" />
                      </div>
                      <div>
                        <p className="text-[11px] text-gray-400 uppercase tracking-wider font-medium">Time</p>
                        <p className="text-sm text-gray-800 font-semibold">{event.time || 'TBA'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 bg-gray-50 rounded-2xl p-4 border border-gray-100">
                      <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
                        <Users className="w-5 h-5 text-blue-500" />
                      </div>
                      <div>
                        <p className="text-[11px] text-gray-400 uppercase tracking-wider font-medium">Attendees</p>
                        <p className="text-sm text-gray-800 font-semibold">{rsvpData.count > 0 ? `${rsvpData.count} going` : 'Be first to join!'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Location */}
                  <div className="flex items-start gap-3 bg-gray-50 rounded-2xl p-4 border border-gray-100 mb-8">
                    <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center shrink-0 mt-0.5">
                      <MapPin className="w-5 h-5 text-rose-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] text-gray-400 uppercase tracking-wider font-medium mb-0.5">Location</p>
                      <p className="text-sm text-gray-800 font-semibold">{event.location}</p>
                    </div>
                  </div>

                  {/* About */}
                  <div className="mb-8">
                    <h3 className="text-lg font-bold text-gray-900 mb-3">About This Event</h3>
                    <p className="text-sm text-gray-500 leading-relaxed">{description}</p>
                  </div>

                  {/* Highlights */}
                  <div className="mb-8">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Highlights</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {highlights.map((h, i) => (
                        <div key={i} className="flex items-center gap-3 bg-[#9CAFA0]/5 rounded-xl p-3.5 border border-[#9CAFA0]/10">
                          <div className="w-2 h-2 rounded-full bg-[#9CAFA0] shrink-0" />
                          <span className="text-sm text-gray-600">{h}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Attendees preview + RSVP */}
                  <div className="flex items-center justify-between bg-[#9CAFA0]/5 rounded-2xl p-5 border border-[#9CAFA0]/10 mb-8">
                    <div className="flex items-center gap-3">
                      <AttendeeAvatars users={rsvpData.users} count={rsvpData.count} size="md" />
                    </div>
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={handleRsvp}
                      disabled={rsvpLoading}
                      className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                        rsvpData.hasRsvpd
                          ? 'bg-[#9CAFA0] text-white shadow-md shadow-[#9CAFA0]/20 hover:bg-[#8A9E8F]'
                          : 'bg-white text-[#9CAFA0] border-2 border-[#9CAFA0] hover:bg-[#9CAFA0] hover:text-white'
                      } ${rsvpLoading ? 'opacity-60 cursor-wait' : ''}`}
                    >
                      <Users className="w-4 h-4" />
                      {rsvpLoading ? 'Loading...' : rsvpData.hasRsvpd ? "I'm Going!" : isLoggedIn ? 'Join Event' : 'Login to Join'}
                    </motion.button>
                  </div>

                  {/* Disclaimer */}
                  <div className="flex items-start gap-3 bg-amber-50/60 rounded-2xl p-4 border border-amber-100/80 mb-2">
                    <Info className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-700/70 leading-relaxed">
                      EventGo is an event discovery platform. We do not sell tickets or process payments. {event.price && !event.isFree ? 'The price shown is provided by the event organizer for informational purposes. ' : ''}Contact the event organizer directly for registration, tickets, or further details.
                    </p>
                  </div>
                </div>
              </div>

              {/* Sticky bottom bar */}
              <div className="border-t border-gray-100 bg-white px-6 md:px-10 py-5 flex items-center justify-between gap-4">
                <div>
                  {event.isFree ? (
                    <span className="text-emerald-600 font-bold">Free Event</span>
                  ) : event.price ? (
                    <div>
                      <span className="text-2xl font-bold text-gray-900">{event.price}</span>
                      <span className="text-xs text-gray-400 ml-1.5">by organizer</span>
                    </div>
                  ) : (
                    <span className="text-gray-500 text-sm">Price not listed</span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={onClose}
                    className="px-6 py-3 rounded-xl text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors duration-200"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      const params = new URLSearchParams({
                        ...(event.id && { eventId: event.id }),
                        ...(event.title && { eventTitle: event.title }),
                        ...(event.date && { eventDate: event.date }),
                        ...(event.location && { eventLocation: event.location }),
                      });
                      navigate(`/contact-organizer?${params.toString()}`);
                    }}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white bg-[#FF9B51] hover:bg-[#E88A3E] shadow-lg shadow-orange-500/15 hover:shadow-orange-500/25 transition-all duration-200 active:scale-[0.98]"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Contact Organizer
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        );
      })()}
    </AnimatePresence>
  );
}