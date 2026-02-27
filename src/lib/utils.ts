import { format, parseISO, differenceInMinutes, addMinutes, isWithinInterval, isBefore, addHours, addDays, startOfDay } from 'date-fns';
import type { Booking, ORRoom } from './types';
import { DEPARTMENT_MAP, DEPARTMENTS, type DepartmentId } from './constants';

/** Format a date string to human readable */
export function formatDate(date: string | Date, fmt = 'MMM dd, yyyy'): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, fmt);
}

/** Format time string HH:MM to 12-hour format */
export function formatTime(time: string): string {
  const [h, m] = time.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, '0')} ${ampm}`;
}

/** Get department color */
export function getDeptColor(deptId: DepartmentId): string {
  return DEPARTMENT_MAP[deptId]?.color || '#64748b';
}

/** Get department background */
export function getDeptBg(deptId: DepartmentId): string {
  return DEPARTMENT_MAP[deptId]?.bg || '#f8fafc';
}

/** Get department name */
export function getDeptName(deptId: DepartmentId): string {
  return DEPARTMENT_MAP[deptId]?.name || deptId;
}

/** Check if two time ranges overlap */
export function timeRangesOverlap(
  start1: string, end1: string,
  start2: string, end2: string
): boolean {
  const toMinutes = (t: string) => {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
  };
  const s1 = toMinutes(start1), e1 = toMinutes(end1);
  const s2 = toMinutes(start2), e2 = toMinutes(end2);
  return s1 < e2 && s2 < e1;
}

/** Check if a booking conflicts with existing bookings for a room */
export function hasRoomConflict(
  newBooking: { or_room_id: string; date: string; start_time: string; end_time: string; id?: string },
  existingBookings: Booking[]
): Booking | null {
  for (const existing of existingBookings) {
    if (existing.id === newBooking.id) continue;
    if (existing.or_room_id !== newBooking.or_room_id) continue;
    if (existing.date !== newBooking.date) continue;
    if (['cancelled', 'denied'].includes(existing.status)) continue;
    if (timeRangesOverlap(newBooking.start_time, newBooking.end_time, existing.start_time, existing.end_time)) {
      return existing;
    }
  }
  return null;
}

/** Check if anesthesiologist has a conflict */
export function hasAnesthesiologistConflict(
  newBooking: { anesthesiologist: string; date: string; start_time: string; end_time: string; id?: string },
  existingBookings: Booking[]
): Booking | null {
  if (!newBooking.anesthesiologist) return null;
  for (const existing of existingBookings) {
    if (existing.id === newBooking.id) continue;
    if (existing.anesthesiologist !== newBooking.anesthesiologist) continue;
    if (existing.date !== newBooking.date) continue;
    if (['cancelled', 'denied'].includes(existing.status)) continue;
    if (timeRangesOverlap(newBooking.start_time, newBooking.end_time, existing.start_time, existing.end_time)) {
      return existing;
    }
  }
  return null;
}

/** Check if booking can be modified (24 hours before) */
export function canModifyBooking(booking: Booking): boolean {
  const bookingDateTime = parseISO(`${booking.date}T${booking.start_time}`);
  const now = new Date();
  const cutoff = addHours(now, 24);
  return isBefore(cutoff, bookingDateTime);
}

/**
 * Check if the booking deadline has passed for a given target date.
 * Rule: bookings must be submitted by 12:00 PM on the previous business day.
 * - For Tuesday–Friday bookings → deadline is previous day at 12:00 PM
 * - For Monday bookings → deadline is Friday at 12:00 PM
 * Returns null if still within deadline, or a description object if past deadline.
 */
export function getBookingDeadlineStatus(targetDateStr: string): {
  isPastDeadline: boolean;
  deadlineLabel: string;
} {
  const now = new Date();
  const target = parseISO(targetDateStr);
  const targetDay = startOfDay(target);
  const dow = target.getDay(); // 0=Sun … 6=Sat

  // Calculate the previous business day
  let prevBusinessDay: Date;
  if (dow === 1) {
    // Monday → previous Friday (3 days back)
    prevBusinessDay = addDays(targetDay, -3);
  } else if (dow === 0) {
    // Sunday → previous Friday (2 days back) — weekends are blocked separately
    prevBusinessDay = addDays(targetDay, -2);
  } else {
    // Tue–Sat → previous day
    prevBusinessDay = addDays(targetDay, -1);
  }

  // Deadline is 12:00 PM (noon) on that previous business day
  const deadline = new Date(prevBusinessDay);
  deadline.setHours(12, 0, 0, 0);

  const deadlineLabel = dow === 1
    ? `Friday ${format(prevBusinessDay, 'MMM dd')} at 12:00 PM`
    : `${format(prevBusinessDay, 'EEEE, MMM dd')} at 12:00 PM`;

  return {
    isPastDeadline: now >= deadline,
    deadlineLabel,
  };
}

/** Generate time slots for a day (full 24 hours, 30-min intervals by default) */
export function generateTimeSlots(intervalMinutes = 30, startHour = 0, endHour = 24): string[] {
  const slots: string[] = [];
  for (let h = startHour; h < endHour; h++) {
    for (let m = 0; m < 60; m += intervalMinutes) {
      slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
    }
  }
  return slots;
}

/** Calculate utilization rate */
export function calcUtilization(bookings: Booking[], totalMinutes = 720): number {
  const bookedMinutes = bookings.reduce((sum, b) => {
    if (['cancelled', 'denied'].includes(b.status)) return sum;
    const [sh, sm] = b.start_time.split(':').map(Number);
    const [eh, em] = b.end_time.split(':').map(Number);
    return sum + (eh * 60 + em) - (sh * 60 + sm);
  }, 0);
  return Math.round((bookedMinutes / totalMinutes) * 100);
}

/** Generate unique ID */
export function generateId(): string {
  return crypto.randomUUID();
}

/** Status badge color mapping */
export function getStatusColor(status: string): { bg: string; text: string; dot: string; border?: string } {
  switch (status) {
    case 'pending': return { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-400', border: 'border-amber-200' };
    case 'approved': return { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-400', border: 'border-blue-200' };
    case 'denied': return { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-400', border: 'border-red-200' };
    case 'cancelled': return { bg: 'bg-gray-50', text: 'text-gray-500', dot: 'bg-gray-400', border: 'border-gray-200' };
    case 'rescheduled': return { bg: 'bg-purple-50', text: 'text-purple-700', dot: 'bg-purple-400', border: 'border-purple-200' };
    case 'ongoing': return { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-400', border: 'border-emerald-200' };
    case 'completed': return { bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-400', border: 'border-green-200' };
    default: return { bg: 'bg-gray-50', text: 'text-gray-600', dot: 'bg-gray-400', border: 'border-gray-200' };
  }
}

/** Get OR Room status display info */
export function getRoomStatusInfo(status: string): { label: string; color: string; bgColor: string } {
  switch (status) {
    case 'in_transit': return { label: 'In Transit', color: 'text-amber-600', bgColor: 'bg-amber-100' };
    case 'ongoing': return { label: 'Ongoing', color: 'text-emerald-600', bgColor: 'bg-emerald-100' };
    case 'ended': return { label: 'Ended', color: 'text-gray-500', bgColor: 'bg-gray-100' };
    case 'deferred': return { label: 'Deferred', color: 'text-red-500', bgColor: 'bg-red-100' };
    default: return { label: 'Idle', color: 'text-blue-500', bgColor: 'bg-blue-50' };
  }
}

// ── OR Priority Schedule Helpers ──

/** Map room designation to primary department IDs */
const DESIGNATION_DEPT_MAP: Record<string, DepartmentId[]> = {
  'General Surgery': ['GS'],
  'OB-GYNE': ['OBGYNE'],
  'Orthopedics': ['ORTHO'],
  'ENT': ['ENT'],
  'Ophtha': ['OPHTHA'],
  'Cardiac': ['CARDIAC', 'TCVS'],
  'Neurosurgery': ['NEURO'],
  'Pediatrics': ['PEDIA'],
  'Urology': ['URO'],
  'Plastics': ['PLASTICS'],
};

/** Get the department IDs that match a room's designation */
export function getRoomDesignationDepts(designation: string): DepartmentId[] {
  const depts: DepartmentId[] = [];
  for (const [keyword, deptIds] of Object.entries(DESIGNATION_DEPT_MAP)) {
    if (designation.toLowerCase().includes(keyword.toLowerCase())) {
      depts.push(...deptIds);
    }
  }
  return depts;
}

export interface RoomPriorityInfo {
  deptId: DepartmentId;
  deptName: string;
  label: string;
  color: string;
  bg: string;
}

/**
 * Get the priority departments for a specific room on a given weekday.
 * Returns all matching department priorities for the room based on its designation.
 */
export function getRoomPriorityForDay(
  room: ORRoom,
  schedule: Record<string, string>,
  weekday: string
): RoomPriorityInfo[] {
  const roomDepts = getRoomDesignationDepts(room.designation);
  const priorities: RoomPriorityInfo[] = [];

  for (const deptId of roomDepts) {
    const key = `${deptId}-${weekday}`;
    const label = schedule[key];
    if (label) {
      const dept = DEPARTMENT_MAP[deptId];
      priorities.push({
        deptId,
        deptName: dept?.name || deptId,
        label,
        color: dept?.color || '#6b7280',
        bg: dept?.bg || '#f3f4f6',
      });
    }
  }

  return priorities;
}

/**
 * Get ALL department priorities for a given weekday.
 * Returns an array of { deptId, deptName, label, color, bg }.
 */
export function getAllPrioritiesForDay(
  schedule: Record<string, string>,
  weekday: string
): RoomPriorityInfo[] {
  const priorities: RoomPriorityInfo[] = [];

  for (const dept of DEPARTMENTS) {
    const key = `${dept.id}-${weekday}`;
    const label = schedule[key];
    if (label) {
      priorities.push({
        deptId: dept.id as DepartmentId,
        deptName: dept.name,
        label,
        color: dept.color,
        bg: dept.bg,
      });
    }
  }

  return priorities;
}

/**
 * Get the weekday name (Monday-Friday) for a Date.
 * Returns empty string for weekends.
 */
export function getWeekdayName(date: Date): string {
  return format(date, 'EEEE');
}
