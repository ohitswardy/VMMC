/**
 * supabaseService.ts
 * Centralised data access layer — all Supabase calls live here.
 * The rest of the app talks only to this module + the Zustand stores.
 *
 * ⚠️  IMPORTANT — Column name mapping:
 *   DB column         →  Frontend field
 *   procedure_name    →  procedure        (Booking, BookingChangeRequest)
 *
 * All mapping is centralised in mapBooking() / mapBookingForDB() below.
 * When adding new fields, ensure the mapping is updated if the DB column
 * name differs from the TypeScript interface field name.
 */

import { supabase } from './supabase';
import type { Booking, ORRoom, ORRoomLiveStatus, Notification, AuditLog, BookingChangeRequest, UserProfile } from './types';
import type { ORRoomStatus } from './constants';

// ─────────────────────────────────────────────
// HELPERS — map DB rows → app types
// ─────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapBooking(row: any): Booking {
  const { procedure_name, ...rest } = row;
  return { ...rest, procedure: procedure_name } as Booking;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapBookingForDB(booking: Partial<Booking>): Record<string, unknown> {
  const { procedure, ...rest } = booking as Record<string, unknown>;
  if (procedure !== undefined) {
    return { ...rest, procedure_name: procedure };
  }
  return rest;
}

// ═════════════════════════════════════════════
// AUTH
// ═════════════════════════════════════════════

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
}

export async function fetchProfile(userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();
  if (error) throw error;
  return data as UserProfile | null;
}

export async function fetchAllProfiles(): Promise<UserProfile[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('full_name');
  if (error) throw error;
  return (data ?? []) as UserProfile[];
}

export async function updateProfile(id: string, updates: Partial<UserProfile>) {
  const { error } = await supabase.from('profiles').update(updates).eq('id', id);
  if (error) throw error;
}

// ═════════════════════════════════════════════
// OR ROOMS
// ═════════════════════════════════════════════

export async function fetchORRooms(): Promise<ORRoom[]> {
  const { data, error } = await supabase
    .from('or_rooms')
    .select('*')
    .order('number');
  if (error) throw error;
  return (data ?? []) as ORRoom[];
}

export async function createORRoom(room: Omit<ORRoom, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from('or_rooms')
    .insert(room)
    .select()
    .single();
  if (error) throw error;
  return data as ORRoom;
}

export async function updateORRoom(id: string, updates: Partial<ORRoom>) {
  const { error } = await supabase.from('or_rooms').update(updates).eq('id', id);
  if (error) throw error;
}

export async function deleteORRoom(id: string) {
  const { error } = await supabase.from('or_rooms').delete().eq('id', id);
  if (error) throw error;
}

/** Batch-update the `number` (sort order) field for multiple rooms at once.
 *  Uses a two-pass approach to avoid UNIQUE constraint violations on `number`:
 *  Pass 1 → set all to unique negative values, Pass 2 → set final positive values. */
export async function reorderORRooms(orderedIds: string[]) {
  // Pass 1: move all to unique negative values to clear the UNIQUE constraint
  const toNegative = orderedIds.map((id, idx) =>
    supabase.from('or_rooms').update({ number: -(idx + 1) }).eq('id', id)
  );
  const negResults = await Promise.all(toNegative);
  const negFailed = negResults.find(r => r.error);
  if (negFailed?.error) throw negFailed.error;

  // Pass 2: set final positive order values
  const toPositive = orderedIds.map((id, idx) =>
    supabase.from('or_rooms').update({ number: idx + 1 }).eq('id', id)
  );
  const posResults = await Promise.all(toPositive);
  const posFailed = posResults.find(r => r.error);
  if (posFailed?.error) throw posFailed.error;
}

// ═════════════════════════════════════════════
// OR ROOM LIVE STATUS
// ═════════════════════════════════════════════

export async function fetchLiveStatuses(): Promise<Record<string, ORRoomLiveStatus>> {
  const { data, error } = await supabase.from('or_room_live_status').select('*');
  if (error) throw error;
  const map: Record<string, ORRoomLiveStatus> = {};
  for (const row of data ?? []) {
    map[row.room_id] = row as ORRoomLiveStatus;
  }
  return map;
}

export async function upsertLiveStatus(roomId: string, status: ORRoomStatus, bookingId?: string | null) {
  const { error } = await supabase
    .from('or_room_live_status')
    .upsert({
      room_id: roomId,
      status,
      current_booking_id: bookingId ?? null,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'room_id' });
  if (error) throw error;
}

// ═════════════════════════════════════════════
// BOOKINGS
// ═════════════════════════════════════════════

export async function fetchBookings(): Promise<Booking[]> {
  const { data, error } = await supabase
    .from('bookings')
    .select('*, or_room:or_rooms(*)')
    .order('date', { ascending: false })
    .order('start_time');
  if (error) throw error;
  return (data ?? []).map(mapBooking);
}

export async function fetchBookingsByDate(date: string): Promise<Booking[]> {
  const { data, error } = await supabase
    .from('bookings')
    .select('*, or_room:or_rooms(*)')
    .eq('date', date)
    .order('start_time');
  if (error) throw error;
  return (data ?? []).map(mapBooking);
}

export async function createBooking(booking: Omit<Booking, 'id' | 'created_at' | 'updated_at' | 'or_room' | 'created_by_profile'>): Promise<Booking> {
  const dbRow = mapBookingForDB(booking);
  delete dbRow['or_room'];
  delete dbRow['created_by_profile'];

  const { data, error } = await supabase
    .from('bookings')
    .insert(dbRow)
    .select()
    .single();
  if (error) throw error;
  return mapBooking(data);
}

export async function updateBookingDB(id: string, updates: Partial<Booking>): Promise<void> {
  const dbUpdates = mapBookingForDB(updates);
  delete dbUpdates['or_room'];
  delete dbUpdates['created_by_profile'];
  dbUpdates['updated_at'] = new Date().toISOString();

  const { error } = await supabase.from('bookings').update(dbUpdates).eq('id', id);
  if (error) throw error;
}

export async function bumpBookings(ids: string[], note: string): Promise<void> {
  const { error } = await supabase
    .from('bookings')
    .update({
      status: 'rescheduled',
      notes: note,
      updated_at: new Date().toISOString(),
    })
    .in('id', ids);
  if (error) throw error;
}

// ═════════════════════════════════════════════
// NOTIFICATIONS
// ═════════════════════════════════════════════

export async function fetchNotifications(userId: string): Promise<Notification[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as Notification[];
}

export async function markNotificationRead(id: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', id);
  if (error) throw error;
}

export async function markAllNotificationsRead(userId: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', userId)
    .eq('is_read', false);
  if (error) throw error;
}

export async function insertNotification(notification: Omit<Notification, 'id' | 'created_at'>): Promise<void> {
  const { error } = await supabase.from('notifications').insert(notification);
  if (error) throw error;
}

export async function deleteNotification(id: string): Promise<void> {
  const { error } = await supabase.from('notifications').delete().eq('id', id);
  if (error) throw error;
}

// ═════════════════════════════════════════════
// AUDIT LOGS
// ═════════════════════════════════════════════

export async function fetchAuditLogs(): Promise<AuditLog[]> {
  const { data, error } = await supabase
    .from('audit_logs')
    .select('*, user_profile:profiles!audit_logs_user_id_fkey(id, full_name, email, role, department_id)')
    .order('created_at', { ascending: false })
    .limit(500);
  if (error) throw error;
  return (data ?? []) as AuditLog[];
}

export async function insertAuditLog(log: Omit<AuditLog, 'id' | 'created_at' | 'user_profile'>): Promise<void> {
  const { error } = await supabase.from('audit_logs').insert(log);
  if (error) throw error;
}

// ═════════════════════════════════════════════
// BOOKING CHANGE REQUESTS
// ═════════════════════════════════════════════

export async function fetchChangeRequests(): Promise<BookingChangeRequest[]> {
  const { data, error } = await supabase
    .from('booking_change_requests')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row) => {
    const { procedure_name, ...rest } = row;
    return { ...rest, procedure: procedure_name } as BookingChangeRequest;
  });
}

export async function createChangeRequest(req: Omit<BookingChangeRequest, 'id' | 'created_at' | 'updated_at'>): Promise<BookingChangeRequest> {
  const { procedure, ...rest } = req as Record<string, unknown>;
  const dbRow = { ...rest, procedure_name: procedure };
  const { data, error } = await supabase
    .from('booking_change_requests')
    .insert(dbRow)
    .select()
    .single();
  if (error) throw error;
  const { procedure_name, ...mapped } = data;
  return { ...mapped, procedure: procedure_name } as BookingChangeRequest;
}

export async function updateChangeRequest(id: string, updates: Partial<BookingChangeRequest>): Promise<void> {
  const { procedure, ...rest } = updates as Record<string, unknown>;
  const dbUpdates: Record<string, unknown> = { ...rest };
  if (procedure !== undefined) dbUpdates.procedure_name = procedure;
  dbUpdates.updated_at = new Date().toISOString();
  const { error } = await supabase.from('booking_change_requests').update(dbUpdates).eq('id', id);
  if (error) throw error;
}

// ═════════════════════════════════════════════
// OR PRIORITY SCHEDULE
// ═════════════════════════════════════════════

export async function fetchPrioritySchedule(): Promise<Record<string, string>> {
  const { data, error } = await supabase
    .from('or_priority_schedule')
    .select('department_id, weekday, priority_label');
  if (error) throw error;
  const map: Record<string, string> = {};
  for (const row of data ?? []) {
    map[`${row.department_id}-${row.weekday}`] = row.priority_label;
  }
  return map;
}

export async function upsertPriorityCell(departmentId: string, weekday: string, value: string): Promise<void> {
  const { error } = await supabase
    .from('or_priority_schedule')
    .upsert(
      { department_id: departmentId, weekday, priority_label: value },
      { onConflict: 'department_id,weekday' }
    );
  if (error) throw error;
}

export async function deletePriorityCell(departmentId: string, weekday: string): Promise<void> {
  const { error } = await supabase
    .from('or_priority_schedule')
    .delete()
    .eq('department_id', departmentId)
    .eq('weekday', weekday);
  if (error) throw error;
}

// ═════════════════════════════════════════════
// NURSE DUTY ASSIGNMENTS
// ═════════════════════════════════════════════

export interface NurseDutyAssignment {
  id: string;
  or_room_id: string;
  date: string;
  scrub_nurse: string;
  circulating_nurse: string;
  assigned_by: string;
  created_at: string;
  updated_at: string;
}

export async function fetchNurseDutyForDate(date: string): Promise<NurseDutyAssignment[]> {
  const { data, error } = await supabase
    .from('nurse_duty_assignments')
    .select('*')
    .eq('date', date);
  if (error) throw error;
  return (data ?? []) as NurseDutyAssignment[];
}

export async function upsertNurseDuty(
  roomId: string,
  date: string,
  scrubNurse: string,
  circulatingNurse: string,
  assignedBy: string
): Promise<void> {
  const { error } = await supabase
    .from('nurse_duty_assignments')
    .upsert(
      {
        or_room_id: roomId,
        date,
        scrub_nurse: scrubNurse,
        circulating_nurse: circulatingNurse,
        assigned_by: assignedBy,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'or_room_id,date' }
    );
  if (error) throw error;
}

// ── System Settings ──

export async function fetchSystemSettings(): Promise<Record<string, unknown> | null> {
  const { data, error } = await supabase
    .from('system_settings')
    .select('data')
    .eq('id', 'global')
    .single();
  if (error) {
    console.warn('fetchSystemSettings:', error.message);
    return null;
  }
  return data?.data ?? null;
}

export async function upsertSystemSettings(
  settings: Record<string, unknown>,
  userId?: string
): Promise<void> {
  const { error } = await supabase
    .from('system_settings')
    .upsert({
      id: 'global',
      data: settings,
      updated_at: new Date().toISOString(),
      updated_by: userId ?? null,
    });
  if (error) throw error;
}

// ── Privacy Acknowledgments ──

export async function checkPrivacyAcknowledgment(
  userId: string,
  version: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from('privacy_acknowledgments')
    .select('id')
    .eq('user_id', userId)
    .eq('version', version)
    .maybeSingle();
  if (error) {
    console.warn('checkPrivacyAcknowledgment:', error.message);
    return false;
  }
  return !!data;
}

export async function insertPrivacyAcknowledgment(
  userId: string,
  version: string
): Promise<void> {
  const { error } = await supabase
    .from('privacy_acknowledgments')
    .upsert(
      { user_id: userId, version, acknowledged_at: new Date().toISOString() },
      { onConflict: 'user_id,version' }
    );
  if (error) throw error;
}

// ── PACU Assignments ──

export async function fetchAllPACUAssignments(): Promise<Record<string, string>> {
  const { data, error } = await supabase
    .from('pacu_assignments')
    .select('date, names');
  if (error) {
    console.warn('fetchAllPACUAssignments:', error.message);
    return {};
  }
  const map: Record<string, string> = {};
  for (const row of data ?? []) {
    map[row.date] = row.names;
  }
  return map;
}

export async function upsertPACUAssignment(
  date: string,
  names: string,
  userId?: string
): Promise<void> {
  const { error } = await supabase
    .from('pacu_assignments')
    .upsert({
      date,
      names,
      updated_by: userId ?? null,
      updated_at: new Date().toISOString(),
    });
  if (error) throw error;
}
