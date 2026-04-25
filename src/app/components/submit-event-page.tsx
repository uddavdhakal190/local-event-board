import { useState, useRef, useEffect } from 'react';
import {
  PartyPopper,
  Music,
  Wrench,
  Dumbbell,
  UtensilsCrossed,
  Palette,
  Laptop,
  Laugh,
  Baby,
  Leaf,
  TreePine,
  FileText,
  Tag,
  X,
  ImageIcon,
  Upload,
  Calendar,
  Clock,
  MapPin,
  Globe,
  Euro,
  CheckCircle,
  Users,
  User,
  Mail,
  Phone,
  Info,
  Sparkles,
  ArrowRight,
  Facebook,
  Instagram,
  Twitter,
  Save,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Link, useNavigate } from 'react-router';
import { useAuth } from './auth-context';
import { supabase } from './auth-context';
import { LoginRequired } from './login-required';
import { CalendarDatePicker } from './calendar-date-picker';
import { TimePicker } from './time-picker';
import { CityAutocomplete } from './city-autocomplete';
import { projectId, publicAnonKey } from '/utils/supabase/info';

const API_BASE = `https://${projectId}.supabase.co/functions/v1/make-server-ccc6c9e2`;

/* ──────────────────────────────────────────────────── */
/*  Category config (same as browse page)               */
/* ──────────────────────────────────────────────────── */

const categories = [
  { value: 'Festival', label: 'Festival', icon: PartyPopper, color: 'text-green-600 bg-green-50' },
  { value: 'Music', label: 'Music', icon: Music, color: 'text-blue-600 bg-blue-50' },
  { value: 'Workshop', label: 'Workshop', icon: Wrench, color: 'text-purple-600 bg-purple-50' },
  { value: 'Sports', label: 'Sports', icon: Dumbbell, color: 'text-red-600 bg-red-50' },
  { value: 'Food & Drink', label: 'Food & Drink', icon: UtensilsCrossed, color: 'text-amber-600 bg-amber-50' },
  { value: 'Art', label: 'Art', icon: Palette, color: 'text-pink-600 bg-pink-50' },
  { value: 'Tech', label: 'Tech', icon: Laptop, color: 'text-indigo-600 bg-indigo-50' },
  { value: 'Comedy', label: 'Comedy', icon: Laugh, color: 'text-yellow-600 bg-yellow-50' },
  { value: 'Kids', label: 'Kids', icon: Baby, color: 'text-teal-600 bg-teal-50' },
  { value: 'Wellness', label: 'Wellness', icon: Leaf, color: 'text-emerald-600 bg-emerald-50' },
  { value: 'Outdoor', label: 'Outdoor', icon: TreePine, color: 'text-lime-700 bg-lime-50' },
];

/* ──────────────────────────────────────────────────── */
/*  Suggested highlights by category                    */
/* ─────────────────────────────────────────────────── */

const suggestedHighlights: Record<string, string[]> = {
  Music: ['Live performances', 'Professional sound system', 'Intimate venue setting', 'Local artists', 'Dance floor'],
  Festival: ['Multiple stages', 'Food vendors', 'Family-friendly activities', 'Arts & crafts', 'Live entertainment'],
  Art: ['Curated exhibitions', 'Artist meet & greet', 'Interactive installations', 'Guided tours', 'Workshops included'],
  Tech: ['Keynote speakers', 'Demo booths', 'Networking sessions', 'Hands-on workshops', 'Industry experts'],
  'Food & Drink': ['Tasting sessions', 'Local vendors', 'Chef demonstrations', 'Live cooking', 'Exclusive recipes'],
  Sports: ['Professional coaching', 'Competition brackets', 'Awards ceremony', 'All skill levels', 'Equipment provided'],
  Workshop: ['Hands-on learning', 'Materials provided', 'Expert instructors', 'Small group size', 'Certificate included'],
  Comedy: ['Multiple performers', 'Full bar service', 'VIP seating available', 'Special guests', 'After-party included'],
  Kids: ['Supervised activities', 'Age-appropriate fun', 'Creative workshops', 'Snacks provided', 'Safe environment'],
  Wellness: ['Guided sessions', 'Relaxation areas', 'Expert practitioners', 'All levels welcome', 'Refreshments included'],
  Outdoor: ['Scenic trails', 'Equipment provided', 'Professional guides', 'Photo opportunities', 'Weather protection'],
};

/* ──────────────────────────────────────────────────── */
/*  Input component                                     */
/* ────────────────────────────────────────────────── */

function FormInput({
  label, icon: Icon, type = 'text', placeholder, value, onChange, required, hint,
}: {
  label: string; icon: React.ElementType; type?: string; placeholder: string;
  value: string; onChange: (v: string) => void; required?: boolean; hint?: string;
}) {
  return (
    <div className="space-y-2">
      <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
        {label}
        {required && <span className="text-[#FF9B51] text-xs">*</span>}
      </label>
      <div className="relative">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
          <Icon className="w-4 h-4 text-gray-400" />
        </div>
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-gray-50 border border-gray-100 rounded-xl pl-11 pr-4 py-3.5 text-sm text-gray-800 placeholder-gray-400 outline-none focus:border-[#9CAFA0] focus:ring-2 focus:ring-[#9CAFA0]/15 transition-all duration-200 hover:border-gray-200"
        />
      </div>
      {hint && <p className="text-xs text-gray-400 pl-1">{hint}</p>}
    </div>
  );
}

function FormTextarea({
  label, placeholder, value, onChange, required, rows = 4,
}: {
  label: string; placeholder: string; value: string; onChange: (v: string) => void; required?: boolean; rows?: number;
}) {
  return (
    <div className="space-y-2">
      <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
        {label}
        {required && <span className="text-[#FF9B51] text-xs">*</span>}
      </label>
      <textarea
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3.5 text-sm text-gray-800 placeholder-gray-400 outline-none focus:border-[#9CAFA0] focus:ring-2 focus:ring-[#9CAFA0]/15 transition-all duration-200 hover:border-gray-200 resize-none"
      />
    </div>
  );
}

/* ──────────────────────────────────────────────────── */
/*  Section card                                        */
/* ──────────────────────────────────────────────────── */

function FormSection({ icon: Icon, title, subtitle, children, delay = 0 }: {
  icon: React.ElementType; title: string; subtitle: string; children: React.ReactNode; delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.45, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="bg-white rounded-3xl border border-gray-100/80 p-7 md:p-8"
      style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.03)' }}
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-[#9CAFA0]/10 flex items-center justify-center">
          <Icon className="w-5 h-5 text-[#9CAFA0]" />
        </div>
        <div>
          <h3 className="text-base font-bold text-gray-900">{title}</h3>
          <p className="text-xs text-gray-400">{subtitle}</p>
        </div>
      </div>
      {children}
    </motion.div>
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

/* ─────────────────────────────────────────────────── */
/*  Success modal                                       */
/* ──────────────────────────────────────────────────── */

function SuccessModal({ onClose }: { onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center px-6"
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="relative bg-white rounded-3xl p-10 max-w-md w-full text-center"
        style={{ boxShadow: '0 24px 64px rgba(0,0,0,0.15)' }}
      >
        <div className="w-20 h-20 rounded-full bg-[#9CAFA0]/10 flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-10 h-10 text-[#9CAFA0]" />
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-3">Event Submitted!</h3>
        <p className="text-gray-500 text-sm leading-relaxed mb-8">
          Your event has been successfully submitted and is now <span className="font-semibold text-amber-600">pending admin review</span>. Once approved, it will immediately appear on the Browse Events page.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            to="/browse"
            className="flex-1 bg-[#FF9B51] hover:bg-[#E88A3E] text-white px-6 py-3.5 rounded-xl font-semibold shadow-lg shadow-orange-500/15 hover:shadow-orange-500/25 transition-all duration-200 active:scale-[0.98] text-sm inline-flex items-center justify-center gap-2"
          >
            Browse Events
            <ArrowRight className="w-4 h-4" />
          </Link>
          <button
            onClick={onClose}
            className="flex-1 bg-gray-50 hover:bg-gray-100 text-gray-700 px-6 py-3.5 rounded-xl font-semibold transition-all duration-200 active:scale-[0.98] text-sm"
          >
            Submit Another
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ──────────────────────────────────────────────────── */
/*  Main page                                           */
/* ─────────────────────────────────────────────────── */

export function SubmitEventPage() {
  return <SubmitEventForm />;
}

function SubmitEventForm() {
  const navigate = useNavigate();
  const { user, isLoggedIn } = useAuth();

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [venueName, setVenueName] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [pricingType, setPricingType] = useState<'free' | 'paid'>('free');
  const [price, setPrice] = useState('');
  const [capacity, setCapacity] = useState('');
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [highlights, setHighlights] = useState<string[]>([]);
  const [highlightInput, setHighlightInput] = useState('');
  const [organizerName, setOrganizerName] = useState('');
  const [organizerEmail, setOrganizerEmail] = useState('');
  const [organizerPhone, setOrganizerPhone] = useState('');
  const [website, setWebsite] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Draft state
  const [draftLoaded, setDraftLoaded] = useState(false);
  const [draftSavedAt, setDraftSavedAt] = useState<string | null>(null);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [draftSaveError, setDraftSaveError] = useState('');

  // Load draft on mount
  useEffect(() => {
    const loadDraft = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const accessToken = session?.access_token;
        if (!accessToken) return;

        const response = await fetch(`${API_BASE}/events/draft`, {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'X-User-Token': accessToken,
          },
        });

        if (response.ok) {
          const data = await response.json();
          if (data.draft) {
            const draft = data.draft;
            // Populate form with draft data
            setTitle(draft.title || '');
            setDescription(draft.description || '');
            setCategory(draft.category || '');
            setStartDate(draft.startDate || '');
            setEndDate(draft.endDate || '');
            setStartTime(draft.startTime || '');
            setEndTime(draft.endTime || '');
            setVenueName(draft.venueName || '');
            setAddress(draft.address || '');
            setCity(draft.city || '');
            setPricingType(draft.pricingType || 'free');
            setPrice(draft.price || '');
            setCapacity(draft.capacity || '');
            setCoverImage(draft.coverImage || null);
            setTags(draft.tags || []);
            setHighlights(draft.highlights || []);
            setOrganizerName(draft.organizerName || '');
            setOrganizerEmail(draft.organizerEmail || '');
            setOrganizerPhone(draft.organizerPhone || '');
            setWebsite(draft.website || '');
            setDraftSavedAt(draft.savedAt);
            setDraftLoaded(true);
            console.log('✓ Draft loaded successfully');
          }
        }
      } catch (error) {
        console.error('Error loading draft:', error);
      }
    };
    loadDraft();
  }, []);

  // Handle sign out in the middle of form - clear everything gracefully
  const prevIsLoggedInRef = useRef<boolean | null>(null);
  const isInitialMount = useRef(true);
  
  useEffect(() => {
    // Skip on initial mount
    if (isInitialMount.current) {
      isInitialMount.current = false;
      prevIsLoggedInRef.current = isLoggedIn;
      return;
    }
    
    // Only clear if user was logged in before and is now logged out (actual sign out)
    if (prevIsLoggedInRef.current === true && isLoggedIn === false) {
      // User signed out, clear all form data immediately
      setTitle('');
      setDescription('');
      setCategory('');
      setStartDate('');
      setEndDate('');
      setStartTime('');
      setEndTime('');
      setVenueName('');
      setAddress('');
      setCity('');
      setPricingType('free');
      setPrice('');
      setCapacity('');
      setCoverImage(null);
      setTags([]);
      setTagInput('');
      setHighlights([]);
      setHighlightInput('');
      setOrganizerName('');
      setOrganizerEmail('');
      setOrganizerPhone('');
      setWebsite('');
      setShowSuccess(false);
      setIsSubmitting(false);
      setSubmitError('');
      setDraftLoaded(false);
      setDraftSavedAt(null);
      setIsSavingDraft(false);
      setDraftSaveError('');
    }
    
    // Update the previous value
    prevIsLoggedInRef.current = isLoggedIn;
  }, [isLoggedIn]);

  const handleSaveDraft = async () => {
    setIsSavingDraft(true);
    setDraftSaveError('');

    const draftData = {
      title,
      description,
      category,
      startDate,
      endDate,
      startTime,
      endTime,
      venueName,
      address,
      city,
      pricingType,
      price,
      capacity,
      coverImage,
      tags,
      highlights,
      organizerName,
      organizerEmail,
      organizerPhone,
      website,
    };

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

      if (!accessToken) {
        setDraftSaveError('Authentication error. Please log in again.');
        setIsSavingDraft(false);
        return;
      }

      const response = await fetch(`${API_BASE}/events/draft`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`,
          'X-User-Token': accessToken,
        },
        body: JSON.stringify(draftData),
      });

      const data = await response.json();

      if (!response.ok) {
        setDraftSaveError(data?.error || 'Failed to save draft');
        setIsSavingDraft(false);
        return;
      }

      setDraftSavedAt(data.savedAt);
      setIsSavingDraft(false);
      console.log('✓ Draft saved successfully');
    } catch (error) {
      console.error('Error saving draft:', error);
      setDraftSaveError('Network error. Please try again.');
      setIsSavingDraft(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setCoverImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const addTag = () => {
    const t = tagInput.trim();
    if (t && !tags.includes(t) && tags.length < 5) {
      setTags([...tags, t]);
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => setTags(tags.filter((t) => t !== tag));

  const addHighlight = () => {
    const h = highlightInput.trim();
    if (h && !highlights.includes(h) && highlights.length < 5) {
      setHighlights([...highlights, h]);
      setHighlightInput('');
    }
  };

  const removeHighlight = (highlight: string) => setHighlights(highlights.filter((h) => h !== highlight));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError('');

    const eventData = {
      title,
      description,
      category,
      startDate,
      endDate,
      startTime,
      endTime,
      venueName,
      address,
      city,
      pricingType,
      price,
      capacity,
      coverImage,
      tags,
      highlights,
      organizerName,
      organizerEmail,
      organizerPhone,
      website,
    };

    try {
      // Refresh session to get a valid token
      const { data: { session }, error: sessionError } = await supabase.auth.refreshSession();
      
      if (sessionError || !session) {
        console.error('Session error:', sessionError);
        setSubmitError('Your session has expired. Please log in again.');
        setIsSubmitting(false);
        return;
      }

      const accessToken = session.access_token;
      console.log('Using access token:', accessToken.substring(0, 20) + '...');

      const response = await fetch(`${API_BASE}/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`,
          'X-User-Token': accessToken,
        },
        body: JSON.stringify(eventData),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('Server error submitting event:', data);
        setSubmitError(data?.error || data?.message || `Server error (${response.status}). Please try again.`);
        setIsSubmitting(false);
        return;
      }

      // Delete draft after successful submission
      try {
        await fetch(`${API_BASE}/events/draft`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'X-User-Token': accessToken,
          },
        });
        console.log('✓ Draft deleted after successful submission');
      } catch (err) {
        console.log('Could not delete draft:', err);
      }

      setIsSubmitting(false);
      setShowSuccess(true);
    } catch (error) {
      console.error('Network error submitting event:', error);
      setSubmitError('Network error. Please check your connection and try again.');
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setTitle(''); setDescription(''); setCategory(''); setStartDate(''); setEndDate('');
    setStartTime(''); setEndTime(''); setVenueName(''); setAddress(''); setCity('');
    setPricingType('free'); setPrice(''); setCapacity(''); setCoverImage(null);
    setTags([]); setTagInput(''); setHighlights([]); setHighlightInput('');
    setOrganizerName(''); setOrganizerEmail('');
    setOrganizerPhone(''); setWebsite(''); setShowSuccess(false);
  };

  const isFormValid = title && description && category && startDate && startTime && venueName && city && organizerName && organizerEmail;

  // Compute missing required fields for user feedback
  const missingFields: string[] = [];
  if (!title) missingFields.push('Event Title');
  if (!description) missingFields.push('Description');
  if (!category) missingFields.push('Category');
  if (!startDate) missingFields.push('Start Date');
  if (!startTime) missingFields.push('Start Time');
  if (!venueName) missingFields.push('Venue Name');
  if (!city) missingFields.push('City');
  if (!organizerName) missingFields.push('Organizer Name');
  if (!organizerEmail) missingFields.push('Organizer Email');
  const hasStartedFilling = title || description || category || startDate || startTime || venueName || city || organizerName || organizerEmail;

  // Check if user is logged in - render LoginRequired if not (after all hooks)
  if (!isLoggedIn) {
    return (
      <LoginRequired
        title="Submit Event"
        subtitle="Sign in to share your event with the world"
        description="You need to be signed in to submit events. Create an account or sign in to start sharing your events with our community."
        icon={FileText}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* ── Hero (same as home page) ── */}
      <section className="relative w-full overflow-hidden bg-[#9CAFA0]">
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

        <div className="relative pt-36 pb-24 md:pt-44 md:pb-32 px-6 flex flex-col items-center">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/15 rounded-full px-4 py-1.5 mb-5"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#FFB070]" />
            <span className="text-xs font-medium text-white/80 tracking-wide uppercase">Share Your Event With The World</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.05 }}
            className="text-4xl md:text-[56px] font-bold tracking-tight text-white leading-[1.08] text-center mb-4"
          >
            Submit Your <span className="text-[#FFB070]">Event</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-lg text-white/60 max-w-lg mx-auto text-center"
          >
            Fill in the details below and let thousands of people discover your event
          </motion.p>
        </div>

        {/* Wave divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 60" fill="none" className="w-full" preserveAspectRatio="none">
            <path d="M0 60V30C240 0 480 0 720 30C960 60 1200 60 1440 30V60H0Z" fill="#FCFCFC" />
          </svg>
        </div>
      </section>

      {/* ── Form content ── */}
      <div className="flex-1 bg-[#FCFCFC]">
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto w-full px-6 md:px-10 py-10 space-y-7">

          {/* Draft loaded banner */}
          {draftLoaded && draftSavedAt && (
            <motion.div
              initial={{ opacity: 0, y: -16 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 flex items-start gap-3"
            >
              <Info className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
              <div className="flex-1">
                <p className="text-sm text-blue-700 font-medium">Draft Loaded</p>
                <p className="text-xs text-blue-600 mt-0.5">
                  Your previous draft from {new Date(draftSavedAt).toLocaleString()} has been loaded. Continue editing or submit when ready.
                </p>
              </div>
              <button
                type="button"
                onClick={() => { setDraftLoaded(false); setDraftSavedAt(null); }}
                className="text-blue-400 hover:text-blue-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          )}

          {/* ─── Section 1: Basic Info ─── */}
          <FormSection icon={FileText} title="Event Details" subtitle="Tell people what your event is about" delay={0}>
            <div className="space-y-5">
              <FormInput
                label="Event Title" icon={FileText} placeholder="e.g. Helsinki Jazz Night 2026"
                value={title} onChange={setTitle} required
              />
              <FormTextarea
                label="Description" placeholder="Describe your event, what attendees can expect, highlights, schedule..."
                value={description} onChange={setDescription} required rows={5}
              />

              {/* Category selector */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  Category <span className="text-[#FF9B51] text-xs">*</span>
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {categories.map((cat) => {
                    const Icon = cat.icon;
                    const isSelected = category === cat.value;
                    return (
                      <button
                        type="button"
                        key={cat.value}
                        onClick={() => setCategory(cat.value)}
                        className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 border ${
                          isSelected
                            ? 'border-[#9CAFA0] bg-[#9CAFA0]/10 text-[#5A6E60] shadow-sm'
                            : 'border-gray-100 bg-gray-50 text-gray-500 hover:border-gray-200 hover:bg-gray-100'
                        }`}
                      >
                        <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-[#9CAFA0]' : 'text-gray-400'}`} />
                        <span className="truncate">{cat.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Tags */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  Tags <span className="text-xs text-gray-400 font-normal">(up to 5)</span>
                </label>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Tag className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      placeholder="Add a tag and press Enter"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
                      className="w-full bg-gray-50 border border-gray-100 rounded-xl pl-11 pr-4 py-3.5 text-sm text-gray-800 placeholder-gray-400 outline-none focus:border-[#9CAFA0] focus:ring-2 focus:ring-[#9CAFA0]/15 transition-all duration-200 hover:border-gray-200"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={addTag}
                    disabled={!tagInput.trim() || tags.length >= 5}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-600 px-4 py-3.5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Add
                  </button>
                </div>
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {tags.map((tag) => (
                      <span key={tag} className="inline-flex items-center gap-1.5 bg-[#9CAFA0]/10 text-[#5A6E60] text-xs font-semibold px-3 py-1.5 rounded-full border border-[#9CAFA0]/15">
                        {tag}
                        <button type="button" onClick={() => removeTag(tag)} className="hover:text-red-500 transition-colors"><X className="w-3 h-3" /></button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Highlights */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  Highlights <span className="text-xs text-gray-400 font-normal">(up to 5)</span>
                </label>
                
                {/* Suggested highlights based on category */}
                {category && suggestedHighlights[category] && (
                  <div className="mb-3">
                    <p className="text-xs text-gray-500 mb-2">Suggested highlights for {category}:</p>
                    <div className="flex flex-wrap gap-2">
                      {suggestedHighlights[category].map((suggestion) => {
                        const isSelected = highlights.includes(suggestion);
                        const canAdd = highlights.length < 5 || isSelected;
                        return (
                          <button
                            key={suggestion}
                            type="button"
                            onClick={() => {
                              if (isSelected) {
                                removeHighlight(suggestion);
                              } else if (canAdd) {
                                setHighlights([...highlights, suggestion]);
                              }
                            }}
                            disabled={!canAdd && !isSelected}
                            className={`text-xs px-3 py-1.5 rounded-full border transition-all duration-200 ${
                              isSelected
                                ? 'bg-[#9CAFA0] text-white border-[#9CAFA0] shadow-sm'
                                : 'bg-white text-gray-600 border-gray-200 hover:border-[#9CAFA0]/50 hover:bg-[#9CAFA0]/5 disabled:opacity-40 disabled:cursor-not-allowed'
                            }`}
                          >
                            {isSelected && <span className="mr-1">✓</span>}
                            {suggestion}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
                
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Sparkles className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      placeholder="Add a custom highlight and press Enter"
                      value={highlightInput}
                      onChange={(e) => setHighlightInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addHighlight(); } }}
                      className="w-full bg-gray-50 border border-gray-100 rounded-xl pl-11 pr-4 py-3.5 text-sm text-gray-800 placeholder-gray-400 outline-none focus:border-[#9CAFA0] focus:ring-2 focus:ring-[#9CAFA0]/15 transition-all duration-200 hover:border-gray-200"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={addHighlight}
                    disabled={!highlightInput.trim() || highlights.length >= 5}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-600 px-4 py-3.5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Add
                  </button>
                </div>
                {highlights.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {highlights.map((highlight) => (
                      <span key={highlight} className="inline-flex items-center gap-1.5 bg-[#9CAFA0]/10 text-[#5A6E60] text-xs font-semibold px-3 py-1.5 rounded-full border border-[#9CAFA0]/15">
                        {highlight}
                        <button type="button" onClick={() => removeHighlight(highlight)} className="hover:text-red-500 transition-colors"><X className="w-3 h-3" /></button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </FormSection>

          {/* ─── Section 2: Cover Image ─── */}
          <FormSection icon={ImageIcon} title="Cover Image" subtitle="Upload an eye-catching image for your event" delay={0.05}>
            <input type="file" ref={fileInputRef} accept="image/*" onChange={handleImageUpload} className="hidden" />
            {coverImage ? (
              <div className="relative rounded-2xl overflow-hidden h-56 group">
                <img src={coverImage} alt="Event cover" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                <button
                  type="button"
                  onClick={() => setCoverImage(null)}
                  className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 backdrop-blur-md flex items-center justify-center text-gray-500 hover:text-red-500 shadow-sm transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-md text-gray-700 px-4 py-2 rounded-xl text-xs font-semibold shadow-sm hover:bg-white transition-colors inline-flex items-center gap-1.5"
                >
                  <Upload className="w-3.5 h-3.5" />
                  Replace
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-48 border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center gap-3 hover:border-[#9CAFA0]/40 hover:bg-[#9CAFA0]/5 transition-all duration-300 group cursor-pointer"
              >
                <div className="w-14 h-14 rounded-2xl bg-gray-50 group-hover:bg-[#9CAFA0]/10 flex items-center justify-center transition-colors">
                  <Upload className="w-6 h-6 text-gray-400 group-hover:text-[#9CAFA0] transition-colors" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-gray-600 group-hover:text-gray-800 transition-colors">Click to upload</p>
                  <p className="text-xs text-gray-400 mt-0.5">PNG, JPG or WEBP up to 10MB</p>
                </div>
              </button>
            )}
          </FormSection>

          {/* ─── Section 3: Date & Time ─── */}
          <FormSection icon={Calendar} title="Date & Time" subtitle="When is your event happening?" delay={0.1}>
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    Start Date <span className="text-[#FF9B51] text-xs">*</span>
                  </label>
                  <div className="relative">
                    <Calendar className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <CalendarDatePicker
                      value={startDate}
                      onChange={(date) => setStartDate(date)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">End Date</label>
                  <div className="relative">
                    <Calendar className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <CalendarDatePicker
                      value={endDate}
                      onChange={(date) => setEndDate(date)}
                      minDate={startDate}
                    />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    Start Time <span className="text-[#FF9B51] text-xs">*</span>
                  </label>
                  <div className="relative">
                    <Clock className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <TimePicker
                      value={startTime}
                      onChange={(time) => setStartTime(time)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">End Time</label>
                  <div className="relative">
                    <Clock className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <TimePicker
                      value={endTime}
                      onChange={(time) => setEndTime(time)}
                    />
                  </div>
                </div>
              </div>
            </div>
          </FormSection>

          {/* ─── Section 4: Location ─── */}
          <FormSection icon={MapPin} title="Location" subtitle="Where will the event take place?" delay={0.15}>
            <div className="space-y-5">
              <FormInput
                label="Venue Name" icon={MapPin} placeholder="e.g. Storyville Jazz Club"
                value={venueName} onChange={setVenueName} required
              />
              <FormInput
                label="Street Address" icon={MapPin} placeholder="e.g. Museokatu 8"
                value={address} onChange={setAddress}
                hint="Full street address including number"
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <CityAutocomplete
                  value={city}
                  onChange={setCity}
                  required
                />
                <FormInput
                  label="Website / Map Link" icon={Globe} placeholder="https://..."
                  value={website} onChange={setWebsite}
                />
              </div>
            </div>
          </FormSection>

          {/* ─── Section 5: Pricing & Capacity ─── */}
          <FormSection icon={Euro} title="Pricing & Capacity" subtitle="Set your ticket pricing and attendee limits" delay={0.2}>
            <div className="space-y-5">
              {/* Free / Paid toggle */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Ticket Type</label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setPricingType('free')}
                    className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-semibold transition-all duration-200 border ${
                      pricingType === 'free'
                        ? 'border-emerald-400 bg-emerald-50 text-emerald-700 shadow-sm'
                        : 'border-gray-100 bg-gray-50 text-gray-500 hover:border-gray-200'
                    }`}
                  >
                    <CheckCircle className={`w-4 h-4 ${pricingType === 'free' ? 'text-emerald-500' : 'text-gray-400'}`} />
                    Free Event
                  </button>
                  <button
                    type="button"
                    onClick={() => setPricingType('paid')}
                    className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-semibold transition-all duration-200 border ${
                      pricingType === 'paid'
                        ? 'border-[#FF9B51] bg-orange-50 text-[#E88A3E] shadow-sm'
                        : 'border-gray-100 bg-gray-50 text-gray-500 hover:border-gray-200'
                    }`}
                  >
                    <Euro className={`w-4 h-4 ${pricingType === 'paid' ? 'text-[#FF9B51]' : 'text-gray-400'}`} />
                    Paid Event
                  </button>
                </div>
              </div>

              {pricingType === 'paid' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <FormInput
                    label="Ticket Price" icon={Euro} placeholder="e.g. 25"
                    value={price} onChange={setPrice} type="number"
                    hint="Price in euros (€)"
                  />
                </motion.div>
              )}

              <FormInput
                label="Maximum Capacity" icon={Users} placeholder="e.g. 200"
                value={capacity} onChange={setCapacity} type="number"
                hint="Leave empty for unlimited"
              />
            </div>
          </FormSection>

          {/* ─── Section 6: Organizer Info ─── */}
          <FormSection icon={User} title="Organizer Information" subtitle="How can attendees reach the organizer?" delay={0.25}>
            <div className="space-y-5">
              <FormInput
                label="Organizer Name" icon={User} placeholder="e.g. Nordic Events Oy"
                value={organizerName} onChange={setOrganizerName} required
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormInput
                  label="Email" icon={Mail} placeholder="organizer@email.com"
                  value={organizerEmail} onChange={setOrganizerEmail} required type="email"
                />
                <FormInput
                  label="Phone" icon={Phone} placeholder="+358 40 123 4567"
                  value={organizerPhone} onChange={setOrganizerPhone} type="tel"
                />
              </div>
            </div>
          </FormSection>

          {/* ─── Guidelines notice ─── */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="bg-[#9CAFA0]/8 border border-[#9CAFA0]/15 rounded-2xl p-5 flex gap-4"
          >
            <div className="w-10 h-10 rounded-xl bg-[#9CAFA0]/10 flex items-center justify-center shrink-0">
              <Info className="w-5 h-5 text-[#9CAFA0]" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-gray-700 mb-1">Submission Guidelines</h4>
              <ul className="text-xs text-gray-500 space-y-1 leading-relaxed">
                <li>• Events are reviewed within 24 hours before going live</li>
                <li>��� Ensure all information is accurate and up-to-date</li>
                <li>• Cover images should be at least 1200×600px for best quality</li>
                <li>• Contact details are shared publicly with attendees</li>
              </ul>
            </div>
          </motion.div>

          {/* ─── Submit button ─── */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.15 }}
            className="flex flex-col gap-4 pt-4"
          >
            {/* Error message */}
            {submitError && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-3 bg-red-50 border border-red-100 rounded-xl px-4 py-3"
              >
                <Info className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                <p className="text-sm text-red-600">{submitError}</p>
              </motion.div>
            )}

            {/* Missing fields hint */}
            {hasStartedFilling && !isFormValid && missingFields.length > 0 && (
              <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
                <p className="text-xs text-amber-700 font-medium">
                  Still needed: {missingFields.join(', ')}
                </p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center gap-4">
              <button
                type="submit"
                disabled={!isFormValid || isSubmitting}
                className="w-full sm:w-auto bg-[#FF9B51] hover:bg-[#E88A3E] disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed text-white px-10 py-4 rounded-xl font-semibold shadow-lg shadow-orange-500/15 hover:shadow-orange-500/25 disabled:shadow-none transition-all duration-200 active:scale-[0.98] text-sm inline-flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
                    Submitting...
                  </>
                ) : (
                  <>
                    Submit Event
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={handleSaveDraft}
                disabled={isSavingDraft || !hasStartedFilling}
                className="w-full sm:w-auto bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-300 disabled:cursor-not-allowed text-gray-700 px-8 py-4 rounded-xl font-semibold transition-all duration-200 active:scale-[0.98] text-sm inline-flex items-center justify-center gap-2"
              >
                {isSavingDraft ? (
                  <>
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      className="w-4 h-4 border-2 border-gray-300 border-t-gray-700 rounded-full" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save Draft
                  </>
                )}
              </button>
              <div className="flex-1" />
              <p className="text-xs text-gray-400">
                Fields marked with <span className="text-[#FF9B51]">*</span> are required
              </p>
            </div>

            {/* Draft save success message */}
            {draftSavedAt && !isSavingDraft && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 text-sm text-green-600"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Draft saved at {new Date(draftSavedAt).toLocaleTimeString()}</span>
              </motion.div>
            )}

            {/* Draft save error */}
            {draftSaveError && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-3 bg-red-50 border border-red-100 rounded-xl px-4 py-3"
              >
                <Info className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                <p className="text-sm text-red-600">{draftSaveError}</p>
              </motion.div>
            )}
          </motion.div>
        </form>
      </div>

      {/* Success modal */}
      <AnimatePresence>
        {showSuccess && <SuccessModal onClose={resetForm} />}
      </AnimatePresence>

      {/* Footer */}
    </div>
  );
}      
