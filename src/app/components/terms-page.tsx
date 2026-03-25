import React from 'react';
import { FileText, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';

const sections = [
  {
    title: '1. Acceptance of Terms',
    content: `By accessing and using EventGo ("the Platform"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services. We reserve the right to update these terms at any time, and your continued use of the Platform constitutes acceptance of any changes.`,
  },
  {
    title: '2. About Our Service',
    content: `EventGo is an event discovery and listing platform. We help users find, browse, and share information about local events. EventGo does not sell tickets, process payments, or act as an intermediary for any financial transactions. All ticket purchases, registrations, and payments — if applicable — are handled entirely by the event organizers or their designated third-party services. EventGo bears no responsibility for any transactions conducted outside our Platform.`,
  },
  {
    title: '3. User Accounts',
    content: `To access certain features of the Platform — such as saving favorites or submitting event listings — you may need to create an account. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree to provide accurate and complete information when creating your account and to update it as necessary.`,
  },
  {
    title: '4. Event Listings & Accuracy',
    content: `Event organizers and community members are responsible for the accuracy of their event listings, including descriptions, dates, locations, and any pricing or registration details. EventGo serves as an informational platform only and does not verify, endorse, or guarantee the accuracy, completeness, or reliability of any event information. We are not liable for errors, cancellations, schedule changes, or any other discrepancies in event listings. We reserve the right to remove or modify listings that violate our policies or applicable laws.`,
  },
  {
    title: '5. No Ticket Sales or Payment Processing',
    content: `EventGo does not sell, resell, or distribute tickets of any kind. We do not collect, store, or process any payment or financial information from users. If an event listing includes a price, registration link, or ticketing information, those details are provided by the event organizer and any resulting transactions occur entirely outside of EventGo. We are not a party to any agreement between you and an event organizer, and we assume no responsibility for the quality, safety, legality, or fulfillment of any event or transaction.`,
  },
  {
    title: '6. User Conduct',
    content: `You agree not to use the Platform for any unlawful purpose or in any way that could damage, disable, or impair the service. Prohibited activities include but are not limited to: posting false, misleading, or fraudulent event information; impersonating event organizers; harassing other users; attempting to gain unauthorized access to the Platform; and using automated systems to scrape or collect data without permission.`,
  },
  {
    title: '7. User-Submitted Content',
    content: `When you submit an event listing or other content to EventGo, you retain ownership of that content but grant us a non-exclusive, royalty-free license to display, distribute, and promote it on the Platform. You represent that you have the right to share any content you submit, and that it does not infringe on any third party's intellectual property or other rights.`,
  },
  {
    title: '8. Intellectual Property',
    content: `All Platform content — including text, graphics, logos, design elements, and software — is the property of EventGo or its content suppliers and is protected by copyright, trademark, and other intellectual property laws. You may not reproduce, distribute, or create derivative works from any Platform content without prior written permission. Event listing content remains the property of its respective submitters.`,
  },
  {
    title: '9. Third-Party Links & Services',
    content: `The Platform may contain links to third-party websites, ticketing platforms, or services that are not owned or controlled by EventGo. These links are provided for convenience only. We have no control over and assume no responsibility for the content, privacy policies, practices, or availability of any third-party sites or services. Your use of third-party services is at your own risk and subject to those services' own terms and policies.`,
  },
  {
    title: '10. Disclaimer of Warranties',
    content: `EventGo is provided on an "as is" and "as available" basis. We make no warranties, express or implied, regarding the Platform's reliability, availability, accuracy, or fitness for a particular purpose. We do not warrant that event information is current, complete, or error-free. We do not guarantee the quality, safety, or legality of any events listed on the Platform.`,
  },
  {
    title: '11. Limitation of Liability',
    content: `To the fullest extent permitted by law, EventGo and its team members shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the Platform, attendance at any listed event, or any transaction with an event organizer. This includes, without limitation, damages for personal injury, property damage, lost profits, or loss of data.`,
  },
  {
    title: '12. Termination',
    content: `We reserve the right to suspend or terminate your account and access to the Platform at our sole discretion, without notice, for conduct that we believe violates these Terms of Service, is harmful to other users or third parties, or for any other reason we deem necessary to protect the integrity of the Platform.`,
  },
  {
    title: '13. Governing Law',
    content: `These Terms of Service shall be governed by and construed in accordance with the laws of Finland, without regard to its conflict of law provisions. Any disputes arising from these terms shall be resolved in the courts of Kokkola, Finland.`,
  },
  {
    title: '14. Contact',
    content: `If you have questions about these Terms of Service, please contact us at contact@eventgo.com or call +358 78 465 4387. Our mailing address is EventGo, Kokkola, Finland.`,
  },
];

export function TermsPage() {
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
            <FileText className="w-3.5 h-3.5 text-[#FFB070]" />
            <span className="text-xs font-medium text-white/80 tracking-wide uppercase">Legal</span>
          </motion.div>
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.05 }}
            className="text-4xl md:text-[56px] font-bold tracking-tight text-white leading-[1.08] text-center mb-4">
            Terms of Service
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
              Welcome to EventGo. These Terms of Service govern your use of our event discovery and listing platform. EventGo is an informational service only — we do not sell tickets, process payments, or facilitate any financial transactions. Please read these terms carefully before using EventGo.
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