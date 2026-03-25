import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router';
import {
  FileText,
  Calendar,
  Clock,
  MapPin,
  Tag,
  Euro,
  Users,
  Trash2,
  Edit3,
  Loader,
  Sparkles,
  ArrowRight,
  AlertCircle,
  CheckCircle,
  Facebook,
  Instagram,
  Twitter,
  Mail,
  Phone,
  Save,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from './auth-context';
import { supabase } from './auth-context';
import { LoginRequired } from './login-required';

interface DraftData {
  title?: string;
  description?: string;
  category?: string;
  startDate?: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
  venueName?: string;
  address?: string;
  city?: string;
  pricingType?: string;
  price?: string;
  capacity?: string;
  coverImage?: string | null;
  tags?: string[];
  organizerName?: string;
  organizerEmail?: string;
  organizerPhone?: string;
  website?: string;
  savedAt?: string;
}

/* ── Footer ── */
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
            <div className="md:col-span-3 md:pl-8">
              <h4 className="text-[#FF9B51] font-bold text-xs uppercase tracking-widest mb-6">Quick Links</h4>
              <ul className="space-y-3.5">
                {['Browse Events', 'Submit Event', 'Help Center', 'Terms of Service', 'Privacy Policy'].map((item) => (
                  <li key={item}>
                    <a href="#" className="text-gray-400 hover:text-white transition-colors text-sm inline-flex items-center gap-1 group">
                      <span className="w-0 h-px bg-[#FF9B51] group-hover:w-3 transition-all duration-200" />
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
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
            <p className="text-gray-500 text-xs">&copy;2026 EventGo. All rights reserved.</p>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-gray-500 text-xs">All systems operational</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

/* ── Detail row helper ── */
function DetailRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center shrink-0 mt-0.5">
        <Icon className="w-4 h-4 text-gray-400" />
      </div>
      <div>
        <p className="text-xs text-gray-400 font-medium">{label}</p>
        <p className="text-sm text-gray-700">{value}</p>
      </div>
    </div>
  );
}

/* ── Completeness indicator ── */
function CompletenessBar({ draft }: { draft: DraftData }) {
  const requiredFields = ['title', 'description', 'category', 'startDate', 'startTime', 'venueName', 'city', 'organizerName', 'organizerEmail'];
  const filled = requiredFields.filter((f) => {
    const val = (draft as any)[f];
    return val && String(val).trim().length > 0;
  }).length;
  const pct = Math.round((filled / requiredFields.length) * 100);
  const missingFields = requiredFields.filter((f) => {
    const val = (draft as any)[f];
    return !val || String(val).trim().length === 0;
  });

  const fieldLabels: Record<string, string> = {
    title: 'Event Title',
    description: 'Description',
    category: 'Category',
    startDate: 'Start Date',
    startTime: 'Start Time',
    venueName: 'Venue Name',
    city: 'City',
    organizerName: 'Organizer Name',
    organizerEmail: 'Organizer Email',
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Completeness</span>
        <span className={`text-sm font-bold ${pct === 100 ? 'text-emerald-600' : pct >= 50 ? 'text-amber-600' : 'text-red-500'}`}>
          {pct}%
        </span>
      </div>
      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className={`h-full rounded-full ${pct === 100 ? 'bg-emerald-500' : pct >= 50 ? 'bg-amber-500' : 'bg-red-400'}`}
        />
      </div>
      {missingFields.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-1">
          {missingFields.map((f) => (
            <span key={f} className="text-[10px] font-medium text-red-500 bg-red-50 px-2 py-0.5 rounded-full border border-red-100">
              {fieldLabels[f] || f}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Main page ── */
export function MyDraftsPage() {
  const { isLoggedIn } = useAuth();

  if (!isLoggedIn) {
    return (
      <LoginRequired
        title="My Drafts"
        subtitle="Sign in to access your saved drafts"
        description="You need to be signed in to view your event drafts. Create an account or sign in to manage your drafts."
        icon={Save}
      />
    );
  }

  return <DraftsContent />;
}

function DraftsContent() {
  const navigate = useNavigate();
  const [draft, setDraft] = useState<DraftData | null>(null);
  const [draftEventId, setDraftEventId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteSuccess, setDeleteSuccess] = useState(false);

  useEffect(() => {
    loadDraft();
  }, []);

  const loadDraft = async () => {
    try {
      setIsLoading(true);
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser?.id) {
        setIsLoading(false);
        return;
      }

      const { data: row, error } = await supabase
        .from('events')
        .select('*')
        .eq('author_id', authUser.id)
        .eq('is_draft', true)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error || !row) {
        setDraft(null);
        setDraftEventId(null);
        return;
      }

      setDraftEventId(row.id);
      setDraft({
        title: row.title || '',
        description: row.description || '',
        category: row.category || '',
        startDate: row.start_date || row.startDate || '',
        endDate: row.end_date || row.endDate || '',
        startTime: row.start_time || row.startTime || '',
        endTime: row.end_time || row.endTime || '',
        venueName: row.venue_name || row.venueName || '',
        address: row.address || '',
        city: row.city || '',
        pricingType: row.pricing_type || row.pricingType || 'free',
        price: row.price != null ? String(row.price) : '',
        capacity: row.capacity != null ? String(row.capacity) : '',
        coverImage: row.cover_image || row.coverImage || null,
        tags: Array.isArray(row.tags) ? row.tags : [],
        organizerName: row.organizer_name || row.organizerName || '',
        organizerEmail: row.organizer_email || row.organizerEmail || '',
        organizerPhone: row.organizer_phone || row.organizerPhone || '',
        website: row.website || '',
        savedAt: row.updated_at || row.created_at || null,
      });
    } catch (error) {
      console.error('Error loading draft:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteDraft = async () => {
    try {
      setIsDeleting(true);
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser?.id) return;

      let query = supabase
        .from('events')
        .delete()
        .eq('author_id', authUser.id)
        .eq('is_draft', true);

      if (draftEventId) {
        query = query.eq('id', draftEventId);
      }

      const { error } = await query;
      if (!error) {
        setDraft(null);
        setDraftEventId(null);
        setShowDeleteConfirm(false);
        setDeleteSuccess(true);
        setTimeout(() => setDeleteSuccess(false), 3000);
      }
    } catch (error) {
      console.error('Error deleting draft:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero */}
      <section className="relative w-full overflow-hidden bg-[#9CAFA0]">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full bg-white/[0.04]" />
          <div className="absolute -bottom-24 -left-24 w-[380px] h-[380px] rounded-full bg-white/[0.04]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] rounded-full bg-white/[0.02]" />
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '28px 28px' }}
          />
        </div>

        <div className="relative pt-36 pb-24 md:pt-44 md:pb-32 px-6 flex flex-col items-center">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/15 rounded-full px-4 py-1.5 mb-5"
          >
            <Save className="w-3.5 h-3.5 text-[#FFB070]" />
            <span className="text-xs font-medium text-white/80 tracking-wide uppercase">
              {draft ? '1 Draft Saved' : 'No Drafts'}
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.05 }}
            className="text-4xl md:text-[56px] font-bold tracking-tight text-white leading-[1.08] text-center mb-4"
          >
            My <span className="text-[#FFB070]">Drafts</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-lg text-white/60 max-w-md mx-auto text-center"
          >
            Resume your unfinished event submissions
          </motion.p>
        </div>

        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 60" fill="none" className="w-full" preserveAspectRatio="none">
            <path d="M0 60V30C240 0 480 0 720 30C960 60 1200 60 1440 30V60H0Z" fill="#FCFCFC" />
          </svg>
        </div>
      </section>

      {/* Content */}
      <div className="flex-1 bg-[#FCFCFC]">
        <div className="max-w-3xl mx-auto w-full px-6 md:px-10 py-10">
          {/* Delete success banner */}
          <AnimatePresence>
            {deleteSuccess && (
              <motion.div
                initial={{ opacity: 0, y: -16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                className="bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3 flex items-center gap-3 mb-6"
              >
                <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                <p className="text-sm text-emerald-700 font-medium">Draft deleted successfully.</p>
              </motion.div>
            )}
          </AnimatePresence>

          {isLoading ? (
            <div className="flex items-center justify-center py-32">
              <Loader className="w-8 h-8 text-[#9CAFA0] animate-spin" />
            </div>
          ) : !draft ? (
            /* Empty state */
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
              <h3 className="text-2xl font-bold text-gray-900 mb-3">No drafts saved</h3>
              <p className="text-gray-500 text-sm max-w-sm mx-auto mb-8 leading-relaxed">
                When you start filling out the submit event form and click "Save as Draft", your progress will appear here.
              </p>
              <Link
                to="/submit"
                className="group inline-flex items-center gap-2 bg-[#FF9B51] hover:bg-[#E88A3E] text-white px-8 py-3.5 rounded-xl font-semibold shadow-lg shadow-orange-500/15 hover:shadow-orange-500/25 transition-all duration-200 active:scale-[0.98] text-sm"
              >
                Create New Event
                <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5" />
              </Link>
            </motion.div>
          ) : (
            /* Draft card */
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="bg-white rounded-3xl border border-gray-100/80 overflow-hidden"
              style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.03)' }}
            >
              {/* Draft header */}
              <div className="p-6 md:p-8 border-b border-gray-100">
                <div className="flex items-start justify-between gap-4 mb-5">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center">
                      <Edit3 className="w-6 h-6 text-amber-500" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">
                        {draft.title || 'Untitled Event'}
                      </h2>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Last saved {draft.savedAt ? formatDate(draft.savedAt) : 'recently'}
                      </p>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-50 px-2.5 py-1.5 rounded-full border border-amber-200 shrink-0">
                    <AlertCircle className="w-3 h-3" />
                    Draft
                  </span>
                </div>

                {/* Completeness */}
                <CompletenessBar draft={draft} />
              </div>

              {/* Draft preview */}
              <div className="p-6 md:p-8 space-y-5">
                {/* Cover image preview */}
                {draft.coverImage && (
                  <div className="rounded-2xl overflow-hidden h-48 bg-gray-100">
                    <img
                      src={draft.coverImage}
                      alt="Cover preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                {/* Description */}
                {draft.description && (
                  <div>
                    <p className="text-xs text-gray-400 font-medium mb-1">Description</p>
                    <p className="text-sm text-gray-600 leading-relaxed line-clamp-3">{draft.description}</p>
                  </div>
                )}

                {/* Details grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {draft.category && (
                    <DetailRow icon={Tag} label="Category" value={draft.category} />
                  )}
                  {draft.startDate && (
                    <DetailRow
                      icon={Calendar}
                      label="Date"
                      value={`${draft.startDate}${draft.endDate ? ` - ${draft.endDate}` : ''}`}
                    />
                  )}
                  {draft.startTime && (
                    <DetailRow
                      icon={Clock}
                      label="Time"
                      value={`${draft.startTime}${draft.endTime ? ` - ${draft.endTime}` : ''}`}
                    />
                  )}
                  {draft.venueName && (
                    <DetailRow
                      icon={MapPin}
                      label="Venue"
                      value={`${draft.venueName}${draft.city ? `, ${draft.city}` : ''}`}
                    />
                  )}
                  {draft.pricingType && (
                    <DetailRow
                      icon={Euro}
                      label="Pricing"
                      value={draft.pricingType === 'free' ? 'Free' : draft.price ? `${draft.price}€` : 'Paid'}
                    />
                  )}
                  {draft.capacity && (
                    <DetailRow icon={Users} label="Capacity" value={draft.capacity} />
                  )}
                </div>

                {/* Tags */}
                {draft.tags && draft.tags.length > 0 && (
                  <div>
                    <p className="text-xs text-gray-400 font-medium mb-2">Tags</p>
                    <div className="flex flex-wrap gap-1.5">
                      {draft.tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-xs font-medium text-[#5A6E60] bg-[#9CAFA0]/10 px-2.5 py-1 rounded-full border border-[#9CAFA0]/20"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Organizer info */}
                {(draft.organizerName || draft.organizerEmail) && (
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-xs text-gray-400 font-medium mb-2">Organizer</p>
                    <div className="space-y-1">
                      {draft.organizerName && (
                        <p className="text-sm font-semibold text-gray-800">{draft.organizerName}</p>
                      )}
                      {draft.organizerEmail && (
                        <p className="text-xs text-gray-500">{draft.organizerEmail}</p>
                      )}
                      {draft.organizerPhone && (
                        <p className="text-xs text-gray-500">{draft.organizerPhone}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="p-6 md:p-8 border-t border-gray-100 bg-gray-50/50">
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => navigate('/submit')}
                    className="flex-1 group inline-flex items-center justify-center gap-2 bg-[#FF9B51] hover:bg-[#E88A3E] text-white px-6 py-3.5 rounded-xl font-semibold shadow-lg shadow-orange-500/15 hover:shadow-orange-500/25 transition-all duration-200 active:scale-[0.98] text-sm"
                  >
                    <Edit3 className="w-4 h-4" />
                    Continue Editing
                    <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="inline-flex items-center justify-center gap-2 bg-white hover:bg-red-50 text-red-600 border border-red-200 hover:border-red-300 px-6 py-3.5 rounded-xl font-semibold transition-all duration-200 active:scale-[0.98] text-sm"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete Draft
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Delete confirmation modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center px-6"
          >
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowDeleteConfirm(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative bg-white rounded-3xl p-8 max-w-sm w-full text-center"
              style={{ boxShadow: '0 24px 64px rgba(0,0,0,0.15)' }}
            >
              <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-5">
                <Trash2 className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Delete Draft?</h3>
              <p className="text-gray-500 text-sm leading-relaxed mb-6">
                This will permanently remove your saved draft. You'll need to start over if you want to submit this event.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 bg-gray-50 hover:bg-gray-100 text-gray-700 px-5 py-3 rounded-xl font-semibold transition-all duration-200 active:scale-[0.98] text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteDraft}
                  disabled={isDeleting}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white px-5 py-3 rounded-xl font-semibold shadow-lg shadow-red-500/20 transition-all duration-200 active:scale-[0.98] text-sm disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {isDeleting ? (
                    <Loader className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Footer />
    </div>
  );
}
