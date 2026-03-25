import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../../utils/supabaseClient';

export { supabase };

/* ── Types ── */
export interface AuthUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  accessToken: string | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  isAdmin: boolean;
  noAdminExists: boolean;
  login: (email: string, password: string) => Promise<{ error?: string }>;
  signup: (name: string, email: string, password: string) => Promise<{ error?: string }>;
  loginWithGoogle: () => Promise<{ error?: string }>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error?: string }>;
  verifyEmail: (email: string) => Promise<{ error?: string }>;
  updatePassword: (email: string, newPassword: string) => Promise<{ error?: string }>;
  claimAdmin: () => Promise<{ error?: string; message?: string }>;
  checkAdminExists: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

/* ── Helpers ── */
function mapSupabaseUser(user: User): AuthUser {
  return {
    id: user.id,
    name: user.user_metadata?.name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
    email: user.email || '',
    avatar: user.user_metadata?.avatar_url || undefined,
  };
}

/* ── Provider ── */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [adminStatus, setAdminStatus] = useState(false);
  const [noAdminExists, setNoAdminExists] = useState(false);

  const ensureProfile = useCallback(async (authUser: User) => {
    try {
      await supabase.from('profiles').upsert(
        { id: authUser.id, email: authUser.email || '' },
        { onConflict: 'id' }
      );
    } catch (err) {
      console.warn('Failed to ensure profile row:', err);
    }
  }, []);

  const checkAdminStatus = useCallback(async (userId?: string) => {
    try {
      const uid = userId || (await supabase.auth.getUser()).data.user?.id;
      if (!uid) {
        setAdminStatus(false);
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', uid)
        .maybeSingle();

      if (error) {
        console.warn('Failed to read admin status:', error.message);
        setAdminStatus(false);
        return;
      }

      setAdminStatus(!!data?.is_admin);
    } catch (err) {
      console.warn('Failed to check admin status:', err);
      setAdminStatus(false);
    }
  }, []);

  // Best-effort check for whether any admin profile exists.
  const checkAdminExists = useCallback(async (): Promise<boolean> => {
    try {
      const { data, error } = await supabase.rpc('admin_exists');

      if (error) {
        console.warn('Admin existence check could not be verified:', error.message);
        setNoAdminExists(false);
        return true;
      }

      const exists = !!data;
      setNoAdminExists(!exists);
      return exists;
    } catch (err) {
      console.warn('Unexpected admin exists check error:', err);
      setNoAdminExists(false);
      return true;
    }
  }, []);

  // Listen to auth state changes
  useEffect(() => {
    const initialize = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(mapSupabaseUser(session.user));
        setAccessToken(session.access_token || null);
        await ensureProfile(session.user);
        await checkAdminStatus(session.user.id);
      } else {
        setUser(null);
        setAccessToken(null);
        setAdminStatus(false);
      }
      setIsLoading(false);
    };

    initialize();

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'PASSWORD_RECOVERY') {
          window.location.href = '/forgot-password#type=recovery';
          return;
        }

        const syncAuthState = async () => {
          if (session?.user) {
            setUser(mapSupabaseUser(session.user));
            setAccessToken(session.access_token || null);
            await ensureProfile(session.user);
            await checkAdminStatus(session.user.id);
          } else {
            setUser(null);
            setAccessToken(null);
            setAdminStatus(false);
          }
          setIsLoading(false);
        };

        syncAuthState();
      }
    );

    return () => subscription.unsubscribe();
  }, [checkAdminStatus]);

  // Email/password login
  const login = useCallback(async (email: string, password: string): Promise<{ error?: string }> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        console.error('Login error:', error.message);
        return { error: error.message };
      }
      if (data.session?.access_token) {
        setAccessToken(data.session.access_token);
      }
      if (data.user) {
        setUser(mapSupabaseUser(data.user));
        await ensureProfile(data.user);
        await checkAdminStatus(data.user.id);
      }
      return {};
    } catch (err: any) {
      console.error('Unexpected login error:', err);
      return { error: err.message || 'An unexpected error occurred' };
    }
  }, []);

  // Signup directly with Supabase Auth
  const signup = useCallback(async (name: string, email: string, password: string): Promise<{ error?: string }> => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name },
        },
      });

      if (error) {
        console.error('Signup error:', error.message);
        return { error: error.message };
      }

      if (data.user) {
        await ensureProfile(data.user);
      }

      // If signup did not create a session (email confirmation enabled), show a helpful message.
      if (!data.session) {
        return { error: 'Account created. Please check your email to confirm your account before signing in.' };
      }

      return {};
    } catch (err: any) {
      console.error('Unexpected signup error:', err);
      return { error: err.message || 'An unexpected error occurred during signup' };
    }
  }, [checkAdminStatus, ensureProfile]);

  // Google OAuth
  const loginWithGoogle = useCallback(async (): Promise<{ error?: string }> => {
    try {
      // Do not forget to complete setup at https://supabase.com/docs/guides/auth/social-login/auth-google
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        },
      });
      if (error) {
        console.error('Google OAuth error:', error.message);
        return { error: error.message };
      }
      return {};
    } catch (err: any) {
      console.error('Unexpected Google OAuth error:', err);
      return { error: err.message || 'Google sign-in failed' };
    }
  }, []);

  // Logout
  const logout = useCallback(async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setAccessToken(null);
      setAdminStatus(false);
    } catch (err) {
      console.error('Logout error:', err);
    }
  }, []);

  // Password reset request
  const resetPassword = useCallback(async (email: string): Promise<{ error?: string }> => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin,
      });
      if (error) {
        return { error: error.message };
      }
      return {};
    } catch (err: any) {
      return { error: err.message || 'Reset request failed' };
    }
  }, []);

  // Verify email
  const verifyEmail = useCallback(async (email: string): Promise<{ error?: string }> => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin,
      });
      if (error) {
        return { error: error.message };
      }
      return {};
    } catch (err: any) {
      return { error: err.message || 'Email verification failed' };
    }
  }, []);

  // Update password
  const updatePassword = useCallback(async (_email: string, newPassword: string): Promise<{ error?: string }> => {
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        return { error: error.message };
      }
      return {};
    } catch (err: any) {
      return { error: err.message || 'Password update failed' };
    }
  }, []);

  // Claim admin status
  const claimAdmin = useCallback(async (): Promise<{ error?: string; message?: string }> => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        return { error: 'No active session. Please log in again.' };
      }

      const { data, error } = await supabase.rpc('claim_first_admin');

      if (error) {
        return { error: error.message };
      }

      const result = Array.isArray(data) ? data[0] : null;
      if (!result?.success) {
        return { error: result?.message || 'Admin claim failed' };
      }

      setAdminStatus(true);
      setNoAdminExists(false);
      return { message: result?.message || 'Admin claim successful' };
    } catch (err: any) {
      console.error('Unexpected error claiming admin:', err);
      return { error: err.message || 'Admin claim failed unexpectedly' };
    }
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      accessToken,
      isLoggedIn: !!user,
      isLoading,
      isAdmin: adminStatus,
      noAdminExists,
      login,
      signup,
      loginWithGoogle,
      logout,
      resetPassword,
      verifyEmail,
      updatePassword,
      claimAdmin,
      checkAdminExists,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}