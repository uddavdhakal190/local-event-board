import React, { useState } from 'react';
import { Search, ChevronDown, ChevronUp, Mail, Phone, MapPin, MessageCircle, HelpCircle, BookOpen, Shield, Calendar, Info, Users, Settings } from 'lucide-react';
import { Link } from 'react-router';
import { motion } from 'motion/react';

const faqCategories = [
  {
    title: 'Getting Started',
    icon: BookOpen,
    faqs: [
      {
        q: 'How do I create an account?',
        a: 'Click the "Sign Up" button in the top navigation bar. Fill in your name and email address, then click "Create Account". You\'ll be logged in immediately and can start browsing and favoriting events.',
      },
      {
        q: 'Do I need an account to browse events?',
        a: 'No! You can browse and search all events without an account. However, you\'ll need to log in to save favorites or submit your own events.',
      },
      {
        q: 'How do I search for events?',
        a: 'Use the search bar on the home page or navigate to the Browse Events page. You can filter by location, date, category, and price range to find exactly what you\'re looking for.',
      },
    ],
  },
  {
    title: 'Events & Discovery',
    icon: Calendar,
    faqs: [
      {
        q: 'How do I submit an event?',
        a: 'Navigate to the "Submit Event" page from the navigation bar. Fill in your event details including title, description, date, location, and category. Once submitted, your event will be reviewed and published.',
      },
      {
        q: 'Can I edit my event after submitting?',
        a: 'Currently, event editing is not available through the platform. Please contact our support team if you need to make changes to a submitted event.',
      },
      {
        q: 'What does EventGo do exactly?',
        a: 'EventGo is an event discovery and listing platform. We help you find, browse, and share information about local events. We do not sell tickets, process payments, or handle any financial transactions. Think of us as a community-powered event board.',
      },
      {
        q: 'Are the events free to attend?',
        a: 'Pricing varies by event and is set entirely by the event organizer. Some events are free, while others display a price as an estimate. EventGo does not sell tickets or process any payments — if an event requires a ticket, you\'ll need to contact the organizer or visit their external ticketing link directly.',
      },
      {
        q: 'How do I save events I\'m interested in?',
        a: 'Click the heart icon on any event card to add it to your favorites. Access all your saved events from the "Favorites" page in the navigation bar.',
      },
    ],
  },
  {
    title: 'Account & Security',
    icon: Shield,
    faqs: [
      {
        q: 'How do I reset my password?',
        a: 'Click "Forgot Password" on the login page. Follow the 4-step verification process to reset your password securely.',
      },
      {
        q: 'Is my personal information secure?',
        a: 'We take privacy seriously. Your information is stored securely and we never share your personal data with third parties without your consent. Since we don\'t handle payments, we never collect any financial information. See our Privacy Policy for full details.',
      },
      {
        q: 'How do I log out?',
        a: 'Click on your profile avatar in the top navigation bar, then select "Log out" from the dropdown menu.',
      },
    ],
  },
  {
    title: 'Pricing & Organizer Info',
    icon: Info,
    faqs: [
      {
        q: 'Does EventGo sell tickets?',
        a: 'No. EventGo is purely an event discovery platform. We do not sell, resell, or distribute tickets of any kind. All pricing information displayed on event listings is provided by the event organizer for informational purposes only.',
      },
      {
        q: 'Does EventGo handle payments?',
        a: 'No. EventGo does not collect, store, or process any payment or financial information. If an event requires a ticket purchase, that transaction happens entirely outside of EventGo — directly with the organizer or their chosen ticketing service.',
      },
      {
        q: 'Why do some events show a price?',
        a: 'Prices shown on event cards are estimates provided by event organizers to give you an idea of the cost. They are for informational purposes only. The actual price, availability, and purchase process are managed entirely by the event organizer.',
      },
      {
        q: 'Can I get a refund through EventGo?',
        a: 'Since EventGo does not sell tickets or handle any payments, we cannot process refunds. If you purchased a ticket through an event organizer or third-party service, please contact them directly for their refund policy.',
      },
    ],
  },
];

export function HelpCenterPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [openItems, setOpenItems] = useState<Set<string>>(new Set());

  const toggleItem = (key: string) => {
    setOpenItems((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const filteredCategories = faqCategories
    .map((cat) => ({
      ...cat,
      faqs: cat.faqs.filter(
        (f) =>
          !searchQuery ||
          f.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
          f.a.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    }))
    .filter((cat) => cat.faqs.length > 0);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero */}
      <section className="relative w-full overflow-hidden bg-[#9CAFA0]">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full bg-white/[0.04]" />
          <div className="absolute -bottom-24 -left-24 w-[380px] h-[380px] rounded-full bg-white/[0.04]" />
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
        </div>
        <div className="relative pt-36 pb-20 md:pt-44 md:pb-28 px-6 flex flex-col items-center">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/15 rounded-full px-4 py-1.5 mb-5">
            <HelpCircle className="w-3.5 h-3.5 text-[#FFB070]" />
            <span className="text-xs font-medium text-white/80 tracking-wide uppercase">Support</span>
          </motion.div>
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.05 }}
            className="text-4xl md:text-[56px] font-bold tracking-tight text-white leading-[1.08] text-center mb-4">
            Help Center
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}
            className="text-white/70 text-base md:text-lg max-w-lg text-center mb-10">
            Find answers to common questions or get in touch with our support team.
          </motion.p>

          {/* Search */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.15 }}
            className="w-full max-w-xl">
            <div className="relative">
              <Search className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search for answers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/95 backdrop-blur-sm rounded-2xl pl-12 pr-5 py-4 text-sm text-gray-700 placeholder:text-gray-400 outline-none shadow-lg shadow-black/5"
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* FAQ Content */}
      <section className="flex-1 bg-[#FCFCFC] py-16 px-6">
        <div className="max-w-3xl mx-auto space-y-10">
          {filteredCategories.length === 0 && (
            <div className="text-center py-20">
              <HelpCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-gray-500 text-lg mb-2">No results found</h3>
              <p className="text-gray-400 text-sm">Try a different search term or browse the categories below.</p>
            </div>
          )}

          {filteredCategories.map((cat) => (
            <div key={cat.title}>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-9 h-9 rounded-xl bg-[#9CAFA0]/10 flex items-center justify-center">
                  <cat.icon className="w-4.5 h-4.5 text-[#9CAFA0]" />
                </div>
                <h2 className="text-lg font-bold text-gray-800">{cat.title}</h2>
              </div>
              <div className="space-y-3">
                {cat.faqs.map((faq, i) => {
                  const key = `${cat.title}-${i}`;
                  const isOpen = openItems.has(key);
                  return (
                    <div key={key} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                      <button
                        onClick={() => toggleItem(key)}
                        className="w-full flex items-center justify-between px-6 py-4.5 text-left cursor-pointer hover:bg-gray-50/50 transition-colors"
                      >
                        <span className="text-sm text-gray-700 pr-4">{faq.q}</span>
                        {isOpen ? (
                          <ChevronUp className="w-4 h-4 text-gray-400 shrink-0" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
                        )}
                      </button>
                      {isOpen && (
                        <div className="px-6 pb-5 pt-0">
                          <div className="h-px bg-gray-100 mb-4" />
                          <p className="text-sm text-gray-500 leading-relaxed">{faq.a}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Contact CTA */}
      <section className="bg-white border-t border-gray-100 py-16 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-3">Still need help?</h2>
          <p className="text-gray-500 text-sm mb-8 max-w-md mx-auto">
            Our support team is here to assist you. Reach out through any of the channels below.
          </p>
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              { icon: Mail, label: 'Email Us', detail: 'contact@eventgo.com' },
              { icon: Phone, label: 'Call Us', detail: '+358 78 465 4387' },
              { icon: MessageCircle, label: 'Live Chat', detail: 'Available 9am-5pm EET' },
            ].map(({ icon: Icon, label, detail }) => (
              <div key={label} className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                <div className="w-10 h-10 rounded-xl bg-[#9CAFA0]/10 flex items-center justify-center mx-auto mb-3">
                  <Icon className="w-5 h-5 text-[#9CAFA0]" />
                </div>
                <h4 className="text-sm font-bold text-gray-700 mb-1">{label}</h4>
                <p className="text-xs text-gray-400">{detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}