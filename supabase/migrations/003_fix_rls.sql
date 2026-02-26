-- =============================================
-- Fix: Recursive RLS policy on public.profiles
-- =============================================
-- PROBLEM:
--   "profiles_all_super_admin" is FOR ALL (includes SELECT).
--   Its USING clause queries public.profiles inside an RLS policy
--   ON public.profiles → infinite recursion → "Database error querying schema".
--
-- FIX:
--   1. Create a SECURITY DEFINER function that bypasses RLS to check admin status
--   2. Re-create the admin policy using that function (no more recursion)
--   3. Restrict the policy to INSERT/UPDATE/DELETE only (SELECT is already
--      covered by the permissive "profiles_select_authenticated" policy)
-- =============================================

-- Step 1: Security definer helper — runs as postgres superuser, bypasses RLS
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'super_admin'
  );
$$;

-- Step 2: Drop the recursive policy
DROP POLICY IF EXISTS "profiles_all_super_admin" ON public.profiles;

-- Step 3: Re-create it with no recursion, limited to write operations only
CREATE POLICY "profiles_insert_super_admin"
  ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (public.is_super_admin());

CREATE POLICY "profiles_update_super_admin"
  ON public.profiles FOR UPDATE TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

CREATE POLICY "profiles_delete_super_admin"
  ON public.profiles FOR DELETE TO authenticated
  USING (public.is_super_admin());

-- =============================================
-- Also fix similar potential recursion on other tables
-- that check admin status via EXIST queries on profiles
-- =============================================

-- or_rooms: already uses a sub-select on profiles — wrap it too
DROP POLICY IF EXISTS "or_rooms_all_admin" ON public.or_rooms;
CREATE POLICY "or_rooms_all_admin"
  ON public.or_rooms FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('super_admin', 'anesthesiology_admin'))
  );

-- (or_rooms querying profiles is fine — recursion only happens when a policy
-- on TABLE X queries TABLE X; or_rooms querying profiles is not recursive)
