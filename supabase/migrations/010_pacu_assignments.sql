-- ═══════════════════════════════════════════════════════════
-- Migration 010: PACU Assignments table
-- Stores per-date PACU resident names in the database
-- so data is shared across devices/browsers.
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.pacu_assignments (
  date TEXT PRIMARY KEY,           -- 'YYYY-MM-DD'
  names TEXT NOT NULL DEFAULT '',   -- comma/slash-separated resident names
  updated_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.pacu_assignments ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read PACU assignments
CREATE POLICY "pacu_select_all"
  ON public.pacu_assignments FOR SELECT
  TO authenticated USING (true);

-- Only admins can insert/update PACU assignments
CREATE POLICY "pacu_upsert_admin"
  ON public.pacu_assignments FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role IN ('super_admin', 'anesthesiology_admin')
    )
  );

CREATE POLICY "pacu_update_admin"
  ON public.pacu_assignments FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role IN ('super_admin', 'anesthesiology_admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role IN ('super_admin', 'anesthesiology_admin')
    )
  );
