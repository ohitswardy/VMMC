import { format, addDays } from 'date-fns';
import type { Booking, ORRoom, Notification, AuditLog, UserProfile } from './types';
import { generateId } from './utils';
import type { BookingStatus, DepartmentId } from './constants';

const today = format(new Date(), 'yyyy-MM-dd');
const tomorrow = format(addDays(new Date(), 1), 'yyyy-MM-dd');

// ── Mock Users ──
export const MOCK_USERS: UserProfile[] = [
  {
    id: 'u1', email: 'admin@vmmc.ph', full_name: 'Dr. Maria Santos',
    role: 'super_admin', department_id: null, is_active: true,
    created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'u2', email: 'anesthesia@vmmc.ph', full_name: 'Dr. Juan Dela Cruz',
    role: 'anesthesiology_admin', department_id: null, is_active: true,
    created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'u3', email: 'gs@vmmc.ph', full_name: 'Dr. Ana Reyes',
    role: 'department_user', department_id: 'GS', is_active: true,
    created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'u4', email: 'obgyne@vmmc.ph', full_name: 'Dr. Grace Lim',
    role: 'department_user', department_id: 'OBGYNE', is_active: true,
    created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'u5', email: 'nurse@vmmc.ph', full_name: 'Nurse Patricia Cruz',
    role: 'nurse', department_id: null, is_active: true,
    created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z',
  },
];

// ── Mock OR Rooms ──
export const MOCK_OR_ROOMS: ORRoom[] = [
  { id: 'r1', number: 1, name: 'OR 1', designation: 'General Surgery Priority', is_active: true, buffer_time_minutes: 30, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' },
  { id: 'r2', number: 2, name: 'OR 2', designation: 'OB-GYNE Priority', is_active: true, buffer_time_minutes: 30, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' },
  { id: 'r3', number: 3, name: 'OR 3', designation: 'Orthopedics Priority', is_active: true, buffer_time_minutes: 30, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' },
  { id: 'r4', number: 4, name: 'OR 4', designation: 'ENT / Ophtha Priority', is_active: true, buffer_time_minutes: 30, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' },
  { id: 'r5', number: 5, name: 'OR 5', designation: 'Cardiac', is_active: true, buffer_time_minutes: 45, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' },
  { id: 'r6', number: 6, name: 'OR 6', designation: 'Neurosurgery Priority', is_active: true, buffer_time_minutes: 30, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' },
  { id: 'r7', number: 7, name: 'OR 7', designation: 'Pediatrics Priority', is_active: true, buffer_time_minutes: 30, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' },
  { id: 'r8', number: 8, name: 'OR 8', designation: 'Multi-specialty', is_active: true, buffer_time_minutes: 30, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' },
];

// ── Mock Bookings ──
export const MOCK_BOOKINGS: Booking[] = [
  {
    id: 'b1', or_room_id: 'r1', department_id: 'GS', date: today,
    start_time: '08:00', end_time: '10:00',
    patient_name: 'Juan Dela Cruz', patient_age: 45, patient_sex: 'M',
    patient_category: 'VMMCP', ward: '3A', procedure: 'Cholecystectomy',
    surgeon: 'Dr. Reyes / Dr. Santos (R)', anesthesiologist: 'Dr. Dela Cruz',
    scrub_nurse: 'Nurse Dela Rosa', circulating_nurse: 'Nurse Cañon',
    clearance_availability: true, special_equipment: ['Lap', 'Tower'],
    estimated_duration_minutes: 120, status: 'ongoing', is_emergency: false,
    created_by: 'u3', approved_by: 'u2',
    created_at: '2026-02-23T08:00:00Z', updated_at: '2026-02-24T08:00:00Z',
  },
  {
    id: 'b2', or_room_id: 'r1', department_id: 'GS', date: today,
    start_time: '10:30', end_time: '12:30',
    patient_name: 'Maria Garcia', patient_age: 67, patient_sex: 'F',
    patient_category: 'CP', ward: '5B', procedure: 'Hernia Repair',
    surgeon: 'Dr. Reyes / Dr. Lim (R)', anesthesiologist: 'Dr. Aquino',
    scrub_nurse: 'Nurse Cruz', circulating_nurse: 'Nurse Bautista',
    clearance_availability: true, special_equipment: [],
    estimated_duration_minutes: 120, status: 'approved', is_emergency: false,
    created_by: 'u3', approved_by: 'u2',
    created_at: '2026-02-23T09:00:00Z', updated_at: '2026-02-23T10:00:00Z',
  },
  {
    id: 'b3', or_room_id: 'r2', department_id: 'OBGYNE', date: today,
    start_time: '07:30', end_time: '09:30',
    patient_name: 'Ana Santos', patient_age: 28, patient_sex: 'F',
    patient_category: 'VMMCP', ward: 'OB Ward', procedure: 'Cesarean Section',
    surgeon: 'Dr. Lim / Dr. Perez (R)', anesthesiologist: 'Dr. Dela Cruz',
    scrub_nurse: 'Nurse Reyes', circulating_nurse: 'Nurse Gomez',
    clearance_availability: true, special_equipment: [],
    estimated_duration_minutes: 120, status: 'completed', is_emergency: false,
    created_by: 'u4', approved_by: 'u2',
    created_at: '2026-02-22T08:00:00Z', updated_at: '2026-02-24T09:30:00Z',
    actual_duration_minutes: 110,
  },
  {
    id: 'b4', or_room_id: 'r2', department_id: 'OBGYNE', date: today,
    start_time: '10:00', end_time: '12:00',
    patient_name: 'Rosa Mendoza', patient_age: 34, patient_sex: 'F',
    patient_category: 'RPV', ward: 'OB Ward', procedure: 'Total Abdominal Hysterectomy',
    surgeon: 'Dr. Lim / Dr. Valdez (R)', anesthesiologist: 'Dr. Aquino',
    scrub_nurse: 'Nurse Santos', circulating_nurse: 'Nurse Flores',
    clearance_availability: true, special_equipment: [],
    estimated_duration_minutes: 120, status: 'approved', is_emergency: false,
    created_by: 'u4', approved_by: 'u2',
    created_at: '2026-02-23T07:00:00Z', updated_at: '2026-02-23T08:00:00Z',
  },
  {
    id: 'b5', or_room_id: 'r3', department_id: 'ORTHO', date: today,
    start_time: '08:00', end_time: '11:00',
    patient_name: 'Pedro Ramos', patient_age: 55, patient_sex: 'M',
    patient_category: 'VMMCPD', ward: '7A', procedure: 'Total Knee Replacement',
    surgeon: 'Dr. Cruz / Dr. Tan (R)', anesthesiologist: 'Dr. Villanueva',
    scrub_nurse: 'Nurse Mendoza', circulating_nurse: 'Nurse Torres',
    clearance_availability: true, special_equipment: [],
    estimated_duration_minutes: 180, status: 'approved', is_emergency: false,
    created_by: 'u3', approved_by: 'u2',
    created_at: '2026-02-22T10:00:00Z', updated_at: '2026-02-23T08:00:00Z',
  },
  {
    id: 'b6', or_room_id: 'r5', department_id: 'CARDIAC', date: today,
    start_time: '07:00', end_time: '12:00',
    patient_name: 'Roberto Fernandez', patient_age: 62, patient_sex: 'M',
    patient_category: 'CP', ward: 'ICU', procedure: 'CABG x3',
    surgeon: 'Dr. Domingo / Dr. Aquino (R)', anesthesiologist: 'Dr. Dela Cruz',
    scrub_nurse: 'Nurse Aquino', circulating_nurse: 'Nurse Ramos',
    clearance_availability: true, special_equipment: [],
    estimated_duration_minutes: 300, status: 'ongoing', is_emergency: false,
    created_by: 'u3', approved_by: 'u2',
    created_at: '2026-02-21T08:00:00Z', updated_at: '2026-02-24T07:00:00Z',
  },
  {
    id: 'b7', or_room_id: 'r4', department_id: 'ENT', date: today,
    start_time: '09:00', end_time: '10:30',
    patient_name: 'Lucia Torres', patient_age: 8, patient_sex: 'F',
    patient_category: 'VMMCP', ward: 'Pedia Ward', procedure: 'Tonsillectomy',
    surgeon: 'Dr. Navarro / Dr. Abad (R)', anesthesiologist: 'Dr. Villanueva',
    scrub_nurse: 'Nurse Garcia', circulating_nurse: 'Nurse Valdez',
    clearance_availability: true, special_equipment: ['Microscope'],
    estimated_duration_minutes: 90, status: 'pending', is_emergency: false,
    created_by: 'u3',
    created_at: '2026-02-23T14:00:00Z', updated_at: '2026-02-23T14:00:00Z',
  },
  {
    id: 'b8', or_room_id: 'r6', department_id: 'NEURO', date: tomorrow,
    start_time: '08:00', end_time: '14:00',
    patient_name: 'Carlos Bautista', patient_age: 40, patient_sex: 'M',
    patient_category: 'CP', ward: 'Neuro ICU', procedure: 'Craniotomy - Tumor Excision',
    surgeon: 'Dr. Santiago / Dr. Rivera (R)', anesthesiologist: 'Dr. Dela Cruz',
    scrub_nurse: 'Nurse Lim', circulating_nurse: 'Nurse Rivera',
    clearance_availability: true, special_equipment: ['Microscope'],
    estimated_duration_minutes: 360, status: 'approved', is_emergency: false,
    created_by: 'u3', approved_by: 'u2',
    created_at: '2026-02-22T12:00:00Z', updated_at: '2026-02-23T09:00:00Z',
  },
];

// ── Mock Notifications ──
export const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: 'n1', user_id: 'u2', title: 'New Booking Request',
    message: 'GS submitted a new booking for OR 1 on ' + today,
    type: 'new_request', related_booking_id: 'b7', is_read: false,
    created_at: '2026-02-23T14:00:00Z',
  },
  {
    id: 'n2', user_id: 'u3', title: 'Booking Approved',
    message: 'Your booking for OR 1 (Hernia Repair) has been approved.',
    type: 'approval', related_booking_id: 'b2', is_read: true,
    created_at: '2026-02-23T10:00:00Z',
  },
  {
    id: 'n3', user_id: 'u2', title: 'Case Nearing End',
    message: 'Cholecystectomy in OR 1 is approaching estimated end time.',
    type: 'case_ending_soon', related_booking_id: 'b1', is_read: false,
    created_at: '2026-02-24T09:45:00Z',
  },
];

// ── Mock Audit Logs ──
export const MOCK_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'a1', user_id: 'u3', action: 'booking.create', entity_type: 'booking', entity_id: 'b1',
    new_values: { patient_name: 'Juan Dela Cruz', procedure: 'Cholecystectomy' },
    created_at: '2026-02-23T08:00:00Z',
  },
  {
    id: 'a2', user_id: 'u2', action: 'booking.approve', entity_type: 'booking', entity_id: 'b1',
    old_values: { status: 'pending' }, new_values: { status: 'approved' },
    created_at: '2026-02-23T08:30:00Z',
  },
  {
    id: 'a3', user_id: 'u2', action: 'booking.status_change', entity_type: 'booking', entity_id: 'b1',
    old_values: { status: 'approved' }, new_values: { status: 'ongoing' },
    created_at: '2026-02-24T08:00:00Z',
  },
  {
    id: 'a4', user_id: 'u4', action: 'booking.create', entity_type: 'booking', entity_id: 'b3',
    new_values: { patient_name: 'Ana Santos', procedure: 'Cesarean Section' },
    created_at: '2026-02-22T08:00:00Z',
  },
  {
    id: 'a5', user_id: 'u2', action: 'booking.approve', entity_type: 'booking', entity_id: 'b3',
    old_values: { status: 'pending' }, new_values: { status: 'approved' },
    created_at: '2026-02-22T09:00:00Z',
  },
  {
    id: 'a6', user_id: 'u1', action: 'user.login', entity_type: 'user', entity_id: 'u1',
    created_at: '2026-02-24T07:00:00Z',
  },
];
