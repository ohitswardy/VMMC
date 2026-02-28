import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UserProfile } from '../lib/types';
import { signIn, signOut, getSession, fetchProfile } from '../lib/supabaseService';
import { auditLogin, auditLogout } from '../lib/auditHelper';
import { clearPrivacyAcknowledgment } from '../lib/privacyPolicy';
import { supabase } from '../lib/supabase';
import type { Subscription } from '@supabase/supabase-js';

// Guard: prevents the onAuthStateChange listener from re-authenticating
// the user while a logout is in progress.
let _loggingOut = false;

// Hold a reference so we can unsubscribe before re-subscribing.
let _authSubscription: Subscription | null = null;

interface AuthState {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: UserProfile | null) => void;
  setLoading: (loading: boolean) => void;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  initAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: true,

      setUser: (user) => set({ user, isAuthenticated: !!user, isLoading: false }),
      setLoading: (isLoading) => set({ isLoading }),

      login: async (email, password) => {
        set({ isLoading: true });
        try {
          const data = await signIn(email, password);
          const profile = await fetchProfile(data.user!.id);
          if (!profile) {
            // Auth succeeded but no profile row found — sign out and report
            await signOut();
            throw new Error('Account not found. Please contact an administrator.');
          }
          set({ user: profile, isAuthenticated: true, isLoading: false });
          auditLogin(profile.id);
        } catch (err) {
          set({ user: null, isAuthenticated: false, isLoading: false });
          throw err; // re-throw so LoginPage can show the toast
        }
      },

      logout: async () => {
        _loggingOut = true;
        try {
          const state = useAuthStore.getState();
          // Fire-and-forget audit; don't let it block sign-out
          if (state.user) {
            auditLogout(state.user.id).catch(() => {});
          }
          // Clear privacy acknowledgment so the modal re-appears on next login
          clearPrivacyAcknowledgment();
          // Clear state FIRST so the UI navigates to login immediately
          set({ user: null, isAuthenticated: false, isLoading: false });
          await signOut().catch(() => {});
        } finally {
          _loggingOut = false;
        }
      },

      initAuth: async () => {
        set({ isLoading: true });
        try {
          const session = await getSession();
          if (session?.user) {
            const profile = await fetchProfile(session.user.id);
            set({ user: profile, isAuthenticated: !!profile, isLoading: false });
          } else {
            set({ user: null, isAuthenticated: false, isLoading: false });
          }
        } catch {
          set({ user: null, isAuthenticated: false, isLoading: false });
        }

        // Unsubscribe any previous listener before registering a new one
        if (_authSubscription) {
          _authSubscription.unsubscribe();
          _authSubscription = null;
        }

        // Listen to auth state changes (token refresh, sign-out from another tab)
        const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
          // Ignore events while we are actively logging out
          if (_loggingOut) return;

          if (event === 'SIGNED_OUT' || !session) {
            set({ user: null, isAuthenticated: false, isLoading: false });
          } else if (event === 'TOKEN_REFRESHED' && session?.user) {
            // Only refresh the profile on explicit token refresh, not on
            // every intermediate event, and only if still authenticated.
            const current = useAuthStore.getState();
            if (current.isAuthenticated) {
              const profile = await fetchProfile(session.user.id);
              // Double-check we haven't logged out while awaiting
              if (!_loggingOut && useAuthStore.getState().isAuthenticated) {
                set({ user: profile, isAuthenticated: !!profile, isLoading: false });
              }
            }
          }
        });
        _authSubscription = data.subscription;
      },
    }),
    {  name: 'vmmc-auth',
      partialize: (state) => ({ user: state.user }),
      onRehydrateStorage: () => (state) => {
        if (state) state.isAuthenticated = !!state.user;
      },
    }
  )
);
