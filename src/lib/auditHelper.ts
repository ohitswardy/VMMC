/**
 * Centralized audit logging helper.
 * Logs all significant user actions to the audit_logs table.
 */
import { insertAuditLog } from './supabaseService';
import type { Booking } from './types';

// ── Helper ──
async function log(
  userId: string,
  action: string,
  entityType: string,
  entityId?: string,
  oldValues?: Record<string, unknown>,
  newValues?: Record<string, unknown>,
) {
  try {
    await insertAuditLog({
      user_id: userId,
      action,
      entity_type: entityType,
      entity_id: entityId,
      old_values: oldValues,
      new_values: newValues,
    });
  } catch (err) {
    console.error('[AuditLog] Failed to write audit log:', err);
  }
}

// ══════════════════════════════════════════════
// AUTH
// ══════════════════════════════════════════════

export function auditLogin(userId: string) {
  return log(userId, 'user.login', 'user', userId);
}

export function auditLogout(userId: string) {
  return log(userId, 'user.logout', 'user', userId);
}

// ══════════════════════════════════════════════
// BOOKINGS
// ══════════════════════════════════════════════

export function auditBookingCreate(userId: string, booking: Booking) {
  return log(userId, 'booking.create', 'booking', booking.id, undefined, {
    procedure: booking.procedure,
    patient_name: booking.patient_name,
    date: booking.date,
    or_room_id: booking.or_room_id,
    department_id: booking.department_id,
    start_time: booking.start_time,
    end_time: booking.end_time,
  });
}

export function auditEmergencyInsert(userId: string, booking: Booking, bumpedIds: string[]) {
  return log(userId, 'booking.emergency_insert', 'booking', booking.id, undefined, {
    procedure: booking.procedure,
    patient_name: booking.patient_name,
    date: booking.date,
    or_room_id: booking.or_room_id,
    bumped_booking_ids: bumpedIds,
  });
}

export function auditBookingUpdate(userId: string, bookingId: string, oldValues: Record<string, unknown>, newValues: Record<string, unknown>) {
  return log(userId, 'booking.update', 'booking', bookingId, oldValues, newValues);
}

export function auditBookingApprove(userId: string, booking: Booking) {
  return log(userId, 'booking.approve', 'booking', booking.id, { status: booking.status }, { status: 'approved' });
}

export function auditBookingDeny(userId: string, booking: Booking, reason: string) {
  return log(userId, 'booking.deny', 'booking', booking.id, { status: booking.status }, { status: 'denied', denial_reason: reason });
}

export function auditBookingCancel(userId: string, bookingId: string) {
  return log(userId, 'booking.cancel', 'booking', bookingId, undefined, { status: 'cancelled' });
}

export function auditBookingEdit(userId: string, bookingId: string, changes: Record<string, unknown>) {
  return log(userId, 'booking.edit', 'booking', bookingId, undefined, changes);
}

// ══════════════════════════════════════════════
// CHANGE REQUESTS
// ══════════════════════════════════════════════

export function auditChangeRequestSubmit(userId: string, bookingId: string, changes: Record<string, unknown>) {
  return log(userId, 'change_request.submit', 'booking', bookingId, undefined, changes);
}

export function auditChangeRequestReview(userId: string, requestId: string, bookingId: string, decision: 'approved' | 'denied', reason?: string) {
  return log(userId, `change_request.${decision}`, 'booking', bookingId, { request_id: requestId }, { decision, reason });
}

// ══════════════════════════════════════════════
// OR ROOMS / LIVE STATUS
// ══════════════════════════════════════════════

export function auditRoomStatusChange(userId: string, roomId: string, roomName: string, from: string, to: string) {
  return log(userId, 'room.status_change', 'or_room', roomId, { status: from, room_name: roomName }, { status: to });
}

// ══════════════════════════════════════════════
// PRIORITY SCHEDULE
// ══════════════════════════════════════════════

export function auditPriorityScheduleUpdate(userId: string, changes: Record<string, unknown>) {
  return log(userId, 'priority_schedule.update', 'or_priority_schedule', undefined, undefined, changes);
}
