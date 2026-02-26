import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UserProfile } from '../lib/types';
import { signIn, signOut, getSession, fetchProfile } from '../lib/supabaseService';
import { auditLogin, auditLogout } from '../lib/auditHelper';
import { supabase } from '../lib/supabase';

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
        const state = useAuthStore.getState();
        if (state.user) auditLogout(state.user.id);
        await signOut();
        set({ user: null, isAuthenticated: false, isLoading: false });
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

        // Listen to auth state changes (token refresh, sign-out from another tab)
        supabase.auth.onAuthStateChange(async (event, session) => {
          if (event === 'SIGNED_OUT' || !session) {
            set({ user: null, isAuthenticated: false, isLoading: false });
          } else if (session?.user) {
            const profile = await fetchProfile(session.user.id);
            set({ user: profile, isAuthenticated: !!profile, isLoading: false });
          }
        });
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
