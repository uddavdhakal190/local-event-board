// Layout component - Updated with notification system
import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { Menu, X, Heart, MessageSquare, User, Calendar, LogOut, ChevronDown, Mail, ClipboardList, Save, Bell, ArrowUp, PlusCircle, FileText } from 'lucide-react';
import { useAuth } from './auth-context';
import { useFavorites } from './favorites-context';
import { supabase } from './auth-context';
import { projectId, publicAnonKey } from '/utils/supabase/info';
import { Toaster, toast } from 'sonner';
import { Footer } from './shared/footer';

const API_BASE = `https://${projectId}.supabase.co/functions/v1/make-server-ccc6c9e2`;

const navItems = [
  { label: 'Home', path: '/' },
  { label: 'Browse Event', path: '/browse' },
  { label: 'Submit Event', path: '/submit', requiresAuth: true },
  { label: 'Favorites', path: '/favorites', requiresAuth: true },
  { label: 'About', path: '/about' },
];

export function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Hide navbar on auth pages - check this BEFORE any hooks
  const isAuthPage = location.pathname === '/login' || location.pathname === '/signup' || location.pathname === '/forgot-password';
  
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [unreadMsgCount, setUnreadMsgCount] = useState(0);
  const [prevUnreadCount, setPrevUnreadCount] = useState<number | null>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [isDarkBackground, setIsDarkBackground] = useState(false);
  const { count: favCount } = useFavorites();
  const { user, isLoggedIn, isAdmin, logout } = useAuth();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const originalTitleRef = useRef<string>(document.title);

  // Close dropdown on outside click
  useEffect(() => {
    if (isAuthPage) return; // Skip if auth page
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowUserDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isAuthPage]);

  // Update page title when unread count changes
  useEffect(() => {
    if (unreadMsgCount > 0) {
      document.title = `(${unreadMsgCount}) New Message${unreadMsgCount > 1 ? 's' : ''} - EventGo`;
    } else {
      document.title = originalTitleRef.current;
    }
  }, [unreadMsgCount]);

  // Fetch unread message count with notifications
  useEffect(() => {
    if (isAuthPage || !isLoggedIn) {
      setUnreadMsgCount(0);
      setPrevUnreadCount(null);
      return;
    }
    const fetchCount = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        const token = data.session?.access_token;
        if (!token) return;
        const res = await fetch(`${API_BASE}/conversations`, {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'X-User-Token': token,
          },
        });
        const json = await res.json();
        if (json.success) {
          const newCount = json.unreadCount || 0;
          
          // Detect NEW messages (count increased)
          if (newCount > (prevUnreadCount ?? 0) && prevUnreadCount !== null) {
            const newMessages = newCount - (prevUnreadCount ?? 0);
            
            // Show toast notification
            toast.success(`${newMessages} new message${newMessages > 1 ? 's' : ''}`, {
              description: 'Click to view your messages',
              duration: 5000,
              action: {
                label: 'View',
                onClick: () => navigate('/my-messages'),
              },
            });
          }
          
          setUnreadMsgCount(newCount);
          setPrevUnreadCount(newCount);
        }
      } catch {
        // silent
      }
    };
    fetchCount();
    // Re-check every 15 seconds for more responsive notifications
    const interval = setInterval(fetchCount, 15000);
    return () => clearInterval(interval);
  }, [isLoggedIn, isAuthPage, prevUnreadCount, navigate]);

  // Scroll to top functionality
  const handleScroll = () => {
    const scrollY = window.scrollY;
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;
    
    // Show button after scrolling 200px
    if (scrollY > 200) {
      setShowScrollTop(true);
    } else {
      setShowScrollTop(false);
    }
    
    // Detect if we're near footer (dark background)
    // Footer typically starts around 80-90% of page height
    const scrollPercentage = (scrollY + windowHeight) / documentHeight;
    setIsDarkBackground(scrollPercentage > 0.85);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    if (isAuthPage) return; // Skip if auth page
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isAuthPage]);

  // Early return AFTER all hooks
  if (isAuthPage) {
    return <Outlet />;
  }

  // Filter nav items based on auth status
  const visibleNavItems = navItems.filter((item) => !item.requiresAuth || isLoggedIn);

  const handleLogout = async () => {
    try {
      await logout();
      setShowUserDropdown(false);
      setIsMobileMenuOpen(false);
      navigate('/', { replace: true });
    } catch (error) {
      console.error('Logout error:', error);
      // Force navigation even if logout fails
      setShowUserDropdown(false);
      setIsMobileMenuOpen(false);
      navigate('/', { replace: true });
    }
  };

  // Get user initials for avatar
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((w) => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="min-h-screen bg-white font-sans text-gray-900 selection:bg-[#FF9B51] selection:text-white">
      {/* Toast Notifications */}
      <Toaster 
        position="top-right" 
        toastOptions={{
          style: {
            background: 'white',
            color: '#1F2937',
            border: '1px solid #E5E7EB',
            boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)',
          },
          className: 'rounded-xl',
        }}
      />

      {/* Navbar */}
      <nav className="w-full flex justify-center py-6 px-6 md:px-12 absolute top-0 z-50">
        <div className="w-full max-w-7xl flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-1.5 group">
            <span className="text-2xl font-bold tracking-tight text-white">Event</span>
            <span className="text-2xl font-bold tracking-tight text-[#FFB070]">Go</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1 bg-white/[0.18] backdrop-blur-lg px-2 py-1.5 rounded-full border border-white/30 shadow-lg shadow-black/[0.08]">
            {visibleNavItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.label}
                  to={item.path}
                  className={`relative px-5 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-white text-gray-900 shadow-md shadow-black/[0.08]'
                      : 'text-white/80 hover:text-white hover:bg-white/15'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    {item.label}
                    {item.path === '/favorites' && favCount > 0 && (
                      <span className="min-w-[18px] h-[18px] bg-[#FF9B51] text-white text-[9px] font-bold rounded-full flex items-center justify-center leading-none px-1">
                        {favCount}
                      </span>
                    )}
                  </span>
                  {isActive && (
                    <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-7 h-1 rounded-full bg-[#FF9B51] shadow-sm shadow-orange-400/50" />
                  )}
                </Link>
              );
            })}
          </div>

          {/* Right side: Auth Button or User Menu */}
          <div className="hidden md:block">
            {isLoggedIn && user ? (
              <div ref={dropdownRef} className="relative">
                <button
                  onClick={() => setShowUserDropdown(!showUserDropdown)}
                  className="flex items-center gap-2.5 bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 px-3 py-1.5 rounded-full transition-all duration-200 shadow-lg shadow-black/[0.05]">
                  {/* Avatar */}
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#FF9B51] to-[#FFB070] flex items-center justify-center text-white text-xs font-bold shadow-sm">
                    {getInitials(user.name)}
                  </div>
                  <span className="text-sm font-medium text-white max-w-[100px] truncate">
                    {user.name}
                  </span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-white/60 transition-transform duration-200 ${
                      showUserDropdown ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {/* Dropdown */}
                {showUserDropdown && (
                  <div
                    className="absolute right-0 top-full mt-2.5 w-64 bg-white rounded-2xl border border-gray-100 shadow-2xl shadow-black/12 overflow-hidden z-50"
                  >
                    {/* User info */}
                    <div className="p-4 border-b border-gray-100 bg-gray-50/50">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#FF9B51] to-[#FFB070] flex items-center justify-center text-white text-sm font-bold shadow-sm">
                          {getInitials(user.name)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-gray-900 truncate">{user.name}</p>
                          <p className="text-xs text-gray-500 truncate">{user.email}</p>
                        </div>
                      </div>
                    </div>

                    {/* Menu items */}
                    <div className="py-1.5">
                      <Link
                        to="/favorites"
                        onClick={() => setShowUserDropdown(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <Heart className="w-4 h-4 text-gray-400" />
                        My Favorites
                        {favCount > 0 && (
                          <span className="ml-auto w-5 h-5 bg-[#FF9B51] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                            {favCount}
                          </span>
                        )}
                      </Link>
                      <Link
                        to="/my-rsvps"
                        onClick={() => setShowUserDropdown(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        My RSVPs
                      </Link>
                      <Link
                        to="/submit"
                        onClick={() => setShowUserDropdown(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <PlusCircle className="w-4 h-4 text-gray-400" />
                        Submit Event
                      </Link>
                      <Link
                        to="/my-events"
                        onClick={() => setShowUserDropdown(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <FileText className="w-4 h-4 text-gray-400" />
                        Submitted Events
                      </Link>
                      <Link
                        to="/my-drafts"
                        onClick={() => setShowUserDropdown(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <Save className="w-4 h-4 text-gray-400" />
                        My Drafts
                      </Link>
                      <Link
                        to="/my-messages"
                        onClick={() => setShowUserDropdown(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <MessageSquare className="w-4 h-4 text-gray-400" />
                        My Messages
                        {unreadMsgCount > 0 && (
                          <span className="ml-auto w-5 h-5 bg-[#FF9B51] text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                            {unreadMsgCount}
                          </span>
                        )}
                      </Link>
                    </div>

                    {/* Logout */}
                    <div className="border-t border-gray-100 py-1.5">
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors w-full"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/login"
                className="bg-white/90 hover:bg-white active:bg-gray-100 text-gray-900 px-6 py-2.5 rounded-full text-sm font-semibold shadow-lg shadow-black/[0.08] hover:shadow-xl transition-all duration-200 active:scale-95 inline-block"
              >
                Login
              </Link>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <div className="md:hidden text-white">
            <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
              {isMobileMenuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="absolute top-20 left-4 right-4 bg-white p-6 shadow-2xl shadow-black/10 z-50 flex flex-col gap-1 md:hidden rounded-2xl border border-gray-100">
            {/* User info (mobile) */}
            {isLoggedIn && user && (
              <div className="flex items-center gap-3 pb-4 mb-2 border-b border-gray-100">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FF9B51] to-[#FFB070] flex items-center justify-center text-white text-sm font-bold shadow-sm">
                  {getInitials(user.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900 truncate">{user.name}</p>
                  <p className="text-xs text-gray-500 truncate">{user.email}</p>
                </div>
              </div>
            )}

            {visibleNavItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.label}
                  to={item.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`py-3 px-4 rounded-xl font-medium transition-all duration-200 flex items-center justify-between ${
                    isActive
                      ? 'bg-[#9CAFA0]/10 text-[#7A8E80]'
                      : 'text-gray-800 hover:bg-gray-50'
                  }`}
                >
                  {item.label}
                  {item.path === '/favorites' && favCount > 0 && (
                    <span className="w-5 h-5 bg-[#FF9B51] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                      {favCount}
                    </span>
                  )}
                </Link>
              );
            })}

            {isLoggedIn && (
              <Link
                to="/my-messages"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`py-3 px-4 rounded-xl font-medium transition-all duration-200 flex items-center justify-between ${
                  location.pathname === '/my-messages'
                    ? 'bg-[#9CAFA0]/10 text-[#7A8E80]'
                    : 'text-gray-800 hover:bg-gray-50'
                }`}
              >
                <span className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-gray-400" />
                  My Messages
                </span>
                {unreadMsgCount > 0 && (
                  <span className="w-5 h-5 bg-[#FF9B51] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {unreadMsgCount}
                  </span>
                )}
              </Link>
            )}

            {isLoggedIn && (
              <Link
                to="/my-drafts"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`py-3 px-4 rounded-xl font-medium transition-all duration-200 flex items-center gap-2 ${
                  location.pathname === '/my-drafts'
                    ? 'bg-[#9CAFA0]/10 text-[#7A8E80]'
                    : 'text-gray-800 hover:bg-gray-50'
                }`}
              >
                <Save className="w-4 h-4 text-gray-400" />
                My Drafts
              </Link>
            )}

            {isLoggedIn ? (
              <button
                onClick={handleLogout}
                className="flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 w-full py-3 rounded-xl font-bold mt-3 text-center transition-all duration-200 active:scale-[0.98]"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            ) : (
              <Link
                to="/login"
                onClick={() => setIsMobileMenuOpen(false)}
                className="bg-gray-900 hover:bg-gray-800 active:bg-gray-700 text-white w-full py-3 rounded-xl font-bold mt-3 text-center transition-all duration-200 active:scale-[0.98] block"
              >
                Login
              </Link>
            )}
          </div>
        )}
      </nav>

      <Outlet />

      {/* Scroll to top button */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className={`fixed bottom-6 right-6 md:bottom-10 md:right-10 z-40 bg-white/20 hover:bg-gradient-to-br hover:from-[#FF9B51] hover:to-[#FFB070] backdrop-blur-lg w-12 h-12 md:w-14 md:h-14 rounded-full shadow-lg shadow-black/10 hover:shadow-2xl hover:shadow-orange-500/40 transition-all duration-300 hover:scale-110 active:scale-95 flex items-center justify-center group border border-white/30 ${
            isDarkBackground ? 'text-white' : 'text-gray-900'
          }`}
          aria-label="Scroll to top"
        >
          <ArrowUp className="w-5 h-5 md:w-6 md:h-6 group-hover:translate-y-[-2px] group-hover:text-white transition-all duration-200" />
        </button>
      )}

      <Footer />
    </div>
  );
}
