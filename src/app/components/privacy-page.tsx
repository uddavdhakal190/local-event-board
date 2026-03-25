import React from 'react';
import { Shield } from 'lucide-react';
import { motion } from 'motion/react';

const sections = [
  {
    title: '1. Information We Collect',
    content: `We collect limited information that you provide directly when using EventGo, including your name and email address when creating an account, and any event-related data you submit through our listing forms (such as event titles, descriptions, dates, and locations). We also automatically collect certain technical information such as your browser type, device information, IP address, and general usage patterns when you interact with our Platform. We do not collect any financial, payment, or billing information, as EventGo does not process any transactions.`,
  },
  {
    title: '2. Information We Do Not Collect',
    content: `EventGo does not sell tickets or handle payments of any kind. As a result, we never collect, store, or process credit card numbers, bank account details, billing addresses, or any other financial or payment information. If you are redirected to a third-party ticketing or payment service through an event listing, that service's own privacy policy applies — not ours.`,
  },
  {
    title: '3. How We Use Your Information',
    content: `We use the information we collect to: provide, maintain, and improve the EventGo platform; manage your account and personalize your experience (e.g., saved favorites); display and promote event listings you submit; communicate with you about platform updates and relevant events; analyze general usage trends to improve our service; and ensure the security and integrity of our Platform.`,
  },
  {
    title: '4. Information Sharing',
    content: `We do not sell, trade, or rent your personal information to third parties. We may share limited information in the following circumstances: with service providers who assist in operating our Platform (e.g., hosting providers), subject to confidentiality agreements; when required by law, regulation, or legal process; to protect the rights, property, or safety of EventGo, our users, or the public. Event listings you submit are publicly visible on the Platform by design.`,
  },
  {
    title: '5. Data Storage & Security',
    content: `Your data is stored securely using industry-standard encryption and security measures. We implement appropriate technical and organizational safeguards to protect your personal information against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the internet or electronic storage is 100% secure, and we cannot guarantee absolute security.`,
  },
  {
    title: '6. Cookies & Local Storage',
    content: `We use cookies and browser local storage to enhance your experience. This includes remembering your login session, storing your saved favorites locally on your device, and analyzing general usage patterns. Essential cookies are required for the Platform to function properly. You can control cookie preferences through your browser settings, though some features may not work correctly if cookies are disabled.`,
  },
  {
    title: '7. Your Rights',
    content: `You have the right to: access the personal information we hold about you; request correction of inaccurate information; request deletion of your account and associated data; object to certain processing activities; withdraw consent where applicable; and request a portable copy of your data. To exercise any of these rights, contact us using the details provided below.`,
  },
  {
    title: '8. Data Retention',
    content: `We retain your personal information only for as long as necessary to fulfill the purposes outlined in this policy — primarily to maintain your account and provide our services — or as required by law. When your data is no longer needed (for example, if you delete your account), it is securely deleted or anonymized within a reasonable timeframe.`,
  },
  {
    title: '9. Third-Party Services',
    content: `Event listings on EventGo may contain links to external websites, ticketing platforms, or registration services operated by event organizers or other third parties. We have no control over and are not responsible for the privacy practices of these external services. We encourage you to review the privacy policies of any third-party service before providing them with your personal information.`,
  },
  {
    title: '10. Children\'s Privacy',
    content: `Our Platform is not intended for children under the age of 16. We do not knowingly collect personal information from children. If you believe we have inadvertently collected such information, please contact us immediately and we will take steps to delete it promptly.`,
  },
  {
    title: '11. International Transfers',
    content: `Your information may be transferred to and processed in countries other than your country of residence. We ensure that appropriate safeguards are in place to protect your data in compliance with applicable data protection laws, including the EU General Data Protection Regulation (GDPR).`,
  },
  {
    title: '12. Changes to This Policy',
    content: `We may update this Privacy Policy from time to time to reflect changes in our practices or applicable laws. We will notify you of any material changes by posting the updated policy on this page and revising the "Last updated" date. Your continued use of the Platform after changes are posted constitutes acceptance of the updated policy.`,
  },
  {
    title: '13. Contact Us',
    content: `If you have any questions, concerns, or requests regarding this Privacy Policy or how we handle your data, please contact us at contact@eventgo.com, call +358 78 465 4387, or write to us at EventGo, Kokkola, Finland.`,
  },
];

export function PrivacyPage() {
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
            <Shield className="w-3.5 h-3.5 text-[#FFB070]" />
            <span className="text-xs font-medium text-white/80 tracking-wide uppercase">Legal</span>
          </motion.div>
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.05 }}
            className="text-4xl md:text-[56px] font-bold tracking-tight text-white leading-[1.08] text-center mb-4">
            Privacy Policy
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}
            className="text-white/70 text-base md:text-lg max-w-lg text-center">
            Last updated: February 1, 2026
          </motion.p>
        </div>
      </section>

      {/* Content */}
      <section className="flex-1 bg-[#FCFCFC] py-16 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 md:p-12 space-y-8">
            <p className="text-sm text-gray-500 leading-relaxed">
              At EventGo, we are committed to protecting your privacy. EventGo is an event discovery and listing platform — we do not sell tickets, process payments, or handle any financial transactions. This Privacy Policy explains what limited information we collect, how we use it, and how we protect it when you use our platform.
            </p>
            {sections.map((section) => (
              <div key={section.title}>
                <h2 className="text-base font-bold text-gray-800 mb-3">{section.title}</h2>
                <p className="text-sm text-gray-500 leading-relaxed">{section.content}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}