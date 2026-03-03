-- ═════════════════════════════════════════════
-- Fix #16: Server-side privacy policy acknowledgment
-- Persists acknowledgment to DB for RA 10173 compliance
-- ═════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.privacy_acknowledgments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  version     TEXT NOT NULL,
  acknowledged_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, version)
);

ALTER TABLE public.privacy_acknowledgments ENABLE ROW LEVEL SECURITY;

-- Users can read their own acknowledgments
CREATE POLICY "privacy_ack_select_own"
  ON public.privacy_acknowledgments FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Users can insert their own acknowledgments
CREATE POLICY "privacy_ack_insert_own"
  ON public.privacy_acknowledgments FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE INDEX idx_privacy_ack_user ON public.privacy_acknowledgments(user_id, version);
