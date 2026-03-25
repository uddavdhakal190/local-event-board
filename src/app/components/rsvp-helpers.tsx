import React from 'react';
import { supabase } from './auth-context';

/* ── Types ── */
export interface RsvpUser {
  name: string;
  avatar: string | null;
}

export interface RsvpData {
  count: number;
  users: RsvpUser[];
  hasRsvpd: boolean;
}

function nameFromEmail(email?: string | null): string {
  if (!email) return 'User';
  return email.split('@')[0] || 'User';
}

async function getEventRsvpCount(eventId: string): Promise<number> {
  const { data, error } = await supabase.rpc('rsvp_counts_by_event_ids', {
    event_ids: [eventId],
  });

  if (error || !Array.isArray(data) || data.length === 0) return 0;
  return Number(data[0].rsvp_count || 0);
}

/* ── Batch fetch RSVP data for multiple events ── */
export async function fetchRsvpBatch(eventIds: string[]): Promise<Record<string, RsvpData>> {
  if (eventIds.length === 0) return {};

  const result: Record<string, RsvpData> = {};
  eventIds.forEach((id) => {
    result[id] = { count: 0, users: [], hasRsvpd: false };
  });

  try {
    const { data: { user } } = await supabase.auth.getUser();

    const { data: countRows, error: countError } = await supabase.rpc('rsvp_counts_by_event_ids', {
      event_ids: eventIds,
    });

    if (countError) {
      throw countError;
    }

    (countRows || []).forEach((row: any) => {
      const current = result[row.event_id] || { count: 0, users: [], hasRsvpd: false };
      current.count = Number(row.rsvp_count || 0);
      result[row.event_id] = current;
    });

    // Keep hasRsvpd behavior for logged-in users via user-scoped RLS query.
    if (user?.id) {
      const { data: mine, error: mineError } = await supabase
        .from('rsvps')
        .select('event_id')
        .eq('user_id', user.id)
        .in('event_id', eventIds);

      if (!mineError) {
        (mine || []).forEach((row: any) => {
          const current = result[row.event_id] || { count: 0, users: [], hasRsvpd: false };
          current.hasRsvpd = true;
          result[row.event_id] = current;
        });
      }
    }

    return result;
  } catch (err) {
    console.error('Failed to fetch RSVP batch:', err);
  }

  return result;
}

/* ── Fetch RSVP data for a single event ── */
export async function fetchEventRsvp(eventId: string): Promise<RsvpData> {
  try {
    const batch = await fetchRsvpBatch([eventId]);
    return batch[eventId] || { count: 0, users: [], hasRsvpd: false };
  } catch (err) {
    console.error('Failed to fetch event RSVP:', err);
  }
  return { count: 0, users: [], hasRsvpd: false };
}

/* ── RSVP / un-RSVP ── */
export async function rsvpToEvent(eventId: string): Promise<{ success: boolean; error?: string; count?: number }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.id) return { success: false, error: 'Please log in to RSVP' };

    const { error } = await supabase
      .from('rsvps')
      .insert({ user_id: user.id, event_id: eventId });

    if (error && error.code !== '23505') {
      return { success: false, error: error.message || 'RSVP failed' };
    }

    const count = await getEventRsvpCount(eventId);
    return { success: true, count };
  } catch (err: any) {
    return { success: false, error: err.message || 'RSVP failed' };
  }
}

export async function removeRsvp(eventId: string): Promise<{ success: boolean; error?: string; count?: number }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.id) return { success: false, error: 'Not authenticated' };

    const { error } = await supabase
      .from('rsvps')
      .delete()
      .eq('event_id', eventId)
      .eq('user_id', user.id);

    if (error) {
      return { success: false, error: error.message || 'Failed to remove RSVP' };
    }

    const count = await getEventRsvpCount(eventId);
    return { success: true, count };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to remove RSVP' };
  }
}

/* ── Attendee Avatars Component ── */
export function AttendeeAvatars({ users, count, size = 'sm' }: {
  users: RsvpUser[];
  count: number;
  size?: 'sm' | 'md';
}) {
  const avatarSize = size === 'sm' ? 'w-6 h-6' : 'w-8 h-8';
  const textSize = size === 'sm' ? 'text-xs' : 'text-sm';
  const spacing = size === 'sm' ? '-space-x-1.5' : '-space-x-2';
  const maxAvatars = size === 'sm' ? 3 : 5;
  const borderWidth = size === 'sm' ? 'border-2' : 'border-2';

  const displayUsers = users.slice(0, maxAvatars);

  if (count === 0) {
    return (
      <span className={`${textSize} text-gray-400`}>Be first to join!</span>
    );
  }

  // Generate a color from name for users without avatars
  const getInitialColor = (name: string): string => {
    const colors = [
      'linear-gradient(135deg, #9CAFA0, #7A8E80)',
      'linear-gradient(135deg, #FFB070, #FF9B51)',
      'linear-gradient(135deg, #A0B4C7, #8A9FB5)',
      'linear-gradient(135deg, #D4A0D4, #B87BB8)',
      'linear-gradient(135deg, #F0A0A0, #D88888)',
      'linear-gradient(135deg, #A0D4A0, #88B888)',
      'linear-gradient(135deg, #D4C0A0, #B8A488)',
    ];
    const idx = name.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0) % colors.length;
    return colors[idx];
  };

  return (
    <div className="flex items-center gap-2">
      <div className={`flex ${spacing}`}>
        {displayUsers.map((u, i) => (
          u.avatar ? (
            <img
              key={i}
              src={u.avatar}
              alt={u.name}
              title={u.name}
              className={`${avatarSize} rounded-full ${borderWidth} border-white object-cover`}
            />
          ) : (
            <div
              key={i}
              title={u.name}
              className={`${avatarSize} rounded-full ${borderWidth} border-white flex items-center justify-center text-white font-bold`}
              style={{
                background: getInitialColor(u.name),
                fontSize: size === 'sm' ? '10px' : '12px',
              }}
            >
              {u.name.charAt(0).toUpperCase()}
            </div>
          )
        ))}
      </div>
      <span className={`${textSize} text-gray-400`}>
        {count} going
      </span>
    </div>
  );
}
