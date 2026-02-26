import { create } from 'zustand';
import type { Booking, ORRoom, Notification, AuditLog, BookingChangeRequest, ORRoomLiveStatus } from '../lib/types';
import type { ORRoomStatus } from '../lib/constants';
import { DEFAULT_OR_PRIORITY_SCHEDULE } from '../lib/constants';
import {
  fetchBookings, createBooking, updateBookingDB,
  fetchORRooms, createORRoom, updateORRoom, deleteORRoom,
  fetchLiveStatuses, upsertLiveStatus,
  fetchNotifications, markNotificationRead, markAllNotificationsRead,
  fetchAuditLogs,
  fetchChangeRequests, createChangeRequest, updateChangeRequest,
  fetchPrioritySchedule, upsertPriorityCell, deletePriorityCell,
} from '../lib/supabaseService';

// ── Bookings Store ──
interface BookingsState {
  bookings: Booking[];
  isLoading: boolean;
  selectedDate: Date;
  selectedRoom: string | null;
  isFormOpen: boolean;
  isChangeFormOpen: boolean;
  editingBooking: Booking | null;
  changeBooking: Booking | null;
  setBookings: (bookings: Booking[]) => void;
  loadBookings: () => Promise<void>;
  addBooking: (booking: Omit<Booking, 'id' | 'created_at' | 'updated_at' | 'or_room' | 'created_by_profile'>) => Promise<Booking>;
  updateBooking: (id: string, updates: Partial<Booking>) => Promise<void>;
  removeBooking: (id: string) => void;
  setSelectedDate: (date: Date) => void;
  setSelectedRoom: (roomId: string | null) => void;
  openForm: (booking?: Booking) => void;
  closeForm: () => void;
  openChangeForm: (booking: Booking) => void;
  closeChangeForm: () => void;
}

export const useBookingsStore = create<BookingsState>((set, get) => ({
  bookings: [],
  isLoading: false,
  selectedDate: new Date(),
  selectedRoom: null,
  isFormOpen: false,
  isChangeFormOpen: false,
  editingBooking: null,
  changeBooking: null,

  setBookings: (bookings) => set({ bookings }),

  loadBookings: async () => {
    set({ isLoading: true });
    try {
      const bookings = await fetchBookings();
      set({ bookings, isLoading: false });
    } catch (err) {
      console.error('Failed to load bookings:', err);
      set({ isLoading: false });
    }
  },

  addBooking: async (booking) => {
    const created = await createBooking(booking);
    set((s) => ({ bookings: [created, ...s.bookings] }));
    return created;
  },

  updateBooking: async (id, updates) => {
    // Optimistic update
    set((s) => ({
      bookings: s.bookings.map((b) => (b.id === id ? { ...b, ...updates } : b)),
    }));
    try {
      await updateBookingDB(id, updates);
    } catch (err) {
      // Rollback — reload from DB
      console.error('Failed to update booking, reloading:', err);
      get().loadBookings();
      throw err;
    }
  },

  removeBooking: (id) => set((s) => ({ bookings: s.bookings.filter((b) => b.id !== id) })),
  setSelectedDate: (date) => set({ selectedDate: date }),
  setSelectedRoom: (roomId) => set({ selectedRoom: roomId }),
  openForm: (booking) => set({ isFormOpen: true, editingBooking: booking || null }),
  closeForm: () => set({ isFormOpen: false, editingBooking: null }),
  openChangeForm: (booking) => set({ isChangeFormOpen: true, changeBooking: booking }),
  closeChangeForm: () => set({ isChangeFormOpen: false, changeBooking: null }),
}));

// ── OR Rooms Store ──
interface ORRoomsState {
  rooms: ORRoom[];
  liveStatuses: Record<string, ORRoomLiveStatus>;
  isLoading: boolean;
  setRooms: (rooms: ORRoom[]) => void;
  loadRooms: () => Promise<void>;
  addRoom: (room: Omit<ORRoom, 'id' | 'created_at' | 'updated_at'>) => Promise<ORRoom>;
  updateRoom: (id: string, updates: Partial<ORRoom>) => Promise<void>;
  deleteRoom: (id: string) => Promise<void>;
  loadLiveStatuses: () => Promise<void>;
  setLiveStatus: (roomId: string, status: ORRoomStatus, bookingId?: string | null) => Promise<void>;
  setAllLiveStatuses: (statuses: Record<string, ORRoomLiveStatus>) => void;
}

export const useORRoomsStore = create<ORRoomsState>((set) => ({
  rooms: [],
  liveStatuses: {},
  isLoading: false,

  setRooms: (rooms) => set({ rooms }),

  loadRooms: async () => {
    set({ isLoading: true });
    try {
      const rooms = await fetchORRooms();
      set({ rooms, isLoading: false });
      // Also seed live status rows optimistically if missing
    } catch (err) {
      console.error('Failed to load OR rooms:', err);
      set({ isLoading: false });
    }
  },

  addRoom: async (room) => {
    const created = await createORRoom(room);
    set((s) => ({ rooms: [...s.rooms, created] }));
    return created;
  },

  updateRoom: async (id, updates) => {
    set((s) => ({ rooms: s.rooms.map((r) => (r.id === id ? { ...r, ...updates } : r)) }));
    await updateORRoom(id, updates);
  },

  deleteRoom: async (id) => {
    await deleteORRoom(id);
    set((s) => ({ rooms: s.rooms.filter((r) => r.id !== id) }));
  },

  loadLiveStatuses: async () => {
    try {
      const statuses = await fetchLiveStatuses();
      set({ liveStatuses: statuses });
    } catch (err) {
      console.error('Failed to load live statuses:', err);
    }
  },

  setLiveStatus: async (roomId, status, bookingId = null) => {
    // Optimistic update
    set((s) => ({
      liveStatuses: {
        ...s.liveStatuses,
        [roomId]: {
          room_id: roomId,
          status,
          current_booking_id: bookingId ?? null,
          updated_at: new Date().toISOString(),
        },
      },
    }));
    await upsertLiveStatus(roomId, status, bookingId);
  },

  setAllLiveStatuses: (statuses) => set({ liveStatuses: statuses }),
}));

// ── Notifications Store ──
interface NotificationsState {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  setNotifications: (notifications: Notification[]) => void;
  loadNotifications: (userId: string) => Promise<void>;
  addNotification: (notification: Notification) => void;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: (userId: string) => Promise<void>;
}

export const useNotificationsStore = create<NotificationsState>((set) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,

  setNotifications: (notifications) =>
    set({ notifications, unreadCount: notifications.filter((n) => !n.is_read).length }),

  loadNotifications: async (userId) => {
    set({ isLoading: true });
    try {
      const notifications = await fetchNotifications(userId);
      set({
        notifications,
        unreadCount: notifications.filter((n) => !n.is_read).length,
        isLoading: false,
      });
    } catch (err) {
      console.error('Failed to load notifications:', err);
      set({ isLoading: false });
    }
  },

  addNotification: (notification) =>
    set((s) => ({
      notifications: [notification, ...s.notifications],
      unreadCount: s.unreadCount + (notification.is_read ? 0 : 1),
    })),

  markAsRead: async (id) => {
    set((s) => ({
      notifications: s.notifications.map((n) => (n.id === id ? { ...n, is_read: true } : n)),
      unreadCount: Math.max(0, s.unreadCount - 1),
    }));
    await markNotificationRead(id);
  },

  markAllAsRead: async (userId) => {
    set((s) => ({
      notifications: s.notifications.map((n) => ({ ...n, is_read: true })),
      unreadCount: 0,
    }));
    await markAllNotificationsRead(userId);
  },
}));

// ── Audit Logs Store ──
interface AuditLogsState {
  logs: AuditLog[];
  isLoading: boolean;
  setLogs: (logs: AuditLog[]) => void;
  loadLogs: () => Promise<void>;
  addLog: (log: AuditLog) => void;
}

export const useAuditLogsStore = create<AuditLogsState>((set) => ({
  logs: [],
  isLoading: false,

  setLogs: (logs) => set({ logs }),

  loadLogs: async () => {
    set({ isLoading: true });
    try {
      const logs = await fetchAuditLogs();
      set({ logs, isLoading: false });
    } catch (err) {
      console.error('Failed to load audit logs:', err);
      set({ isLoading: false });
    }
  },

  addLog: (log) => set((s) => ({ logs: [log, ...s.logs] })),
}));

// ── Change Requests Store ──
interface ChangeRequestsState {
  requests: BookingChangeRequest[];
  isLoading: boolean;
  setRequests: (requests: BookingChangeRequest[]) => void;
  loadRequests: () => Promise<void>;
  addRequest: (request: Omit<BookingChangeRequest, 'id' | 'created_at' | 'updated_at'>) => Promise<BookingChangeRequest>;
  updateRequest: (id: string, updates: Partial<BookingChangeRequest>) => Promise<void>;
}

export const useChangeRequestsStore = create<ChangeRequestsState>((set) => ({
  requests: [],
  isLoading: false,

  setRequests: (requests) => set({ requests }),

  loadRequests: async () => {
    set({ isLoading: true });
    try {
      const requests = await fetchChangeRequests();
      set({ requests, isLoading: false });
    } catch (err) {
      console.error('Failed to load change requests:', err);
      set({ isLoading: false });
    }
  },

  addRequest: async (request) => {
    const created = await createChangeRequest(request);
    set((s) => ({ requests: [created, ...s.requests] }));
    return created;
  },

  updateRequest: async (id, updates) => {
    set((s) => ({
      requests: s.requests.map((r) => (r.id === id ? { ...r, ...updates } : r)),
    }));
    await updateChangeRequest(id, updates);
  },
}));

// ── OR Priority Schedule Store ──
interface ORPriorityScheduleState {
  schedule: Record<string, string>;
  isLoading: boolean;
  loadSchedule: () => Promise<void>;
  setCell: (key: string, value: string) => Promise<void>;
  clearCell: (key: string) => Promise<void>;
  setSchedule: (schedule: Record<string, string>) => void;
}

export const useORPriorityScheduleStore = create<ORPriorityScheduleState>((set) => ({
  schedule: { ...DEFAULT_OR_PRIORITY_SCHEDULE },
  isLoading: false,

  loadSchedule: async () => {
    set({ isLoading: true });
    try {
      const schedule = await fetchPrioritySchedule();
      set({ schedule, isLoading: false });
    } catch (err) {
      console.error('Failed to load priority schedule:', err);
      set({ isLoading: false });
    }
  },

  setCell: async (key, value) => {
    set((s) => ({ schedule: { ...s.schedule, [key]: value } }));
    const [deptId, weekday] = key.split('-');
    await upsertPriorityCell(deptId, weekday, value);
  },

  clearCell: async (key) => {
    set((s) => {
      const next = { ...s.schedule };
      delete next[key];
      return { schedule: next };
    });
    const [deptId, weekday] = key.split('-');
    await deletePriorityCell(deptId, weekday);
  },

  setSchedule: (schedule) => set({ schedule }),
}));
