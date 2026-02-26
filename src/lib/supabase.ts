import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'Supabase credentials not set. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env'
  );
}

export const supabase = createClient(
  supabaseUrl || 'https://chfiefxeschdmnihsvvb.supabase.co',
  supabaseAnonKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNoZmllZnhlc2NoZG1uaWhzdnZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIwNjU0NTgsImV4cCI6MjA4NzY0MTQ1OH0.adyo3GBkW9sV-iwdDuKzWRL0HqRzVNjjsx6HoPaduOw',
  {
    db: { schema: 'public' },
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  }
);
