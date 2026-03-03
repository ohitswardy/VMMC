-- ═════════════════════════════════════════════
-- Fix #7: System settings table (synced to DB instead of localStorage only)
-- ═════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.system_settings (
  id          TEXT PRIMARY KEY DEFAULT 'global',  -- single-row config pattern
  data        JSONB NOT NULL DEFAULT '{}',
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by  UUID REFERENCES auth.users(id)
);

ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Admins can read settings
CREATE POLICY "settings_select"
  ON public.system_settings FOR SELECT TO authenticated
  USING (true);

-- Only super_admin and anesthesiology_admin can update settings
CREATE POLICY "settings_upsert"
  ON public.system_settings FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('super_admin', 'anesthesiology_admin')
    )
  );

CREATE POLICY "settings_update"
  ON public.system_settings FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('super_admin', 'anesthesiology_admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('super_admin', 'anesthesiology_admin')
    )
  );

-- Seed default settings row
INSERT INTO public.system_settings (id, data) VALUES (
  'global',
  '{"bufferTime":"30","downloadRetention":"7","archiveRetention":"30","purgeWarningHours":"48","autoArchive":true,"notifications":{}}'
) ON CONFLICT (id) DO NOTHING;
