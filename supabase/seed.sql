-- =============================================
-- VMMC OR Booking System — Seed Data
-- =============================================
-- INSTRUCTIONS:
--   1. In the Supabase Dashboard, go to the SQL Editor
--   2. First run: supabase/migrations/002_full_schema.sql  (creates all tables)
--   3. Then run this file to create demo accounts and initial data
--
-- Demo password for ALL accounts: Vmmc@2026!
-- =============================================

DO $$
DECLARE
  v_admin_id    UUID := gen_random_uuid();
  v_anes_id     UUID := gen_random_uuid();
  v_gs_id       UUID := gen_random_uuid();
  v_obgyne_id   UUID := gen_random_uuid();
  v_ortho_id    UUID := gen_random_uuid();
  v_nurse_id    UUID := gen_random_uuid();
  v_viewer_id   UUID := gen_random_uuid();
BEGIN

  -- ─────────────────────────────────────────
  -- 1. Auth users (with bcrypt-hashed password)
  -- ─────────────────────────────────────────
  INSERT INTO auth.users (
    id, instance_id, email, encrypted_password,
    email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at, role, aud, is_sso_user
  ) VALUES
    (v_admin_id,  '00000000-0000-0000-0000-000000000000',
     'admin@vmmc.gov.ph',      crypt('Vmmc@2026!', gen_salt('bf')),
     now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb,
     now(), now(), 'authenticated', 'authenticated', false),

    (v_anes_id,   '00000000-0000-0000-0000-000000000000',
     'anes.admin@vmmc.gov.ph', crypt('Vmmc@2026!', gen_salt('bf')),
     now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb,
     now(), now(), 'authenticated', 'authenticated', false),

    (v_gs_id,     '00000000-0000-0000-0000-000000000000',
     'gs@vmmc.gov.ph',         crypt('Vmmc@2026!', gen_salt('bf')),
     now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb,
     now(), now(), 'authenticated', 'authenticated', false),

    (v_obgyne_id, '00000000-0000-0000-0000-000000000000',
     'obgyne@vmmc.gov.ph',     crypt('Vmmc@2026!', gen_salt('bf')),
     now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb,
     now(), now(), 'authenticated', 'authenticated', false),

    (v_ortho_id,  '00000000-0000-0000-0000-000000000000',
     'ortho@vmmc.gov.ph',      crypt('Vmmc@2026!', gen_salt('bf')),
     now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb,
     now(), now(), 'authenticated', 'authenticated', false),

    (v_nurse_id,  '00000000-0000-0000-0000-000000000000',
     'nurse@vmmc.gov.ph',      crypt('Vmmc@2026!', gen_salt('bf')),
     now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb,
     now(), now(), 'authenticated', 'authenticated', false),

    (v_viewer_id, '00000000-0000-0000-0000-000000000000',
     'viewer@vmmc.gov.ph',     crypt('Vmmc@2026!', gen_salt('bf')),
     now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb,
     now(), now(), 'authenticated', 'authenticated', false);

  -- ─────────────────────────────────────────
  -- 2. Auth identities (required for email login)
  -- ─────────────────────────────────────────
  INSERT INTO auth.identities (id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  VALUES
    (v_admin_id,  v_admin_id,  jsonb_build_object('sub', v_admin_id::text,  'email', 'admin@vmmc.gov.ph'),      'email', now(), now(), now()),
    (v_anes_id,   v_anes_id,   jsonb_build_object('sub', v_anes_id::text,   'email', 'anes.admin@vmmc.gov.ph'), 'email', now(), now(), now()),
    (v_gs_id,     v_gs_id,     jsonb_build_object('sub', v_gs_id::text,     'email', 'gs@vmmc.gov.ph'),         'email', now(), now(), now()),
    (v_obgyne_id, v_obgyne_id, jsonb_build_object('sub', v_obgyne_id::text, 'email', 'obgyne@vmmc.gov.ph'),     'email', now(), now(), now()),
    (v_ortho_id,  v_ortho_id,  jsonb_build_object('sub', v_ortho_id::text,  'email', 'ortho@vmmc.gov.ph'),      'email', now(), now(), now()),
    (v_nurse_id,  v_nurse_id,  jsonb_build_object('sub', v_nurse_id::text,  'email', 'nurse@vmmc.gov.ph'),      'email', now(), now(), now()),
    (v_viewer_id, v_viewer_id, jsonb_build_object('sub', v_viewer_id::text, 'email', 'viewer@vmmc.gov.ph'),     'email', now(), now(), now());

  -- ─────────────────────────────────────────
  -- 3. User profiles
  -- ─────────────────────────────────────────
  INSERT INTO public.profiles (id, email, full_name, role, department_id, is_active)
  VALUES
    (v_admin_id,  'admin@vmmc.gov.ph',      'System Administrator',       'super_admin',           NULL,     true),
    (v_anes_id,   'anes.admin@vmmc.gov.ph', 'Dr. Anesthesiology Admin',   'anesthesiology_admin',  NULL,     true),
    (v_gs_id,     'gs@vmmc.gov.ph',         'Dr. General Surgery',        'department_user',       'GS',     true),
    (v_obgyne_id, 'obgyne@vmmc.gov.ph',     'Dr. OB-Gyne',                'department_user',       'OBGYNE', true),
    (v_ortho_id,  'ortho@vmmc.gov.ph',      'Dr. Orthopedics',            'department_user',       'ORTHO',  true),
    (v_nurse_id,  'nurse@vmmc.gov.ph',      'Nurse Staff',                'nurse',                 NULL,     true),
    (v_viewer_id, 'viewer@vmmc.gov.ph',     'View Only User',             'viewer',                NULL,     true);

  -- ─────────────────────────────────────────
  -- 4. OR Rooms
  -- ─────────────────────────────────────────
  INSERT INTO public.or_rooms (number, name, designation, is_active, buffer_time_minutes)
  VALUES
    (1, 'OR 1', 'General Surgery / OB-Gyne',     true, 30),
    (2, 'OR 2', 'Orthopedics / ENT / Ophtha',    true, 30),
    (3, 'OR 3', 'Urology / Plastics / Neuro',    true, 30),
    (4, 'OR 4', 'Cardiac / Thoracic / Pedia',    true, 30);

END $$;
