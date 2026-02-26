// ── Department definitions with colors ──
export const DEPARTMENTS = [
  { id: 'GS', name: 'General Surgery', color: '#3b82f6', bg: '#eff6ff' },
  { id: 'OBGYNE', name: 'OB-GYNE', color: '#ec4899', bg: '#fdf2f8' },
  { id: 'ORTHO', name: 'Orthopedics', color: '#f59e0b', bg: '#fffbeb' },
  { id: 'OPHTHA', name: 'Ophthalmology', color: '#8b5cf6', bg: '#f5f3ff' },
  { id: 'ENT', name: 'ENT', color: '#14b8a6', bg: '#f0fdfa' },
  { id: 'PEDIA', name: 'Pediatrics', color: '#f97316', bg: '#fff7ed' },
  { id: 'URO', name: 'Urology', color: '#06b6d4', bg: '#ecfeff' },
  { id: 'TCVS', name: 'TCVS', color: '#dc2626', bg: '#fef2f2' },
  { id: 'NEURO', name: 'Neurosurgery', color: '#7c3aed', bg: '#f5f3ff' },
  { id: 'PLASTICS', name: 'Plastics', color: '#d946ef', bg: '#fdf4ff' },
  { id: 'PSYCH', name: 'Psychiatry', color: '#64748b', bg: '#f8fafc' },
  { id: 'DENTAL', name: 'Dental', color: '#0ea5e9', bg: '#f0f9ff' },
  { id: 'GI', name: 'GI', color: '#84cc16', bg: '#f7fee7' },
  { id: 'RADIO', name: 'Radiology', color: '#a855f7', bg: '#faf5ff' },
  { id: 'PULMO', name: 'Pulmonology', color: '#22d3ee', bg: '#ecfeff' },
  { id: 'CARDIAC', name: 'Cardiac', color: '#ef4444', bg: '#fef2f2' },
  { id: 'ONCO', name: 'Oncology', color: '#10b981', bg: '#ecfdf5' },
] as const;

export type DepartmentId = typeof DEPARTMENTS[number]['id'];

export const DEPARTMENT_MAP = Object.fromEntries(
  DEPARTMENTS.map(d => [d.id, d])
) as Record<DepartmentId, typeof DEPARTMENTS[number]>;

// ── Patient categories ──
export const PATIENT_CATEGORIES = [
  'RPV', 'RPVD', 'VMMCP', 'VMMCPD', 'VMMCPR', 'CP', 'CPNBB', 'CP-M',
] as const;

export type PatientCategory = typeof PATIENT_CATEGORIES[number];

// ── Special equipment options ──
export const SPECIAL_EQUIPMENT = [
  'Lap', 'Tower', 'II', 'Microscope',
] as const;

// ── OR Room defaults ──
export const DEFAULT_OR_ROOMS = [
  { number: 1, name: 'OR 1', designation: 'General Surgery Priority' },
  { number: 2, name: 'OR 2', designation: 'OB-GYNE Priority' },
  { number: 3, name: 'OR 3', designation: 'Orthopedics Priority' },
  { number: 4, name: 'OR 4', designation: 'ENT / Ophtha Priority' },
  { number: 5, name: 'OR 5', designation: 'Cardiac' },
  { number: 6, name: 'OR 6', designation: 'Neurosurgery Priority' },
  { number: 7, name: 'OR 7', designation: 'Pediatrics Priority' },
  { number: 8, name: 'OR 8', designation: 'Multi-specialty' },
] as const;

// ── Booking status flow ──
export const BOOKING_STATUSES = [
  'pending', 'approved', 'denied', 'cancelled', 'rescheduled', 'ongoing', 'completed',
] as const;

export type BookingStatus = typeof BOOKING_STATUSES[number];

// ── OR Room live status ──
export const OR_ROOM_STATUSES = ['idle', 'in_transit', 'ongoing', 'ended', 'deferred'] as const;
export type ORRoomStatus = typeof OR_ROOM_STATUSES[number];

// ── Change reasons ──
export const CHANGE_REASONS = [
  'Additional in schedule',
  'Reschedule',
  'Consultant Availability',
  'Clearance',
  'Other',
] as const;

// ── IM Subspecialties ──
export const IM_SUBSPECIALTIES = ['GI', 'Pulmonology', 'Cardiology', 'Others'] as const;

// ── User roles ──
export const USER_ROLES = [
  'super_admin',
  'anesthesiology_admin',
  'department_user',
  'nurse',
  'viewer',
] as const;

export type UserRole = typeof USER_ROLES[number];

// ── Buffer time (minutes) between cases ──
export const DEFAULT_BUFFER_TIME = 30;

// ── Retention policy ──
export const RETENTION_DAYS_DOWNLOAD = 7;
export const RETENTION_DAYS_ARCHIVE = 30;

// ── Anesthesiology Department Contact ──
export const ANES_DEPARTMENT_CONTACT = {
  name: 'Department of Anesthesiology',
  phone: '(02) 8981-8150 loc. 286',
  email: 'vmmc.anesthesiology@gmail.com',
};

// ── Weekdays ──
export const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] as const;
export type Weekday = typeof WEEKDAYS[number];

// ── Default OR Priority Schedule (department per room per day) ──
// Each key is `${departmentId}-${Weekday}` → value string (e.g., "PRIORITY", "Dr. Cruz, Dr. Ong")
// Based on the VMMC proposed schedule.
export const DEFAULT_OR_PRIORITY_SCHEDULE: Record<string, string> = {
  // GS row — specific anesthesiologists named per day
  'GS-Monday': 'Dr. Littaua, Dr. Taplac',
  'GS-Tuesday': 'Dr. Ocampo',
  'GS-Wednesday': 'Dr. Cruz, Dr. Ong',
  'GS-Thursday': 'Dr. Bartolome, Dr. Andres, Dr. RM Santos',
  'GS-Friday': 'Dr. Yabut, Dr. Guerrero',
  // Urology
  'URO-Monday': 'PRIORITY',
  'URO-Wednesday': 'PRIORITY OPEN',
  'URO-Friday': 'PRIORITY NON-OPEN (ENDOSCOPY)',
  // Ortho
  'ORTHO-Monday': 'PRIORITY',
  'ORTHO-Tuesday': 'PRIORITY',
  'ORTHO-Friday': 'PRIORITY',
  // TCVS
  'TCVS-Wednesday': 'PRIORITY',
  // Neurosurgery
  'NEURO-Wednesday': 'PRIORITY',
  'NEURO-Friday': 'PRIORITY',
  // Plastics
  'PLASTICS-Wednesday': 'PRIORITY',
  'PLASTICS-Friday': 'PRIORITY',
  // Pedia Surgery
  'PEDIA-Monday': 'PRIORITY',
  // OB-GYE
  'OBGYNE-Tuesday': 'PRIORITY',
  'OBGYNE-Thursday': 'PRIORITY',
  // Ophtha
  'OPHTHA-Tuesday': 'PRIORITY',
  'OPHTHA-Thursday': 'PRIORITY',
  // ENT
  'ENT-Tuesday': 'PRIORITY',
  'ENT-Thursday': 'PRIORITY',
};
