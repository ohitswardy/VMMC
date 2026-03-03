-- ═════════════════════════════════════════════
-- Fix #5: Add missing DELETE RLS policy on notifications table
-- Users can only delete their own notifications
-- ═════════════════════════════════════════════

CREATE POLICY "notifications_delete_own"
  ON public.notifications FOR DELETE TO authenticated
  USING (user_id = auth.uid());
