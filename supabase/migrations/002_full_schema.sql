-- =============================================
-- VMMC OR Booking System — Complete Supabase Schema
-- Generated: 2026-02-26
-- Version: 2.0 (matches all frontend features)
--
-- Run this on a FRESH Supabase project, or use
-- the incremental migration guide in SUPABASE_INTEGRATION.md
-- =============================================

-- ─────────────────────────────────────────────
-- EXTENSIONS
-- ─────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";


-- ═════════════════════════════════════════════
-- 1. PROFILES (extends Supabase Auth)
-- ═════════════════════════════════════════════
-- Mirrors: src/lib/types.ts → UserProfile
-- Roles:   src/lib/constants.ts → USER_ROLES
--   super_admin, anesthesiology_admin, department_user, nurse, viewer
-- ─────────────────────────────────────────────

CREATE TABLE public.profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT NOT NULL UNIQUE,
  full_name   TEXT NOT NULL,
  role        TEXT NOT NULL DEFAULT 'viewer'
              CHECK (role IN (
                'super_admin',
                'anesthesiology_admin',
                'department_user',
                'nurse',
                'viewer'
              )),
  department_id TEXT
              CHECK (department_id IS NULL OR department_id IN (
                'GS','OBGYNE','ORTHO','OPHTHA','ENT','PEDIA','URO','TCVS','NEURO',
                'PLASTICS','PSYCH','DENTAL','GI','RADIO','PULMO','CARDIAC','ONCO'
              )),
  avatar_url  TEXT,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Everyone authenticated can read profiles
CREATE POLICY "profiles_select_authenticated"
  ON public.profiles FOR SELECT TO authenticated
  USING (true);

-- Users can update their own profile
CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Super admins can do everything on profiles
CREATE POLICY "profiles_all_super_admin"
  ON public.profiles FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'super_admin')
  );


-- ═════════════════════════════════════════════
-- 2. OR ROOMS
-- ═════════════════════════════════════════════
-- Mirrors: src/lib/types.ts → ORRoom
-- ─────────────────────────────────────────────

CREATE TABLE public.or_rooms (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  number              INT NOT NULL UNIQUE,
  name                TEXT NOT NULL,
  designation         TEXT NOT NULL DEFAULT '',
  is_active           BOOLEAN NOT NULL DEFAULT true,
  buffer_time_minutes INT NOT NULL DEFAULT 30
                      CHECK (buffer_time_minutes >= 0 AND buffer_time_minutes <= 120),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.or_rooms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "or_rooms_select_authenticated"
  ON public.or_rooms FOR SELECT TO authenticated
  USING (true);

-- Admins + nurses can view; admins can manage
CREATE POLICY "or_rooms_all_admin"
  ON public.or_rooms FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('super_admin', 'anesthesiology_admin'))
  );

-- Seed default 8 OR rooms (VMMC layout)
INSERT INTO public.or_rooms (number, name, designation, buffer_time_minutes) VALUES
  (1, 'OR 1', 'General Surgery Priority',  30),
  (2, 'OR 2', 'OB-GYNE Priority',          30),
  (3, 'OR 3', 'Orthopedics Priority',       30),
  (4, 'OR 4', 'ENT / Ophtha Priority',      30),
  (5, 'OR 5', 'Cardiac',                    45),
  (6, 'OR 6', 'Neurosurgery Priority',      30),
  (7, 'OR 7', 'Pediatrics Priority',        30),
  (8, 'OR 8', 'Multi-specialty',            30);


-- ═════════════════════════════════════════════
-- 3. OR ROOM LIVE STATUS
-- ═════════════════════════════════════════════
-- Mirrors: src/lib/types.ts → ORRoomLiveStatus
-- Statuses: idle | in_transit | ongoing | ended | deferred
-- Controlled exclusively by anes dept (LiveBoardPage)
-- ─────────────────────────────────────────────

CREATE TABLE public.or_room_live_status (
  room_id             UUID PRIMARY KEY REFERENCES public.or_rooms(id) ON DELETE CASCADE,
  status              TEXT NOT NULL DEFAULT 'idle'
                      CHECK (status IN ('idle', 'in_transit', 'ongoing', 'ended', 'deferred')),
  current_booking_id  UUID,
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.or_room_live_status ENABLE ROW LEVEL SECURITY;

CREATE POLICY "live_status_select_authenticated"
  ON public.or_room_live_status FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "live_status_all_admin"
  ON public.or_room_live_status FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('super_admin', 'anesthesiology_admin'))
  );

-- Auto-seed live status rows for each OR room
INSERT INTO public.or_room_live_status (room_id)
SELECT id FROM public.or_rooms;


-- ═════════════════════════════════════════════
-- 4. BOOKINGS
-- ═════════════════════════════════════════════
-- Mirrors: src/lib/types.ts → Booking
-- Statuses: pending | approved | denied | cancelled | rescheduled | ongoing | completed
--
-- Key behaviors in the frontend:
--   • anesthesiologist is empty for non-CP categories
--     → assigned later by anes admin (BookingDetailModal edit mode)
--   • is_emergency = true auto-sets status to 'approved'
--     → bump-off conflicting to-follow cases (status → 'rescheduled')
--   • special_equipment stored as TEXT[] (comma-separated in form, split on submit)
-- ─────────────────────────────────────────────

CREATE TABLE public.bookings (
  id                          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  or_room_id                  UUID NOT NULL REFERENCES public.or_rooms(id),
  department_id               TEXT NOT NULL
                              CHECK (department_id IN (
                                'GS','OBGYNE','ORTHO','OPHTHA','ENT','PEDIA','URO','TCVS','NEURO',
                                'PLASTICS','PSYCH','DENTAL','GI','RADIO','PULMO','CARDIAC','ONCO'
                              )),
  date                        DATE NOT NULL,
  start_time                  TIME NOT NULL,
  end_time                    TIME NOT NULL,
  patient_name                TEXT NOT NULL,
  patient_age                 INT NOT NULL CHECK (patient_age >= 0 AND patient_age <= 150),
  patient_sex                 TEXT NOT NULL CHECK (patient_sex IN ('M', 'F')),
  patient_category            TEXT NOT NULL
                              CHECK (patient_category IN (
                                'RPV','RPVD','VMMCP','VMMCPD','VMMCPR','CP','CPNBB','CP-M'
                              )),
  ward                        TEXT NOT NULL,
  procedure_name              TEXT NOT NULL,
  surgeon                     TEXT NOT NULL,
  anesthesiologist            TEXT NOT NULL DEFAULT '',   -- empty for non-CP; assigned later by anes dept
  scrub_nurse                 TEXT NOT NULL DEFAULT '',
  circulating_nurse           TEXT NOT NULL DEFAULT '',
  clearance_availability      BOOLEAN NOT NULL DEFAULT true,
  special_equipment           TEXT[] NOT NULL DEFAULT '{}',
  estimated_duration_minutes  INT NOT NULL CHECK (estimated_duration_minutes > 0),
  actual_duration_minutes     INT,
  status                      TEXT NOT NULL DEFAULT 'pending'
                              CHECK (status IN (
                                'pending','approved','denied','cancelled',
                                'rescheduled','ongoing','completed'
                              )),
  is_emergency                BOOLEAN NOT NULL DEFAULT false,
  emergency_reason            TEXT,
  denial_reason               TEXT,
  notes                       TEXT,
  created_by                  UUID NOT NULL REFERENCES public.profiles(id),
  approved_by                 UUID REFERENCES public.profiles(id),
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT valid_time_range CHECK (start_time < end_time)
);

-- Performance indexes
CREATE INDEX idx_bookings_date              ON public.bookings(date);
CREATE INDEX idx_bookings_room_date         ON public.bookings(or_room_id, date);
CREATE INDEX idx_bookings_department        ON public.bookings(department_id);
CREATE INDEX idx_bookings_status            ON public.bookings(status);
CREATE INDEX idx_bookings_anesthesiologist  ON public.bookings(anesthesiologist, date);
CREATE INDEX idx_bookings_emergency         ON public.bookings(is_emergency) WHERE is_emergency = true;

ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read bookings
CREATE POLICY "bookings_select_authenticated"
  ON public.bookings FOR SELECT TO authenticated
  USING (true);

-- Department users can create bookings for their own department
CREATE POLICY "bookings_insert_dept"
  ON public.bookings FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
      AND (
        p.role IN ('super_admin', 'anesthesiology_admin')
        OR (p.role = 'department_user' AND p.department_id = department_id)
      )
    )
  );

-- Admins can update any booking (approve, deny, edit, bump-off, etc.)
CREATE POLICY "bookings_update_admin"
  ON public.bookings FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('super_admin', 'anesthesiology_admin')
    )
  );

-- Department users can update their own department's bookings (request change, cancel)
CREATE POLICY "bookings_update_own_dept"
  ON public.bookings FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
      AND p.role = 'department_user'
      AND p.department_id = department_id
    )
  );


-- ═════════════════════════════════════════════
-- 5. BOOKING CHANGE REQUESTS
-- ═════════════════════════════════════════════
-- Mirrors: src/lib/types.ts → BookingChangeRequest
-- Used by ChangeScheduleModal
-- ─────────────────────────────────────────────

CREATE TABLE public.booking_change_requests (
  id                          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  original_booking_id         UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  department_id               TEXT NOT NULL,
  im_subspecialty             TEXT,
  im_subspecialty_other       TEXT,
  new_date                    DATE NOT NULL,
  new_preferred_time          TIME NOT NULL,
  patient_details             TEXT NOT NULL,
  procedure_name              TEXT NOT NULL,
  preferred_anesthesiologist  TEXT,
  reason                      TEXT NOT NULL,
  reason_other                TEXT,
  additional_info             TEXT,
  status                      TEXT NOT NULL DEFAULT 'pending'
                              CHECK (status IN ('pending', 'approved', 'denied')),
  created_by                  UUID NOT NULL REFERENCES public.profiles(id),
  reviewed_by                 UUID REFERENCES public.profiles(id),
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_change_requests_booking ON public.booking_change_requests(original_booking_id);
CREATE INDEX idx_change_requests_status  ON public.booking_change_requests(status);

ALTER TABLE public.booking_change_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "change_requests_select_authenticated"
  ON public.booking_change_requests FOR SELECT TO authenticated
  USING (true);

-- Anyone except viewer/nurse can create change requests
-- (anes admin gets override: bypasses 24h restriction in the frontend)
CREATE POLICY "change_requests_insert"
  ON public.booking_change_requests FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role NOT IN ('viewer', 'nurse')
    )
  );

-- Admins can review (approve/deny) change requests
CREATE POLICY "change_requests_update_admin"
  ON public.booking_change_requests FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('super_admin', 'anesthesiology_admin')
    )
  );


-- ═════════════════════════════════════════════
-- 6. RECURRING TEMPLATES
-- ═════════════════════════════════════════════
-- Mirrors: src/lib/types.ts → RecurringTemplate
-- ─────────────────────────────────────────────

CREATE TABLE public.recurring_templates (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  department_id   TEXT NOT NULL,
  or_room_id      UUID NOT NULL REFERENCES public.or_rooms(id),
  day_of_week     INT NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time      TIME NOT NULL,
  end_time        TIME NOT NULL,
  procedure_name  TEXT NOT NULL,
  surgeon         TEXT NOT NULL,
  is_active       BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.recurring_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "recurring_templates_select_authenticated"
  ON public.recurring_templates FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "recurring_templates_all_admin"
  ON public.recurring_templates FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('super_admin', 'anesthesiology_admin'))
  );


-- ═════════════════════════════════════════════
-- 7. NOTIFICATIONS
-- ═════════════════════════════════════════════
-- Mirrors: src/lib/types.ts → Notification
-- Types match the union type in types.ts
-- ─────────────────────────────────────────────

CREATE TABLE public.notifications (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id             UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title               TEXT NOT NULL,
  message             TEXT NOT NULL,
  type                TEXT NOT NULL
                      CHECK (type IN (
                        'booking_confirmation','approval','denial','schedule_change',
                        'cancellation','reminder_24h','reminder_2h','emergency_alert',
                        'case_ending_soon','new_request','purge_warning'
                      )),
  related_booking_id  UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
  is_read             BOOLEAN NOT NULL DEFAULT false,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_notifications_user       ON public.notifications(user_id, is_read);
CREATE INDEX idx_notifications_created    ON public.notifications(created_at DESC);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notifications_select_own"
  ON public.notifications FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "notifications_insert"
  ON public.notifications FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "notifications_update_own"
  ON public.notifications FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());


-- ═════════════════════════════════════════════
-- 8. AUDIT LOGS (IMMUTABLE)
-- ═════════════════════════════════════════════
-- Mirrors: src/lib/types.ts → AuditLog
-- Visible to: super_admin, anesthesiology_admin only
-- ─────────────────────────────────────────────

CREATE TABLE public.audit_logs (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES public.profiles(id),
  action      TEXT NOT NULL,          -- e.g. 'booking.create', 'booking.approve', 'user.login'
  entity_type TEXT NOT NULL,          -- e.g. 'booking', 'user', 'or_room'
  entity_id   UUID,
  old_values  JSONB,
  new_values  JSONB,
  ip_address  INET,
  user_agent  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_logs_user    ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_action  ON public.audit_logs(action);
CREATE INDEX idx_audit_logs_entity  ON public.audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_date    ON public.audit_logs(created_at DESC);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "audit_logs_select_admin"
  ON public.audit_logs FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('super_admin', 'anesthesiology_admin')
    )
  );

CREATE POLICY "audit_logs_insert_authenticated"
  ON public.audit_logs FOR INSERT TO authenticated
  WITH CHECK (true);

-- Immutability triggers — no UPDATE or DELETE ever
CREATE OR REPLACE FUNCTION prevent_audit_log_modification()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Audit logs are immutable. Updates and deletes are not permitted.';
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER prevent_audit_log_update
  BEFORE UPDATE ON public.audit_logs
  FOR EACH ROW EXECUTE FUNCTION prevent_audit_log_modification();

CREATE TRIGGER prevent_audit_log_delete
  BEFORE DELETE ON public.audit_logs
  FOR EACH ROW EXECUTE FUNCTION prevent_audit_log_modification();


-- ═════════════════════════════════════════════
-- 9. DATA RETENTION / ARCHIVE SNAPSHOTS
-- ═════════════════════════════════════════════

CREATE TABLE public.archive_snapshots (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date_range_start  DATE NOT NULL,
  date_range_end    DATE NOT NULL,
  file_url          TEXT,
  record_count      INT NOT NULL DEFAULT 0,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.archive_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "archive_snapshots_select_admin"
  ON public.archive_snapshots FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('super_admin', 'anesthesiology_admin')
    )
  );


-- ═════════════════════════════════════════════
-- 10. OR PRIORITY SCHEDULE
-- ═════════════════════════════════════════════
-- Mirrors: src/stores/appStore.ts → useORPriorityScheduleStore
-- Key format: "department_id × weekday" → priority_label
-- Managed by anes admin via ORPriorityModal
-- ─────────────────────────────────────────────

CREATE TABLE public.or_priority_schedule (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  department_id    TEXT NOT NULL
                   CHECK (department_id IN (
                     'GS','OBGYNE','ORTHO','OPHTHA','ENT','PEDIA','URO','TCVS','NEURO',
                     'PLASTICS','PSYCH','DENTAL','GI','RADIO','PULMO','CARDIAC','ONCO'
                   )),
  weekday          TEXT NOT NULL
                   CHECK (weekday IN ('Monday','Tuesday','Wednesday','Thursday','Friday')),
  priority_label   TEXT NOT NULL DEFAULT 'PRIORITY',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (department_id, weekday)
);

CREATE INDEX idx_priority_schedule_day ON public.or_priority_schedule(weekday);

ALTER TABLE public.or_priority_schedule ENABLE ROW LEVEL SECURITY;

CREATE POLICY "priority_schedule_select_authenticated"
  ON public.or_priority_schedule FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "priority_schedule_all_admin"
  ON public.or_priority_schedule FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('super_admin', 'anesthesiology_admin')
    )
  );

-- Seed VMMC proposed OR priority schedule
INSERT INTO public.or_priority_schedule (department_id, weekday, priority_label) VALUES
  -- General Surgery (specific anesthesiologists)
  ('GS', 'Monday',    'Dr. Littaua, Dr. Taplac'),
  ('GS', 'Tuesday',   'Dr. Ocampo'),
  ('GS', 'Wednesday', 'Dr. Cruz, Dr. Ong'),
  ('GS', 'Thursday',  'Dr. Bartolome, Dr. Andres, Dr. RM Santos'),
  ('GS', 'Friday',    'Dr. Yabut, Dr. Guerrero'),
  -- Urology
  ('URO', 'Monday',    'PRIORITY'),
  ('URO', 'Wednesday', 'PRIORITY OPEN'),
  ('URO', 'Friday',    'PRIORITY NON-OPEN (ENDOSCOPY)'),
  -- Orthopedics
  ('ORTHO', 'Monday',  'PRIORITY'),
  ('ORTHO', 'Tuesday', 'PRIORITY'),
  ('ORTHO', 'Friday',  'PRIORITY'),
  -- TCVS
  ('TCVS', 'Wednesday', 'PRIORITY'),
  -- Neurosurgery
  ('NEURO', 'Wednesday', 'PRIORITY'),
  ('NEURO', 'Friday',    'PRIORITY'),
  -- Plastics
  ('PLASTICS', 'Wednesday', 'PRIORITY'),
  ('PLASTICS', 'Friday',    'PRIORITY'),
  -- Pediatrics
  ('PEDIA', 'Monday', 'PRIORITY'),
  -- OB-GYNE
  ('OBGYNE', 'Tuesday',  'PRIORITY'),
  ('OBGYNE', 'Thursday', 'PRIORITY'),
  -- Ophthalmology
  ('OPHTHA', 'Tuesday',  'PRIORITY'),
  ('OPHTHA', 'Thursday', 'PRIORITY'),
  -- ENT
  ('ENT', 'Tuesday',  'PRIORITY'),
  ('ENT', 'Thursday', 'PRIORITY');


-- ═════════════════════════════════════════════
-- 11. NURSE ON DUTY ASSIGNMENTS
-- ═════════════════════════════════════════════
-- Mirrors: ORRoomsPage.tsx → nurseDuty state
-- Nurses (and admins) can assign scrub & circulating nurses per room per date
-- ─────────────────────────────────────────────

CREATE TABLE public.nurse_duty_assignments (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  or_room_id          UUID NOT NULL REFERENCES public.or_rooms(id) ON DELETE CASCADE,
  date                DATE NOT NULL DEFAULT CURRENT_DATE,
  scrub_nurse         TEXT NOT NULL DEFAULT '',
  circulating_nurse   TEXT NOT NULL DEFAULT '',
  assigned_by         UUID NOT NULL REFERENCES public.profiles(id),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (or_room_id, date)
);

CREATE INDEX idx_nurse_duty_date ON public.nurse_duty_assignments(date);

ALTER TABLE public.nurse_duty_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "nurse_duty_select_authenticated"
  ON public.nurse_duty_assignments FOR SELECT TO authenticated
  USING (true);

-- Nurses, super_admin and anes admin can manage duty assignments
CREATE POLICY "nurse_duty_manage"
  ON public.nurse_duty_assignments FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('super_admin', 'anesthesiology_admin', 'nurse')
    )
  );


-- ═════════════════════════════════════════════
-- 12. HELPER FUNCTIONS & TRIGGERS
-- ═════════════════════════════════════════════

-- ── Auto-update updated_at ──
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_or_rooms_updated_at
  BEFORE UPDATE ON public.or_rooms
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_change_requests_updated_at
  BEFORE UPDATE ON public.booking_change_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_priority_schedule_updated_at
  BEFORE UPDATE ON public.or_priority_schedule
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_nurse_duty_updated_at
  BEFORE UPDATE ON public.nurse_duty_assignments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- ── Booking conflict check ──
-- Prevents double-booking of rooms and anesthesiologists.
-- Emergency cases bypass this in the frontend (bump-off logic).
-- To allow emergency override at DB level, the trigger checks is_emergency.
CREATE OR REPLACE FUNCTION check_booking_conflict()
RETURNS TRIGGER AS $$
BEGIN
  -- Skip conflict check for emergency insertions (bump-off handled in app)
  IF NEW.is_emergency = true THEN
    RETURN NEW;
  END IF;

  -- Check for room double-booking
  IF EXISTS (
    SELECT 1 FROM public.bookings
    WHERE or_room_id = NEW.or_room_id
      AND date = NEW.date
      AND id != COALESCE(NEW.id, uuid_generate_v4())
      AND status NOT IN ('cancelled', 'denied', 'rescheduled')
      AND (NEW.start_time, NEW.end_time) OVERLAPS (start_time, end_time)
  ) THEN
    RAISE EXCEPTION 'Room conflict: This OR room is already booked during this time period.';
  END IF;

  -- Check for anesthesiologist double-booking (only if assigned)
  IF NEW.anesthesiologist IS NOT NULL AND NEW.anesthesiologist != '' THEN
    IF EXISTS (
      SELECT 1 FROM public.bookings
      WHERE anesthesiologist = NEW.anesthesiologist
        AND date = NEW.date
        AND id != COALESCE(NEW.id, uuid_generate_v4())
        AND status NOT IN ('cancelled', 'denied', 'rescheduled')
        AND (NEW.start_time, NEW.end_time) OVERLAPS (start_time, end_time)
    ) THEN
      RAISE EXCEPTION 'Anesthesiologist conflict: % is already assigned during this time period.', NEW.anesthesiologist;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_booking_conflict_trigger
  BEFORE INSERT OR UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION check_booking_conflict();


-- ═════════════════════════════════════════════
-- 13. AUTO-CREATE PROFILE ON SIGNUP
-- ═════════════════════════════════════════════
-- When a user signs up via Supabase Auth, automatically
-- create a matching row in public.profiles.
-- Pass role/full_name/department_id via raw_user_meta_data.
-- ─────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, department_id)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'role', 'viewer'),
    NULLIF(NEW.raw_user_meta_data->>'department_id', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ═════════════════════════════════════════════
-- 14. REALTIME SUBSCRIPTIONS
-- ═════════════════════════════════════════════
-- Enable Supabase Realtime for live-updating pages:
--   • LiveBoardPage → or_room_live_status
--   • BookingsPage / ORCalendarPage → bookings
--   • AlertsPage → notifications
--   • ORPriorityModal → or_priority_schedule
--   • ORRoomsPage nurse duty → nurse_duty_assignments
-- ─────────────────────────────────────────────

ALTER PUBLICATION supabase_realtime ADD TABLE public.bookings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.or_room_live_status;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.or_priority_schedule;
ALTER PUBLICATION supabase_realtime ADD TABLE public.nurse_duty_assignments;


-- ═════════════════════════════════════════════
-- SCHEMA COMPLETE ✓
-- ═════════════════════════════════════════════
-- Tables: 10
--   1. profiles
--   2. or_rooms
--   3. or_room_live_status
--   4. bookings
--   5. booking_change_requests
--   6. recurring_templates
--   7. notifications
--   8. audit_logs
--   9. archive_snapshots
--  10. or_priority_schedule
--  11. nurse_duty_assignments
--
-- Functions: 4
--   • update_updated_at_column
--   • check_booking_conflict
--   • prevent_audit_log_modification
--   • handle_new_user
--
-- Seed data:
--   • 8 OR rooms
--   • 24 priority schedule entries
--   • Live status rows auto-seeded
-- ═════════════════════════════════════════════
