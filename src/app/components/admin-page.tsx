import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ShieldCheck,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  Calendar,
  MapPin,
  Tag,
  User,
  Users,
  Mail,
  DollarSign,
  AlertTriangle,
  RefreshCw,
  X,
  Facebook,
  Instagram,
  Twitter,
  Phone,
  ArrowRight,
  Crown,
  UserMinus,
  UserPlus,
  Search,
  LayoutDashboard,
  Trash2,
  RotateCcw,
  MessageSquare,
  MailOpen,
  MailCheck,
} from 'lucide-react';
import { Link } from 'react-router';
import { useAuth } from './auth-context';
import { supabase } from './auth-context';

type EventStatus = 'pending_review' | 'approved' | 'rejected';
type TabFilter = 'all' | EventStatus;
type AdminSection = 'events' | 'users' | 'messages';

interface ServerEvent {
  id: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  startDate: string;
  endDate: string | null;
  startTime: string;
  endTime: string | null;
  venueName: string;
  address: string;
  city: string;
  pricingType: string;
  price: string | null;
  capacity: string | null;
  coverImage: string | null;
  organizerName: string;
  organizerEmail: string;
  organizerPhone: string;
  website: string;
  status: EventStatus;
  createdAt: string;
  reviewedAt?: string;
}

interface AdminUser {
  id: string;
  email: string;
  name: string;
  avatar: string | null;
  isAdmin: boolean;
  isGrandAdmin?: boolean;
  createdAt: string;
  lastSignIn: string | null;
}

interface ContactMessage {
  id: string;
  eventId: string | null;
  eventTitle: string | null;
  senderName: string;
  senderEmail: string;
  senderPhone: string | null;
  subject: string;
  message: string;
  createdAt: string;
  status: 'unread' | 'read';
}

const statusConfig: Record<EventStatus, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  pending_review: { label: 'Pending Review', color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200', icon: Clock },
  approved: { label: 'Approved', color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200', icon: CheckCircle },
  rejected: { label: 'Rejected', color: 'text-red-500', bg: 'bg-red-50 border-red-200', icon: XCircle },
};

/* ──────────────────────────────────────────────────── */
/*  Confirmation Modal (reusable)                        */
/* ──────────────────────────────────────────────────── */

function ConfirmModal({ title, description, confirmLabel, confirmColor, icon: Icon, isLoading, onConfirm, onCancel }: {
  title: string;
  description: React.ReactNode;
  confirmLabel: string;
  confirmColor: string;
  icon: React.ElementType;
  isLoading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onCancel]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-center justify-center px-4"
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onCancel} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="relative bg-white rounded-2xl w-full max-w-md p-7"
        style={{ boxShadow: '0 24px 64px rgba(0,0,0,0.2)' }}
      >
        <div className="flex items-start gap-4 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center shrink-0">
            <Icon className="w-6 h-6 text-red-500" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">{title}</h3>
            <div className="text-sm text-gray-500 mt-1 leading-relaxed">{description}</div>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`flex-1 ${confirmColor} text-white py-3 rounded-xl font-semibold shadow-lg transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-2 text-sm disabled:opacity-60`}
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Icon className="w-4 h-4" />
            )}
            {confirmLabel}
          </button>
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1 bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 py-3 rounded-xl font-semibold transition-all text-sm"
          >
            Cancel
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ──────────────────────────────────────────────────── */
/*  Toast notification                                   */
/* ──────────────────────────────────────────────────── */

function Toast({ message, type, onDismiss }: { message: string; type: 'success' | 'error'; onDismiss: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 3500);
    return () => clearTimeout(t);
  }, [onDismiss]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 40, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 40, scale: 0.95 }}
      className={`fixed bottom-6 right-6 z-[70] flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-2xl text-sm font-semibold ${
        type === 'success' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'
      }`}
    >
      {type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
      {message}
      <button onClick={onDismiss} className="ml-2 opacity-70 hover:opacity-100 transition-opacity">
        <X className="w-3.5 h-3.5" />
      </button>
    </motion.div>
  );
}

/* ──────────────────────────────────────────────────── */
/*  Event Preview Modal (full actions)                   */
/* ──────────────────────────────────────────────────── */

function EventPreviewModal({ event, onClose, onApprove, onReject, onRevert, onDelete, isUpdating }: {
  event: ServerEvent;
  onClose: () => void;
  onApprove: () => void;
  onReject: () => void;
  onRevert: () => void;
  onDelete: () => void;
  isUpdating: boolean;
}) {
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => { document.body.style.overflow = ''; document.removeEventListener('keydown', handler); };
  }, [onClose]);

  const cfg = statusConfig[event.status];
  const StatusIcon = cfg.icon;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="relative bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        style={{ boxShadow: '0 24px 64px rgba(0,0,0,0.2)' }}
      >
        {event.coverImage && (
          <div className="relative h-48 rounded-t-3xl overflow-hidden">
            <img src={event.coverImage} alt={event.title} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
          </div>
        )}

        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/90 backdrop-blur-md flex items-center justify-center text-gray-500 hover:text-gray-700 shadow-md transition-colors z-10"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="p-7">
          <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold mb-4 ${cfg.bg} ${cfg.color}`}>
            <StatusIcon className="w-3.5 h-3.5" />
            {cfg.label}
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-2">{event.title}</h2>
          <p className="text-sm text-gray-500 leading-relaxed mb-6">{event.description}</p>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <InfoItem icon={Tag} label="Category" value={event.category} />
            <InfoItem icon={Calendar} label="Date" value={`${event.startDate}${event.endDate ? ` – ${event.endDate}` : ''}`} />
            <InfoItem icon={Clock} label="Time" value={`${event.startTime}${event.endTime ? ` – ${event.endTime}` : ''}`} />
            <InfoItem icon={MapPin} label="Location" value={`${event.venueName}, ${event.city}`} />
            <InfoItem icon={DollarSign} label="Pricing" value={event.pricingType === 'free' ? 'Free' : `${event.price}\u20AC`} />
            <InfoItem icon={User} label="Organizer" value={event.organizerName} />
            <InfoItem icon={Mail} label="Email" value={event.organizerEmail} />
            {event.organizerPhone && <InfoItem icon={Phone} label="Phone" value={event.organizerPhone} />}
          </div>

          {event.tags.length > 0 && (
            <div className="mb-6">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Tags</p>
              <div className="flex flex-wrap gap-2">
                {event.tags.map((tag) => (
                  <span key={tag} className="bg-gray-100 text-gray-600 text-xs font-medium px-3 py-1.5 rounded-full">{tag}</span>
                ))}
              </div>
            </div>
          )}

          <p className="text-xs text-gray-400 mb-6">
            Submitted {new Date(event.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
            {event.reviewedAt && (
              <> &middot; Reviewed {new Date(event.reviewedAt).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}</>
            )}
          </p>

          {/* Action bar — always visible with contextual buttons */}
          <div className="pt-4 border-t border-gray-100 space-y-3">
            <div className="flex gap-3">
              {/* Approve — show for pending or rejected */}
              {event.status !== 'approved' && (
                <button
                  onClick={onApprove}
                  disabled={isUpdating}
                  className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white py-3 rounded-xl font-semibold shadow-lg shadow-emerald-500/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2 text-sm disabled:opacity-60"
                >
                  {isUpdating ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                  Approve
                </button>
              )}

              {/* Reject — show for pending or approved */}
              {event.status !== 'rejected' && (
                <button
                  onClick={onReject}
                  disabled={isUpdating}
                  className="flex-1 bg-white border border-red-200 hover:bg-red-50 text-red-600 py-3 rounded-xl font-semibold transition-all active:scale-[0.98] flex items-center justify-center gap-2 text-sm disabled:opacity-60"
                >
                  {isUpdating ? <div className="w-4 h-4 border-2 border-red-300 border-t-red-600 rounded-full animate-spin" /> : <XCircle className="w-4 h-4" />}
                  Reject
                </button>
              )}

              {/* Revert to Pending — show for approved or rejected */}
              {event.status !== 'pending_review' && (
                <button
                  onClick={onRevert}
                  disabled={isUpdating}
                  className="flex-1 bg-white border border-amber-200 hover:bg-amber-50 text-amber-600 py-3 rounded-xl font-semibold transition-all active:scale-[0.98] flex items-center justify-center gap-2 text-sm disabled:opacity-60"
                >
                  {isUpdating ? <div className="w-4 h-4 border-2 border-amber-300 border-t-amber-600 rounded-full animate-spin" /> : <RotateCcw className="w-4 h-4" />}
                  Revert to Pending
                </button>
              )}
            </div>

            {/* Delete — always available */}
            <button
              onClick={onDelete}
              disabled={isUpdating}
              className="w-full bg-white border border-gray-200 hover:bg-red-50 hover:border-red-200 text-gray-400 hover:text-red-500 py-3 rounded-xl font-semibold transition-all active:scale-[0.98] flex items-center justify-center gap-2 text-sm disabled:opacity-60"
            >
              <Trash2 className="w-4 h-4" />
              Delete Event Permanently
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function InfoItem({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center shrink-0 mt-0.5">
        <Icon className="w-3.5 h-3.5 text-gray-400" />
      </div>
      <div>
        <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wider">{label}</p>
        <p className="text-sm text-gray-700 font-medium">{value}</p>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────── */
/*  Event Card (admin view with full actions)            */
/* ──────────────────────────────────────────────────── */

const AdminEventCard = React.forwardRef<HTMLDivElement, {
  event: ServerEvent;
  onView: () => void;
  onApprove: () => void;
  onReject: () => void;
  onRevert: () => void;
  onDelete: () => void;
  isUpdating: boolean;
}>(function AdminEventCard({ event, onView, onApprove, onReject, onRevert, onDelete, isUpdating }, ref) {
  const cfg = statusConfig[event.status];
  const StatusIcon = cfg.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      layout
      className="bg-white rounded-2xl border border-gray-100/80 overflow-hidden hover:shadow-lg transition-all duration-300"
      style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.03)' }}
      ref={ref}
    >
      <div className="flex flex-col sm:flex-row">
        <div className="relative w-full sm:w-44 h-40 sm:h-auto shrink-0 overflow-hidden">
          {event.coverImage ? (
            <img src={event.coverImage} alt={event.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-[#9CAFA0]/20 to-[#9CAFA0]/5 flex items-center justify-center">
              <Calendar className="w-8 h-8 text-[#9CAFA0]/40" />
            </div>
          )}
          <div className={`absolute top-3 left-3 inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-[11px] font-bold ${cfg.bg} ${cfg.color}`}>
            <StatusIcon className="w-3 h-3" />
            {cfg.label}
          </div>
        </div>

        <div className="flex-1 p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between gap-3 mb-2">
              <h3 className="text-base font-bold text-gray-900 leading-snug line-clamp-1">{event.title}</h3>
              <span className="text-xs font-semibold text-gray-400 bg-gray-50 px-2.5 py-1 rounded-full shrink-0">{event.category}</span>
            </div>
            <p className="text-sm text-gray-500 line-clamp-2 mb-3">{event.description}</p>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-400">
              <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{event.startDate}</span>
              <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{event.startTime}</span>
              <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{event.city}</span>
              <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" />{event.pricingType === 'free' ? 'Free' : `${event.price}\u20AC`}</span>
              <span className="flex items-center gap-1"><User className="w-3 h-3" />{event.organizerName}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 mt-4 pt-3 border-t border-gray-50 flex-wrap">
            <button
              onClick={onView}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-700 bg-gray-50 hover:bg-gray-100 px-3 py-2 rounded-lg transition-colors"
            >
              <Eye className="w-3.5 h-3.5" /> View
            </button>

            {/* Approve — show if not already approved */}
            {event.status !== 'approved' && (
              <button
                onClick={onApprove}
                disabled={isUpdating}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-2 rounded-lg transition-colors disabled:opacity-50"
              >
                <CheckCircle className="w-3.5 h-3.5" /> Approve
              </button>
            )}

            {/* Reject — show if not already rejected */}
            {event.status !== 'rejected' && (
              <button
                onClick={onReject}
                disabled={isUpdating}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-500 hover:text-red-600 bg-red-50 hover:bg-red-100 px-3 py-2 rounded-lg transition-colors disabled:opacity-50"
              >
                <XCircle className="w-3.5 h-3.5" /> Reject
              </button>
            )}

            {/* Revert to Pending — show if reviewed */}
            {event.status !== 'pending_review' && (
              <button
                onClick={onRevert}
                disabled={isUpdating}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-600 hover:text-amber-700 bg-amber-50 hover:bg-amber-100 px-3 py-2 rounded-lg transition-colors disabled:opacity-50"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Revert
              </button>
            )}

            {/* Delete */}
            <button
              onClick={onDelete}
              disabled={isUpdating}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-400 hover:text-red-500 bg-gray-50 hover:bg-red-50 px-3 py-2 rounded-lg transition-colors disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete
            </button>

            <span className="ml-auto text-[11px] text-gray-300">
              {new Date(event.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
});

/* ──────────────────────────────────────────────────── */
/*  User Management Panel                                */
/* ──────────────────────────────────────────────────── */

function UserManagementPanel({ showToast }: {
  showToast: (msg: string, type: 'success' | 'error') => void;
}) {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [confirmModal, setConfirmModal] = useState<{
    userId: string;
    action: 'promote' | 'demote' | 'delete' | 'transfer';
    name: string;
    email: string;
  } | null>(null);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.rpc('admin_list_users');
      if (error) {
        console.error('Failed to fetch users:', error.message);
        setUsers([]);
        showToast(`Failed to load users: ${error.message}`, 'error');
      } else if (Array.isArray(data)) {
        const mapped: AdminUser[] = data.map((row: any) => ({
          id: row.id,
          email: row.email || '',
          name: row.name || row.email?.split('@')[0] || 'User',
          avatar: row.avatar || null,
          isAdmin: !!row.is_admin,
          isGrandAdmin: !!row.is_grand_admin,
          createdAt: row.created_at,
          lastSignIn: row.last_sign_in,
        }));
        setUsers(mapped);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
      setUsers([]);
      showToast('Failed to load users. Please try again.', 'error');
    }
    setIsLoading(false);
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleAction = async () => {
    if (!confirmModal) return;
    const { userId, action, name } = confirmModal;

    setUpdatingUserId(userId);

    try {
      if (action === 'promote' || action === 'demote') {
        const { data, error } = await supabase.rpc('admin_set_user_admin', {
          target_user_id: userId,
          make_admin: action === 'promote',
        });

        if (error) {
          showToast(error.message || `Failed to ${action} user`, 'error');
          setUpdatingUserId(null);
          setConfirmModal(null);
          return;
        }

        const result = Array.isArray(data) ? data[0] : null;
        if (!result?.success) {
          showToast(result?.message || `Failed to ${action} user`, 'error');
          setUpdatingUserId(null);
          setConfirmModal(null);
          return;
        }

        setUsers((prev) =>
          prev.map((u) =>
            u.id === userId ? { ...u, isAdmin: action === 'promote' } : u
          )
        );
        showToast(
          action === 'promote'
            ? `"${name}" is now an admin`
            : `Admin removed from "${name}"`,
          'success'
        );
      } else if (action === 'delete') {
        const { data, error } = await supabase.rpc('admin_deactivate_user', {
          target_user_id: userId,
        });

        if (error) {
          showToast(error.message || 'Failed to remove user', 'error');
          setUpdatingUserId(null);
          setConfirmModal(null);
          return;
        }

        const result = Array.isArray(data) ? data[0] : null;
        if (!result?.success) {
          showToast(result?.message || 'Failed to remove user', 'error');
          setUpdatingUserId(null);
          setConfirmModal(null);
          return;
        }

        setUsers((prev) => prev.filter((u) => u.id !== userId));
        showToast(`User "${name}" deleted successfully`, 'success');
      } else if (action === 'transfer') {
        const { data, error } = await supabase.rpc('admin_transfer_grand_admin', {
          target_user_id: userId,
        });

        if (error) {
          showToast(error.message || 'Failed to transfer Grand Admin role', 'error');
          setUpdatingUserId(null);
          setConfirmModal(null);
          return;
        }

        const result = Array.isArray(data) ? data[0] : null;
        if (!result?.success) {
          showToast(result?.message || 'Failed to transfer Grand Admin role', 'error');
          setUpdatingUserId(null);
          setConfirmModal(null);
          return;
        }

        // Refetch users to get updated roles since multiple rows change
        await fetchUsers();
        showToast(`Grand Admin role transferred to "${name}"`, 'success');
      }
    } catch (err) {
      console.error(`Error ${action}ing user:`, err);
      showToast('An error occurred', 'error');
    }

    setUpdatingUserId(null);
    setConfirmModal(null);
  };

  const filteredUsers = searchQuery.trim()
    ? users.filter((u) =>
        u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : users;

  const adminCount = users.filter((u) => u.isAdmin).length;

  const getInitials = (name: string) =>
    name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);

  const isViewerGrandAdmin = !!users.find(u => u.id === currentUser?.id)?.isGrandAdmin;

  return (
    <div>
      {/* Header stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Total Users', count: users.length, color: 'text-gray-600', bg: 'bg-gray-50', icon: Users },
          { label: 'Admins', count: adminCount, color: 'text-[#9CAFA0]', bg: 'bg-[#9CAFA0]/10', icon: Crown },
          { label: 'Regular Users', count: users.length - adminCount, color: 'text-blue-600', bg: 'bg-blue-50', icon: User },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl border border-gray-100/80 p-5"
              style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.03)' }}
            >
              <div className={`w-9 h-9 rounded-xl ${stat.bg} flex items-center justify-center mb-3`}>
                <Icon className={`w-4 h-4 ${stat.color}`} />
              </div>
              <p className="text-2xl font-bold text-gray-900">{isLoading ? '\u2014' : stat.count}</p>
              <p className="text-xs text-gray-400 font-medium">{stat.label}</p>
            </motion.div>
          );
        })}
      </div>

      {/* Search + Refresh */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#9CAFA0]/30 focus:border-[#9CAFA0] transition-all"
          />
        </div>
        <button
          onClick={fetchUsers}
          disabled={isLoading}
          className="w-11 h-11 rounded-xl bg-white border border-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors shrink-0"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* User list */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-8 h-8 border-3 border-gray-200 border-t-[#9CAFA0] rounded-full animate-spin" />
          <p className="text-sm text-gray-400">Loading users...</p>
        </div>
      ) : filteredUsers.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl border border-gray-100/80 p-12 text-center"
          style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.03)' }}
        >
          <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-4">
            <Users className="w-7 h-7 text-gray-300" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">No users found</h3>
          <p className="text-sm text-gray-400">
            {searchQuery ? 'Try a different search term.' : 'No registered users yet.'}
          </p>
        </motion.div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {filteredUsers.map((u) => {
              const isSelf = u.id === currentUser?.id;
              const isLastAdmin = u.isAdmin && adminCount <= 1;
              return (
                <motion.div
                  key={u.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  layout
                  className="bg-white rounded-2xl border border-gray-100/80 p-5 hover:shadow-md transition-all duration-300"
                  style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.03)' }}
                >
                  <div className="flex items-center gap-4">
                    {/* Avatar */}
                    <div className="relative shrink-0">
                      {u.avatar ? (
                        <img src={u.avatar} alt={u.name} className="w-11 h-11 rounded-full object-cover" />
                      ) : (
                        <div className={`w-11 h-11 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-sm ${
                          u.isAdmin
                            ? 'bg-gradient-to-br from-[#9CAFA0] to-[#7A8E80]'
                            : 'bg-gradient-to-br from-gray-300 to-gray-400'
                        }`}>
                          {getInitials(u.name)}
                        </div>
                      )}
                      {u.isAdmin && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-[#FF9B51] rounded-full flex items-center justify-center shadow-sm border-2 border-white">
                          <Crown className="w-2.5 h-2.5 text-white" />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-sm font-bold text-gray-900 truncate">{u.name}</p>
                        {isSelf && (
                          <span className="text-[10px] font-bold text-[#9CAFA0] bg-[#9CAFA0]/10 px-2 py-0.5 rounded-full">You</span>
                        )}
                        {u.isGrandAdmin ? (
                          <span className="text-[10px] font-bold text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                            <Crown className="w-2.5 h-2.5" /> Grand Admin
                          </span>
                        ) : u.isAdmin ? (
                          <span className="text-[10px] font-bold text-[#FF9B51] bg-[#FF9B51]/10 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                            <ShieldCheck className="w-2.5 h-2.5" /> Admin
                          </span>
                        ) : null}
                      </div>
                      <p className="text-xs text-gray-500 truncate">{u.email}</p>
                      <div className="flex items-center gap-3 mt-1.5">
                        <span className="text-[11px] text-gray-400">
                          Joined {new Date(u.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                        {u.lastSignIn && (
                          <span className="text-[11px] text-gray-400">
                            Last seen {new Date(u.lastSignIn).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="shrink-0 flex items-center gap-2">
                      {isSelf ? (
                        <span className="text-[11px] text-gray-400 italic bg-gray-50 px-3 py-1.5 rounded-lg">Current session</span>
                      ) : (
                        <>
                          {isViewerGrandAdmin && (
                            u.isAdmin && !u.isGrandAdmin ? (
                              <>
                                <button
                                  onClick={() => setConfirmModal({ userId: u.id, action: 'transfer', name: u.name, email: u.email })}
                                  disabled={updatingUserId === u.id}
                                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-600 hover:text-amber-700 bg-amber-50 hover:bg-amber-100 px-3 py-2 rounded-lg transition-colors disabled:opacity-50"
                                >
                                  <Crown className="w-3.5 h-3.5" /> Make Grand Admin
                                </button>
                                <button
                                  onClick={() => {
                                    if (isLastAdmin) {
                                      showToast('Cannot remove the last admin.', 'error');
                                      return;
                                    }
                                    setConfirmModal({ userId: u.id, action: 'demote', name: u.name, email: u.email });
                                  }}
                                  disabled={updatingUserId === u.id}
                                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-500 hover:text-red-600 bg-red-50 hover:bg-red-100 px-3 py-2 rounded-lg transition-colors disabled:opacity-50"
                                >
                                  <UserMinus className="w-3.5 h-3.5" /> Remove Admin
                                </button>
                              </>
                            ) : !u.isGrandAdmin && (
                              <button
                                onClick={() => setConfirmModal({ userId: u.id, action: 'promote', name: u.name, email: u.email })}
                                disabled={updatingUserId === u.id}
                                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#9CAFA0] hover:text-[#7A8E80] bg-[#9CAFA0]/10 hover:bg-[#9CAFA0]/20 px-3 py-2 rounded-lg transition-colors disabled:opacity-50"
                              >
                                <UserPlus className="w-3.5 h-3.5" /> Make Admin
                              </button>
                            )
                          )}
                          
                          {(!u.isAdmin || isViewerGrandAdmin) && !u.isGrandAdmin && (
                            <button
                              onClick={() => setConfirmModal({ userId: u.id, action: 'delete', name: u.name, email: u.email })}
                              disabled={updatingUserId === u.id}
                              className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-400 hover:text-red-500 bg-gray-50 hover:bg-red-50 px-3 py-2 rounded-lg transition-colors disabled:opacity-50"
                              title="Delete user account permanently"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Confirmation Modal */}
      <AnimatePresence>
        {confirmModal && (
          <ConfirmModal
            title={
              confirmModal.action === 'transfer' ? 'Transfer Grand Admin Role' :
              confirmModal.action === 'promote' ? 'Grant Admin Access' :
              confirmModal.action === 'demote' ? 'Remove Admin Access' :
              'Delete User Account'
            }
            description={
              confirmModal.action === 'transfer' ? (
                <>Are you sure you want to permanently transfer the Grand Admin role to <strong>{confirmModal.name}</strong>? You will lose this role.</>
              ) : confirmModal.action === 'promote' ? (
                <>Grant admin privileges to <strong>{confirmModal.name}</strong> ({confirmModal.email})? They will be able to manage events, users, and settings.</>
              ) : confirmModal.action === 'demote' ? (
                <>Remove admin privileges from <strong>{confirmModal.name}</strong> ({confirmModal.email})? They will lose access to the admin panel.</>
              ) : (
                <>Deactivate <strong>{confirmModal.name}</strong> ({confirmModal.email})? They will lose access to platform data and be removed from active user management lists.</>
              )
            }
            confirmLabel={
              confirmModal.action === 'transfer' ? 'Transfer Role' :
              confirmModal.action === 'promote' ? 'Grant Admin' :
              confirmModal.action === 'demote' ? 'Remove Admin' :
              'Deactivate User'
            }
            confirmColor={
              confirmModal.action === 'transfer' ? 'bg-amber-600 hover:bg-amber-700' :
              confirmModal.action === 'promote' ? 'bg-[#9CAFA0] hover:bg-[#8A9E8F]' :
              'bg-red-500 hover:bg-red-600'
            }
            icon={
              confirmModal.action === 'transfer' ? Crown :
              confirmModal.action === 'promote' ? UserPlus :
              confirmModal.action === 'demote' ? UserMinus :
              Trash2
            }
            isLoading={updatingUserId === confirmModal.userId}
            onConfirm={handleAction}
            onCancel={() => setConfirmModal(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

/* ──────────────────────────────────────────────────── */
/*  Contact Messages Panel                               */
/* ──────────────────────────────────────────────────── */

function MessagesPanel() {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchMessages = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('id, event_id, event_title, sender_name, sender_email, sender_phone, subject, message, created_at, status')
        .eq('type', 'contact')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const mapped: ContactMessage[] = (data || []).map((row) => ({
        id: row.id,
        eventId: row.event_id,
        eventTitle: row.event_title,
        senderName: row.sender_name || 'User',
        senderEmail: row.sender_email || '',
        senderPhone: row.sender_phone,
        subject: row.subject || '',
        message: row.message || '',
        createdAt: row.created_at,
        status: row.status === 'read' ? 'read' : 'unread',
      }));
      setMessages(mapped);
    } catch (err) {
      console.error('Error fetching messages:', err);
    }
    setIsLoading(false);
  };

  useEffect(() => { fetchMessages(); }, []);

  const markAsRead = async (msgId: string) => {
    try {
      const { data, error } = await supabase.rpc('mark_contact_message_read', {
        target_message_id: msgId,
      });

      if (error) throw error;
      const result = Array.isArray(data) ? data[0] : null;
      if (!result?.success) return;

      setMessages((prev) => prev.map((m) => m.id === msgId ? { ...m, status: 'read' } : m));
    } catch (err) {
      console.error('Error marking message as read:', err);
    }
  };

  const unreadCount = messages.filter((m) => m.status === 'unread').length;

  return (
    <div>
      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        {[
          { label: 'Total Messages', count: messages.length, color: 'text-gray-600', bg: 'bg-gray-50', icon: MessageSquare },
          { label: 'Unread', count: unreadCount, color: 'text-[#FF9B51]', bg: 'bg-[#FF9B51]/10', icon: MailOpen },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl border border-gray-100/80 p-5"
              style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.03)' }}
            >
              <div className={`w-9 h-9 rounded-xl ${stat.bg} flex items-center justify-center mb-3`}>
                <Icon className={`w-4 h-4 ${stat.color}`} />
              </div>
              <p className="text-2xl font-bold text-gray-900">{isLoading ? '\u2014' : stat.count}</p>
              <p className="text-xs text-gray-400 font-medium">{stat.label}</p>
            </motion.div>
          );
        })}
      </div>

      {/* Refresh */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-sm font-bold text-gray-700">All Platform Messages</h3>
          <p className="text-xs text-gray-400 mt-0.5">Oversight view — organizers receive these directly in their inbox</p>
        </div>
        <button
          onClick={fetchMessages}
          disabled={isLoading}
          className="w-9 h-9 rounded-xl bg-white border border-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-8 h-8 border-3 border-gray-200 border-t-[#9CAFA0] rounded-full animate-spin" />
          <p className="text-sm text-gray-400">Loading messages...</p>
        </div>
      ) : messages.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl border border-gray-100/80 p-12 text-center"
          style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.03)' }}
        >
          <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-4">
            <MessageSquare className="w-7 h-7 text-gray-300" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">No messages yet</h3>
          <p className="text-sm text-gray-400">Contact messages from users will appear here.</p>
        </motion.div>
      ) : (
        <div className="space-y-3">
          {messages.map((msg) => {
            const isExpanded = expandedId === msg.id;
            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className={`bg-white rounded-2xl border overflow-hidden transition-all duration-300 cursor-pointer ${
                  msg.status === 'unread' ? 'border-[#FF9B51]/30 shadow-md shadow-[#FF9B51]/5' : 'border-gray-100/80'
                }`}
                style={{ boxShadow: msg.status === 'unread' ? undefined : '0 1px 3px rgba(0,0,0,0.04)' }}
                onClick={() => {
                  setExpandedId(isExpanded ? null : msg.id);
                  if (msg.status === 'unread') markAsRead(msg.id);
                }}
              >
                <div className="p-5">
                  <div className="flex items-start gap-3">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                      msg.status === 'unread' ? 'bg-[#FF9B51]/10' : 'bg-gray-50'
                    }`}>
                      {msg.status === 'unread' ? (
                        <MailOpen className="w-4 h-4 text-[#FF9B51]" />
                      ) : (
                        <MailCheck className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className={`text-sm font-bold truncate ${msg.status === 'unread' ? 'text-gray-900' : 'text-gray-600'}`}>
                          {msg.senderName}
                        </p>
                        {msg.status === 'unread' && (
                          <span className="w-2 h-2 rounded-full bg-[#FF9B51] shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-gray-500 truncate">{msg.subject || msg.message.slice(0, 80)}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-[11px] text-gray-400">{msg.senderEmail}</span>
                        <span className="text-[11px] text-gray-300">
                          {new Date(msg.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  </div>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="mt-4 pt-4 border-t border-gray-100"
                      >
                        {msg.eventTitle && (
                          <p className="text-xs text-gray-400 mb-2">
                            Re: <span className="font-semibold text-gray-500">{msg.eventTitle}</span>
                          </p>
                        )}
                        <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{msg.message}</p>
                        {msg.senderPhone && (
                          <p className="text-xs text-gray-400 mt-3 flex items-center gap-1">
                            <Phone className="w-3 h-3" /> {msg.senderPhone}
                          </p>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ──────────────────────────────────────────────────── */
/*  Footer                                               */
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
                {[{ label: 'Browse Events', to: '/browse' }, { label: 'Submit Event', to: '/submit' }, { label: 'Help Center', to: '/help' }].map(({ label, to }) => (
                  <li key={label}><Link to={to} className="text-gray-400 hover:text-white transition-colors text-sm">{label}</Link></li>
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
/*  Admin Page                                           */
/* ──────────────────────────────────────────────────── */

export function AdminPage() {
  const { isLoggedIn, isAdmin, user, claimAdmin } = useAuth();
  const [events, setEvents] = useState<ServerEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabFilter>('pending_review');
  const [previewEvent, setPreviewEvent] = useState<ServerEvent | null>(null);
  const [claimingAdmin, setClaimingAdmin] = useState(false);
  const [claimMessage, setClaimMessage] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<AdminSection>('events');
  const [deleteConfirm, setDeleteConfirm] = useState<ServerEvent | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = useCallback((message: string, type: 'success' | 'error') => {
    setToast({ message, type });
  }, []);

  const toUiStatus = (status: string | null | undefined): EventStatus => {
    if (status === 'approved' || status === 'rejected') return status;
    return 'pending_review';
  };

  const fetchEvents = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('events')
        .select('id, title, description, category, tags, start_date, end_date, start_time, end_time, venue_name, address, city, pricing_type, price, capacity, cover_image, organizer_name, organizer_email, organizer_phone, website, status, created_at, updated_at')
        .eq('is_draft', false)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const mapped: ServerEvent[] = (data || []).map((row) => ({
        id: row.id,
        title: row.title,
        description: row.description,
        category: row.category || 'General',
        tags: Array.isArray(row.tags) ? row.tags : [],
        startDate: row.start_date || '',
        endDate: row.end_date,
        startTime: row.start_time || '',
        endTime: row.end_time,
        venueName: row.venue_name || '',
        address: row.address || '',
        city: row.city || '',
        pricingType: row.pricing_type || 'free',
        price: row.price != null ? String(row.price) : null,
        capacity: row.capacity != null ? String(row.capacity) : null,
        coverImage: row.cover_image,
        organizerName: row.organizer_name || '',
        organizerEmail: row.organizer_email || '',
        organizerPhone: row.organizer_phone || '',
        website: row.website || '',
        status: toUiStatus(row.status),
        createdAt: row.created_at,
        reviewedAt: row.updated_at,
      }));

      setEvents(mapped);
    } catch (err) {
      console.error('Failed to fetch events for admin:', err);
    }
    setIsLoading(false);
  };

  useEffect(() => { if (isAdmin) fetchEvents(); }, [isAdmin]);

  const updateStatus = async (eventId: string, status: EventStatus) => {
    setUpdatingId(eventId);
    try {
      const { data, error } = await supabase.rpc('admin_update_event_status', {
        target_event_id: eventId,
        next_status: status,
      });

      if (error) {
        showToast(error.message || 'Failed to update status', 'error');
        setUpdatingId(null);
        return;
      }

      const result = Array.isArray(data) ? data[0] : null;
      if (result?.success) {
        const now = result.reviewed_at || new Date().toISOString();
        setEvents((prev) =>
          prev.map((e) => e.id === eventId ? { ...e, status, reviewedAt: now } : e)
        );
        if (previewEvent?.id === eventId) {
          setPreviewEvent((prev) => prev ? { ...prev, status, reviewedAt: now } : null);
        }
        const statusLabel = status === 'approved' ? 'approved' : status === 'rejected' ? 'rejected' : 'reverted to pending';
        showToast(`Event ${statusLabel} successfully`, 'success');
      } else {
        console.error('Failed to update event status:', result?.message);
        showToast(result?.message || 'Failed to update status', 'error');
      }
    } catch (err) {
      console.error('Error updating event status:', err);
      showToast('An error occurred', 'error');
    }
    setUpdatingId(null);
  };

  const deleteEvent = async (eventId: string) => {
    setUpdatingId(eventId);
    try {
      const { data, error } = await supabase.rpc('admin_delete_event', {
        target_event_id: eventId,
      });

      if (error) {
        showToast(error.message || 'Failed to delete event', 'error');
        setUpdatingId(null);
        setDeleteConfirm(null);
        return;
      }

      const result = Array.isArray(data) ? data[0] : null;
      if (result?.success) {
        setEvents((prev) => prev.filter((e) => e.id !== eventId));
        if (previewEvent?.id === eventId) setPreviewEvent(null);
        showToast('Event deleted permanently', 'success');
      } else {
        console.error('Failed to delete event:', result?.message);
        showToast(result?.message || 'Failed to delete event', 'error');
      }
    } catch (err) {
      console.error('Error deleting event:', err);
      showToast('An error occurred', 'error');
    }
    setUpdatingId(null);
    setDeleteConfirm(null);
  };

  const handleClaimAdmin = async () => {
    setClaimingAdmin(true);
    setClaimMessage(null);
    const result = await claimAdmin();
    if (result.error) {
      setClaimMessage(result.error);
    } else {
      setClaimMessage(result.message || 'You are now an admin!');
    }
    setClaimingAdmin(false);
  };

  const filteredEvents = activeTab === 'all' ? events : events.filter((e) => e.status === activeTab);

  const counts = {
    all: events.length,
    pending_review: events.filter((e) => e.status === 'pending_review').length,
    approved: events.filter((e) => e.status === 'approved').length,
    rejected: events.filter((e) => e.status === 'rejected').length,
  };

  const tabs: { key: TabFilter; label: string; icon: React.ElementType; color: string }[] = [
    { key: 'pending_review', label: 'Pending', icon: Clock, color: 'text-amber-600 bg-amber-50 border-amber-200' },
    { key: 'approved', label: 'Approved', icon: CheckCircle, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
    { key: 'rejected', label: 'Rejected', icon: XCircle, color: 'text-red-500 bg-red-50 border-red-200' },
    { key: 'all', label: 'All Events', icon: Calendar, color: 'text-gray-600 bg-gray-50 border-gray-200' },
  ];

  /* Not logged in */
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex flex-col">
        <section className="relative w-full overflow-hidden bg-[#9CAFA0]">
          <div className="relative pt-36 pb-24 md:pt-44 md:pb-32 px-6 flex flex-col items-center">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/15 rounded-full px-4 py-1.5 mb-5">
              <ShieldCheck className="w-3.5 h-3.5 text-[#FFB070]" />
              <span className="text-xs font-medium text-white/80 tracking-wide uppercase">Admin Access Required</span>
            </div>
            <h1 className="text-4xl md:text-[56px] font-bold tracking-tight text-white leading-[1.08] text-center mb-4">Admin Panel</h1>
            <p className="text-lg text-white/60 max-w-md mx-auto text-center">Please sign in to manage event submissions</p>
          </div>
          <div className="absolute bottom-0 left-0 right-0">
            <svg viewBox="0 0 1440 60" fill="none" className="w-full" preserveAspectRatio="none">
              <path d="M0 60V30C240 0 480 0 720 30C960 60 1200 60 1440 30V60H0Z" fill="#FCFCFC" />
            </svg>
          </div>
        </section>
        <div className="flex-1 bg-[#FCFCFC] flex items-center justify-center px-6 py-20">
          <div className="bg-white rounded-3xl border border-gray-100/80 p-10 text-center max-w-md" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.03)' }}>
            <ShieldCheck className="w-12 h-12 text-[#9CAFA0] mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Sign in required</h2>
            <p className="text-sm text-gray-500 mb-6">You must be logged in to access the admin panel.</p>
            <Link to="/login" className="inline-flex items-center gap-2 bg-[#FF9B51] hover:bg-[#E88A3E] text-white px-6 py-3 rounded-xl font-semibold text-sm shadow-lg shadow-orange-500/15 transition-all">
              Sign In <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
</div>
    );
  }

  /* Not admin */
  if (!isAdmin) {
    return (
      <div className="min-h-screen flex flex-col">
        <section className="relative w-full overflow-hidden bg-[#9CAFA0]">
          <div className="relative pt-36 pb-24 md:pt-44 md:pb-32 px-6 flex flex-col items-center">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/15 rounded-full px-4 py-1.5 mb-5">
              <ShieldCheck className="w-3.5 h-3.5 text-[#FFB070]" />
              <span className="text-xs font-medium text-white/80 tracking-wide uppercase">Admin Access Required</span>
            </div>
            <h1 className="text-4xl md:text-[56px] font-bold tracking-tight text-white leading-[1.08] text-center mb-4">Admin Panel</h1>
            <p className="text-lg text-white/60 max-w-md mx-auto text-center">Manage events, users, and platform messages</p>
          </div>
          <div className="absolute bottom-0 left-0 right-0">
            <svg viewBox="0 0 1440 60" fill="none" className="w-full" preserveAspectRatio="none">
              <path d="M0 60V30C240 0 480 0 720 30C960 60 1200 60 1440 30V60H0Z" fill="#FCFCFC" />
            </svg>
          </div>
        </section>
        <div className="flex-1 bg-[#FCFCFC] flex items-center justify-center px-6 py-20">
          <div className="bg-white rounded-3xl border border-gray-100/80 p-10 text-center max-w-sm" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.03)' }}>
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#9CAFA0] to-[#8FA297] flex items-center justify-center mx-auto mb-5 shadow-lg shadow-[#9CAFA0]/20">
              <ShieldCheck className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Access Denied</h2>
            <p className="text-sm text-gray-500 leading-relaxed">
              You don't have admin access.
            </p>
          </div>
        </div>
</div>
    );
  }

  /* Main admin dashboard */
  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero */}
      <section className="relative w-full overflow-hidden bg-[#9CAFA0]">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full bg-white/[0.04]" />
          <div className="absolute -bottom-24 -left-24 w-[380px] h-[380px] rounded-full bg-white/[0.04]" />
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
        </div>

        <div className="relative pt-36 pb-24 md:pt-44 md:pb-32 px-6 flex flex-col items-center">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/15 rounded-full px-4 py-1.5 mb-5">
            <ShieldCheck className="w-3.5 h-3.5 text-[#FFB070]" />
            <span className="text-xs font-medium text-white/80 tracking-wide uppercase">Admin Dashboard</span>
          </motion.div>

          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.05 }}
            className="text-4xl md:text-[56px] font-bold tracking-tight text-white leading-[1.08] text-center mb-4">
            Event <span className="text-[#FFB070]">Management</span>
          </motion.h1>

          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}
            className="text-lg text-white/60 max-w-lg mx-auto text-center">
            Full control over events, users, and messages
          </motion.p>
        </div>

        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 60" fill="none" className="w-full" preserveAspectRatio="none">
            <path d="M0 60V30C240 0 480 0 720 30C960 60 1200 60 1440 30V60H0Z" fill="#FCFCFC" />
          </svg>
        </div>
      </section>

      {/* Content */}
      <div className="flex-1 bg-[#FCFCFC]">
        <div className="max-w-4xl mx-auto w-full px-6 md:px-10 py-10">

          {/* Section Toggle: Events / Users / Messages */}
          <div className="flex items-center gap-2 mb-8 bg-white rounded-2xl border border-gray-100/80 p-1.5" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            {([
              { key: 'events' as AdminSection, label: 'Events', icon: LayoutDashboard },
              { key: 'users' as AdminSection, label: 'Users', icon: Users },
              { key: 'messages' as AdminSection, label: 'Messages', icon: MessageSquare },
            ]).map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveSection(key)}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  activeSection === key
                    ? 'bg-[#9CAFA0] text-white shadow-md shadow-[#9CAFA0]/20'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>

          {/* EVENTS SECTION */}
          {activeSection === 'events' && (
            <>
              {/* Stats cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                {[
                  { label: 'Pending', count: counts.pending_review, color: 'text-amber-600', bg: 'bg-amber-50', icon: Clock },
                  { label: 'Approved', count: counts.approved, color: 'text-emerald-600', bg: 'bg-emerald-50', icon: CheckCircle },
                  { label: 'Rejected', count: counts.rejected, color: 'text-red-500', bg: 'bg-red-50', icon: XCircle },
                  { label: 'Total', count: counts.all, color: 'text-gray-600', bg: 'bg-gray-50', icon: Calendar },
                ].map((stat) => {
                  const Icon = stat.icon;
                  return (
                    <motion.div
                      key={stat.label}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white rounded-2xl border border-gray-100/80 p-5"
                      style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.03)' }}
                    >
                      <div className={`w-9 h-9 rounded-xl ${stat.bg} flex items-center justify-center mb-3`}>
                        <Icon className={`w-4 h-4 ${stat.color}`} />
                      </div>
                      <p className="text-2xl font-bold text-gray-900">{isLoading ? '\u2014' : stat.count}</p>
                      <p className="text-xs text-gray-400 font-medium">{stat.label}</p>
                    </motion.div>
                  );
                })}
              </div>

              {/* Tabs + Refresh */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex gap-2 overflow-x-auto">
                  {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.key;
                    return (
                      <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 whitespace-nowrap border ${
                          isActive
                            ? tab.color
                            : 'text-gray-400 bg-white border-gray-100 hover:bg-gray-50 hover:text-gray-600'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        {tab.label}
                        <span className={`ml-1 ${isActive ? 'opacity-80' : 'opacity-50'}`}>({counts[tab.key]})</span>
                      </button>
                    );
                  })}
                </div>
                <button
                  onClick={fetchEvents}
                  disabled={isLoading}
                  className="w-9 h-9 rounded-xl bg-white border border-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors shrink-0"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                </button>
              </div>

              {/* Event list */}
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                  <div className="w-8 h-8 border-3 border-gray-200 border-t-[#9CAFA0] rounded-full animate-spin" />
                  <p className="text-sm text-gray-400">Loading events...</p>
                </div>
              ) : filteredEvents.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-3xl border border-gray-100/80 p-12 text-center"
                  style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.03)' }}
                >
                  <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-4">
                    {activeTab === 'pending_review' ? <Clock className="w-7 h-7 text-gray-300" /> : <Calendar className="w-7 h-7 text-gray-300" />}
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">
                    {activeTab === 'pending_review' ? 'No pending events' : `No ${activeTab === 'all' ? '' : activeTab} events`}
                  </h3>
                  <p className="text-sm text-gray-400 max-w-xs mx-auto">
                    {activeTab === 'pending_review'
                      ? 'All submitted events have been reviewed. Check back later for new submissions.'
                      : 'No events found with this status filter.'}
                  </p>
                </motion.div>
              ) : (
                <div className="space-y-4">
                  <AnimatePresence mode="popLayout">
                    {filteredEvents.map((event) => (
                      <AdminEventCard
                        key={event.id}
                        event={event}
                        onView={() => setPreviewEvent(event)}
                        onApprove={() => updateStatus(event.id, 'approved')}
                        onReject={() => updateStatus(event.id, 'rejected')}
                        onRevert={() => updateStatus(event.id, 'pending_review')}
                        onDelete={() => setDeleteConfirm(event)}
                        isUpdating={updatingId === event.id}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </>
          )}

          {/* USERS SECTION */}
          {activeSection === 'users' && (
            <UserManagementPanel showToast={showToast} />
          )}

          {/* MESSAGES SECTION */}
          {activeSection === 'messages' && (
            <MessagesPanel />
          )}
        </div>
      </div>

      {/* Event Preview Modal */}
      <AnimatePresence>
        {previewEvent && (
          <EventPreviewModal
            event={previewEvent}
            onClose={() => setPreviewEvent(null)}
            onApprove={() => updateStatus(previewEvent.id, 'approved')}
            onReject={() => updateStatus(previewEvent.id, 'rejected')}
            onRevert={() => updateStatus(previewEvent.id, 'pending_review')}
            onDelete={() => { setPreviewEvent(null); setDeleteConfirm(previewEvent); }}
            isUpdating={updatingId === previewEvent.id}
          />
        )}
      </AnimatePresence>

      {/* Delete Event Confirmation */}
      <AnimatePresence>
        {deleteConfirm && (
          <ConfirmModal
            title="Delete Event"
            description={<>Permanently delete <strong>"{deleteConfirm.title}"</strong>? This action cannot be undone and the event will be removed from all listings.</>}
            confirmLabel="Delete Event"
            confirmColor="bg-red-500 hover:bg-red-600"
            icon={Trash2}
            isLoading={updatingId === deleteConfirm.id}
            onConfirm={() => deleteEvent(deleteConfirm.id)}
            onCancel={() => setDeleteConfirm(null)}
          />
        )}
      </AnimatePresence>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />
        )}
      </AnimatePresence>

      
    </div>
  );
}
