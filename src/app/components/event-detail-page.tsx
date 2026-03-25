import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { ArrowLeft, Loader } from 'lucide-react';
import { EventDetailModal, type EventDetailData } from './event-detail-modal';
import { supabase } from '../../utils/supabaseClient';

const PLACEHOLDER_IMAGE = 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=800';

function toDisplayDate(rawDate?: string | null): string {
  if (!rawDate) return 'TBD';
  const d = new Date(`${rawDate}T00:00:00`);
  if (Number.isNaN(d.getTime())) return rawDate;
  return d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' });
}

function normalizeStatus(status?: string): 'pending' | 'approved' | 'rejected' {
  if (status === 'approved' || status === 'rejected' || status === 'pending') return status;
  return 'pending';
}

export function EventDetailPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const [event, setEvent] = useState<EventDetailData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEvent = async () => {
      if (!eventId) {
        setError('No event ID provided');
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('events')
          .select('*')
          .eq('id', eventId)
          .eq('is_draft', false)
          .maybeSingle();

        if (error || !data) {
          throw new Error('Event not found');
        }

        const status = normalizeStatus(data.status);
        if (status !== 'approved') {
          throw new Error('Event not found');
        }

        const startDate = data.start_date || data.startDate || null;
        const startTime = data.start_time || data.startTime || 'TBD';
        const endTime = data.end_time || data.endTime || '';
        const timeDisplay = endTime ? `${startTime} – ${endTime}` : startTime;

        setEvent({
          id: data.id,
          image: data.cover_image || data.coverImage || PLACEHOLDER_IMAGE,
          title: data.title || 'Untitled Event',
          date: toDisplayDate(startDate),
          time: timeDisplay,
          location: [data.venue_name || data.venueName, data.address, data.city].filter(Boolean).join(', ') || 'Location TBA',
          tag: data.category || 'Event',
          price: data.pricing_type === 'paid' || data.pricingType === 'paid'
            ? `${data.price || 0}€`
            : undefined,
          isFree: data.pricing_type === 'free' || data.pricingType === 'free',
          attendees: 0,
          description: data.description || undefined,
        });
      } catch (err) {
        console.error('Error fetching event:', err);
        setError('Event not found or has been removed');
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvent();
  }, [eventId]);

  const handleClose = () => {
    navigate(-1); // Go back to previous page
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#9CAFA0] via-white to-white pt-32 pb-16 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-center py-20">
          <Loader className="w-8 h-8 text-[#9CAFA0] animate-spin" />
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#9CAFA0] via-white to-white pt-32 pb-16 px-4">
        <div className="max-w-7xl mx-auto">
          <button
            onClick={handleClose}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Go Back
          </button>
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-3">Event Not Found</h1>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => navigate('/')}
              className="bg-[#9CAFA0] hover:bg-[#8A9D8E] text-white px-6 py-3 rounded-xl font-semibold transition-colors"
            >
              Return to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#9CAFA0] via-white to-white">
      <EventDetailModal event={event} onClose={handleClose} />
    </div>
  );
}