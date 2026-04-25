import React, { useState } from 'react';
import {
  Send,
  Mail,
  User,
  MessageSquare,
  ArrowLeft,
  CheckCircle,
  Calendar,
  MapPin,
  Sparkles,
  Phone,
  FileText,
  Facebook,
  Instagram,
  Twitter,
  ArrowRight,
  Clock,
  Shield,
  Zap,
  Check,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Link, useSearchParams, useNavigate } from 'react-router';
import { useAuth } from './auth-context';
import { supabase } from './auth-context';

/* ──────────────────────────────────────────────────── */
/*  Footer Component                                    */
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
/*  Contact Organizer Page                              */
/* ──────────────────────────────────────────────────── */

export function ContactOrganizerPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, isLoggedIn } = useAuth();

  const eventId = searchParams.get('eventId') || '';
  const eventTitle = searchParams.get('eventTitle') || '';
  const eventDate = searchParams.get('eventDate') || '';
  const eventLocation = searchParams.get('eventLocation') || '';

  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: '',
    subject: eventTitle ? `Question about: ${eventTitle}` : '',
    message: '',
  });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const toUuidOrNull = (value: string): string | null => {
    const trimmed = value.trim();
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(trimmed)
      ? trimmed
      : null;
  };

  const update = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (error) setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoggedIn) {
      setError('Please log in to send a message to the organizer.');
      return;
    }

    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      setError('Please fill in all required fields.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setError('Please enter a valid email address.');
      return;
    }

    setSending(true);
    setError('');

    try {
      const { data, error: rpcError } = await supabase.rpc('create_contact_message', {
        event_id_param: toUuidOrNull(eventId),
        event_title_param: eventTitle || null,
        sender_name_param: form.name,
        sender_email_param: form.email,
        sender_phone_param: form.phone || null,
        subject_param: form.subject || null,
        message_param: form.message,
      });

      if (rpcError) {
        throw new Error(rpcError.message || 'Failed to send message');
      }

      const result = Array.isArray(data) ? data[0] : null;
      if (!result?.success) {
        throw new Error(result?.error || 'Failed to send message');
      }

      setSent(true);
    } catch (err: any) {
      console.error('Contact organizer error:', err);
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const isFormValid = form.name.trim() && form.email.trim() && form.message.trim();

  /* ── Success state ── */
  if (sent) {
    return (
      <div className="min-h-screen flex flex-col">
        {/* Hero Section */}
        <section className="relative w-full overflow-hidden bg-gradient-to-br from-[#9CAFA0] via-[#8FA598] to-[#7A9485]">
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full bg-white/[0.06]" />
            <div className="absolute -bottom-24 -left-24 w-[380px] h-[380px] rounded-full bg-white/[0.06]" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] rounded-full bg-white/[0.03]" />
            <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
          </div>
          <div className="relative pt-36 pb-24 md:pt-44 md:pb-32 px-6 flex flex-col items-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, type: 'spring', stiffness: 100 }}
              className="inline-flex items-center gap-2 bg-green-500/20 backdrop-blur-sm border border-green-400/30 rounded-full px-5 py-2 mb-6"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
              >
                <CheckCircle className="w-4 h-4 text-green-300" />
              </motion.div>
              <span className="text-sm font-semibold text-white tracking-wide">Message Delivered Successfully</span>
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="text-4xl md:text-[56px] font-bold tracking-tight text-white leading-[1.08] text-center mb-5"
            >
              Check Your <span className="text-[#FFD19E]">Inbox</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-lg text-white/70 max-w-2xl mx-auto text-center leading-relaxed"
            >
              We've forwarded your message to the event organizer
              {eventTitle && <span className="text-white/90 font-semibold"> for {eventTitle}</span>}.
              You'll receive a response at <span className="text-white font-semibold">{form.email}</span> within 24–48 hours.
            </motion.p>
          </div>
          <div className="absolute bottom-0 left-0 right-0">
            <svg viewBox="0 0 1440 60" fill="none" className="w-full" preserveAspectRatio="none">
              <path d="M0 60V30C240 0 480 0 720 30C960 60 1200 60 1440 30V60H0Z" fill="#FCFCFC" />
            </svg>
          </div>
        </section>

        {/* Content Section */}
        <div className="flex-1 bg-[#FCFCFC]">
          <div className="max-w-4xl mx-auto w-full px-6 md:px-10 py-16">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="bg-white rounded-3xl border border-gray-100/80 overflow-hidden"
              style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.06)' }}
            >
              {/* Success Icon */}
              <div className="relative bg-gradient-to-br from-green-50 to-emerald-50/50 p-12 text-center border-b border-gray-100/80">
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.4, type: 'spring', stiffness: 150, damping: 12 }}
                  className="w-24 h-24 rounded-3xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center mx-auto mb-6 shadow-xl shadow-green-500/30"
                >
                  <CheckCircle className="w-12 h-12 text-white" strokeWidth={2.5} />
                </motion.div>
                <motion.h2
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="text-3xl font-bold text-gray-900 mb-3"
                >
                  Success!
                </motion.h2>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="text-gray-600 leading-relaxed max-w-md mx-auto"
                >
                  Your message has been sent. The organizer will get back to you soon!
                </motion.p>
              </div>

              {/* What happens next */}
              <div className="p-8 md:p-10">
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-6 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  What Happens Next
                </h3>
                <div className="space-y-4 mb-8">
                  {[
                    { icon: Mail, text: 'The organizer receives your message instantly', delay: 0.7 },
                    { icon: Clock, text: 'They typically respond within 24-48 hours', delay: 0.8 },
                    { icon: CheckCircle, text: `You'll get their reply at ${form.email}`, delay: 0.9 },
                  ].map(({ icon: Icon, text, delay }, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay }}
                      className="flex items-start gap-3.5"
                    >
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#9CAFA0] to-[#8FA598] flex items-center justify-center shrink-0">
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <p className="text-gray-700 pt-2 leading-relaxed">{text}</p>
                    </motion.div>
                  ))}
                </div>

                {/* Actions */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1 }}
                  className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6 border-t border-gray-100"
                >
                  <button
                    onClick={() => navigate(-1)}
                    className="w-full sm:w-auto px-7 py-3.5 rounded-xl text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-all duration-200 active:scale-[0.98]"
                  >
                    Go Back
                  </button>
                  <Link
                    to="/browse"
                    className="w-full sm:w-auto group inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-[#FF9B51] to-[#FF8534] hover:from-[#E88A3E] hover:to-[#E07730] shadow-lg shadow-orange-500/20 hover:shadow-orange-500/30 transition-all duration-200 active:scale-[0.98]"
                  >
                    Browse More Events
                    <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                  </Link>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
        
      </div>
    );
  }

  /* ── Main form ── */
  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero Section */}
      <section className="relative w-full overflow-hidden bg-gradient-to-br from-[#9CAFA0] via-[#8FA598] to-[#7A9485]">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full bg-white/[0.06] blur-3xl" />
          <div className="absolute -bottom-24 -left-24 w-[380px] h-[380px] rounded-full bg-white/[0.06] blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] rounded-full bg-white/[0.03]" />
          <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
        </div>
        <div className="relative pt-36 pb-24 md:pt-44 md:pb-32 px-6 flex flex-col items-center">
          <motion.button
            onClick={() => navigate(-1)}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            whileHover={{ x: -4 }}
            className="absolute top-28 left-6 md:left-12 inline-flex items-center gap-2 text-white/70 hover:text-white text-sm font-medium transition-colors bg-white/5 hover:bg-white/10 px-4 py-2 rounded-xl backdrop-blur-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to event
          </motion.button>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2.5 bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-5 py-2 mb-6"
          >
            <Mail className="w-4 h-4 text-[#FFD19E]" />
            <span className="text-sm font-semibold text-white tracking-wide">Direct Messaging</span>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.05 }}
            className="text-4xl md:text-[56px] font-bold tracking-tight text-white leading-[1.08] text-center mb-5"
          >
            Contact <span className="text-[#FFD19E]">Organizer</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-lg text-white/70 max-w-2xl mx-auto text-center leading-relaxed"
          >
            Have questions about the event? Send a direct message to the organizer and get personalized answers.
          </motion.p>
        </div>
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 60" fill="none" className="w-full" preserveAspectRatio="none">
            <path d="M0 60V30C240 0 480 0 720 30C960 60 1200 60 1440 30V60H0Z" fill="#FCFCFC" />
          </svg>
        </div>
      </section>

      {/* Content Section */}
      <div className="flex-1 bg-[#FCFCFC]">
        <div className="max-w-6xl mx-auto w-full px-6 md:px-10 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-7">
            {/* Event info sidebar */}
            {eventTitle && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15, duration: 0.6 }}
                className="lg:col-span-1"
              >
                <div className="bg-white rounded-3xl border border-gray-100/80 p-7 lg:sticky lg:top-24" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 8px 20px rgba(0,0,0,0.06)' }}>
                  <div className="flex items-center gap-2.5 mb-6">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#FF9B51] to-[#FF8534] flex items-center justify-center">
                      <Sparkles className="w-4 h-4 text-white" />
                    </div>
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Event Details</h3>
                  </div>
                  <div className="space-y-5">
                    <div className="pb-5 border-b border-gray-100">
                      <h4 className="font-bold text-gray-900 text-base leading-snug">
                        {eventTitle}
                      </h4>
                    </div>
                    {eventDate && (
                      <div className="flex items-center gap-3 text-sm text-gray-600">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-50 to-orange-100/50 flex items-center justify-center shrink-0 border border-orange-100">
                          <Calendar className="w-4 h-4 text-[#FF9B51]" />
                        </div>
                        <div>
                          <div className="text-xs text-gray-400 font-medium mb-0.5">Date</div>
                          <div className="font-medium text-gray-900">{eventDate}</div>
                        </div>
                      </div>
                    )}
                    {eventLocation && (
                      <div className="flex items-center gap-3 text-sm text-gray-600">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-green-50 to-emerald-100/50 flex items-center justify-center shrink-0 border border-green-100">
                          <MapPin className="w-4 h-4 text-[#9CAFA0]" />
                        </div>
                        <div>
                          <div className="text-xs text-gray-400 font-medium mb-0.5">Location</div>
                          <div className="font-medium text-gray-900 line-clamp-2">{eventLocation}</div>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Trust indicators */}
                  <div className="mt-7 pt-6 border-t border-gray-100 space-y-3">
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Shield className="w-3.5 h-3.5 text-green-500" />
                      <span>Secure messaging</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Zap className="w-3.5 h-3.5 text-orange-500" />
                      <span>Instant delivery</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Clock className="w-3.5 h-3.5 text-blue-500" />
                      <span>24-48h response time</span>
                    </div>
                  </div>

                  <div className="mt-6 p-4 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50/50 border border-blue-100/50">
                    <p className="text-xs text-gray-600 leading-relaxed">
                      <span className="font-semibold text-gray-800">💡 Tip:</span> Be specific with your questions to help the organizer provide detailed answers!
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Contact form */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.6 }}
              className={eventTitle ? 'lg:col-span-2' : 'lg:col-span-3'}
            >
              <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-gray-100/80 p-8 md:p-10" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 8px 20px rgba(0,0,0,0.06)' }}>
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#9CAFA0] to-[#8FA598] flex items-center justify-center">
                    <MessageSquare className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Your Message</h3>
                    <p className="text-xs text-gray-500">Fill in the details below</p>
                  </div>
                </div>

                {/* Error */}
                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                      animate={{ opacity: 1, height: 'auto', marginBottom: 20 }}
                      exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="px-5 py-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-medium flex items-start gap-3">
                        <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center shrink-0 mt-0.5">
                          <span className="text-red-600 text-xs font-bold">!</span>
                        </div>
                        <span>{error}</span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  {/* Name */}
                  <div className="space-y-2.5">
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                      <User className="w-4 h-4 text-[#9CAFA0]" />
                      Your Name <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="John Doe"
                        value={form.name}
                        onChange={(e) => update('name', e.target.value)}
                        onFocus={() => setFocusedField('name')}
                        onBlur={() => setFocusedField(null)}
                        className="w-full px-4 py-3.5 rounded-xl border border-gray-200 bg-gray-50/50 text-gray-900 placeholder:text-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-[#9CAFA0]/30 focus:border-[#9CAFA0] focus:bg-white transition-all"
                        required
                      />
                      {form.name && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute right-3 top-1/2 -translate-y-1/2"
                        >
                          <Check className="w-4 h-4 text-green-500" />
                        </motion.div>
                      )}
                    </div>
                  </div>

                  {/* Email */}
                  <div className="space-y-2.5">
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                      <Mail className="w-4 h-4 text-[#9CAFA0]" />
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        placeholder="you@example.com"
                        value={form.email}
                        onChange={(e) => update('email', e.target.value)}
                        onFocus={() => setFocusedField('email')}
                        onBlur={() => setFocusedField(null)}
                        className="w-full px-4 py-3.5 rounded-xl border border-gray-200 bg-gray-50/50 text-gray-900 placeholder:text-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-[#9CAFA0]/30 focus:border-[#9CAFA0] focus:bg-white transition-all"
                        required
                      />
                      {form.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email) && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute right-3 top-1/2 -translate-y-1/2"
                        >
                          <Check className="w-4 h-4 text-green-500" />
                        </motion.div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  {/* Phone */}
                  <div className="space-y-2.5">
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                      <Phone className="w-4 h-4 text-[#9CAFA0]" />
                      Phone <span className="text-gray-400 font-normal text-xs ml-1">(optional)</span>
                    </label>
                    <input
                      type="tel"
                      placeholder="+1 (555) 000-0000"
                      value={form.phone}
                      onChange={(e) => update('phone', e.target.value)}
                      onFocus={() => setFocusedField('phone')}
                      onBlur={() => setFocusedField(null)}
                      className="w-full px-4 py-3.5 rounded-xl border border-gray-200 bg-gray-50/50 text-gray-900 placeholder:text-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-[#9CAFA0]/30 focus:border-[#9CAFA0] focus:bg-white transition-all"
                    />
                  </div>

                  {/* Subject */}
                  <div className="space-y-2.5">
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                      <FileText className="w-4 h-4 text-[#9CAFA0]" />
                      Subject
                    </label>
                    <input
                      type="text"
                      placeholder="What's this about?"
                      value={form.subject}
                      onChange={(e) => update('subject', e.target.value)}
                      onFocus={() => setFocusedField('subject')}
                      onBlur={() => setFocusedField(null)}
                      className="w-full px-4 py-3.5 rounded-xl border border-gray-200 bg-gray-50/50 text-gray-900 placeholder:text-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-[#9CAFA0]/30 focus:border-[#9CAFA0] focus:bg-white transition-all"
                    />
                  </div>
                </div>

                {/* Message */}
                <div className="space-y-2.5 mb-7">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <MessageSquare className="w-4 h-4 text-[#9CAFA0]" />
                    Message <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <textarea
                      placeholder="Hi! I'm interested in this event and would like to know more about..."
                      value={form.message}
                      onChange={(e) => update('message', e.target.value)}
                      onFocus={() => setFocusedField('message')}
                      onBlur={() => setFocusedField(null)}
                      rows={7}
                      maxLength={1000}
                      className="w-full px-4 py-3.5 rounded-xl border border-gray-200 bg-gray-50/50 text-gray-900 placeholder:text-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-[#9CAFA0]/30 focus:border-[#9CAFA0] focus:bg-white transition-all resize-none"
                      required
                    />
                    <div className="absolute bottom-3 right-3 flex items-center gap-2">
                      <span className={`text-xs font-medium transition-colors ${form.message.length > 900 ? 'text-orange-500' : 'text-gray-400'}`}>
                        {form.message.length}/1000
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => navigate(-1)}
                    className="w-full sm:w-auto order-2 sm:order-1 px-6 py-3 rounded-xl text-sm font-semibold text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-all duration-200"
                  >
                    Cancel
                  </button>
                  <motion.button
                    type="submit"
                    disabled={sending || !isFormValid}
                    whileTap={{ scale: sending ? 1 : 0.97 }}
                    className={`w-full sm:w-auto order-1 sm:order-2 inline-flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-xl text-sm font-semibold text-white shadow-lg transition-all duration-200 ${
                      isFormValid && !sending
                        ? 'bg-gradient-to-r from-[#FF9B51] to-[#FF8534] hover:from-[#E88A3E] hover:to-[#E07730] shadow-orange-500/20 hover:shadow-orange-500/30'
                        : 'bg-gray-300 cursor-not-allowed shadow-gray-300/20'
                    }`}
                  >
                    {sending ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Sending Message…
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Send Message
                      </>
                    )}
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </div>
        </div>
      </div>
      
    </div>
  );
}