import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './auth-context';
import { supabase } from '../../utils/supabaseClient';
import { toast } from 'sonner';

interface FavoritesContextValue {
  favorites: string[]; // Array of event IDs
  isFavorite: (id: string) => boolean;
  toggleFavorite: (eventId: string) => Promise<void>;
  removeFavorite: (id: string) => Promise<void>;
  clearFavorites: () => void;
  count: number;
  isLoading: boolean;
}

const FavoritesContext = createContext<FavoritesContextValue | undefined>(undefined);

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const { user, isLoggedIn } = useAuth();
  const [favorites, setFavorites] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch favorites from Postgres when user logs in
  useEffect(() => {
    if (!isLoggedIn || !user?.id) {
      setFavorites([]);
      return;
    }

    const fetchFavorites = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('favorites')
          .select('event_id')
          .eq('user_id', user.id);

        if (error) {
          throw error;
        }

        if (Array.isArray(data)) {
          setFavorites(data.map((row) => row.event_id));
        }
      } catch (error) {
        console.error('Error fetching favorites:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFavorites();
  }, [isLoggedIn, user?.id]);

  const isFavorite = useCallback(
    (id: string) => favorites.includes(id),
    [favorites],
  );

  const toggleFavorite = useCallback(async (eventId: string) => {
    if (!isLoggedIn || !user?.id) {
      toast.info('Login Required', {
        description: 'Please log in to save and view favorites.',
        action: { label: 'Log In', onClick: () => window.location.href = '/login' }
      });
      return;
    }

    const wasFavorite = favorites.includes(eventId);

    // Optimistic update
    setFavorites((prev) => 
      wasFavorite 
        ? prev.filter((id) => id !== eventId)
        : [...prev, eventId]
    );

    try {
      if (wasFavorite) {
        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('event_id', eventId);

        if (error) {
          throw error;
        }
      } else {
        const { error } = await supabase
          .from('favorites')
          .insert({ user_id: user.id, event_id: eventId });

        if (error) {
          throw error;
        }
      }
    } catch (error) {
      // Revert on error
      setFavorites((prev) => 
        wasFavorite 
          ? [...prev, eventId]
          : prev.filter((id) => id !== eventId)
      );
      console.error('Error toggling favorite:', error);
    }
  }, [favorites, isLoggedIn, user?.id]);

  const removeFavorite = useCallback(async (eventId: string) => {
    if (!isLoggedIn || !user?.id) return;

    // Optimistic update
    setFavorites((prev) => prev.filter((id) => id !== eventId));

    try {
      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('user_id', user.id)
        .eq('event_id', eventId);

      if (error) {
        throw error;
      }
    } catch (error) {
      // Revert on error
      setFavorites((prev) => [...prev, eventId]);
      console.error('Error removing favorite:', error);
    }
  }, [isLoggedIn, user?.id]);

  const clearFavorites = useCallback(() => setFavorites([]), []);

  return (
    <FavoritesContext.Provider
      value={{ 
        favorites, 
        isFavorite, 
        toggleFavorite, 
        removeFavorite, 
        clearFavorites, 
        count: favorites.length,
        isLoading 
      }}
    >
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error('useFavorites must be used within FavoritesProvider');
  return ctx;
}
