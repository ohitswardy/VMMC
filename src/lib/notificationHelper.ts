/**
 * notificationHelper.ts
 * Centralized notification creation for all booking lifecycle events.
 * Creates database notifications for relevant users and updates the local store.
 */

import { insertNotification, fetchAllProfiles } from './supabaseService';
import type { Booking, Notification, UserProfile } from './types';
import type { DepartmentId } from './constants';
import { DEPARTMENT_MAP } from './constants';
import { formatTime } from './utils';

// ── Helpers ──

function getDeptName(deptId: DepartmentId): string {
  return DEPARTMENT_MAP[deptId]?.name || deptId;
}

/** Get all admin users (super_admin + anesthesiology_admin) */
async function getAdminUsers(): Promise<UserProfile[]> {
  const profiles = await fetchAllProfiles();
  return profiles.filter(
    (p) => p.is_active && (p.role === 'super_admin' || p.role === 'anesthesiology_admin')
  );
}

/** Get all users in a specific department */
async function getDepartmentUsers(departmentId: DepartmentId): Promise<UserProfile[]> {
  const profiles = await fetchAllProfiles();
  return profiles.filter(
    (p) => p.is_active && p.department_id === departmentId
  );
}

/** Send a notification to a list of users (inserts in DB; real-time subscription propagates to local store) */
async function notifyUsers(
  userIds: string[],
  notification: Omit<Notification, 'id' | 'created_at' | 'user_id'>
) {
  for (const userId of userIds) {
    try {
      await insertNotification({
        user_id: userId,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        related_booking_id: notification.related_booking_id,
        is_read: false,
      });
    } catch (err) {
      console.error(`Failed to send notification to user ${userId}:`, err);
    }
  }

  // Note: real-time subscription will propagate to the local store for the current user
}

// ═════════════════════════════════════════════
// PUBLIC API — Call these from UI components
// ═════════════════════════════════════════════

/**
 * Notify admins when a new booking request is submitted by a department user.
 */
export async function notifyNewBookingRequest(booking: Booking) {
  try {
    const admins = await getAdminUsers();
    const adminIds = admins.map((a) => a.id);

    await notifyUsers(adminIds, {
      title: 'New Booking Request',
      message: `${getDeptName(booking.department_id)}: ${booking.procedure} for ${booking.patient_name} on ${booking.date} (${formatTime(booking.start_time)} – ${formatTime(booking.end_time)})`,
      type: 'new_request',
      related_booking_id: booking.id,
      is_read: false,
    });
  } catch (err) {
    console.error('notifyNewBookingRequest failed:', err);
  }
}

/**
 * Notify the booking creator (and department users) when a booking is approved.
 */
export async function notifyBookingApproved(booking: Booking, approvedByName: string) {
  try {
    const targetIds = new Set<string>();

    // Notify the creator
    if (booking.created_by) targetIds.add(booking.created_by);

    // Notify all users in the same department
    const deptUsers = await getDepartmentUsers(booking.department_id);
    deptUsers.forEach((u) => targetIds.add(u.id));

    await notifyUsers([...targetIds], {
      title: 'Booking Approved',
      message: `Your booking for "${booking.procedure}" (${booking.patient_name}) on ${booking.date} ${formatTime(booking.start_time)} has been approved by ${approvedByName}.`,
      type: 'approval',
      related_booking_id: booking.id,
      is_read: false,
    });
  } catch (err) {
    console.error('notifyBookingApproved failed:', err);
  }
}

/**
 * Notify the booking creator (and department users) when a booking is denied.
 */
export async function notifyBookingDenied(booking: Booking, deniedByName: string, reason: string) {
  try {
    const targetIds = new Set<string>();
    if (booking.created_by) targetIds.add(booking.created_by);

    const deptUsers = await getDepartmentUsers(booking.department_id);
    deptUsers.forEach((u) => targetIds.add(u.id));

    await notifyUsers([...targetIds], {
      title: 'Booking Denied',
      message: `Your booking for "${booking.procedure}" (${booking.patient_name}) on ${booking.date} has been denied by ${deniedByName}. Reason: ${reason}`,
      type: 'denial',
      related_booking_id: booking.id,
      is_read: false,
    });
  } catch (err) {
    console.error('notifyBookingDenied failed:', err);
  }
}

/**
 * Notify relevant users when a booking is edited by an admin.
 */
export async function notifyBookingEdited(booking: Booking, editedByName: string) {
  try {
    const targetIds = new Set<string>();
    if (booking.created_by) targetIds.add(booking.created_by);

    const deptUsers = await getDepartmentUsers(booking.department_id);
    deptUsers.forEach((u) => targetIds.add(u.id));

    await notifyUsers([...targetIds], {
      title: 'Booking Updated',
      message: `Your booking "${booking.procedure}" (${booking.patient_name}) on ${booking.date} has been updated by ${editedByName}. Please review the changes.`,
      type: 'schedule_change',
      related_booking_id: booking.id,
      is_read: false,
    });
  } catch (err) {
    console.error('notifyBookingEdited failed:', err);
  }
}

/**
 * Notify admins when an emergency case is inserted.
 */
export async function notifyEmergencyInsertion(booking: Booking, insertedByName: string) {
  try {
    const admins = await getAdminUsers();
    const adminIds = admins.map((a) => a.id);

    // Also notify all department users (so everyone is aware)
    const allProfiles = await fetchAllProfiles();
    const allActiveUserIds = allProfiles
      .filter((p) => p.is_active && p.role !== 'viewer')
      .map((p) => p.id);

    const uniqueIds = [...new Set([...adminIds, ...allActiveUserIds])];

    await notifyUsers(uniqueIds, {
      title: '🚨 Emergency Case Inserted',
      message: `Emergency: ${booking.procedure} for ${booking.patient_name} inserted into ${booking.date} ${formatTime(booking.start_time)} by ${insertedByName}. Reason: ${booking.emergency_reason || 'Not specified'}`,
      type: 'emergency_alert',
      related_booking_id: booking.id,
      is_read: false,
    });
  } catch (err) {
    console.error('notifyEmergencyInsertion failed:', err);
  }
}

/**
 * Notify booking creators whose cases were bumped off by an emergency.
 */
export async function notifyBumpedCases(
  bumpedBookings: Booking[],
  emergencyPatientName: string,
  emergencyProcedure: string
) {
  try {
    for (const bumped of bumpedBookings) {
      const targetIds = new Set<string>();
      if (bumped.created_by) targetIds.add(bumped.created_by);

      const deptUsers = await getDepartmentUsers(bumped.department_id);
      deptUsers.forEach((u) => targetIds.add(u.id));

      // Also notify admins
      const admins = await getAdminUsers();
      admins.forEach((a) => targetIds.add(a.id));

      await notifyUsers([...targetIds], {
        title: 'Booking Rescheduled — Emergency Bump',
        message: `Your booking "${bumped.procedure}" for ${bumped.patient_name} on ${bumped.date} ${formatTime(bumped.start_time)} has been bumped off due to emergency case: ${emergencyProcedure} (${emergencyPatientName}). Please reschedule.`,
        type: 'schedule_change',
        related_booking_id: bumped.id,
        is_read: false,
      });
    }
  } catch (err) {
    console.error('notifyBumpedCases failed:', err);
  }
}

/**
 * Notify admins when a schedule change request is submitted.
 */
export async function notifyChangeRequestSubmitted(
  booking: Booking,
  requestedByName: string,
  reason: string,
  newDate: string,
  newTime: string
) {
  try {
    const admins = await getAdminUsers();
    const adminIds = admins.map((a) => a.id);

    await notifyUsers(adminIds, {
      title: 'Schedule Change Request',
      message: `${requestedByName} (${getDeptName(booking.department_id)}) has requested a schedule change for "${booking.procedure}" (${booking.patient_name}). New date: ${newDate} ${formatTime(newTime)}. Reason: ${reason}`,
      type: 'schedule_change',
      related_booking_id: booking.id,
      is_read: false,
    });
  } catch (err) {
    console.error('notifyChangeRequestSubmitted failed:', err);
  }
}

/**
 * Notify department users when a booking is cancelled.
 */
export async function notifyBookingCancelled(booking: Booking, cancelledByName: string) {
  try {
    const targetIds = new Set<string>();
    if (booking.created_by) targetIds.add(booking.created_by);

    const deptUsers = await getDepartmentUsers(booking.department_id);
    deptUsers.forEach((u) => targetIds.add(u.id));

    // Also notify admins
    const admins = await getAdminUsers();
    admins.forEach((a) => targetIds.add(a.id));

    await notifyUsers([...targetIds], {
      title: 'Booking Cancelled',
      message: `The booking "${booking.procedure}" for ${booking.patient_name} on ${booking.date} ${formatTime(booking.start_time)} has been cancelled by ${cancelledByName}.`,
      type: 'cancellation',
      related_booking_id: booking.id,
      is_read: false,
    });
  } catch (err) {
    console.error('notifyBookingCancelled failed:', err);
  }
}

/**
 * Notify the booking creator when their booking is confirmed/created (acknowledgement).
 */
export async function notifyBookingConfirmation(booking: Booking) {
  try {
    if (!booking.created_by) return;

    await notifyUsers([booking.created_by], {
      title: 'Booking Request Submitted',
      message: `Your booking request for "${booking.procedure}" (${booking.patient_name}) on ${booking.date} ${formatTime(booking.start_time)} – ${formatTime(booking.end_time)} has been submitted and is pending approval.`,
      type: 'booking_confirmation',
      related_booking_id: booking.id,
      is_read: false,
    });
  } catch (err) {
    console.error('notifyBookingConfirmation failed:', err);
  }
}

/**
 * Notify when an OR room live status changes (e.g., ongoing → ended, case ending soon).
 */
export async function notifyRoomStatusChange(
  roomName: string,
  newStatus: string,
  changedByName: string
) {
  try {
    // Notify all admins and nurses
    const allProfiles = await fetchAllProfiles();
    const targetIds = allProfiles
      .filter(
        (p) =>
          p.is_active &&
          (p.role === 'super_admin' ||
            p.role === 'anesthesiology_admin' ||
            p.role === 'nurse')
      )
      .map((p) => p.id);

    // Only notify on significant status changes
    if (newStatus === 'ongoing' || newStatus === 'ended' || newStatus === 'deferred') {
      await notifyUsers(targetIds, {
        title: `${roomName} — ${newStatus === 'ongoing' ? 'Case Started' : newStatus === 'ended' ? 'Case Ended' : 'Case Deferred'}`,
        message: `${roomName} status changed to "${newStatus}" by ${changedByName}.`,
        type: newStatus === 'deferred' ? 'emergency_alert' : 'case_ending_soon',
        is_read: false,
      });
    }
  } catch (err) {
    console.error('notifyRoomStatusChange failed:', err);
  }
}
