import React from 'react';
import {
  Sparkles,
  Heart,
  MapPin,
  Users,
  Globe,
  Target,
  Lightbulb,
  Shield,
  ArrowRight,
  Calendar,
  Zap,
  Star,
  Mail,
  Phone,
  Facebook,
  Instagram,
  Twitter,
  Linkedin,
  Github,
  Palette,
  TestTube,
  Server,
  Database,
} from 'lucide-react';
import { motion } from 'motion/react';
import { Link } from 'react-router';

/* ──────────────────────────────────────────────────── */
/*  Team data                                           */
/* ──────────────────────────────────────────────────── */

const team = [
  {
    name: 'Nur Ahammad Niloy',
      linkedinUrl: 'https://www.linkedin.com/in/nur-ahammad-niloy-472a52218/',
      githubUrl: 'https://github.com/NurAhammadNiloy',
      role: 'UI/UX Designer',
    desc: 'Crafts every pixel with purpose — from wireframes to polished interfaces that feel effortless and look stunning.',
    icon: Palette,
    accent: 'from-[#FF9B51] to-[#FFB070]',
    accentLight: 'bg-orange-50 text-[#FF9B51]',
    avatarGradient: 'from-[#FF9B51] to-[#FFB070]',
  },
  {
    name: 'Tahbir Moon',
      linkedinUrl: '#',
      githubUrl: '#',
      role: 'Quality Assurance Tester',
    desc: 'Ensures every feature is bulletproof — rigorously testing edge cases so users never have to encounter a bug.',
    icon: TestTube,
    accent: 'from-[#9CAFA0] to-[#7A8E80]',
    accentLight: 'bg-[#9CAFA0]/10 text-[#7A8E80]',
    avatarGradient: 'from-[#9CAFA0] to-[#7A8E80]',
  },
  {
    name: 'Md Rashedul Islam',
      linkedinUrl: 'https://www.linkedin.com/in/md-rasedul-islam-b88153247?utm_source=share_via&utm_content=profile&utm_medium=member_android',
      githubUrl: 'https://github.com/rashed-22',
      role: 'Backend Developer',
    desc: 'Architects the APIs and server logic that power every interaction — fast, secure, and built to scale.',
    icon: Server,
    accent: 'from-indigo-500 to-blue-500',
    accentLight: 'bg-indigo-50 text-indigo-600',
    avatarGradient: 'from-indigo-500 to-blue-500',
  },
  {
    name: 'Uddhav Dhakal',
      linkedinUrl: 'https://www.linkedin.com/in/ud4uddav',
      githubUrl: 'https://github.com/uddavdhakal190',
      role: 'Database Engineer',
    desc: 'Designs and optimizes the data layer — making sure every query is lightning-fast and every record is safe.',
    icon: Database,
    accent: 'from-emerald-500 to-teal-500',
    accentLight: 'bg-emerald-50 text-emerald-600',
    avatarGradient: 'from-emerald-500 to-teal-500',
  },
];

/* ──────────────────────────────────────────────────── */
/*  Stats                                               */
/* ──────────────────────────────────────────────────── */

const stats = [
  { value: '10K+', label: 'Events Hosted', icon: Calendar },
  { value: '50K+', label: 'Active Users', icon: Users },
  { value: '120+', label: 'Cities Covered', icon: Globe },
  { value: '4.9', label: 'User Rating', icon: Star },
];

/* ──────────────────────────────────────────────────── */
/*  Values                                              */
/* ──────────────────────────────────────────────────── */

const values = [
  {
    icon: Heart,
    title: 'Community First',
    desc: 'We believe every great event starts with people. Our platform is built to foster genuine human connection.',
    color: 'text-red-500 bg-red-50',
  },
  {
    icon: Lightbulb,
    title: 'Thoughtful Design',
    desc: 'Every detail is intentional. We obsess over the little things so discovering events feels effortless.',
    color: 'text-amber-500 bg-amber-50',
  },
  {
    icon: Shield,
    title: 'Trust & Safety',
    desc: 'Verified organizers, transparent pricing, and secure data handling you can count on.',
    color: 'text-blue-500 bg-blue-50',
  },
  {
    icon: Zap,
    title: 'Built for Speed',
    desc: 'Blazing fast search, instant filters, and a seamless experience on every device.',
    color: 'text-emerald-500 bg-emerald-50',
  },
];

/* ──────────────────────────────────────────────────── */
/*  Section heading                                     */
/* ──────────────────────────────────────────────────── */

function SectionHeading({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-14 text-center">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.5 }}
      >
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight">{title}</h2>
        {subtitle && <p className="mt-3 text-gray-500 text-base max-w-lg mx-auto">{subtitle}</p>}
      </motion.div>
    </div>
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

/* ──────────────────────────────────────────────────── */
/*  Main page                                           */
/* ──────────────────────────────────────────────────── */

export function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* ── Hero ── */}
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
            <span className="text-xs font-medium text-white/80 tracking-wide uppercase">Our Story</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.05 }}
            className="text-4xl md:text-[56px] font-bold tracking-tight text-white leading-[1.08] text-center mb-4"
          >
            About <span className="text-[#FFB070]">EventGo</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-lg text-white/60 max-w-lg mx-auto text-center"
          >
            Building the bridge between people and unforgettable experiences
          </motion.p>
        </div>

        {/* Wave divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 60" fill="none" className="w-full" preserveAspectRatio="none">
            <path d="M0 60V30C240 0 480 0 720 30C960 60 1200 60 1440 30V60H0Z" fill="#FCFCFC" />
          </svg>
        </div>
      </section>

      {/* ── Mission section ── */}
      <section className="bg-[#FCFCFC] py-28 px-6 md:px-12">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Text */}
            <motion.div
              initial={{ opacity: 0, x: -24 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.5 }}
            >
              <div className="inline-flex items-center gap-2 bg-[#9CAFA0]/10 rounded-full px-4 py-1.5 mb-5">
                <Target className="w-3.5 h-3.5 text-[#9CAFA0]" />
                <span className="text-xs font-semibold text-[#7A8E80] uppercase tracking-wide">Our Mission</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight mb-6 leading-tight">
                Making every event<br />
                <span className="text-[#FF9B51]">discoverable</span>
              </h2>
              <p className="text-gray-500 leading-relaxed mb-5">
                EventGo was born from a simple idea: too many incredible local events go unnoticed. Whether it's a jazz night in Helsinki, a food festival in Turku, or a community yoga session in the park — we believe every event deserves an audience.
              </p>
              <p className="text-gray-500 leading-relaxed mb-8">
                We built EventGo as a platform that connects event organizers with people looking for their next great experience. Our focus is on beautiful design, effortless discovery, and a community-driven approach that puts people first.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  to="/browse"
                  className="group inline-flex items-center gap-2 bg-[#FF9B51] hover:bg-[#E88A3E] text-white px-7 py-3.5 rounded-xl font-semibold shadow-lg shadow-orange-500/15 hover:shadow-orange-500/25 transition-all duration-200 active:scale-[0.98] text-sm"
                >
                  Explore Events
                  <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                </Link>
                <Link
                  to="/submit"
                  className="inline-flex items-center gap-2 bg-white border border-gray-200 hover:border-gray-300 text-gray-700 px-7 py-3.5 rounded-xl font-semibold shadow-sm hover:shadow-md transition-all duration-200 active:scale-[0.98] text-sm"
                >
                  Submit Your Event
                </Link>
              </div>
            </motion.div>

            {/* Stats grid */}
            <motion.div
              initial={{ opacity: 0, x: 24 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="grid grid-cols-2 gap-5"
            >
              {stats.map((stat, i) => {
                const Icon = stat.icon;
                return (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: 0.15 + i * 0.08 }}
                    className="bg-white rounded-3xl border border-gray-100/80 p-7 text-center hover:shadow-xl hover:shadow-black/5 hover:-translate-y-1 transition-all duration-500"
                    style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.03)' }}
                  >
                    <div className="w-12 h-12 rounded-2xl bg-[#9CAFA0]/10 flex items-center justify-center mx-auto mb-4">
                      <Icon className="w-5 h-5 text-[#9CAFA0]" />
                    </div>
                    <div className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</div>
                    <div className="text-sm text-gray-500">{stat.label}</div>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Values section ── */}
      <section className="relative bg-[#F4F7F5] py-28 px-6 md:px-12 overflow-hidden">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] rounded-full bg-[#9CAFA0]/5 -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] rounded-full bg-[#FF9B51]/5 translate-y-1/2 -translate-x-1/2 pointer-events-none" />

        <div className="relative max-w-6xl mx-auto">
          <SectionHeading title="What We Stand For" subtitle="The principles that guide every decision we make" />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((v, i) => {
              const Icon = v.icon;
              return (
                <motion.div
                  key={v.title}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-60px' }}
                  transition={{ duration: 0.45, delay: i * 0.08 }}
                  className="bg-white rounded-3xl border border-gray-100/80 p-7 hover:shadow-xl hover:shadow-black/5 hover:-translate-y-1.5 transition-all duration-500"
                  style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.03)' }}
                >
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-5 ${v.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold text-gray-900 mb-2">{v.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{v.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Team section ── */}
      <section className="bg-[#FCFCFC] py-28 px-6 md:px-12">
        <div className="max-w-6xl mx-auto">
          <SectionHeading title="Meet the Team" subtitle="The talented people behind EventGo" />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-7">
            {team.map((member, i) => {
              const RoleIcon = member.icon;
              return (
                <motion.div
                  key={member.name}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-60px' }}
                  transition={{ duration: 0.45, delay: i * 0.1, ease: [0.25, 0.46, 0.45, 0.94] }}
                  className="group bg-white rounded-3xl overflow-hidden border border-gray-100/80 hover:shadow-2xl hover:shadow-black/8 hover:-translate-y-2 transition-all duration-500"
                  style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.03)' }}
                >
                  {/* Image */}
                  <div className={`relative h-56 overflow-hidden bg-gradient-to-br ${member.avatarGradient} flex items-center justify-center`}>
                    {/* Decorative floating shapes */}
                    <div className="absolute inset-0 pointer-events-none overflow-hidden">
                      <div className="absolute -top-8 -right-8 w-28 h-28 rounded-full bg-white/[0.07]" />
                      <div className="absolute -bottom-6 -left-6 w-20 h-20 rounded-full bg-white/[0.06]" />
                      <div className="absolute top-1/4 right-1/4 w-10 h-10 rounded-full bg-white/[0.05]" />
                    </div>

                    {/* Subtle dot pattern */}
                    <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '24px 24px' }} />

                    {/* Avatar circle with ring */}
                    <div className="relative flex items-center justify-center">
                      <div className="absolute w-[108px] h-[108px] rounded-full border border-white/15 group-hover:scale-110 transition-transform duration-700" />
                      <div className="w-[88px] h-[88px] rounded-full bg-white/15 backdrop-blur-md border border-white/25 flex items-center justify-center shadow-xl shadow-black/10 group-hover:scale-105 group-hover:bg-white/20 transition-all duration-500">
                        <span className="text-[28px] font-bold text-white drop-shadow-sm">
                          {member.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </span>
                      </div>
                    </div>

                    {/* Gradient bar at top */}
                    <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${member.accent}`} />

                    {/* Role badge */}
                    <div className="absolute top-3.5 left-3.5">
                      <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1.5 rounded-full backdrop-blur-md bg-white/90 shadow-sm ${member.accentLight}`}>
                        <RoleIcon className="w-3 h-3" />
                        {member.role.split(' ')[0]}
                      </span>
                    </div>

                    {/* Social links */}
                    <div className="absolute z-10 bottom-3.5 right-3.5 flex gap-1.5 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                        <a
                          href={member.linkedinUrl || '#'}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={member.name + ' LinkedIn'}
                          className="w-7 h-7 rounded-full bg-white/90 backdrop-blur-md flex items-center justify-center text-gray-600 hover:text-[#0077B5] shadow-sm transition-colors duration-200"
                        >
                          <Linkedin className="w-3 h-3" />
                        </a>
                        <a
                          href={member.githubUrl || '#'}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={member.name + ' GitHub'}
                          className="w-7 h-7 rounded-full bg-white/90 backdrop-blur-md flex items-center justify-center text-gray-600 hover:text-gray-900 shadow-sm transition-colors duration-200"
                        >
                          <Github className="w-3 h-3" />
                        </a>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-5 pt-5">
                    <h3 className="text-[16px] font-bold text-gray-900 mb-0.5 group-hover:text-[#7A8E80] transition-colors duration-300">
                      {member.name}
                    </h3>
                    <p className={`text-[11px] font-semibold mb-2.5 uppercase tracking-wide ${member.accentLight.split(' ')[1] || 'text-gray-500'}`}>
                      {member.role}
                    </p>
                    <p className="text-[13px] text-gray-500 leading-relaxed">{member.desc}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── CTA section ── */}
      <section className="relative bg-[#9CAFA0] py-28 px-6 md:px-12 overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full bg-white/[0.04]" />
          <div className="absolute -bottom-24 -left-24 w-[380px] h-[380px] rounded-full bg-white/[0.04]" />
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
              backgroundSize: '28px 28px',
            }}
          />
        </div>

        <div className="relative max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl md:text-5xl font-bold text-white tracking-tight mb-5 leading-tight">
              Ready to discover your<br />next <span className="text-[#FFB070]">experience</span>?
            </h2>
            <p className="text-white/60 text-lg mb-10 max-w-md mx-auto">
              Join thousands of people finding amazing events every day
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link
                to="/browse"
                className="group inline-flex items-center gap-2 bg-white text-gray-900 px-8 py-4 rounded-xl font-semibold shadow-xl shadow-black/10 hover:shadow-2xl hover:shadow-black/15 transition-all duration-200 active:scale-[0.98] text-sm"
              >
                Browse Events
                <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5" />
              </Link>
              <Link
                to="/submit"
                className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 text-white px-8 py-4 rounded-xl font-semibold hover:bg-white/20 transition-all duration-200 active:scale-[0.98] text-sm"
              >
                Submit an Event
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
    </div>
  );
}      


