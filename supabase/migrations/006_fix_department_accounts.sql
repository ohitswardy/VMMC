-- ═════════════════════════════════════════════
-- 006 — FIX DEPARTMENT ACCOUNTS
-- ═════════════════════════════════════════════
-- Run this in Supabase → SQL Editor
--
-- BEFORE RUNNING:
--   1. Go to Supabase Dashboard → Authentication → Users
--   2. For each department email below that does NOT exist yet,
--      click "Add user" → "Create new user"
--      Email: (see below) | Password: Vmmc@2026!
--      ✅ Enable "Auto Confirm User"
--   3. Then run the UPDATE statements in Step 2 below.
-- ═════════════════════════════════════════════


-- ─────────────────────────────────────────────
-- STEP 1: Diagnose — see current profile state
-- ─────────────────────────────────────────────
SELECT
  email,
  full_name,
  role,
  department_id,
  is_active,
  created_at
FROM public.profiles
ORDER BY created_at;


-- ─────────────────────────────────────────────
-- STEP 2: Fix / set department_id for each account
-- Only run the rows that apply to accounts you have created.
-- ─────────────────────────────────────────────

UPDATE public.profiles SET
  full_name      = 'Admin User',
  role           = 'super_admin',
  department_id  = NULL,
  is_active      = TRUE
WHERE email = 'admin@vmmc.gov.ph';

UPDATE public.profiles SET
  full_name      = 'Anesthesiology Admin',
  role           = 'anesthesiology_admin',
  department_id  = NULL,
  is_active      = TRUE
WHERE email = 'anes.admin@vmmc.gov.ph';

UPDATE public.profiles SET
  full_name      = 'General Surgery Dept',
  role           = 'department_user',
  department_id  = 'GS',
  is_active      = TRUE
WHERE email = 'gs@vmmc.gov.ph';

UPDATE public.profiles SET
  full_name      = 'OB-GYNE Department',
  role           = 'department_user',
  department_id  = 'OBGYNE',
  is_active      = TRUE
WHERE email = 'obgyne@vmmc.gov.ph';

UPDATE public.profiles SET
  full_name      = 'Orthopedics Department',
  role           = 'department_user',
  department_id  = 'ORTHO',
  is_active      = TRUE
WHERE email = 'ortho@vmmc.gov.ph';

UPDATE public.profiles SET
  full_name      = 'Ophthalmology Department',
  role           = 'department_user',
  department_id  = 'OPHTHA',
  is_active      = TRUE
WHERE email = 'ophtha@vmmc.gov.ph';

UPDATE public.profiles SET
  full_name      = 'ENT Department',
  role           = 'department_user',
  department_id  = 'ENT',
  is_active      = TRUE
WHERE email = 'ent@vmmc.gov.ph';

UPDATE public.profiles SET
  full_name      = 'Pediatrics Department',
  role           = 'department_user',
  department_id  = 'PEDIA',
  is_active      = TRUE
WHERE email = 'pedia@vmmc.gov.ph';

UPDATE public.profiles SET
  full_name      = 'Urology Department',
  role           = 'department_user',
  department_id  = 'URO',
  is_active      = TRUE
WHERE email = 'uro@vmmc.gov.ph';

UPDATE public.profiles SET
  full_name      = 'TCVS Department',
  role           = 'department_user',
  department_id  = 'TCVS',
  is_active      = TRUE
WHERE email = 'tcvs@vmmc.gov.ph';

UPDATE public.profiles SET
  full_name      = 'Neurosurgery Department',
  role           = 'department_user',
  department_id  = 'NEURO',
  is_active      = TRUE
WHERE email = 'neuro@vmmc.gov.ph';

UPDATE public.profiles SET
  full_name      = 'OR Nurse',
  role           = 'nurse',
  department_id  = NULL,
  is_active      = TRUE
WHERE email = 'nurse@vmmc.gov.ph';


-- ─────────────────────────────────────────────
-- STEP 3: Verify the result
-- ─────────────────────────────────────────────
SELECT
  email,
  full_name,
  role,
  department_id,
  is_active
FROM public.profiles
ORDER BY role, department_id;
