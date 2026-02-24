-- =============================================
-- VMMC OR Booking System - Supabase Schema
-- Full database migration for PostgreSQL
-- =============================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================
-- 1. PROFILES (extends Supabase Auth)
-- =============================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('super_admin', 'anesthesiology_admin', 'department_user', 'viewer')),
  department_id TEXT CHECK (department_id IN (
    'GS','OBGYNE','ORTHO','OPHTHA','ENT','PEDIA','URO','TCVS','NEURO',
    'PLASTICS','PSYCH','DENTAL','GI','RADIO','PULMO','CARDIAC','ONCO'
  )),
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles are viewable by authenticated users"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Super admins can manage all profiles"
  ON public.profiles FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'super_admin')
  );

-- =============================================
-- 2. OR ROOMS
-- =============================================
CREATE TABLE public.or_rooms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  number INT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  designation TEXT NOT NULL DEFAULT '',
  is_active BOOLEAN DEFAULT true,
  buffer_time_minutes INT DEFAULT 30 CHECK (buffer_time_minutes >= 0 AND buffer_time_minutes <= 120),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.or_rooms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "OR rooms are viewable by authenticated users"
  ON public.or_rooms FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage OR rooms"
  ON public.or_rooms FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('super_admin', 'anesthesiology_admin'))
  );

-- Insert default 8 OR rooms
INSERT INTO public.or_rooms (number, name, designation) VALUES
  (1, 'OR 1', 'General Surgery Priority'),
  (2, 'OR 2', 'OB-GYNE Priority'),
  (3, 'OR 3', 'Orthopedics Priority'),
  (4, 'OR 4', 'ENT / Ophtha Priority'),
  (5, 'OR 5', 'Cardiac'),
  (6, 'OR 6', 'Neurosurgery Priority'),
  (7, 'OR 7', 'Pediatrics Priority'),
  (8, 'OR 8', 'Multi-specialty');

-- =============================================
-- 3. OR ROOM LIVE STATUS
-- =============================================
CREATE TABLE public.or_room_live_status (
  room_id UUID PRIMARY KEY REFERENCES public.or_rooms(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'idle' CHECK (status IN ('idle', 'ongoing', 'ended')),
  current_booking_id UUID,
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.or_room_live_status ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Live status viewable by all authenticated"
  ON public.or_room_live_status FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can update live status"
  ON public.or_room_live_status FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('super_admin', 'anesthesiology_admin'))
  );

-- =============================================
-- 4. BOOKINGS
-- =============================================
CREATE TABLE public.bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  or_room_id UUID NOT NULL REFERENCES public.or_rooms(id),
  department_id TEXT NOT NULL CHECK (department_id IN (
    'GS','OBGYNE','ORTHO','OPHTHA','ENT','PEDIA','URO','TCVS','NEURO',
    'PLASTICS','PSYCH','DENTAL','GI','RADIO','PULMO','CARDIAC','ONCO'
  )),
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  patient_name TEXT NOT NULL,
  patient_age INT NOT NULL CHECK (patient_age >= 0 AND patient_age <= 150),
  patient_sex TEXT NOT NULL CHECK (patient_sex IN ('M', 'F')),
  patient_category TEXT NOT NULL CHECK (patient_category IN ('RPV','RPVD','VMMCP','VMMCPD','VMMCPR','CP','CPNBB','CP-M')),
  ward TEXT NOT NULL,
  procedure_name TEXT NOT NULL,
  surgeon TEXT NOT NULL,
  anesthesiologist TEXT NOT NULL,
  clearance_availability BOOLEAN DEFAULT true,
  special_equipment TEXT[] DEFAULT '{}',
  estimated_duration_minutes INT NOT NULL CHECK (estimated_duration_minutes > 0),
  actual_duration_minutes INT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','denied','cancelled','rescheduled','ongoing','completed')),
  is_emergency BOOLEAN DEFAULT false,
  emergency_reason TEXT,
  denial_reason TEXT,
  notes TEXT,
  created_by UUID NOT NULL REFERENCES public.profiles(id),
  approved_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  -- Ensure start_time < end_time
  CONSTRAINT valid_time_range CHECK (start_time < end_time)
);

-- Indexes for performance
CREATE INDEX idx_bookings_date ON public.bookings(date);
CREATE INDEX idx_bookings_room_date ON public.bookings(or_room_id, date);
CREATE INDEX idx_bookings_department ON public.bookings(department_id);
CREATE INDEX idx_bookings_status ON public.bookings(status);
CREATE INDEX idx_bookings_anesthesiologist ON public.bookings(anesthesiologist, date);

ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Bookings are viewable by authenticated users"
  ON public.bookings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Dept users can create bookings for own department"
  ON public.bookings FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND (
        role IN ('super_admin', 'anesthesiology_admin')
        OR (role = 'department_user' AND department_id = bookings.department_id)
      )
    )
  );

CREATE POLICY "Admins can update any booking"
  ON public.bookings FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('super_admin', 'anesthesiology_admin'))
  );

-- =============================================
-- 5. BOOKING CHANGE REQUESTS
-- =============================================
CREATE TABLE public.booking_change_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  original_booking_id UUID NOT NULL REFERENCES public.bookings(id),
  department_id TEXT NOT NULL,
  im_subspecialty TEXT,
  im_subspecialty_other TEXT,
  new_date DATE NOT NULL,
  new_preferred_time TIME NOT NULL,
  patient_details TEXT NOT NULL,
  procedure_name TEXT NOT NULL,
  preferred_anesthesiologist TEXT,
  reason TEXT NOT NULL,
  reason_other TEXT,
  additional_info TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied')),
  created_by UUID NOT NULL REFERENCES public.profiles(id),
  reviewed_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.booking_change_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Change requests viewable by authenticated"
  ON public.booking_change_requests FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Dept users can create change requests"
  ON public.booking_change_requests FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role != 'viewer')
  );

-- =============================================
-- 6. RECURRING TEMPLATES
-- =============================================
CREATE TABLE public.recurring_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  department_id TEXT NOT NULL,
  or_room_id UUID NOT NULL REFERENCES public.or_rooms(id),
  day_of_week INT NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  procedure_name TEXT NOT NULL,
  surgeon TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- 7. NOTIFICATIONS
-- =============================================
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN (
    'booking_confirmation','approval','denial','schedule_change',
    'cancellation','reminder_24h','reminder_2h','emergency_alert',
    'case_ending_soon','new_request','purge_warning'
  )),
  related_booking_id UUID REFERENCES public.bookings(id),
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_notifications_user ON public.notifications(user_id, is_read);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own notifications"
  ON public.notifications FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "System can create notifications"
  ON public.notifications FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can mark own notifications read"
  ON public.notifications FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- =============================================
-- 8. AUDIT LOGS (IMMUTABLE)
-- =============================================
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_audit_logs_user ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX idx_audit_logs_entity ON public.audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_date ON public.audit_logs(created_at);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Only super_admin and anesthesiology_admin can read audit logs
CREATE POLICY "Admins can view audit logs"
  ON public.audit_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('super_admin', 'anesthesiology_admin'))
  );

-- Anyone authenticated can INSERT (for logging their own actions)
CREATE POLICY "Authenticated users can create audit log entries"
  ON public.audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- NO UPDATE OR DELETE policies at all — audit logs are immutable
-- Additionally, create a trigger to prevent any updates or deletes

CREATE OR REPLACE FUNCTION prevent_audit_log_modification()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Audit logs are immutable. Updates and deletes are not permitted.';
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER prevent_audit_log_update
  BEFORE UPDATE ON public.audit_logs
  FOR EACH ROW
  EXECUTE FUNCTION prevent_audit_log_modification();

CREATE TRIGGER prevent_audit_log_delete
  BEFORE DELETE ON public.audit_logs
  FOR EACH ROW
  EXECUTE FUNCTION prevent_audit_log_modification();

-- =============================================
-- 9. DATA RETENTION / ARCHIVES
-- =============================================
CREATE TABLE public.archive_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date_range_start DATE NOT NULL,
  date_range_end DATE NOT NULL,
  file_url TEXT,
  record_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- 10. HELPER FUNCTIONS
-- =============================================

-- Conflict check function for bookings
CREATE OR REPLACE FUNCTION check_booking_conflict()
RETURNS TRIGGER AS $$
BEGIN
  -- Check for room double-booking
  IF EXISTS (
    SELECT 1 FROM public.bookings
    WHERE or_room_id = NEW.or_room_id
    AND date = NEW.date
    AND id != COALESCE(NEW.id, uuid_generate_v4())
    AND status NOT IN ('cancelled', 'denied')
    AND (
      (NEW.start_time, NEW.end_time) OVERLAPS (start_time, end_time)
    )
  ) THEN
    RAISE EXCEPTION 'Room conflict: This OR room is already booked during this time period.';
  END IF;

  -- Check for anesthesiologist double-booking
  IF NEW.anesthesiologist IS NOT NULL AND NEW.anesthesiologist != '' THEN
    IF EXISTS (
      SELECT 1 FROM public.bookings
      WHERE anesthesiologist = NEW.anesthesiologist
      AND date = NEW.date
      AND id != COALESCE(NEW.id, uuid_generate_v4())
      AND status NOT IN ('cancelled', 'denied')
      AND (
        (NEW.start_time, NEW.end_time) OVERLAPS (start_time, end_time)
      )
    ) THEN
      RAISE EXCEPTION 'Anesthesiologist conflict: % is already assigned during this time period.', NEW.anesthesiologist;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_booking_conflict_trigger
  BEFORE INSERT OR UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION check_booking_conflict();

-- Auto-update updated_at timestamp
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

-- =============================================
-- 11. REALTIME SUBSCRIPTIONS
-- =============================================
-- Enable realtime for live updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.bookings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.or_room_live_status;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- =============================================
-- 12. AUTO-CREATE PROFILE ON SIGNUP
-- =============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'role', 'viewer')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
