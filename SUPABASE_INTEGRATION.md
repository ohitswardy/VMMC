# Supabase Integration Guide — VMMC OR Booking System

This guide walks you through setting up Supabase as the backend for the VMMC OR Booking System.

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Create a Supabase Project](#2-create-a-supabase-project)
3. [Run the Schema SQL](#3-run-the-schema-sql)
4. [Configure Environment Variables](#4-configure-environment-variables)
5. [Enable Realtime](#5-enable-realtime)
6. [Set Up Auth Providers](#6-set-up-auth-providers)
7. [Create Initial Users](#7-create-initial-users)
8. [Row Level Security (RLS) Reference](#8-row-level-security-rls-reference)
9. [Troubleshooting](#9-troubleshooting)

---

## 1. Prerequisites

| Requirement | Notes |
|---|---|
| **Supabase account** | Free tier is fine for development — [supabase.com](https://supabase.com) |
| **Node.js ≥ 18** | For running the Vite frontend |
| **Git** | To clone the project repo |

---

## 2. Create a Supabase Project

1. Go to [app.supabase.com](https://app.supabase.com) and click **New project**.
2. Choose a name (e.g., `vmmc-or-booking`), set a **database password**, and pick a **region** close to your users.
3. Wait for the project to finish provisioning (usually < 2 minutes).
4. On the project dashboard, note these values (you'll need them in step 4):
   - **Project URL** — looks like `https://abcdefg.supabase.co`
   - **anon/public key** — found in **Settings → API → Project API keys**

---

## 3. Run the Schema SQL

The complete schema lives in:

```
supabase/migrations/002_full_schema.sql
```

### Option A: Supabase Dashboard (Recommended for first-time setup)

1. In your Supabase project, go to **SQL Editor** (left sidebar).
2. Click **+ New query**.
3. Open `supabase/migrations/002_full_schema.sql` in a text editor, **copy the entire contents**.
4. Paste into the SQL Editor.
5. Click **Run** (or press `Ctrl + Enter`).
6. You should see `Success. No rows returned` — this means all tables, indexes, policies, seeds, and triggers were created.

### Option B: Supabase CLI (For CI/CD or scripted setup)

```bash
# Install the CLI (once)
npm install -g supabase

# Login
supabase login

# Link to your remote project
supabase link --project-ref YOUR_PROJECT_REF

# Push the migration
supabase db push
```

> The CLI will automatically run all files in `supabase/migrations/` in alphabetical order. If you're starting fresh, you only need `002_full_schema.sql`. Delete or rename `001_initial_schema.sql` to avoid running it.

### Option C: Using psql directly

```bash
psql "postgresql://postgres:[YOUR-DB-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres" \
  -f supabase/migrations/002_full_schema.sql
```

> Find the full connection string in: **Settings → Database → Connection string → URI**

---

## 4. Configure Environment Variables

Create a `.env` file in the project root (or `.env.local` for Vite):

```env
VITE_SUPABASE_URL=https://chfiefxeschdmnihsvvb.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNoZmllZnhlc2NoZG1uaWhzdnZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIwNjU0NTgsImV4cCI6MjA4NzY0MTQ1OH0.adyo3GBkW9sV-iwdDuKzWRL0HqRzVNjjsx6HoPaduOw
```

These are consumed by `src/lib/supabase.ts`:

```ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

> **Security note**: The `anon` key is safe to expose in the browser. RLS policies protect all data. Never expose the `service_role` key in frontend code.

---

## 5. Enable Realtime

The schema automatically adds tables to `supabase_realtime`. To verify:

1. Go to **Database → Replication** in the Supabase dashboard.
2. Ensure the following tables show up under the `supabase_realtime` publication:
   - `bookings`
   - `or_room_live_status`
   - `notifications`
   - `or_priority_schedule`
   - `nurse_duty_assignments`

If any are missing, toggle them on, or run:

```sql
ALTER PUBLICATION supabase_realtime ADD TABLE public.bookings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.or_room_live_status;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.or_priority_schedule;
ALTER PUBLICATION supabase_realtime ADD TABLE public.nurse_duty_assignments;

-- ... etc.
```

---

## 6. Set Up Auth Providers

The system uses Supabase Auth. To configure:

1. Go to **Authentication → Providers** in the dashboard.
2. Enable **Email** (default — already enabled).
3. *(Optional)* Enable additional providers (Google, Azure AD) under the same page.
4. Under **Authentication → Settings**:
   - Set **Site URL** to `http://localhost:5173` (dev) or your production URL.
   - Add redirect URLs as needed.

---

## 7. Create Initial Users

The schema includes a `handle_new_user()` trigger that automatically creates a `profiles` row whenever a new auth user is created, reading `raw_user_meta_data` for `full_name`, `role`, and `department_id`.

### All System Accounts

> **Initial password for all accounts:** `Vmmc@2026!`
> Change these immediately after first login.

| # | Full Name | Email | Password | Role | Department |
|---|---|---|---|---|---|
| 1 | System Administrator | `admin@vmmc.gov.ph` | `Vmmc@2026!` | `super_admin` | — |
| 2 | Anesthesia Admin | `anes.admin@vmmc.gov.ph` | `Vmmc@2026!` | `anesthesiology_admin` | — |
| 3 | Dept User – General Surgery | `gs@vmmc.gov.ph` | `Vmmc@2026!` | `department_user` | `GS` |
| 4 | Dept User – OB-GYNE | `obgyne@vmmc.gov.ph` | `Vmmc@2026!` | `department_user` | `OBGYNE` |
| 5 | Dept User – Orthopedics | `ortho@vmmc.gov.ph` | `Vmmc@2026!` | `department_user` | `ORTHO` |
| 6 | Dept User – Ophthalmology | `ophtha@vmmc.gov.ph` | `Vmmc@2026!` | `department_user` | `OPHTHA` |
| 7 | Dept User – ENT | `ent@vmmc.gov.ph` | `Vmmc@2026!` | `department_user` | `ENT` |
| 8 | Dept User – Pediatrics | `pedia@vmmc.gov.ph` | `Vmmc@2026!` | `department_user` | `PEDIA` |
| 9 | Dept User – Urology | `uro@vmmc.gov.ph` | `Vmmc@2026!` | `department_user` | `URO` |
| 10 | Dept User – TCVS | `tcvs@vmmc.gov.ph` | `Vmmc@2026!` | `department_user` | `TCVS` |
| 11 | Dept User – Neurosurgery | `neuro@vmmc.gov.ph` | `Vmmc@2026!` | `department_user` | `NEURO` |
| 12 | Dept User – Plastic Surgery | `plastics@vmmc.gov.ph` | `Vmmc@2026!` | `department_user` | `PLASTICS` |
| 13 | Dept User – Psychiatry | `psych@vmmc.gov.ph` | `Vmmc@2026!` | `department_user` | `PSYCH` |
| 14 | Dept User – Dental | `dental@vmmc.gov.ph` | `Vmmc@2026!` | `department_user` | `DENTAL` |
| 15 | Dept User – Gastroenterology | `gi@vmmc.gov.ph` | `Vmmc@2026!` | `department_user` | `GI` |
| 16 | Dept User – Radiology | `radio@vmmc.gov.ph` | `Vmmc@2026!` | `department_user` | `RADIO` |
| 17 | Dept User – Pulmonology | `pulmo@vmmc.gov.ph` | `Vmmc@2026!` | `department_user` | `PULMO` |
| 18 | Dept User – Cardiology | `cardiac@vmmc.gov.ph` | `Vmmc@2026!` | `department_user` | `CARDIAC` |
| 19 | Dept User – Oncology | `onco@vmmc.gov.ph` | `Vmmc@2026!` | `department_user` | `ONCO` |
| 20 | OR Nurse | `nurse@vmmc.gov.ph` | `Vmmc@2026!` | `nurse` | — |

---

### Option A: Bulk Create via SQL Editor (Recommended)

Run this entire block in **Supabase → SQL Editor**. It creates all 20 auth users and their profiles in one shot.

```sql
DO $$
DECLARE
  _password TEXT := crypt('Vmmc@2026!', gen_salt('bf'));
  _confirmed TIMESTAMPTZ := now();
BEGIN

  -- 1. Super Admin
  INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token)
  VALUES ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated',
    'admin@vmmc.gov.ph', _password, _confirmed,
    '{"full_name":"System Administrator","role":"super_admin"}',
    _confirmed, _confirmed, '', '');

  -- 2. Anesthesia Admin
  INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token)
  VALUES ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated',
    'anes.admin@vmmc.gov.ph', _password, _confirmed,
    '{"full_name":"Anesthesia Admin","role":"anesthesiology_admin"}',
    _confirmed, _confirmed, '', '');

  -- 3. General Surgery
  INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token)
  VALUES ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated',
    'gs@vmmc.gov.ph', _password, _confirmed,
    '{"full_name":"Dept User – General Surgery","role":"department_user","department_id":"GS"}',
    _confirmed, _confirmed, '', '');

  -- 4. OB-GYNE
  INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token)
  VALUES ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated',
    'obgyne@vmmc.gov.ph', _password, _confirmed,
    '{"full_name":"Dept User – OB-GYNE","role":"department_user","department_id":"OBGYNE"}',
    _confirmed, _confirmed, '', '');

  -- 5. Orthopedics
  INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token)
  VALUES ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated',
    'ortho@vmmc.gov.ph', _password, _confirmed,
    '{"full_name":"Dept User – Orthopedics","role":"department_user","department_id":"ORTHO"}',
    _confirmed, _confirmed, '', '');

  -- 6. Ophthalmology
  INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token)
  VALUES ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated',
    'ophtha@vmmc.gov.ph', _password, _confirmed,
    '{"full_name":"Dept User – Ophthalmology","role":"department_user","department_id":"OPHTHA"}',
    _confirmed, _confirmed, '', '');

  -- 7. ENT
  INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token)
  VALUES ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated',
    'ent@vmmc.gov.ph', _password, _confirmed,
    '{"full_name":"Dept User – ENT","role":"department_user","department_id":"ENT"}',
    _confirmed, _confirmed, '', '');

  -- 8. Pediatrics
  INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token)
  VALUES ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated',
    'pedia@vmmc.gov.ph', _password, _confirmed,
    '{"full_name":"Dept User – Pediatrics","role":"department_user","department_id":"PEDIA"}',
    _confirmed, _confirmed, '', '');

  -- 9. Urology
  INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token)
  VALUES ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated',
    'uro@vmmc.gov.ph', _password, _confirmed,
    '{"full_name":"Dept User – Urology","role":"department_user","department_id":"URO"}',
    _confirmed, _confirmed, '', '');

  -- 10. TCVS
  INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token)
  VALUES ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated',
    'tcvs@vmmc.gov.ph', _password, _confirmed,
    '{"full_name":"Dept User – TCVS","role":"department_user","department_id":"TCVS"}',
    _confirmed, _confirmed, '', '');

  -- 11. Neurosurgery
  INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token)
  VALUES ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated',
    'neuro@vmmc.gov.ph', _password, _confirmed,
    '{"full_name":"Dept User – Neurosurgery","role":"department_user","department_id":"NEURO"}',
    _confirmed, _confirmed, '', '');

  -- 12. Plastic Surgery
  INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token)
  VALUES ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated',
    'plastics@vmmc.gov.ph', _password, _confirmed,
    '{"full_name":"Dept User – Plastic Surgery","role":"department_user","department_id":"PLASTICS"}',
    _confirmed, _confirmed, '', '');

  -- 13. Psychiatry
  INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token)
  VALUES ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated',
    'psych@vmmc.gov.ph', _password, _confirmed,
    '{"full_name":"Dept User – Psychiatry","role":"department_user","department_id":"PSYCH"}',
    _confirmed, _confirmed, '', '');

  -- 14. Dental
  INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token)
  VALUES ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated',
    'dental@vmmc.gov.ph', _password, _confirmed,
    '{"full_name":"Dept User – Dental","role":"department_user","department_id":"DENTAL"}',
    _confirmed, _confirmed, '', '');

  -- 15. Gastroenterology
  INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token)
  VALUES ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated',
    'gi@vmmc.gov.ph', _password, _confirmed,
    '{"full_name":"Dept User – Gastroenterology","role":"department_user","department_id":"GI"}',
    _confirmed, _confirmed, '', '');

  -- 16. Radiology
  INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token)
  VALUES ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated',
    'radio@vmmc.gov.ph', _password, _confirmed,
    '{"full_name":"Dept User – Radiology","role":"department_user","department_id":"RADIO"}',
    _confirmed, _confirmed, '', '');

  -- 17. Pulmonology
  INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token)
  VALUES ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated',
    'pulmo@vmmc.gov.ph', _password, _confirmed,
    '{"full_name":"Dept User – Pulmonology","role":"department_user","department_id":"PULMO"}',
    _confirmed, _confirmed, '', '');

  -- 18. Cardiology
  INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token)
  VALUES ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated',
    'cardiac@vmmc.gov.ph', _password, _confirmed,
    '{"full_name":"Dept User – Cardiology","role":"department_user","department_id":"CARDIAC"}',
    _confirmed, _confirmed, '', '');

  -- 19. Oncology
  INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token)
  VALUES ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated',
    'onco@vmmc.gov.ph', _password, _confirmed,
    '{"full_name":"Dept User – Oncology","role":"department_user","department_id":"ONCO"}',
    _confirmed, _confirmed, '', '');

  -- 20. Nurse
  INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token)
  VALUES ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated',
    'nurse@vmmc.gov.ph', _password, _confirmed,
    '{"full_name":"OR Nurse","role":"nurse"}',
    _confirmed, _confirmed, '', '');

END;
$$;
```

> The `on_auth_user_created` trigger fires automatically for each row, populating `public.profiles` with the correct role and department.

---

### Option B: Manual via Dashboard

1. Go to **Authentication → Users** → **Invite user** (or **Add user**).
2. Enter one email at a time and set the password to `Vmmc@2026!`.
3. After each user is created, the profile row is auto-created by the trigger.
4. Verify roles were applied correctly by checking **Table Editor → profiles**.

---

## 8. Row Level Security (RLS) Reference

All tables have RLS enabled. Here's a quick summary:

| Table | SELECT | INSERT | UPDATE | DELETE |
|---|---|---|---|---|
| `profiles` | All auth users | — | Own profile / super_admin | super_admin |
| `or_rooms` | All auth users | Admin | Admin | Admin |
| `or_room_live_status` | All auth users | Admin | Admin | Admin |
| `bookings` | All auth users | Admin + dept user (own dept) | Admin + dept user (own dept) | — |
| `booking_change_requests` | All auth users | Non-viewer/nurse | Admin | — |
| `recurring_templates` | All auth users | Admin | Admin | Admin |
| `notifications` | Own only | All auth | Own only | — |
| `audit_logs` | Admin only | All auth (immutable) | ❌ NEVER | ❌ NEVER |
| `archive_snapshots` | Admin only | — | — | — |
| `or_priority_schedule` | All auth users | Admin | Admin | Admin |
| `nurse_duty_assignments` | All auth users | Admin + nurse | Admin + nurse | Admin + nurse |

> "Admin" = `super_admin` or `anesthesiology_admin`

---

## 9. Troubleshooting

### "permission denied for table …"

RLS is enabled. Make sure the user is signed in and has the correct role in `profiles`.

### "duplicate key value violates unique constraint"

You're trying to re-run the schema on a database that already has data. Either:
- Drop all tables first: `DROP SCHEMA public CASCADE; CREATE SCHEMA public;` (⚠️ destroys everything)
- Or use a fresh project

### "relation auth.users does not exist"

You're running the SQL outside of Supabase (e.g., plain PostgreSQL). The `profiles` table references `auth.users`, which is a Supabase-specific schema. Use the Supabase SQL Editor or a connected `psql` session.

### "publication supabase_realtime does not exist"

This publication is created automatically by Supabase. If missing, create it:

```sql
CREATE PUBLICATION supabase_realtime;
```

Then re-run the `ALTER PUBLICATION` statements from the schema.

### Conflict trigger blocks legitimate bookings

The `check_booking_conflict` trigger prevents overlapping bookings for the same room/anesthesiologist. Emergency bookings (`is_emergency = true`) bypass it automatically. If you need to force-insert a non-emergency booking during testing:

```sql
ALTER TABLE public.bookings DISABLE TRIGGER check_booking_conflict_trigger;
-- do your insert
ALTER TABLE public.bookings ENABLE TRIGGER check_booking_conflict_trigger;
```

---

## Quick Start Checklist

- [ ] Create Supabase project
- [ ] Run `002_full_schema.sql` in SQL Editor
- [ ] Create `.env` with `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
- [ ] Verify Realtime is enabled for key tables
- [ ] Create initial super_admin user
- [ ] Run `npm install && npm run dev`
- [ ] Login and verify dashboard loads

---

*Last updated: February 2025*
