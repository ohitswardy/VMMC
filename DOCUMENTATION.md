# VMMC OR Core Booking & Scheduling System — Technical Documentation

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Technology Stack](#technology-stack)
4. [Project Structure](#project-structure)
5. [Getting Started](#getting-started)
6. [Environment Configuration](#environment-configuration)
7. [Database Schema](#database-schema)
8. [Authentication & Authorization](#authentication--authorization)
9. [Role-Based Access Control (RBAC)](#role-based-access-control-rbac)
10. [Core Features](#core-features)
11. [State Management](#state-management)
12. [Routing](#routing)
13. [Component Architecture](#component-architecture)
14. [Supabase Integration](#supabase-integration)
15. [Styling & Theme](#styling--theme)
16. [Deployment](#deployment)
17. [Data Retention & Archival](#data-retention--archival)
18. [API Reference](#api-reference)

---

## Overview

The **VMMC OR Core Booking & Scheduling System** is a hospital-grade Operating Room (OR) booking and scheduling platform designed for the Veterans Memorial Medical Center. It allows 17 surgical departments to request, manage, and track OR bookings with full approval workflows controlled by the Department of Anesthesiology.

### Key Capabilities

- **Interactive OR Calendar** — Day and week views showing all 8 OR rooms side by side, with color-coded department bookings
- **Booking Workflow** — Department users submit requests → Anesthesiology Admin reviews → Approves / Denies
- **Smart Conflict Detection** — Prevents double-booking of rooms and anesthesiologists with time overlap checks
- **Emergency Case Protocol** — Priority override for emergency cases (admin-only)
- **Live Status Board** — Real-time view of OR room states (Idle / Ongoing / Ended)
- **Change Schedule Workflow** — Structured change requests with 24-hour cutoff enforcement
- **Immutable Audit Trail** — Every action logged with tamper-proof database triggers
- **Reporting & Analytics** — OR utilization, department activity, estimated vs. actual durations
- **Document Generation** — Daily OR schedule sheets in PDF and Excel formats
- **Notifications & Alerts** — In-app notification system for booking status changes

---

## Architecture

```
┌──────────────────────────────────────────────────┐
│                   Frontend (SPA)                  │
│  React 19 + TypeScript + Vite + Tailwind CSS v4  │
├──────────────────────────────────────────────────┤
│  State Management: Zustand                        │
│  Routing: react-router-dom v6                     │
│  Animation: framer-motion                         │
│  Charts: Recharts                                 │
│  Icons: lucide-react                              │
├──────────────────────────────────────────────────┤
│                  Supabase Backend                  │
│  Auth │ PostgreSQL │ Realtime │ Row Level Security │
└──────────────────────────────────────────────────┘
```

### Data Flow

1. **User authenticates** via Supabase Auth (or mock auth in demo mode)
2. **Frontend queries** Supabase PostgreSQL via the JS client
3. **Row Level Security (RLS)** enforces role-based data access at the database level
4. **Realtime subscriptions** push booking/notification changes to connected clients
5. **Audit log triggers** automatically capture every data mutation

---

## Technology Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | React | 19.x |
| Language | TypeScript | 5.x |
| Bundler | Vite | 7.x |
| CSS | Tailwind CSS | 4.x (Vite plugin) |
| Backend | Supabase | Latest |
| State | Zustand | 5.x |
| Routing | react-router-dom | 6.x |
| Animation | framer-motion | 12.x |
| Charts | Recharts | 2.x |
| Icons | lucide-react | 0.5x |
| Date Utils | date-fns | 4.x |
| Drag & Drop | @dnd-kit/core + sortable | 6.x / 10.x |
| PDF | jspdf + jspdf-autotable | 3.x |
| Excel | xlsx (SheetJS) | 0.18.x |
| Toast Notifications | react-hot-toast | 2.x |
| Data Fetching | @tanstack/react-query | 5.x |

---

## Project Structure

```
src/
├── App.tsx                    # Root router & ProtectedRoute
├── main.tsx                   # React entry point
├── index.css                  # Tailwind v4 theme, animations, utilities
│
├── lib/
│   ├── constants.ts           # Departments, roles, statuses, categories, equipment
│   ├── types.ts               # TypeScript interfaces (Booking, UserProfile, ORRoom, etc.)
│   ├── supabase.ts            # Supabase client initialization
│   ├── utils.ts               # Date formatting, conflict detection, utilization calc
│   └── mockData.ts            # Demo data (users, rooms, bookings, notifications, logs)
│
├── stores/
│   ├── authStore.ts           # Zustand auth store (persisted)
│   └── appStore.ts            # Zustand stores: bookings, rooms, notifications, audit, changes
│
├── components/
│   ├── ui/
│   │   ├── Button.tsx         # Animated button with variants
│   │   ├── Modal.tsx          # Reusable modal with framer-motion
│   │   ├── StatusBadge.tsx    # Color-coded status pill
│   │   └── FormFields.tsx     # Input, Select, Textarea, CheckboxGroup
│   │
│   ├── layout/
│   │   ├── Sidebar.tsx        # Collapsible nav with role-based menu items
│   │   └── AppLayout.tsx      # Sidebar + main content + toast provider
│   │
│   └── booking/
│       ├── BookingFormModal.tsx      # New booking form (11 required fields)
│       ├── ChangeScheduleModal.tsx   # Change schedule request form
│       └── BookingDetailModal.tsx    # Read-only detail view + approve/deny
│
└── pages/
    ├── LoginPage.tsx           # Authentication with demo quick-login
    ├── ORCalendarPage.tsx      # Day/week calendar views
    ├── DashboardPage.tsx       # Stats, pending queue, bookings table
    ├── LiveBoardPage.tsx       # Real-time OR room status board
    ├── BookingsPage.tsx        # Card-based booking browser
    ├── ORRoomsPage.tsx         # OR room CRUD management
    ├── NotificationsPage.tsx   # In-app notifications center
    ├── ReportsPage.tsx         # Recharts analytics dashboard
    ├── DocumentsPage.tsx       # Schedule sheet generator (PDF/Excel)
    ├── AuditLogsPage.tsx       # Immutable audit log viewer
    ├── UsersPage.tsx           # User account management
    └── SettingsPage.tsx        # System settings (buffer, retention, alerts)

supabase/
└── migrations/
    └── 001_initial_schema.sql  # Full PostgreSQL schema with RLS
```

---

## Getting Started

### Prerequisites

- **Node.js** ≥ 18
- **npm** ≥ 9
- **Supabase** project (or use demo mode with mock data)

### Installation

```bash
# Clone the repository
git clone <repo-url>
cd "VMMC Booking System"

# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Start development server
npm run dev
```

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server (HMR) |
| `npm run build` | TypeScript check + production build |
| `npm run preview` | Preview production build locally |
| `npm run lint` | ESLint check |

---

## Environment Configuration

Create a `.env` file in the project root:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

> **Demo Mode**: The application ships with mock data (`src/lib/mockData.ts`) and works without a live Supabase connection. Mock authentication matches email from predefined users.

---

## Database Schema

The full schema is defined in `supabase/migrations/001_initial_schema.sql`.

### Core Tables

| Table | Purpose |
|-------|---------|
| `profiles` | User profiles linked to Supabase Auth |
| `or_rooms` | Operating room configurations |
| `or_room_live_status` | Real-time status per room |
| `bookings` | OR booking records (core entity) |
| `booking_change_requests` | Submitted change/reschedule requests |
| `recurring_templates` | Template definitions for recurring schedules |
| `notifications` | In-app notification inbox |
| `audit_logs` | Immutable action log |
| `archive_snapshots` | Periodic data archival snapshots |

### Key Constraints & Triggers

- **`check_booking_conflicts`** — Before INSERT trigger that prevents overlapping room or anesthesiologist bookings
- **`prevent_audit_update`** / **`prevent_audit_delete`** — Triggers that make audit_logs truly immutable
- **`update_updated_at_column`** — Auto-timestamping trigger on all mutable tables
- **`handle_new_user`** — Creates a profile row when a new user signs up via Supabase Auth

### Booking Entity Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `or_room_id` | UUID | FK → or_rooms |
| `department_id` | TEXT | Surgical department code |
| `date` | DATE | Scheduled date |
| `start_time` | TIME | Procedure start |
| `end_time` | TIME | Procedure end |
| `patient_name` | TEXT | Patient full name |
| `patient_age` | INTEGER | Patient age |
| `patient_sex` | TEXT | M or F |
| `patient_category` | TEXT | RPV, RPVD, VMMCP, etc. |
| `ward` | TEXT | Hospital ward |
| `procedure` | TEXT | Surgical procedure description |
| `surgeon` | TEXT | Surgeon name(s) |
| `anesthesiologist` | TEXT | Assigned anesthesiologist |
| `clearance_availability` | BOOLEAN | Medical clearance status |
| `special_equipment` | TEXT[] | Required special equipment |
| `estimated_duration_minutes` | INTEGER | Estimated duration |
| `actual_duration_minutes` | INTEGER | Actual (filled after) |
| `status` | TEXT | pending / approved / denied / ongoing / completed / cancelled |
| `is_emergency` | BOOLEAN | Emergency case flag |
| `emergency_reason` | TEXT | Reason for emergency override |

---

## Authentication & Authorization

### Authentication Flow

1. User enters email + password on the Login page
2. **Production**: Supabase Auth verifies credentials and returns a session JWT
3. **Demo mode**: Email matched against `MOCK_USERS` array for instant login
4. User profile stored in Zustand `authStore` (persisted to localStorage)
5. On logout, store is cleared and user redirected to `/login`

### Session Persistence

The `authStore` uses Zustand's `persist` middleware to survive page refreshes:

```typescript
export const useAuthStore = create(
  persist<AuthState>(
    (set) => ({ /* ... */ }),
    { name: 'vmmc-auth' }
  )
);
```

---

## Role-Based Access Control (RBAC)

### Roles

| Role | Code | Permissions |
|------|------|-------------|
| **Super Admin** | `super_admin` | Full access to all modules, can manage users, approve/deny bookings, configure system |
| **Anesthesiology Admin** | `anesthesiology_admin` | Approve/deny bookings, manage schedule, access reports, emergency override |
| **Department User** | `department_user` | Create bookings for own department, request changes, view own department data |
| **Viewer** | `viewer` | Read-only access to calendar and live board |

### Frontend Route Guards

Routes are wrapped in a `ProtectedRoute` component that checks the user's role:

```tsx
<Route element={<ProtectedRoute allowedRoles={['super_admin', 'anesthesiology_admin']} />}>
  <Route path="/reports" element={<ReportsPage />} />
  <Route path="/audit-logs" element={<AuditLogsPage />} />
</Route>
```

### Database-Level RLS

Row Level Security policies on every table enforce access at the PostgreSQL level:

- **Super Admin**: Full CRUD on all tables
- **Anesthesiology Admin**: Full read, can update booking statuses
- **Department User**: Can only see/modify bookings from their department
- **Viewer**: SELECT-only policies
- **Audit Logs**: No UPDATE/DELETE allowed (immutable)

---

## Core Features

### 1. OR Calendar (Day & Week Views)

- **Day View**: Time grid (7:00 AM – 7:00 PM) with all 8 OR rooms as columns. Booking blocks positioned by start/end time with department color coding.
- **Week View**: Condensed 7-day view showing booking summaries per room per day.
- **Interactions**: Click a time slot to create a booking, click a booking block to view details.

### 2. Booking Form (11 Required Fields)

1. Operating Room selection
2. Department (auto-filled for dept users)
3. Date
4. Start Time / End Time
5. Patient Name, Age, Sex
6. Patient Category (RPV, RPVD, VMMCP, etc.)
7. Ward
8. Procedure
9. Surgeon
10. Anesthesiologist
11. Medical Clearance status

Additional: Special equipment checklist, emergency toggle (admin only), notes.

### 3. Conflict Detection

Before saving a booking, the system checks:
- **Room conflict**: Another approved/ongoing booking in the same room overlapping the requested time
- **Anesthesiologist conflict**: The same anesthesiologist assigned to an overlapping booking in any room
- Buffer time between consecutive bookings (configurable, default 15 min)

### 4. Change Schedule Workflow

- Department users can request a schedule change
- **24-hour cutoff rule**: If the booking is within 24 hours, the form shows "Contact the Department of Anesthesia directly" and disables submission
- Change request includes: new date, time, reason (from predefined list), and free-text remarks
- Admin reviews and approves/denies the change

### 5. Emergency Case Protocol

- Only Super Admin and Anesthesiology Admin can flag a case as emergency
- Emergency bookings bypass normal approval workflow
- Emergency reason is required and logged
- Visual indicator (red badge) on calendar and detail views

### 6. Live Status Board

4-column grid showing all OR rooms with:
- **Idle** — No active case (blue indicator)
- **Ongoing** — Case in progress with animated pulse (green indicator)
- **Ended** — All cases completed for the day (gray indicator)
- Current case details (patient, surgeon, time, department)
- Today's queue with status badges

### 7. Notifications

- In-app notification bell with unread count
- Notification types: booking_approved, booking_denied, change_requested, emergency_alert, system
- Mark individual or all as read
- Filter by type or unread status

### 8. Reporting & Analytics

Built with Recharts:
- **OR Utilization**: Bar chart showing utilization % per room
- **Department Activity**: Pie chart of bookings by department
- **Duration Accuracy**: Estimated vs. actual duration comparison
- **Status Breakdown**: Approved, cancelled, emergency percentages

### 9. Document Generation

- **Daily OR Schedule Sheet**: Table of all bookings for a selected date
- **Export formats**: PDF (via jspdf), Excel (via xlsx), Print
- Preview table shown in-app before export

### 10. Audit Logs

- Every action logged: booking_created, booking_approved, booking_denied, booking_modified, schedule_changed, user_login, etc.
- Search, filter by date range, user, and action type
- Immutable badge — database triggers prevent modification or deletion

### 11. User Management (Admin)

- View all user accounts with role and department
- Add / edit users with role assignment and department mapping
- Activate / deactivate accounts

### 12. System Settings

- **Buffer Time**: Configurable minutes between consecutive bookings
- **Data Retention**: Downloadable data retention period, archive retention period
- **Purge Warnings**: Hours before purge to send warnings
- **Notification Preferences**: Toggle email/in-app alerts per event type

---

## State Management

### Zustand Stores

| Store | File | State |
|-------|------|-------|
| `useAuthStore` | `stores/authStore.ts` | `user`, `isAuthenticated`, `isLoading`, `setUser`, `logout` |
| `useBookingsStore` | `stores/appStore.ts` | `selectedDate`, `isFormOpen`, `selectedRoom`, booking form controls |
| `useORRoomsStore` | `stores/appStore.ts` | Room list, add/update/toggle operations |
| `useNotificationsStore` | `stores/appStore.ts` | Notifications array, add/markRead/clear |
| `useAuditLogsStore` | `stores/appStore.ts` | Audit log entries, addLog |
| `useChangeRequestsStore` | `stores/appStore.ts` | Change requests, add/approve/deny |

### Persistence

Only the `authStore` is persisted to localStorage (key: `vmmc-auth`). Other stores reset on page refresh (expected to be hydrated from Supabase in production).

---

## Routing

| Path | Page | Allowed Roles |
|------|------|---------------|
| `/login` | LoginPage | Public |
| `/` | Redirect to `/calendar` | Authenticated |
| `/calendar` | ORCalendarPage | All authenticated |
| `/dashboard` | DashboardPage | All authenticated |
| `/live-board` | LiveBoardPage | All authenticated |
| `/bookings` | BookingsPage | All authenticated |
| `/or-rooms` | ORRoomsPage | super_admin, anesthesiology_admin |
| `/notifications` | NotificationsPage | All authenticated |
| `/reports` | ReportsPage | super_admin, anesthesiology_admin |
| `/documents` | DocumentsPage | super_admin, anesthesiology_admin |
| `/audit-logs` | AuditLogsPage | super_admin, anesthesiology_admin |
| `/users` | UsersPage | super_admin |
| `/settings` | SettingsPage | super_admin |
| `*` | Redirect to `/calendar` | — |

---

## Component Architecture

### UI Primitives (`components/ui/`)

- **Button** — Animated with framer-motion `whileHover`/`whileTap`. Supports 5 variants: `primary`, `secondary`, `danger`, `ghost`, `accent`. Sizes: `sm`, `md`, `lg`. Loading spinner state.
- **Modal** — AnimatePresence-powered overlay with backdrop blur, close on escape/outside click.
- **StatusBadge** — Compact pill displaying booking status with appropriate color.
- **FormFields** — `Input`, `Select`, `Textarea`, `CheckboxGroup` with consistent label/error styling.

### Layout (`components/layout/`)

- **Sidebar** — Collapsible left navigation. Shows different menu items based on user role. Mobile-responsive with hamburger toggle.
- **AppLayout** — Wraps authenticated pages in Sidebar + scrollable content area.

### Booking Components (`components/booking/`)

- **BookingFormModal** — Full booking creation form with all 11 fields, conflict detection, emergency toggle.
- **ChangeScheduleModal** — Change request form with 24-hour cutoff logic and predefined change reasons.
- **BookingDetailModal** — Displays all booking details. Admin sees Approve/Deny buttons; dept users see Request Change button.

---

## Supabase Integration

### Client Setup

```typescript
// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);
```

### Realtime Subscriptions

The database has realtime enabled for:
- `bookings` — Live booking status updates
- `or_room_live_status` — Real-time room state changes
- `notifications` — Instant notification delivery

### Applying the Migration

```bash
# Via Supabase CLI
supabase db push

# Or manually via SQL editor in Supabase Dashboard
# Copy and execute: supabase/migrations/001_initial_schema.sql
```

---

## Styling & Theme

### Color Scheme

The application uses a **Blue + Green** dual-tone palette:

| Token | Usage | Value |
|-------|-------|-------|
| `primary-*` | Main UI elements (buttons, links, highlights) | Blue spectrum (#3b82f6 base) |
| `accent-*` | Secondary CTA, success states, green accents | Green spectrum (#10b981 base) |

### Tailwind v4 Configuration

Styles are configured via the `@theme` directive in `src/index.css`:

```css
@import "tailwindcss";

@theme {
  --color-primary-50: #eff6ff;
  --color-primary-500: #3b82f6;
  /* ... full spectrum ... */
  --color-accent-50: #ecfdf5;
  --color-accent-500: #10b981;
  /* ... full spectrum ... */
  --font-sans: 'Inter', system-ui, sans-serif;
}
```

### Design Patterns

- **Glass morphism**: `bg-white/80 backdrop-blur-xl` for cards and panels
- **Rounded corners**: `rounded-2xl` (16px) for cards, `rounded-xl` (12px) for inputs
- **Shadows**: `shadow-sm` for subtle depth, `shadow-lg` for elevated elements
- **Gradients**: Buttons use `bg-gradient-to-r` for primary/accent/danger variants
- **Animations**: 5 custom keyframe animations (fadeIn, slideUp, slideDown, scaleIn, pulse-soft)

### Department Color Coding

Each of the 17 departments has a unique color and background:

| Department | Color | Background |
|------------|-------|------------|
| General Surgery | #3b82f6 | #eff6ff |
| OB-GYNE | #ec4899 | #fdf2f8 |
| Orthopedics | #f59e0b | #fffbeb |
| Ophthalmology | #8b5cf6 | #f5f3ff |
| ENT | #14b8a6 | #f0fdfa |
| Pediatrics | #f97316 | #fff7ed |
| Urology | #06b6d4 | #ecfeff |
| TCVS | #dc2626 | #fef2f2 |
| Neurosurgery | #7c3aed | #f5f3ff |
| Plastics | #d946ef | #fdf4ff |
| Psychiatry | #64748b | #f8fafc |
| Dental | #0ea5e9 | #f0f9ff |
| GI | #84cc16 | #f7fee7 |
| Radiology | #a855f7 | #faf5ff |
| Pulmonology | #22d3ee | #ecfeff |
| Cardiac | #ef4444 | #fef2f2 |
| Oncology | #10b981 | #ecfdf5 |

---

## Deployment

### Static Hosting (Recommended)

The application builds to a static SPA in `dist/`:

```bash
npm run build
# Output: dist/index.html, dist/assets/
```

Deploy to any static host:
- **Vercel**: `vercel --prod`
- **Netlify**: Upload `dist/` folder or connect repository
- **Nginx**: Serve `dist/` with SPA fallback to `index.html`
- **Apache (XAMPP)**: Copy `dist/` to htdocs

### Nginx Configuration

```nginx
server {
    listen 80;
    root /var/www/vmmc-booking/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

### Required Environment

Ensure the Supabase URL and anon key are set as environment variables at build time. Vite inlines `VITE_*` env vars during build.

---

## Data Retention & Archival

| Policy | Default | Configurable |
|--------|---------|-------------|
| Downloadable data retention | 3 months | Yes (Settings page) |
| Archive retention | 12 months | Yes (Settings page) |
| Purge warning | 72 hours before | Yes (Settings page) |
| Audit log retention | Permanent (immutable) | No |

The `archive_snapshots` table stores periodic JSON snapshots of booking data for compliance and historical reference.

---

## API Reference

### Supabase Queries (Production Pattern)

```typescript
// Fetch today's bookings
const { data, error } = await supabase
  .from('bookings')
  .select('*, or_rooms(*)')
  .eq('date', format(new Date(), 'yyyy-MM-dd'))
  .not('status', 'in', '("cancelled","denied")')
  .order('start_time');

// Create a booking
const { data, error } = await supabase
  .from('bookings')
  .insert({
    or_room_id: roomId,
    department_id: 'GS',
    date: '2025-07-15',
    start_time: '08:00',
    end_time: '10:00',
    patient_name: 'Juan Dela Cruz',
    // ... all required fields
  })
  .select()
  .single();

// Subscribe to realtime booking updates
supabase
  .channel('bookings')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' },
    (payload) => { /* handle update */ }
  )
  .subscribe();
```

### Utility Functions (`src/lib/utils.ts`)

| Function | Parameters | Returns | Description |
|----------|-----------|---------|-------------|
| `formatDate` | `date: string \| Date` | `string` | Formats to "Mar 15, 2025" |
| `formatTime` | `time: string` | `string` | Formats "08:00" to "8:00 AM" |
| `getDeptColor` | `deptId: string` | `string` | Returns department's hex color |
| `getDeptBg` | `deptId: string` | `string` | Returns department's background |
| `getDeptName` | `deptId: string` | `string` | Returns department's display name |
| `timeRangesOverlap` | `s1, e1, s2, e2` | `boolean` | Checks if two time ranges overlap |
| `hasRoomConflict` | `booking, bookings, roomId` | `Booking \| undefined` | Finds conflicting room booking |
| `hasAnesthesiologistConflict` | `booking, bookings` | `Booking \| undefined` | Finds anesthesiologist conflict |
| `canModifyBooking` | `booking` | `boolean` | Checks 24-hour cutoff rule |
| `generateTimeSlots` | `intervalMinutes` | `string[]` | Generates time slot labels |
| `calcUtilization` | `bookings, totalMinutes` | `number` | Calculates OR utilization % |
| `getStatusColor` | `status` | `string` | Returns Tailwind color for status |
| `getRoomStatusInfo` | `status` | `{ label, color, bgColor }` | Room status display info |

---

## License

Internal use — Veterans Memorial Medical Center. All rights reserved.
