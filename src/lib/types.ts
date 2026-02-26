import type { BookingStatus, DepartmentId, ORRoomStatus, PatientCategory, UserRole } from './constants';

// ── User / Auth ──
export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  department_id: DepartmentId | null;
  avatar_url?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ── OR Room ──
export interface ORRoom {
  id: string;
  number: number;
  name: string;
  designation: string;
  is_active: boolean;
  buffer_time_minutes: number;
  created_at: string;
  updated_at: string;
}

export interface ORRoomLiveStatus {
  room_id: string;
  status: ORRoomStatus;
  current_booking_id: string | null;
  updated_at: string;
}

// ── Booking ──
export interface Booking {
  id: string;
  or_room_id: string;
  department_id: DepartmentId;
  date: string; // YYYY-MM-DD
  start_time: string; // HH:MM
  end_time: string; // HH:MM
  patient_name: string;
  patient_age: number;
  patient_sex: 'M' | 'F';
  patient_category: PatientCategory;
  ward: string;
  procedure: string;
  surgeon: string;
  anesthesiologist: string;
  scrub_nurse: string;
  circulating_nurse: string;
  clearance_availability: boolean;
  special_equipment: string[];
  estimated_duration_minutes: number;
  actual_duration_minutes?: number;
  status: BookingStatus;
  is_emergency: boolean;
  emergency_reason?: string;
  denial_reason?: string;
  notes?: string;
  created_by: string;
  approved_by?: string;
  created_at: string;
  updated_at: string;
  // Joined fields
  or_room?: ORRoom;
  created_by_profile?: UserProfile;
}

// ── Booking Change Request ──
export interface BookingChangeRequest {
  id: string;
  original_booking_id: string;
  department_id: DepartmentId;
  im_subspecialty?: string;
  im_subspecialty_other?: string;
  new_date: string;
  new_preferred_time: string;
  patient_details: string;
  procedure: string;
  preferred_anesthesiologist?: string;
  reason: string;
  reason_other?: string;
  additional_info?: string;
  status: 'pending' | 'approved' | 'denied';
  created_by: string;
  reviewed_by?: string;
  created_at: string;
  updated_at: string;
}

// ── Recurring Template ──
export interface RecurringTemplate {
  id: string;
  department_id: DepartmentId;
  or_room_id: string;
  day_of_week: number; // 0=Sunday, 6=Saturday
  start_time: string;
  end_time: string;
  procedure: string;
  surgeon: string;
  is_active: boolean;
  created_at: string;
}

// ── Notification ──
export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'booking_confirmation' | 'approval' | 'denial' | 'schedule_change' |
        'cancellation' | 'reminder_24h' | 'reminder_2h' | 'emergency_alert' |
        'case_ending_soon' | 'new_request' | 'purge_warning';
  related_booking_id?: string;
  is_read: boolean;
  created_at: string;
}

// ── Audit Log ──
export interface AuditLog {
  id: string;
  user_id: string;
  action: string;
  entity_type: string;
  entity_id?: string;
  old_values?: Record<string, unknown>;
  new_values?: Record<string, unknown>;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
  // Joined
  user_profile?: UserProfile;
}

// ── Analytics ──
export interface ORUtilization {
  room_id: string;
  room_name: string;
  date: string;
  total_booked_minutes: number;
  total_available_minutes: number;
  utilization_rate: number;
}

export interface DepartmentStats {
  department_id: DepartmentId;
  total_bookings: number;
  completed: number;
  cancelled: number;
  avg_duration_variance: number;
}
