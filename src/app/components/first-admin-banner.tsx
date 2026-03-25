import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Crown, X, Sparkles } from 'lucide-react';
import { useAuth } from './auth-context';
import { useNavigate } from 'react-router';

export function FirstAdminBanner() {
  const { isLoggedIn, isAdmin, noAdminExists, claimAdmin, checkAdminExists } = useAuth();
  const [showBanner, setShowBanner] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Only show if logged in, not admin, and no admin exists
    if (isLoggedIn && !isAdmin) {
      checkAdminExists().then((exists) => {
        if (!exists) {
          setShowBanner(true);
        }
      });
    } else {
      setShowBanner(false);
    }
  }, [isLoggedIn, isAdmin, checkAdminExists]);

  const handleClaimAdmin = async () => {
    setIsClaiming(true);
    const result = await claimAdmin();
    setIsClaiming(false);
    
    if (!result.error) {
      // On success, navigate to admin panel after a short delay
      setTimeout(() => {
        navigate('/admin');
      }, 1000);
    }
  };

  if (!showBanner) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="fixed top-4 left-4 right-4 md:left-auto md:right-4 md:max-w-md z-[60]"
      >
        <div className="bg-gradient-to-r from-[#9CAFA0] via-[#9CAFA0] to-[#8FA297] rounded-2xl border border-white/20 shadow-2xl shadow-black/15 overflow-hidden relative">
          {/* Shimmer effect */}
          <div 
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none" 
            style={{ 
              backgroundSize: '200% 100%',
              animation: 'shimmer 3s infinite'
            }} 
          />
          
          <div className="relative p-5">
            <button
              onClick={() => setShowBanner(false)}
              className="absolute top-3 right-3 w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm flex items-center justify-center text-white/70 hover:text-white transition-all"
            >
              <X className="w-3.5 h-3.5" />
            </button>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#FFB070] to-[#FF9B51] flex items-center justify-center shrink-0 shadow-lg shadow-orange-500/20">
                <Crown className="w-6 h-6 text-white" />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-base font-bold text-white leading-tight">Become the First Admin!</h3>
                  <Sparkles className="w-3.5 h-3.5 text-[#FFB070] animate-pulse" />
                </div>
                <p className="text-sm text-white/80 leading-relaxed mb-4">
                  You're the first user! Claim admin privileges to manage events, users, and messages.
                </p>
                
                <button
                  onClick={handleClaimAdmin}
                  disabled={isClaiming}
                  className="w-full bg-white/90 hover:bg-white text-[#8FA297] px-4 py-2.5 rounded-xl font-bold text-sm shadow-lg transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {isClaiming ? (
                    <>
                      <div className="w-4 h-4 border-2 border-[#8FA297]/30 border-t-[#8FA297] rounded-full animate-spin" />
                      Claiming...
                    </>
                  ) : (
                    <>
                      <Crown className="w-4 h-4" />
                      Claim Admin Access
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
