import React from 'react';
import { Lock, ArrowRight, LogIn, UserPlus, Sparkles, Mail, MapPin, Phone, Facebook, Instagram, Twitter } from 'lucide-react';
import { motion } from 'motion/react';
import { Link } from 'react-router';

/* ──────────────────────────────────────────────────── */
/*  Footer (identical to other pages)                   */
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

/* ──────────────────────────────────────────────────── */
/*  Login Required page                                 */
/* ──────────────────────────────────────────────────── */

interface LoginRequiredProps {
  title: string;
  subtitle: string;
  description: string;
  icon?: React.ElementType;
}

export function LoginRequired({ title, subtitle, description, icon: HeroIcon = Lock }: LoginRequiredProps) {
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
            <Lock className="w-3.5 h-3.5 text-[#FFB070]" />
            <span className="text-xs font-medium text-white/80 tracking-wide uppercase">Login Required</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.05 }}
            className="text-4xl md:text-[56px] font-bold tracking-tight text-white leading-[1.08] text-center mb-4"
          >
            {title}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-lg text-white/60 max-w-md mx-auto text-center"
          >
            {subtitle}
          </motion.p>
        </div>

        {/* Wave divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 60" fill="none" className="w-full" preserveAspectRatio="none">
            <path d="M0 60V30C240 0 480 0 720 30C960 60 1200 60 1440 30V60H0Z" fill="#FCFCFC" />
          </svg>
        </div>
      </section>

      {/* Content */}
      <div className="flex-1 bg-[#FCFCFC]">
        <div className="max-w-xl mx-auto w-full px-6 md:px-10 py-20">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="bg-white rounded-3xl border border-gray-100/80 p-10 md:p-14 text-center"
            style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.03)' }}
          >
            {/* Icon */}
            <div className="w-20 h-20 bg-[#9CAFA0]/10 rounded-3xl flex items-center justify-center mx-auto mb-7">
              <HeroIcon className="w-9 h-9 text-[#9CAFA0]" />
            </div>

            <h2 className="text-2xl font-bold text-gray-900 tracking-tight mb-3">Sign in to continue</h2>
            <p className="text-gray-500 text-sm leading-relaxed max-w-sm mx-auto mb-10">{description}</p>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                to="/login"
                className="group w-full sm:w-auto inline-flex items-center justify-center gap-2.5 bg-[#FF9B51] hover:bg-[#E88A3E] text-white px-8 py-3.5 rounded-xl font-semibold shadow-lg shadow-orange-500/15 hover:shadow-orange-500/25 transition-all duration-200 active:scale-[0.98] text-sm"
              >
                <LogIn className="w-4 h-4" />
                Sign In
                <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5" />
              </Link>
              <Link
                to="/signup"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 bg-white border border-gray-200 hover:border-gray-300 text-gray-700 px-8 py-3.5 rounded-xl font-semibold shadow-sm hover:shadow-md transition-all duration-200 active:scale-[0.98] text-sm"
              >
                <UserPlus className="w-4 h-4" />
                Create Account
              </Link>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-4 my-8">
              <div className="flex-1 h-px bg-gray-100" />
              <span className="text-[11px] text-gray-400 font-medium uppercase tracking-wider">Why sign in?</span>
              <div className="flex-1 h-px bg-gray-100" />
            </div>

            {/* Benefits */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { icon: Sparkles, label: 'Save your favorite events' },
                { icon: HeroIcon, label: 'Submit & manage events' },
                { icon: Lock, label: 'Secure personal experience' },
              ].map((item, i) => {
                const Icon = item.icon;
                return (
                  <div key={i} className="flex flex-col items-center gap-2 py-3">
                    <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center">
                      <Icon className="w-4 h-4 text-gray-400" />
                    </div>
                    <span className="text-xs text-gray-500 text-center leading-snug">{item.label}</span>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Footer */}
    </div>
  );
}
      
