-- =============================================
-- DIAGNOSTIC + FIX: GoTrue 500 "Database error querying schema"
-- =============================================
-- Run each section ONE AT A TIME in Supabase SQL Editor.
-- Do NOT run the entire file at once — read results after each section.
-- =============================================


-- ═══════════════════════════════════════════
-- STEP 1: DIAGNOSTICS — Run this first, read the output
-- ═══════════════════════════════════════════

-- 1A. Check if auth.users entries exist for demo accounts
SELECT id, email, created_at, last_sign_in_at, 
       email_confirmed_at, banned_until,
       raw_app_meta_data->>'provider' as provider
FROM auth.users 
WHERE email IN ('admin@vmmc.gov.ph', 'anes.admin@vmmc.gov.ph', 'gs@vmmc.gov.ph', 'nurse@vmmc.gov.ph')
ORDER BY email;

-- 1B. Check auth.identities — CRITICAL: if missing, GoTrue will fail
SELECT i.id, i.user_id, u.email, i.provider, i.created_at
FROM auth.identities i
JOIN auth.users u ON u.id = i.user_id
WHERE u.email IN ('admin@vmmc.gov.ph', 'anes.admin@vmmc.gov.ph', 'gs@vmmc.gov.ph', 'nurse@vmmc.gov.ph')
ORDER BY u.email;

-- 1C. Check ALL RLS policies on profiles (should NOT have recursive ones)
SELECT pol.polname, pol.polcmd, pg_get_expr(pol.polqual, pol.polrelid) as using_expr,
       pg_get_expr(pol.polwithcheck, pol.polrelid) as with_check_expr
FROM pg_policy pol
JOIN pg_class cls ON cls.oid = pol.polrelid
WHERE cls.relname = 'profiles'
ORDER BY pol.polname;

-- 1D. Check if RLS is currently enabled or disabled on profiles
SELECT relname, relrowsecurity, relforcerowsecurity
FROM pg_class WHERE relname = 'profiles';

-- 1E. Check ALL auth hooks configured (this is the most likely culprit!)
SELECT * FROM auth.flow_state LIMIT 5;

-- 1F. Check for any custom functions in auth schema that might be hooks
SELECT n.nspname as schema, p.proname as function_name, 
       pg_get_function_result(p.oid) as return_type
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'auth' AND p.proname NOT LIKE 'pg_%'
ORDER BY p.proname;

-- 1G. Check for any TRIGGERS on auth.users
SELECT tgname, tgtype, 
       (SELECT proname FROM pg_proc WHERE oid = tgfoid) as function_name
FROM pg_trigger
WHERE tgrelid = 'auth.users'::regclass
  AND NOT tgisinternal;

-- 1H. (Removed — auth.config does not exist on this Supabase version)


-- ═══════════════════════════════════════════
-- STEP 2: THE FIX — Based on diagnosis
-- ═══════════════════════════════════════════
-- Run the appropriate fix based on STEP 1 results:

-- ───────────────────────────────────────────
-- FIX A: If auth.identities rows are MISSING (Step 1B returns 0 rows)
-- This is the most likely cause if users were created via SQL or dashboard
-- ───────────────────────────────────────────

/*
INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  u.id,
  jsonb_build_object('sub', u.id::text, 'email', u.email, 'email_verified', true),
  'email',
  u.id::text,
  now(),
  u.created_at,
  now()
FROM auth.users u
WHERE u.email IN ('admin@vmmc.gov.ph', 'anes.admin@vmmc.gov.ph', 'gs@vmmc.gov.ph', 'nurse@vmmc.gov.ph')
  AND NOT EXISTS (
    SELECT 1 FROM auth.identities i WHERE i.user_id = u.id AND i.provider = 'email'
  );
*/

-- ───────────────────────────────────────────
-- FIX B: If auth hooks are configured and broken
-- Go to Supabase Dashboard → Authentication → Hooks
-- DISABLE all hooks, then try signing in again
-- ───────────────────────────────────────────

-- ───────────────────────────────────────────
-- FIX C: Nuclear — drop the handle_new_user trigger 
-- (it may be interfering somehow)
-- ───────────────────────────────────────────

/*
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
*/

-- ───────────────────────────────────────────
-- FIX D: Completely remove ALL custom RLS on profiles
-- and rebuild from scratch (belt-and-suspenders)
-- ───────────────────────────────────────────

/*
-- Drop ALL existing policies on profiles
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN 
    SELECT policyname FROM pg_policies WHERE tablename = 'profiles' AND schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.profiles', pol.policyname);
  END LOOP;
END $$;

-- Keep RLS enabled but with safe policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Simple, non-recursive policies
CREATE POLICY "profiles_select_all" ON public.profiles 
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "profiles_update_own" ON public.profiles 
  FOR UPDATE TO authenticated 
  USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- Admin write access using SECURITY DEFINER function (no recursion)
CREATE OR REPLACE FUNCTION public.is_admin_role()
RETURNS BOOLEAN LANGUAGE SQL SECURITY DEFINER STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('super_admin', 'anesthesiology_admin')
  );
$$;

CREATE POLICY "profiles_admin_insert" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (public.is_admin_role());

CREATE POLICY "profiles_admin_update" ON public.profiles
  FOR UPDATE TO authenticated 
  USING (public.is_admin_role()) WITH CHECK (public.is_admin_role());

CREATE POLICY "profiles_admin_delete" ON public.profiles
  FOR DELETE TO authenticated USING (public.is_admin_role());
*/


-- ═══════════════════════════════════════════
-- STEP 3: VERIFY — After applying fix, test
-- ═══════════════════════════════════════════

-- Run this to verify all is healthy:
SELECT u.email, u.id, 
       (SELECT COUNT(*) FROM auth.identities i WHERE i.user_id = u.id) as identity_count,
       (SELECT COUNT(*) FROM public.profiles p WHERE p.id = u.id) as profile_count
FROM auth.users u
WHERE u.email IN ('admin@vmmc.gov.ph', 'anes.admin@vmmc.gov.ph', 'gs@vmmc.gov.ph', 'nurse@vmmc.gov.ph')
ORDER BY u.email;
-- Each row should have identity_count = 1 and profile_count = 1
