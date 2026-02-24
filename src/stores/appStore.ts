import { create } from 'zustand';
import type { Booking, ORRoom, Notification, AuditLog, BookingChangeRequest, ORRoomLiveStatus } from '../lib/types';
import type { ORRoomStatus } from '../lib/constants';

// ── Bookings Store ──
interface BookingsState {
  bookings: Booking[];
  selectedDate: Date;
  selectedRoom: string | null;
  isFormOpen: boolean;
  isChangeFormOpen: boolean;
  editingBooking: Booking | null;
  changeBooking: Booking | null;
  setBookings: (bookings: Booking[]) => void;
  addBooking: (booking: Booking) => void;
  updateBooking: (id: string, updates: Partial<Booking>) => void;
  removeBooking: (id: string) => void;
  setSelectedDate: (date: Date) => void;
  setSelectedRoom: (roomId: string | null) => void;
  openForm: (booking?: Booking) => void;
  closeForm: () => void;
  openChangeForm: (booking: Booking) => void;
  closeChangeForm: () => void;
}

export const useBookingsStore = create<BookingsState>((set) => ({
  bookings: [],
  selectedDate: new Date(),
  selectedRoom: null,
  isFormOpen: false,
  isChangeFormOpen: false,
  editingBooking: null,
  changeBooking: null,
  setBookings: (bookings) => set({ bookings }),
  addBooking: (booking) => set((s) => ({ bookings: [...s.bookings, booking] })),
  updateBooking: (id, updates) =>
    set((s) => ({
      bookings: s.bookings.map((b) => (b.id === id ? { ...b, ...updates } : b)),
    })),
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
  setRooms: (rooms: ORRoom[]) => void;
  addRoom: (room: ORRoom) => void;
  updateRoom: (id: string, updates: Partial<ORRoom>) => void;
  setLiveStatus: (roomId: string, status: ORRoomStatus, bookingId?: string | null) => void;
  setAllLiveStatuses: (statuses: Record<string, ORRoomLiveStatus>) => void;
}

export const useORRoomsStore = create<ORRoomsState>((set) => ({
  rooms: [],
  liveStatuses: {},
  setRooms: (rooms) => set({ rooms }),
  addRoom: (room) => set((s) => ({ rooms: [...s.rooms, room] })),
  updateRoom: (id, updates) =>
    set((s) => ({ rooms: s.rooms.map((r) => (r.id === id ? { ...r, ...updates } : r)) })),
  setLiveStatus: (roomId, status, bookingId = null) =>
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
    })),
  setAllLiveStatuses: (statuses) => set({ liveStatuses: statuses }),
}));

// ── Notifications Store ──
interface NotificationsState {
  notifications: Notification[];
  unreadCount: number;
  setNotifications: (notifications: Notification[]) => void;
  addNotification: (notification: Notification) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
}

export const useNotificationsStore = create<NotificationsState>((set) => ({
  notifications: [],
  unreadCount: 0,
  setNotifications: (notifications) =>
    set({ notifications, unreadCount: notifications.filter((n) => !n.is_read).length }),
  addNotification: (notification) =>
    set((s) => ({
      notifications: [notification, ...s.notifications],
      unreadCount: s.unreadCount + (notification.is_read ? 0 : 1),
    })),
  markAsRead: (id) =>
    set((s) => ({
      notifications: s.notifications.map((n) => (n.id === id ? { ...n, is_read: true } : n)),
      unreadCount: Math.max(0, s.unreadCount - 1),
    })),
  markAllAsRead: () =>
    set((s) => ({
      notifications: s.notifications.map((n) => ({ ...n, is_read: true })),
      unreadCount: 0,
    })),
}));

// ── Audit Logs Store ──
interface AuditLogsState {
  logs: AuditLog[];
  setLogs: (logs: AuditLog[]) => void;
  addLog: (log: AuditLog) => void;
}

export const useAuditLogsStore = create<AuditLogsState>((set) => ({
  logs: [],
  setLogs: (logs) => set({ logs }),
  addLog: (log) => set((s) => ({ logs: [log, ...s.logs] })),
}));

// ── Change Requests Store ──
interface ChangeRequestsState {
  requests: BookingChangeRequest[];
  setRequests: (requests: BookingChangeRequest[]) => void;
  addRequest: (request: BookingChangeRequest) => void;
  updateRequest: (id: string, updates: Partial<BookingChangeRequest>) => void;
}

export const useChangeRequestsStore = create<ChangeRequestsState>((set) => ({
  requests: [],
  setRequests: (requests) => set({ requests }),
  addRequest: (request) => set((s) => ({ requests: [...s.requests, request] })),
  updateRequest: (id, updates) =>
    set((s) => ({
      requests: s.requests.map((r) => (r.id === id ? { ...r, ...updates } : r)),
    })),
}));
