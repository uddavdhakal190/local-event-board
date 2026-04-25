import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  MessageSquare,
  Send,
  ArrowLeft,
  Inbox,
  RefreshCw,
  Calendar,
  User,
  Mail,
  Phone,
  MapPin,
  Facebook,
  Instagram,
  Twitter,
  ChevronRight,
  Circle,
  CheckCheck,
  Loader,
  ArrowRight,
  Search,
  X,
  Trash2,
  Archive,
  ArchiveRestore,
  MoreVertical,
  AlertTriangle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router';
import { useAuth } from './auth-context';
import { LoginRequired } from './login-required';
import { supabase } from './auth-context';

interface Reply {
  id: string;
  senderId: string | null;
  senderName: string;
  senderEmail: string;
  message: string;
  createdAt: string;
  isInitialMessage?: boolean;
}

interface Conversation {
  id: string;
  eventId: string | null;
  eventTitle: string | null;
  organizerUserId: string | null;
  organizerEmail: string | null;
  senderUserId: string | null;
  senderName: string;
  senderEmail: string;
  subject: string;
  message: string;
  createdAt: string;
  status: string;
  replies: Reply[];
  lastReplyAt?: string;
  lastReplyBy?: string;
  _otherName: string;
  _isSender: boolean;
  _isOrganizer: boolean;
  _lastReply: Reply | null;
  _hasUnread: boolean;
}

/* ── Confirmation Modal ── */
function ConfirmModal({ open, title, description, confirmLabel, confirmColor, onConfirm, onCancel, loading }: {
  open: boolean; title: string; description: string; confirmLabel: string; confirmColor?: string;
  onConfirm: () => void; onCancel: () => void; loading?: boolean;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancel} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl"
      >
        <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-6 h-6 text-red-500" />
        </div>
        <h3 className="text-base font-bold text-gray-900 text-center mb-2">{title}</h3>
        <p className="text-sm text-gray-500 text-center mb-6 leading-relaxed">{description}</p>
        <div className="flex gap-3">
          <button onClick={onCancel} disabled={loading} className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
            Cancel
          </button>
          <button onClick={onConfirm} disabled={loading} className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all active:scale-[0.98] ${confirmColor || 'bg-red-500 hover:bg-red-600'}`}>
            {loading ? <Loader className="w-4 h-4 animate-spin mx-auto" /> : confirmLabel}
          </button>
        </div>
      </motion.div>
    </div>
  );
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
              <p className="text-gray-400 text-sm leading-relaxed max-w-xs">Discover and share amazing events across the world.</p>
              <div className="flex gap-3 pt-2">
                {[{ icon: Facebook, bg: 'bg-blue-600/10 hover:bg-blue-600/20 text-blue-400' }, { icon: Instagram, bg: 'bg-pink-600/10 hover:bg-pink-600/20 text-pink-400' }, { icon: Twitter, bg: 'bg-sky-500/10 hover:bg-sky-500/20 text-sky-400' }].map(({ icon: Icon, bg }, i) => (
                  <a key={i} href="#" className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors duration-200 ${bg}`}><Icon className="w-4 h-4" /></a>
                ))}
              </div>
            </div>
            <div className="md:col-span-3 md:pl-8">
              <h4 className="text-[#FF9B51] font-bold text-xs uppercase tracking-widest mb-6">Quick Links</h4>
              <ul className="space-y-3.5">
                {[{ label: 'Browse Events', path: '/browse' }, { label: 'Submit Event', path: '/submit' }, { label: 'Help Center', path: '/help' }].map((item) => (
                  <li key={item.label}><Link to={item.path} className="text-gray-400 hover:text-white transition-colors text-sm">{item.label}</Link></li>
                ))}
              </ul>
            </div>
            <div className="md:col-span-4">
              <h4 className="text-[#FF9B51] font-bold text-xs uppercase tracking-widest mb-6">Contact Us</h4>
              <ul className="space-y-4">
                {[{ icon: Mail, text: 'contact@localeventboard.com' }, { icon: Phone, text: '+358 78 465 4387' }, { icon: MapPin, text: 'Kokkola, Finland' }].map(({ icon: Icon, text }) => (
                  <li key={text} className="flex items-center gap-3 text-gray-400 text-sm"><div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center shrink-0"><Icon className="w-4 h-4 text-gray-500" /></div><span>{text}</span></li>
                ))}
              </ul>
            </div>
          </div>
          <div className="mt-16 pt-8 border-t border-white/[0.06] flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-gray-500 text-xs">&copy;2026 Local Event Board. All rights reserved.</p>
            <div className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /><span className="text-gray-500 text-xs">All systems operational</span></div>
          </div>
        </div>
      </div>
    </footer>
  );
}

/* ── Time formatting ── */
function timeAgo(dateStr: string) {
  const now = Date.now();
  const d = new Date(dateStr).getTime();
  const diff = Math.floor((now - d) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

function formatDateLabel(dateStr: string) {
  const d = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

/* ── Conversation List Item ── */
function ConversationItem({ conv, isActive, onClick, userId, onArchive, onDelete, isArchived }: {
  conv: Conversation; isActive: boolean; onClick: () => void; userId: string;
  onArchive: (id: string, archive: boolean) => void; onDelete: (id: string) => void; isArchived: boolean;
}) {
  const lastReply = conv._lastReply;
  const lastMsg = lastReply?.message || conv.message;
  const isMe = lastReply?.senderId === userId;
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    if (menuOpen) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);

  return (
    <div className={`relative group transition-all duration-200 border-b border-gray-100/60 ${isActive ? 'bg-[#9CAFA0]/8 border-l-3 border-l-[#9CAFA0]' : 'hover:bg-gray-50/80'}`}>
      <button onClick={onClick} className="w-full text-left p-4 pr-10">
        <div className="flex items-start gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0 ${
            conv._isSender ? 'bg-gradient-to-br from-[#9CAFA0] to-[#7A8E80]' : 'bg-gradient-to-br from-[#FF9B51] to-[#FFB070]'
          }`}>
            {conv._otherName.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-0.5">
              <div className="flex items-center gap-2 min-w-0">
                <p className={`text-sm truncate ${conv._hasUnread ? 'font-bold text-gray-900' : 'font-medium text-gray-700'}`}>
                  {conv._otherName}
                </p>
                {conv._hasUnread && <Circle className="w-2 h-2 fill-[#FF9B51] text-[#FF9B51] shrink-0" />}
                {isArchived && <Archive className="w-3 h-3 text-gray-300 shrink-0" />}
              </div>
              <span className="text-[10px] text-gray-400 shrink-0">
                {timeAgo(conv.lastReplyAt || conv.createdAt)}
              </span>
            </div>
            {conv.eventTitle && <p className="text-[10px] text-[#7A8E80] font-medium mb-1 truncate">{conv.eventTitle}</p>}
            <p className={`text-xs truncate ${conv._hasUnread ? 'text-gray-700 font-medium' : 'text-gray-400'}`}>
              {isMe ? 'You: ' : ''}{lastMsg}
            </p>
          </div>
        </div>
      </button>

      {/* Action menu trigger */}
      <div ref={menuRef} className="absolute right-2 top-3.5">
        <button
          onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); }}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-300 opacity-0 group-hover:opacity-100 hover:bg-gray-100 hover:text-gray-500 transition-all"
        >
          <MoreVertical className="w-3.5 h-3.5" />
        </button>

        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -4 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-8 z-30 bg-white rounded-xl border border-gray-100 shadow-lg shadow-black/8 py-1.5 min-w-[160px]"
            >
              <button
                onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onArchive(conv.id, !isArchived); }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
              >
                {isArchived ? <ArchiveRestore className="w-3.5 h-3.5 text-[#9CAFA0]" /> : <Archive className="w-3.5 h-3.5 text-[#9CAFA0]" />}
                {isArchived ? 'Unarchive' : 'Archive'}
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onDelete(conv.id); }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ── Chat Thread View ── */
function ChatThread({ conv, userId, onBack, onSend, onRefresh }: {
  conv: Conversation;
  userId: string;
  onBack: () => void;
  onSend: (msg: string) => Promise<void>;
  onRefresh: () => void;
}) {
  const [newMsg, setNewMsg] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }, [conv.replies]);

  const handleSend = async () => {
    if (!newMsg.trim() || sending) return;
    setSending(true);
    try {
      await onSend(newMsg.trim());
      setNewMsg('');
      if (inputRef.current) {
        inputRef.current.style.height = '44px';
        inputRef.current.style.overflow = 'hidden';
      }
      inputRef.current?.focus();
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Group messages by date
  const groupedReplies: { date: string; messages: Reply[] }[] = [];
  (conv.replies || []).forEach((r) => {
    const dateLabel = formatDateLabel(r.createdAt);
    const last = groupedReplies[groupedReplies.length - 1];
    if (last && last.date === dateLabel) {
      last.messages.push(r);
    } else {
      groupedReplies.push({ date: dateLabel, messages: [r] });
    }
  });

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100 bg-white flex items-center gap-3">
        <button onClick={onBack} className="md:hidden w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center hover:bg-gray-100 transition-colors shrink-0">
          <ArrowLeft className="w-4 h-4 text-gray-500" />
        </button>
        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0 ${
          conv._isSender ? 'bg-gradient-to-br from-[#9CAFA0] to-[#7A8E80]' : 'bg-gradient-to-br from-[#FF9B51] to-[#FFB070]'
        }`}>
          {conv._otherName.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-gray-900 truncate">{conv._otherName}</p>
          <p className="text-[11px] text-gray-400 truncate">
            {conv._isSender ? 'Organizer' : 'Attendee'}
            {conv.eventTitle ? ` · ${conv.eventTitle}` : ''}
          </p>
        </div>
        <button onClick={onRefresh} className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center hover:bg-gray-100 transition-colors shrink-0" title="Refresh">
          <RefreshCw className="w-3.5 h-3.5 text-gray-400" />
        </button>
      </div>

      {/* Messages area */}
      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto px-5 py-4 space-y-1 bg-white [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" style={{ minHeight: 0 }}>
        {/* Event context */}
        {conv.eventTitle && (
          <div className="flex justify-center mb-4">
            <div className="inline-flex items-center gap-2 bg-white border border-gray-100 rounded-full px-4 py-1.5 shadow-sm">
              <Calendar className="w-3 h-3 text-[#9CAFA0]" />
              <span className="text-[11px] text-gray-500 font-medium">{conv.eventTitle}</span>
            </div>
          </div>
        )}

        {/* Subject */}
        {conv.subject && (
          <div className="flex justify-center mb-3">
            <span className="text-[11px] text-gray-400 font-medium">{conv.subject}</span>
          </div>
        )}

        {groupedReplies.map((group) => (
          <div key={group.date}>
            {/* Date separator */}
            <div className="flex items-center gap-3 my-4">
              <div className="flex-1 h-px bg-gray-200/60" />
              <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">{group.date}</span>
              <div className="flex-1 h-px bg-gray-200/60" />
            </div>
            {/* Messages */}
            {group.messages.map((reply) => {
              const isMyMsg = reply.senderId === userId;
              return (
                <motion.div
                  key={reply.id || reply.createdAt}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className={`flex mb-2 ${isMyMsg ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[80%] ${isMyMsg ? 'order-2' : ''}`}>
                    {!isMyMsg && (
                      <p className="text-[10px] text-gray-400 font-medium mb-1 ml-1">{reply.senderName}</p>
                    )}
                    <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                      isMyMsg
                        ? 'bg-[#9CAFA0] text-white rounded-br-md'
                        : 'bg-[#F3F4F6] text-gray-800 rounded-bl-md'
                    }`}>
                      {reply.message}
                    </div>
                    <div className={`flex items-center gap-1 mt-1 ${isMyMsg ? 'justify-end mr-1' : 'ml-1'}`}>
                      <span className="text-[10px] text-gray-300">{formatTime(reply.createdAt)}</span>
                      {isMyMsg && <CheckCheck className="w-3 h-3 text-gray-300" />}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ))}

        {(!conv.replies || conv.replies.length === 0) && (
          <div className="text-center py-12">
            <MessageSquare className="w-8 h-8 text-gray-200 mx-auto mb-3" />
            <p className="text-sm text-gray-400">No messages yet. Start the conversation!</p>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="px-4 py-3 border-t border-gray-100/80 bg-white/80 backdrop-blur-sm">
        <div className="relative flex items-end bg-gray-50/80 border border-gray-200/60 rounded-2xl transition-all duration-300 focus-within:border-[#9CAFA0] focus-within:ring-[3px] focus-within:ring-[#9CAFA0]/10 focus-within:bg-white">
            <textarea
              ref={inputRef}
              value={newMsg}
              onChange={(e) => setNewMsg(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Write a message..."
              rows={1}
              className="flex-1 pl-4 pr-2 py-3 bg-transparent text-sm text-gray-800 placeholder-gray-400/60 outline-none resize-none leading-relaxed [scrollbar-width:none] [&::-webkit-scrollbar]:hidden overflow-hidden"
              style={{ minHeight: '44px', maxHeight: '120px' }}
              onInput={(e) => {
                const el = e.target as HTMLTextAreaElement;
                el.style.height = 'auto';
                el.style.overflow = 'hidden';
                const sh = el.scrollHeight;
                if (sh > 120) {
                  el.style.height = '120px';
                  el.style.overflow = 'auto';
                } else {
                  el.style.height = sh + 'px';
                }
              }}
            />
            <button
              onClick={handleSend}
              disabled={!newMsg.trim() || sending}
              className="m-1.5 w-10 h-10 rounded-xl bg-[#FF9B51] hover:bg-[#E88A3E] disabled:bg-gray-200 disabled:cursor-not-allowed flex items-center justify-center transition-all duration-200 active:scale-95 shrink-0 shadow-sm shadow-orange-500/20 disabled:shadow-none"
            >
              {sending ? (
                <Loader className="w-4 h-4 text-white animate-spin" />
              ) : (
                <Send className="w-4 h-4 text-white translate-x-[1px]" />
              )}
            </button>
        </div>
        <p className="text-[10px] text-gray-400 text-center mt-2 select-none">Enter to send · Shift+Enter for new line</p>
      </div>
    </div>
  );
}

/* ── Main Messages Page ── */
export function MyMessagesPage() {
  const { user, isLoggedIn } = useAuth();

  if (!isLoggedIn) {
    return (
      <LoginRequired
        title="My Messages"
        subtitle="Sign in to view your messages"
        description="You need to be logged in to access your conversations with organizers and attendees."
        icon={MessageSquare}
      />
    );
  }

  return <MessagesContent />;
}

function MessagesContent() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const pollRef = useRef<number | null>(null);
  const [activeTab, setActiveTab] = useState<'inbox' | 'archived'>('inbox');
  const [archivedIds, setArchivedIds] = useState<string[]>([]);
  const [deletedIds, setDeletedIds] = useState<string[]>([]);
  const [lastReadAtByConversation, setLastReadAtByConversation] = useState<Record<string, string | null>>({});
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const mapConversationRow = useCallback((row: any): Conversation => {
    const replies: Reply[] = Array.isArray(row.replies)
      ? row.replies.map((reply: any) => ({
          id: String(reply.id || reply.createdAt || crypto.randomUUID()),
          senderId: reply.senderId || null,
          senderName: reply.senderName || 'User',
          senderEmail: reply.senderEmail || '',
          message: reply.message || '',
          createdAt: reply.createdAt || row.created_at,
          isInitialMessage: !!reply.isInitialMessage,
        }))
      : [];

    const createdAt = row.created_at || new Date().toISOString();
    const lastReply = replies.length > 0 ? replies[replies.length - 1] : null;
    const latestActivityAt = row.last_reply_at || createdAt;
    const lastReadAt = lastReadAtByConversation[row.id] || null;
    const latestActivityTs = new Date(latestActivityAt).getTime();
    const lastReadTs = lastReadAt ? new Date(lastReadAt).getTime() : 0;
    const isSender = row.sender_user_id === user?.id;
    const isOrganizer = row.organizer_user_id === user?.id;
    const otherName = isSender
      ? (row.organizer_email?.split('@')[0] || 'Organizer')
      : (row.sender_name || row.sender_email?.split('@')[0] || 'User');
    const lastReplyByOther = row.last_reply_by ? row.last_reply_by !== user?.id : false;

    return {
      id: row.id,
      eventId: row.event_id,
      eventTitle: row.event_title,
      organizerUserId: row.organizer_user_id,
      organizerEmail: row.organizer_email,
      senderUserId: row.sender_user_id,
      senderName: row.sender_name || 'User',
      senderEmail: row.sender_email || '',
      subject: row.subject || '',
      message: row.message || row.content || '',
      createdAt,
      status: row.status || 'unread',
      replies,
      lastReplyAt: row.last_reply_at || createdAt,
      lastReplyBy: row.last_reply_by || null,
      _otherName: otherName,
      _isSender: isSender,
      _isOrganizer: isOrganizer,
      _lastReply: lastReply,
      _hasUnread: !!(lastReplyByOther && latestActivityTs > lastReadTs),
    };
  }, [lastReadAtByConversation, user?.id]);

  const fetchMeta = useCallback(async () => {
    try {
      if (!user?.id) return;

      const { data, error } = await supabase
        .from('message_user_state')
        .select('message_id, archived, deleted, last_read_at')
        .eq('user_id', user.id)
        .or('archived.eq.true,deleted.eq.true,last_read_at.not.is.null');

      if (error) throw error;

      const archived = (data || []).filter((row) => row.archived).map((row) => row.message_id);
      const deleted = (data || []).filter((row) => row.deleted).map((row) => row.message_id);
      const readMap: Record<string, string | null> = {};
      for (const row of data || []) {
        readMap[row.message_id] = row.last_read_at || null;
      }

      setArchivedIds((prev) => JSON.stringify(prev) === JSON.stringify(archived) ? prev : archived);
      setDeletedIds((prev) => JSON.stringify(prev) === JSON.stringify(deleted) ? prev : deleted);
      setLastReadAtByConversation((prev) => JSON.stringify(prev) === JSON.stringify(readMap) ? prev : readMap);
    } catch (err) {
      console.error('Error fetching conversation meta:', err);
    }
  }, [user?.id]);

  const fetchConversations = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      if (!user?.id) {
        setConversations([]);
        return;
      }

      const { data, error } = await supabase
        .from('messages')
        .select('id, event_id, event_title, organizer_user_id, organizer_email, sender_user_id, sender_name, sender_email, subject, message, content, created_at, status, replies, last_reply_at, last_reply_by')
        .eq('type', 'contact')
        .or(`sender_user_id.eq.${user.id},organizer_user_id.eq.${user.id}`)
        .order('last_reply_at', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setConversations((data || []).map(mapConversationRow));
    } catch (err) {
      console.error('Error fetching conversations:', err);
    }
    if (!silent) setIsLoading(false);
  }, [mapConversationRow, user?.id]);

  const fetchSingleConversation = useCallback(async (convId: string) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('id, event_id, event_title, organizer_user_id, organizer_email, sender_user_id, sender_name, sender_email, subject, message, content, created_at, status, replies, last_reply_at, last_reply_by')
        .eq('id', convId)
        .maybeSingle();

      if (error) throw error;
      if (!data) return;

      const mapped = mapConversationRow(data);
      setConversations(prev => prev.map(c => {
        if (c.id === convId) {
          return { ...mapped, _otherName: c._otherName, _isSender: c._isSender, _isOrganizer: c._isOrganizer };
        }
        return c;
      }));
    } catch (err) {
      console.error('Error fetching conversation:', err);
    }
  }, [mapConversationRow]);

  // Initial load — sequential to avoid concurrent edge function hits
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      await fetchMeta();
      if (!cancelled) await fetchConversations();
    };
    load();
    return () => { cancelled = true; };
  }, [fetchConversations, fetchMeta]);

  // Polling every 5s for live updates (reduced from 3s for stability)
  useEffect(() => {
    pollRef.current = window.setInterval(() => {
      if (activeConvId) {
        fetchSingleConversation(activeConvId);
      } else {
        fetchConversations(true);
      }
    }, 5000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [activeConvId, fetchConversations, fetchSingleConversation]);

  const handleSendMessage = async (msg: string) => {
    if (!activeConvId) return;
    try {
      const { data, error } = await supabase.rpc('send_contact_reply', {
        target_message_id: activeConvId,
        reply_text: msg,
      });

      if (error) throw error;
      const result = Array.isArray(data) ? data[0] : null;
      if (result?.success && result.reply) {
        const reply = {
          id: String(result.reply.id),
          senderId: result.reply.senderId || user?.id || null,
          senderName: result.reply.senderName || user?.name || 'You',
          senderEmail: result.reply.senderEmail || user?.email || '',
          message: result.reply.message || msg,
          createdAt: result.reply.createdAt || new Date().toISOString(),
        };
        setConversations(prev => prev.map(c => {
          if (c.id === activeConvId) {
            const replies = [...(c.replies || []), reply];
            return { ...c, replies, lastReplyAt: reply.createdAt, lastReplyBy: user?.id || '', _lastReply: reply, _hasUnread: false };
          }
          return c;
        }));
      }
    } catch (err) {
      console.error('Error sending message:', err);
    }
  };

  const handleArchiveConversation = async (convId: string, archive: boolean) => {
    // Optimistic update
    setArchivedIds(prev => archive ? [...prev, convId] : prev.filter(id => id !== convId));
    if (activeConvId === convId) setActiveConvId(null);
    try {
      const { data, error } = await supabase.rpc('set_contact_message_archived', {
        target_message_id: convId,
        archive_value: archive,
      });

      if (error) throw error;
      const result = Array.isArray(data) ? data[0] : null;
      if (!result?.success) {
        // Revert on failure
        setArchivedIds(prev => archive ? prev.filter(id => id !== convId) : [...prev, convId]);
      }
    } catch (err) {
      console.error('Error archiving conversation:', err);
      setArchivedIds(prev => archive ? prev.filter(id => id !== convId) : [...prev, convId]);
    }
  };

  const markConversationAsRead = useCallback(async (convId: string) => {
    try {
      // Optimistically update UI
      setConversations(prev => prev.map(c => 
        c.id === convId ? { ...c, _hasUnread: false } : c
      ));

      const { data, error } = await supabase.rpc('mark_contact_message_read', {
        target_message_id: convId,
      });

      if (error) {
        console.error('Failed to mark conversation as read:', error.message);
        return;
      }

      const result = Array.isArray(data) ? data[0] : null;
      if (!result?.success) {
        console.error('Failed to mark conversation as read:', result?.error);
        return;
      }

      setLastReadAtByConversation((prev) => ({
        ...prev,
        [convId]: new Date().toISOString(),
      }));
    } catch (err) {
      console.error('Error marking conversation as read:', err);
    }
  }, []);

  const handleConversationClick = useCallback((convId: string) => {
    setActiveConvId(convId);
    // Mark as read when opening
    const conv = conversations.find(c => c.id === convId);
    if (conv?._hasUnread) {
      markConversationAsRead(convId);
    }
  }, [conversations, markConversationAsRead]);

  const confirmDeleteConversation = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    // Optimistic update
    const convId = deleteTarget;
    setDeletedIds(prev => [...prev, convId]);
    if (activeConvId === convId) setActiveConvId(null);
    try {
      const { data, error } = await supabase.rpc('soft_delete_contact_message', {
        target_message_id: convId,
      });

      if (error) throw error;
      const result = Array.isArray(data) ? data[0] : null;
      if (!result?.success) {
        setDeletedIds(prev => prev.filter(id => id !== convId));
      }
    } catch (err) {
      console.error('Error deleting conversation:', err);
      setDeletedIds(prev => prev.filter(id => id !== convId));
    } finally {
      setDeleteLoading(false);
      setDeleteTarget(null);
    }
  };

  const activeConv = conversations.find(c => c.id === activeConvId) || null;

  // Filter by tab and search, excluding deleted
  const visibleConversations = conversations.filter(c => {
    if (deletedIds.includes(c.id)) return false;
    if (activeTab === 'inbox') return !archivedIds.includes(c.id);
    if (activeTab === 'archived') return archivedIds.includes(c.id);
    return true;
  });

  const filteredConversations = searchQuery
    ? visibleConversations.filter(c =>
        c._otherName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.eventTitle || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.subject || '').toLowerCase().includes(searchQuery.toLowerCase())
      )
    : visibleConversations;

  const inboxCount = conversations.filter(c => !deletedIds.includes(c.id) && !archivedIds.includes(c.id)).length;
  const archivedCount = conversations.filter(c => !deletedIds.includes(c.id) && archivedIds.includes(c.id)).length;
  const unreadCount = conversations.filter(c => c._hasUnread && !deletedIds.includes(c.id) && !archivedIds.includes(c.id)).length;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Delete confirmation modal */}
      <ConfirmModal
        open={!!deleteTarget}
        title="Delete Conversation"
        description="This conversation will be permanently removed from your inbox. The other person will still be able to see it on their end."
        confirmLabel="Delete"
        onConfirm={confirmDeleteConversation}
        onCancel={() => setDeleteTarget(null)}
        loading={deleteLoading}
      />

      {/* Hero */}
      <section className="relative w-full overflow-hidden bg-[#9CAFA0]">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full bg-white/[0.04]" />
          <div className="absolute -bottom-24 -left-24 w-[380px] h-[380px] rounded-full bg-white/[0.04]" />
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
        </div>
        <div className="relative pt-36 pb-20 md:pt-40 md:pb-24 px-6 flex flex-col items-center">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/15 rounded-full px-4 py-1.5 mb-5">
            <Inbox className="w-3.5 h-3.5 text-[#FFB070]" />
            <span className="text-xs font-medium text-white/80 tracking-wide uppercase">
              {isLoading ? 'Loading...' : `${inboxCount} Conversation${inboxCount !== 1 ? 's' : ''}`}
              {unreadCount > 0 && ` · ${unreadCount} new`}
              {archivedCount > 0 && ` · ${archivedCount} archived`}
            </span>
          </motion.div>
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.05 }} className="text-4xl md:text-[52px] font-bold tracking-tight text-white leading-[1.08] text-center mb-3">
            My <span className="text-[#FFB070]">Messages</span>
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }} className="text-base text-white/60 max-w-md mx-auto text-center">
            Real-time conversations with organizers and attendees
          </motion.p>
          {/* Live indicator */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="flex items-center gap-1.5 mt-4">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] text-white/50 font-medium">Live updates every 5s</span>
          </motion.div>
        </div>
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 60" fill="none" className="w-full" preserveAspectRatio="none"><path d="M0 60V30C240 0 480 0 720 30C960 60 1200 60 1440 30V60H0Z" fill="#FCFCFC" /></svg>
        </div>
      </section>

      {/* Content */}
      <div className="flex-1 bg-[#FCFCFC]">
        <div className="max-w-5xl mx-auto w-full px-4 md:px-8 py-8">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <Loader className="w-8 h-8 text-[#9CAFA0] animate-spin" />
              <p className="text-sm text-gray-400">Loading conversations...</p>
            </div>
          ) : conversations.filter(c => !deletedIds.includes(c.id)).length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-3xl border border-gray-100/80 p-12 text-center"
              style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.03)' }}
            >
              <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-4">
                <Inbox className="w-7 h-7 text-gray-300" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">No conversations yet</h3>
              <p className="text-sm text-gray-400 max-w-sm mx-auto mb-6">
                When you contact an organizer or someone contacts you about your events, conversations will appear here.
              </p>
              <Link
                to="/browse"
                className="group inline-flex items-center gap-2 bg-[#FF9B51] hover:bg-[#E88A3E] text-white px-8 py-3.5 rounded-xl font-semibold shadow-lg shadow-orange-500/15 transition-all duration-200 active:scale-[0.98] text-sm"
              >
                Browse Events
                <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5" />
              </Link>
            </motion.div>
          ) : (
            /* Conversation layout: list + thread */
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-3xl border border-gray-100/80 overflow-hidden flex"
              style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.06)', height: 'calc(100vh - 360px)', minHeight: '500px' }}
            >
              {/* Left panel: Conversation list */}
              <div className={`w-full md:w-[340px] border-r border-gray-100 flex flex-col ${activeConvId ? 'hidden md:flex' : 'flex'}`}>
                {/* Tabs */}
                <div className="flex border-b border-gray-100">
                  <button
                    onClick={() => { setActiveTab('inbox'); setSearchQuery(''); }}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-semibold tracking-wide transition-all border-b-2 ${
                      activeTab === 'inbox'
                        ? 'text-[#9CAFA0] border-[#9CAFA0]'
                        : 'text-gray-400 border-transparent hover:text-gray-600'
                    }`}
                  >
                    <Inbox className="w-3.5 h-3.5" />
                    Inbox
                    {inboxCount > 0 && (
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                        activeTab === 'inbox' ? 'bg-[#9CAFA0]/10 text-[#9CAFA0]' : 'bg-gray-100 text-gray-400'
                      }`}>{inboxCount}</span>
                    )}
                  </button>
                  <button
                    onClick={() => { setActiveTab('archived'); setSearchQuery(''); }}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-semibold tracking-wide transition-all border-b-2 ${
                      activeTab === 'archived'
                        ? 'text-[#9CAFA0] border-[#9CAFA0]'
                        : 'text-gray-400 border-transparent hover:text-gray-600'
                    }`}
                  >
                    <Archive className="w-3.5 h-3.5" />
                    Archived
                    {archivedCount > 0 && (
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                        activeTab === 'archived' ? 'bg-[#9CAFA0]/10 text-[#9CAFA0]' : 'bg-gray-100 text-gray-400'
                      }`}>{archivedCount}</span>
                    )}
                  </button>
                </div>

                {/* Search bar */}
                <div className="p-3 border-b border-gray-100">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search conversations..."
                      className="w-full pl-9 pr-8 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm text-gray-700 placeholder-gray-400 focus:border-[#9CAFA0] focus:ring-1 focus:ring-[#9CAFA0]/20 outline-none transition-all"
                    />
                    {searchQuery && (
                      <button onClick={() => setSearchQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2">
                        <X className="w-3.5 h-3.5 text-gray-400" />
                      </button>
                    )}
                  </div>
                </div>
                {/* List */}
                <div className="flex-1 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {filteredConversations.length === 0 ? (
                    <div className="text-center py-12 px-4">
                      <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center mx-auto mb-3">
                        {activeTab === 'archived' ? <Archive className="w-5 h-5 text-gray-300" /> : <Inbox className="w-5 h-5 text-gray-300" />}
                      </div>
                      <p className="text-sm font-medium text-gray-500 mb-1">
                        {searchQuery
                          ? 'No conversations match your search'
                          : activeTab === 'archived'
                            ? 'No archived conversations'
                            : 'No conversations'}
                      </p>
                      <p className="text-xs text-gray-400">
                        {activeTab === 'archived' ? 'Archived chats will appear here' : 'Start chatting with event organizers'}
                      </p>
                    </div>
                  ) : (
                    filteredConversations.map(conv => (
                      <ConversationItem
                        key={conv.id}
                        conv={conv}
                        isActive={activeConvId === conv.id}
                        onClick={() => handleConversationClick(conv.id)}
                        userId={user?.id || ''}
                        onArchive={handleArchiveConversation}
                        onDelete={(id) => setDeleteTarget(id)}
                        isArchived={archivedIds.includes(conv.id)}
                      />
                    ))
                  )}
                </div>
              </div>

              {/* Right panel: Chat thread */}
              <div className={`flex-1 flex flex-col ${!activeConvId ? 'hidden md:flex' : 'flex'}`}>
                {activeConv ? (
                  <ChatThread
                    conv={activeConv}
                    userId={user?.id || ''}
                    onBack={() => setActiveConvId(null)}
                    onSend={handleSendMessage}
                    onRefresh={() => fetchSingleConversation(activeConvId!)}
                  />
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
                    <div className="w-20 h-20 rounded-3xl bg-gray-50 flex items-center justify-center mb-5">
                      <MessageSquare className="w-9 h-9 text-gray-200" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">Select a conversation</h3>
                    <p className="text-sm text-gray-400 max-w-xs">
                      Choose a conversation from the left to start chatting. Messages update in real-time.
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}      
