-- ═══════════════════════════════════════════
-- DEEP DIAGNOSIS — run each query separately
-- ═══════════════════════════════════════════

-- QUERY 1: Check email_confirmed_at — if NULL, GoTrue might fail
SELECT email, email_confirmed_at, confirmed_at, 
       raw_app_meta_data,
       encrypted_password IS NOT NULL as has_password
FROM auth.users
WHERE email IN ('admin@vmmc.gov.ph','anes.admin@vmmc.gov.ph','gs@vmmc.gov.ph','nurse@vmmc.gov.ph')
ORDER BY email;


-- QUERY 2: Current RLS policies on profiles — is the recursive one still there?
SELECT policyname, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'profiles' AND schemaname = 'public';


-- QUERY 3: All triggers on auth.users
SELECT tgname, 
       (SELECT proname FROM pg_proc WHERE oid = tgfoid) as function_name,
       tgenabled
FROM pg_trigger
WHERE tgrelid = 'auth.users'::regclass AND NOT tgisinternal;


-- QUERY 4: Check for any broken/invalid functions in public schema
SELECT p.proname, pg_get_functiondef(p.oid) as definition
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public' 
  AND p.proname IN ('handle_new_user','is_super_admin','is_admin_role','update_updated_at_column','check_booking_conflict');
