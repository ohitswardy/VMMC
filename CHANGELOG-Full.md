# VMMC OR Booking System — Full Change Log

> **Document Version:** 1.0
> **Date:** February 28, 2026
> **Scope:** All features, process changes, and database updates implemented to date

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Technology Stack](#2-technology-stack)
3. [Feature Inventory](#3-feature-inventory)
   - [Authentication & Security](#31-authentication--security)
   - [OR Calendar](#32-or-calendar)
   - [Dashboard](#33-dashboard)
   - [Bookings Management](#34-bookings-management)
   - [Live Board](#35-live-board)
   - [OR Rooms & Nurse Duty](#36-or-rooms--nurse-duty)
   - [Notifications](#37-notifications)
   - [Reports & Analytics](#38-reports--analytics)
   - [Documents & PDF Export](#39-documents--pdf-export)
   - [Audit Logs](#310-audit-logs)
   - [User Management](#311-user-management)
   - [Settings](#312-settings)
   - [Data Privacy Compliance](#313-data-privacy-compliance)
   - [Session Idle Timeout](#314-session-idle-timeout)
   - [Contextual Help System](#315-contextual-help-system)
4. [Process Flows](#4-process-flows)
5. [Database Schema](#5-database-schema)
6. [Role-Based Access Control (RBAC)](#6-role-based-access-control-rbac)
7. [Real-Time Features](#7-real-time-features)
8. [Deployment & Infrastructure](#8-deployment--infrastructure)
9. [UI/UX Design System](#9-uiux-design-system)
10. [File Manifest](#10-file-manifest)

---

## 1. System Overview

The **VMMC OR Booking System** is a web-based operating room scheduling and management platform built for **Veterans Memorial Medical Center** (VMMC). It enables departments to book operating rooms, administrators to manage schedules, and nurses to track real-time OR status — all through a unified, role-based interface.

**Live deployment:** Hosted on **Vercel** with a **Supabase** PostgreSQL backend.

---

## 2. Technology Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, TypeScript, Vite |
| Styling | Tailwind CSS 4, Framer Motion |
| State Management | Zustand (with persist middleware) |
| Routing | React Router DOM v6 |
| Backend / Database | Supabase (PostgreSQL, Auth, Realtime, Row-Level Security) |
| PDF Generation | jsPDF + jspdf-autotable |
| Charts | Recharts |
| Hosting | Vercel |

---

## 3. Feature Inventory

### 3.1 Authentication & Security

| Feature | Description |
|---------|-------------|
| **Email/Password Login** | Supabase Auth with hashed credentials |
| **Role-Based Route Guards** | `ProtectedRoute` component checks `isAuthenticated` + `user.role` before granting access |
| **Persistent Sessions** | Zustand `persist` middleware stores user profile in `localStorage` key `vmmc-auth`; Supabase session auto-refreshes tokens |
| **Cross-Tab Sync** | `onAuthStateChange` listener handles `SIGNED_OUT` and `TOKEN_REFRESHED` events across tabs |
| **Logout Guard** | `_loggingOut` flag prevents auth listener from re-authenticating during logout |
| **Session Idle Timeout** | 30-minute inactivity auto-logout with 5-minute countdown warning (see §3.14) |
| **Data Privacy Agreement** | RA 10173-compliant modal shown on every login (see §3.13) |
| **Audit Logging** | Every login/logout event is recorded in immutable `audit_logs` table |

**Files:** `src/stores/authStore.ts`, `src/pages/LoginPage.tsx`, `src/lib/supabaseService.ts`

---

### 3.2 OR Calendar

| Feature | Description |
|---------|-------------|
| **Three View Modes** | Day (default), Week, Month — toggle in header |
| **Day View** | Multi-room time grid (desktop) with 30-min increments for 8 OR rooms; mobile: single-room timeline with tab selector |
| **Week View** | 7-column desktop grid; stacked mobile cards |
| **Month View** | 7-column calendar grid with department-colored booking dots (mobile) or chips (desktop); selected-day panel below |
| **Inline Booking** | Click any empty time slot or the "+" button to open the booking form for that room/date |
| **Booking Detail** | Click any booking block to open a read-only detail modal |
| **Department Color Coding** | 17 departments each with unique color + background |
| **PDF Print** | Daily schedule export from the calendar view |

**File:** `src/pages/ORCalendarPage.tsx` (≈900 lines)

---

### 3.3 Dashboard

| Feature | Description |
|---------|-------------|
| **4 Metric Cards** | Today's Cases, Pending, Ongoing, Completed — each with sparkline chart, trend badge, and contextual label |
| **Pending Approval Queue** | Cards for pending bookings with quick Approve / Deny actions |
| **Bookings Table** | Full searchable, filterable table of all bookings with status badges |
| **Role Restriction** | Accessible by `super_admin` and `anesthesiology_admin` only |

**File:** `src/pages/DashboardPage.tsx`

---

### 3.4 Bookings Management

| Feature | Description |
|---------|-------------|
| **Create Booking** | 11+ required fields: OR room, department, date, start/end time, patient demographics (name, age, sex, category, ward), procedure, surgeon, anesthesiologist, scrub nurse, circulating nurse, clearance availability, special equipment |
| **Emergency Toggle** | Marks booking as emergency (bypasses DB conflict check trigger) |
| **Approve / Deny Workflow** | Admins approve or deny pending bookings with optional denial reason |
| **Cancel Booking** | Admins or creating department can cancel |
| **Edit Booking** | Admins can edit any field of an approved/pending booking |
| **Change Request** | Department users request date/time changes on existing bookings with required reason; admins review and approve/deny |
| **IM Subspecialty** | Change requests can specify Internal Medicine subspecialties (Cardio, Pulmo, Nephro, GI, Other) |
| **24h Cutoff** | Change requests enforce a 24-hour cutoff — cannot request changes less than 24 hours before surgery |
| **Conflict Detection** | Database trigger `check_booking_conflict()` prevents room + anesthesiologist double-booking |
| **Day-by-Day Browser** | Inline day-picker with search/filter by department and status |
| **Status Flow** | `pending → approved → ongoing → completed` (or `denied` / `cancelled` / `rescheduled`) |

**Files:** `src/pages/BookingsPage.tsx`, `src/components/booking/BookingFormModal.tsx`, `src/components/booking/BookingDetailModal.tsx`, `src/components/booking/ChangeScheduleModal.tsx`

---

### 3.5 Live Board

| Feature | Description |
|---------|-------------|
| **Real-Time OR Status** | 8 rooms displayed with 5 possible states: Idle, In Transit, Ongoing, Ended, Deferred |
| **Status Change** | Admins/nurses update room status with confirmation dialog |
| **Featured Case** | Currently active case highlighted prominently |
| **Per-Room Queue** | Today's bookings listed per room with times and patient info |
| **Color Indicators** | Each status has a distinct color (green=idle, amber=in_transit, blue=ongoing, gray=ended, red=deferred) |

**File:** `src/pages/LiveBoardPage.tsx`

---

### 3.6 OR Rooms & Nurse Duty

| Feature | Description |
|---------|-------------|
| **Room CRUD** | Add, edit, or delete OR rooms — number (unique), name, designation, active toggle, buffer time |
| **Nurse Duty Assignments** | Assign scrub nurse + circulating nurse per room per day |
| **OR Priority Schedule** | Department × Weekday priority matrix managed by `anesthesiology_admin` with specific anesthesiologist assignments |
| **Default 8 Rooms** | Pre-configured with department priorities (GS, OB-GYNE, Ortho, ENT/Ophtha, Cardiac, Neuro, Pedia, Multi) |

**Files:** `src/pages/ORRoomsPage.tsx`, `src/components/booking/ORPriorityModal.tsx`

---

### 3.7 Notifications

| Feature | Description |
|---------|-------------|
| **11 Notification Types** | `new_request`, `approval`, `denial`, `booking_confirmation`, `schedule_change`, `cancellation`, `emergency_alert`, `case_ending_soon`, `reminder_24h`, `reminder_2h`, `purge_warning` |
| **Real-Time Push** | Supabase Realtime subscription on `notifications` table — new items appear instantly |
| **Automated Reminders** | Background scheduler (admin sessions only) sends 24h and 2h reminders for upcoming bookings, runs every 5 minutes with deduplication via `Set<string>` |
| **Purge Warnings** | Automated warnings for bookings approaching data retention deadlines |
| **Click-to-Navigate** | Each notification type maps to a relevant app route (e.g., `approval` → `/bookings`, `emergency_alert` → `/live-board`) |
| **Mark Read / Mark All Read** | Individual and bulk read marking |
| **Swipe-to-Dismiss** | Mobile: Framer Motion pan gesture swipes left to reveal red delete strip; Desktop: hover × button |
| **Type Filtering** | Dropdown to filter by All, Unread, Requests, Approvals, Emergencies |
| **Pagination** | Shows 10 notifications at a time with "See Previous Notifications" button that loads 10 more per click; resets on filter change; "Showing x of y" counter |

**Files:** `src/pages/NotificationsPage.tsx`, `src/lib/notificationHelper.ts`

---

### 3.8 Reports & Analytics

| Feature | Description |
|---------|-------------|
| **4 Metric Cards** | Avg Utilization (area chart), Total Cases (bar chart), Cancellation Rate (area chart), Emergency Rate (line chart) — each with sparkline and trend |
| **OR Utilization** | Bar chart showing utilization % per room |
| **Department Distribution** | Donut chart of cases by department |
| **Status Breakdown** | Pie chart of booking statuses |
| **Duration Accuracy** | Estimated vs actual duration analysis |
| **Role Restriction** | `super_admin` only |

**File:** `src/pages/ReportsPage.tsx`

---

### 3.9 Documents & PDF Export

| Feature | Description |
|---------|-------------|
| **Daily OR Schedule Sheet** | Formatted schedule for a selected date, grouped by room |
| **Quick Links** | Last 7 days of schedule sheets accessible with one click |
| **PDF Download** | jsPDF + autotable exports with VMMC logo, date header, room-grouped tables |
| **Retention Policy** | Configurable download retention (default 7 days) and archive retention (default 30 days) |

**Files:** `src/pages/DocumentsPage.tsx`, `src/lib/generateSchedulePDF.ts`

---

### 3.10 Audit Logs

| Feature | Description |
|---------|-------------|
| **Immutable Log** | Database trigger `prevent_audit_log_modification()` blocks all UPDATE and DELETE on `audit_logs` — true write-once |
| **Tracked Actions** | Login, logout, booking create/approve/deny/cancel/edit, room status change, change request review |
| **Rich Context** | Each log stores `user_id`, `action`, `entity_type`, `entity_id`, `old_values` (JSONB), `new_values` (JSONB), `ip_address`, `user_agent` |
| **Search & Filter** | Full-text search, date range filter, user filter, action type filter with color-coded badges |
| **Role Restriction** | `super_admin` and `anesthesiology_admin` only |

**Files:** `src/pages/AuditLogsPage.tsx`, `src/lib/auditHelper.ts`

---

### 3.11 User Management

| Feature | Description |
|---------|-------------|
| **User List** | All profiles displayed with name, email, role, department, active status |
| **Add User** | Create new accounts: full name, email, password, role, department, active toggle |
| **Edit User** | Update any field for existing accounts |
| **Role Assignment** | 5 roles: `super_admin`, `anesthesiology_admin`, `department_user`, `nurse`, `viewer` |
| **Department Binding** | Department users and nurses are assigned a specific department |
| **Role Restriction** | `super_admin` only |

**File:** `src/pages/UsersPage.tsx`

---

### 3.12 Settings

| Feature | Description |
|---------|-------------|
| **Buffer Time** | Default buffer between cases (minutes) |
| **Download Retention** | Days to keep downloadable schedule sheets (default: 7) |
| **Archive Retention** | Days to retain archived records (default: 30) |
| **Purge Warning Hours** | Hours before data purge to send warning notifications |
| **Auto-Archive Toggle** | Enable/disable automatic archival of old records |
| **Role Restriction** | `super_admin` and `anesthesiology_admin` only |

**File:** `src/pages/SettingsPage.tsx`

---

### 3.13 Data Privacy Compliance (RA 10173)

| Feature | Description |
|---------|-------------|
| **Privacy Policy Modal** | Full-screen modal with 10 sections covering: Introduction, Information Collected, Purpose, Data Access & Sharing, Security Measures, Retention, User Rights, User Agreement, Policy Updates, Contact |
| **Shown on Every Login** | Modal appears after each successful authentication |
| **Version Control** | `PRIVACY_POLICY_VERSION` (currently `1.0.0`) — bump to force re-display for all users |
| **Acknowledgment Tracking** | Per-user localStorage tracking via `hasAcknowledgedCurrentPolicy(userId)` / `acknowledgePolicy(userId)` |
| **Close = Agree** | Closing the modal constitutes acknowledgment. Footer states: "By closing this window, you acknowledge that you have read, understood, and agree to be bound by this Data Privacy Policy and User Agreement." |
| **Re-Show on Update** | If policy version changes, modal re-appears even on session restore (page refresh) until user closes it again |
| **Smooth Animations** | Framer Motion spring animation for panel entry, staggered section fade-ins, backdrop blur |

**Files:** `src/components/ui/DataPrivacyModal.tsx`, `src/lib/privacyPolicy.ts`

---

### 3.14 Session Idle Timeout

| Feature | Description |
|---------|-------------|
| **30-Minute Timeout** | User is automatically logged out after 30 minutes of inactivity |
| **5-Minute Warning** | A countdown banner slides down from the top of the screen at the 25-minute mark |
| **Live Countdown** | Warning shows remaining time in `M:SS` format, updating every second |
| **Activity Detection** | Monitors 7+ event types: `mousemove`, `mousedown`, `keydown`, `scroll`, `touchstart`, `pointerdown`, `wheel`, plus `focus` and `storage` (cross-tab) |
| **Instant Reset** | Any activity during warning period resets the full 30-minute timer and dismisses the warning |
| **Toast on Logout** | After auto-logout, a 🔒 toast displays: "You have been signed out due to inactivity." |

**Files:** `src/lib/useIdleTimeout.ts`, `src/App.tsx`

---

### 3.15 Contextual Help System

| Feature | Description |
|---------|-------------|
| **Per-Page Help** | Every page has a `PageHelpButton` that opens an overlay with step-by-step instructions |
| **11 Help Configs** | Dashboard, Bookings, OR Calendar, Live Board, OR Rooms, Notifications, Reports, Documents, Audit Logs, Users, Settings |
| **Emoji Icons** | Each step has an emoji icon for visual guidance |

**Files:** `src/components/ui/PageHelpButton.tsx`, `src/lib/helpContent.ts`

---

## 4. Process Flows

### 4.1 Booking Lifecycle

```
Department User creates booking
        ↓
  Status: PENDING
        ↓
Admin reviews (Dashboard or Bookings page)
        ↓
   ┌────┴────┐
APPROVED    DENIED (with reason)
   ↓            ↓
ONGOING      (Terminal)
   ↓
COMPLETED
```

**Parallel paths:**
- `PENDING → CANCELLED` (by admin or creating department)
- `APPROVED → RESCHEDULED` (via change request)
- `APPROVED → CANCELLED`

### 4.2 Change Request Flow

```
Dept user opens booking detail → "Request Change"
        ↓
Selects new date/time, reason, patient details
        ↓
  24h cutoff enforced
        ↓
  Status: PENDING
        ↓
Admin reviews request
        ↓
   ┌────┴────┐
APPROVED     DENIED
   ↓
Original booking updated with new date/time
Notification sent to department
```

### 4.3 Authentication Flow

```
User enters email + password → LoginPage
        ↓
Supabase signIn() → fetchProfile()
        ↓
Store: { user, isAuthenticated: true }
        ↓
Data Privacy Modal shown (every login)
        ↓
User closes modal → acknowledgePolicy(userId)
        ↓
Redirect to /calendar
        ↓
Idle timeout starts (30 min)
        ↓
    ┌───┴───┐
Active Use   25 min idle → Warning banner
    ↓              ↓
 (continues)   30 min idle → Auto-logout + toast
```

### 4.4 Notification Flow

```
Booking event occurs (create/approve/deny/cancel/change)
        ↓
notificationHelper creates DB row in `notifications` table
        ↓
Supabase Realtime pushes INSERT to subscribed clients
        ↓
App.tsx listener → addNotification() to store
        ↓
Unread badge updates, notification appears in inbox
```

**Automated (admin sessions only, every 5 min):**
```
Check all approved bookings
        ↓
   24h before → reminder_24h notification
    2h before → reminder_2h notification
  Near purge  → purge_warning notification
        ↓
Dedup via Set<string> (id+type) prevents duplicates
```

### 4.5 Live Board Status Flow

```
           ┌──────────┐
           │   IDLE    │ (green)
           └────┬─────┘
                ↓
        ┌───────────────┐
        │  IN TRANSIT   │ (amber)
        └───────┬───────┘
                ↓
         ┌────────────┐
         │  ONGOING    │ (blue)
         └──────┬─────┘
                ↓
           ┌─────────┐
           │  ENDED   │ (gray)
           └─────────┘

  Any state → DEFERRED (red) → can return to queue
```

---

## 5. Database Schema

### 5.1 Tables

#### `profiles`
| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID (PK) | References `auth.users(id)` — cascade delete |
| `email` | TEXT UNIQUE NOT NULL | |
| `full_name` | TEXT NOT NULL | |
| `role` | TEXT NOT NULL | One of: `super_admin`, `anesthesiology_admin`, `department_user`, `nurse`, `viewer` |
| `department_id` | TEXT | FK-like to department constant (e.g., `GS`, `OBGYNE`) |
| `avatar_url` | TEXT | |
| `is_active` | BOOLEAN | Default `true` |
| `created_at` | TIMESTAMPTZ | Default `now()` |
| `updated_at` | TIMESTAMPTZ | Auto-updated by trigger |

#### `or_rooms`
| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID (PK) | Default `gen_random_uuid()` |
| `number` | INT UNIQUE NOT NULL | |
| `name` | TEXT NOT NULL | |
| `designation` | TEXT | Department priority label |
| `is_active` | BOOLEAN | Default `true` |
| `buffer_time_minutes` | INT | Default `30` |
| `created_at` | TIMESTAMPTZ | |
| `updated_at` | TIMESTAMPTZ | |

#### `or_room_live_status`
| Column | Type | Notes |
|--------|------|-------|
| `room_id` | UUID (PK) | References `or_rooms(id)` — cascade |
| `status` | TEXT NOT NULL | One of: `idle`, `in_transit`, `ongoing`, `ended`, `deferred` |
| `current_booking_id` | UUID | References `bookings(id)` — set null |
| `updated_at` | TIMESTAMPTZ | |

#### `bookings`
| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID (PK) | |
| `or_room_id` | UUID NOT NULL | References `or_rooms(id)` |
| `department_id` | TEXT NOT NULL | |
| `date` | DATE NOT NULL | |
| `start_time` | TIME NOT NULL | |
| `end_time` | TIME NOT NULL | |
| `patient_name` | TEXT NOT NULL | |
| `patient_age` | INT NOT NULL | |
| `patient_sex` | TEXT NOT NULL | `M` or `F` |
| `patient_category` | TEXT NOT NULL | One of 8 categories |
| `ward` | TEXT NOT NULL | |
| `procedure_name` | TEXT NOT NULL | Mapped to `procedure` in frontend |
| `surgeon` | TEXT NOT NULL | |
| `anesthesiologist` | TEXT NOT NULL | |
| `scrub_nurse` | TEXT | |
| `circulating_nurse` | TEXT | |
| `clearance_availability` | BOOLEAN | Default `false` |
| `special_equipment` | TEXT[] | Array of equipment strings |
| `estimated_duration_minutes` | INT NOT NULL | |
| `actual_duration_minutes` | INT | |
| `status` | TEXT NOT NULL | Default `pending` |
| `is_emergency` | BOOLEAN | Default `false` |
| `emergency_reason` | TEXT | |
| `denial_reason` | TEXT | |
| `notes` | TEXT | |
| `created_by` | UUID NOT NULL | References `auth.users(id)` |
| `approved_by` | UUID | References `auth.users(id)` |
| `created_at` | TIMESTAMPTZ | |
| `updated_at` | TIMESTAMPTZ | |

#### `booking_change_requests`
| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID (PK) | |
| `original_booking_id` | UUID NOT NULL | References `bookings(id)` — cascade |
| `department_id` | TEXT NOT NULL | |
| `im_subspecialty` | TEXT | IM subspecialty selection |
| `im_subspecialty_other` | TEXT | Free text for "Other" |
| `new_date` | DATE NOT NULL | |
| `new_preferred_time` | TIME NOT NULL | |
| `patient_details` | TEXT | |
| `procedure_name` | TEXT | |
| `preferred_anesthesiologist` | TEXT | |
| `reason` | TEXT NOT NULL | Predefined + "Other" |
| `reason_other` | TEXT | |
| `additional_info` | TEXT | |
| `status` | TEXT NOT NULL | Default `pending` |
| `created_by` | UUID NOT NULL | References `auth.users(id)` |
| `reviewed_by` | UUID | References `auth.users(id)` |
| `created_at` | TIMESTAMPTZ | |
| `updated_at` | TIMESTAMPTZ | |

#### `recurring_templates`
| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID (PK) | |
| `department_id` | TEXT NOT NULL | |
| `or_room_id` | UUID NOT NULL | References `or_rooms(id)` — cascade |
| `day_of_week` | INT NOT NULL | 0=Sunday … 6=Saturday |
| `start_time` | TIME NOT NULL | |
| `end_time` | TIME NOT NULL | |
| `procedure_name` | TEXT | |
| `surgeon` | TEXT | |
| `is_active` | BOOLEAN | Default `true` |
| `created_at` | TIMESTAMPTZ | |
| `updated_at` | TIMESTAMPTZ | |

#### `notifications`
| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID (PK) | |
| `user_id` | UUID NOT NULL | References `auth.users(id)` — cascade |
| `title` | TEXT NOT NULL | |
| `message` | TEXT NOT NULL | |
| `type` | TEXT NOT NULL | 11 types (see §3.7) |
| `related_booking_id` | UUID | References `bookings(id)` — set null |
| `is_read` | BOOLEAN | Default `false` |
| `created_at` | TIMESTAMPTZ | |

#### `audit_logs`
| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID (PK) | |
| `user_id` | UUID | References `auth.users(id)` — set null |
| `action` | TEXT NOT NULL | e.g., `login`, `booking_create`, `booking_approve` |
| `entity_type` | TEXT | e.g., `booking`, `or_room`, `profile` |
| `entity_id` | TEXT | |
| `old_values` | JSONB | Snapshot before change |
| `new_values` | JSONB | Snapshot after change |
| `ip_address` | TEXT | |
| `user_agent` | TEXT | |
| `created_at` | TIMESTAMPTZ | |

> **Immutable:** Trigger `prevent_audit_log_modification()` blocks all UPDATE and DELETE.

#### `archive_snapshots`
| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID (PK) | |
| `date_range_start` | DATE NOT NULL | |
| `date_range_end` | DATE NOT NULL | |
| `file_url` | TEXT | |
| `record_count` | INT | |
| `created_at` | TIMESTAMPTZ | |

#### `or_priority_schedule`
| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID (PK) | |
| `department_id` | TEXT NOT NULL | |
| `weekday` | INT NOT NULL | 0–6 |
| `priority_label` | TEXT NOT NULL | Anesthesiologist name or priority descriptor |
| `created_at` | TIMESTAMPTZ | |
| `updated_at` | TIMESTAMPTZ | |

> **Unique constraint:** `(department_id, weekday)`

#### `nurse_duty_assignments`
| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID (PK) | |
| `or_room_id` | UUID NOT NULL | References `or_rooms(id)` — cascade |
| `date` | DATE NOT NULL | |
| `scrub_nurse` | TEXT | |
| `circulating_nurse` | TEXT | |
| `assigned_by` | UUID | References `auth.users(id)` |
| `created_at` | TIMESTAMPTZ | |
| `updated_at` | TIMESTAMPTZ | |

> **Unique constraint:** `(or_room_id, date)`

---

### 5.2 Functions & Triggers

| Function | Type | Purpose |
|----------|------|---------|
| `update_updated_at_column()` | `BEFORE UPDATE` trigger | Auto-sets `updated_at = now()` on profiles, or_rooms, bookings, change_requests, priority_schedule, nurse_duty |
| `check_booking_conflict()` | `BEFORE INSERT/UPDATE` trigger on bookings | Prevents same-room or same-anesthesiologist time overlap (emergency cases bypass) |
| `prevent_audit_log_modification()` | `BEFORE UPDATE/DELETE` trigger on audit_logs | Raises exception — makes audit logs immutable |
| `handle_new_user()` | `AFTER INSERT` trigger on `auth.users` | Auto-creates a `profiles` row from `raw_user_meta_data` (role, full_name, department_id) |
| `is_super_admin()` | `SECURITY DEFINER` function | Non-recursive admin check for profiles RLS — fixes infinite recursion when checking own role (migration 003) |

---

### 5.3 Indexes

| Index | Table | Columns |
|-------|-------|---------|
| `idx_bookings_date` | bookings | `date` |
| `idx_bookings_room_date` | bookings | `or_room_id`, `date` |
| `idx_bookings_department` | bookings | `department_id` |
| `idx_bookings_status` | bookings | `status` |
| `idx_bookings_anesthesiologist` | bookings | `anesthesiologist` |
| `idx_bookings_emergency` | bookings | `is_emergency` (where true) |
| `idx_notifications_user` | notifications | `user_id` |
| `idx_notifications_created` | notifications | `created_at DESC` |
| `idx_audit_logs_user` | audit_logs | `user_id` |
| `idx_audit_logs_action` | audit_logs | `action` |
| `idx_audit_logs_entity` | audit_logs | `entity_type`, `entity_id` |
| `idx_audit_logs_date` | audit_logs | `created_at DESC` |
| `idx_change_requests_booking` | booking_change_requests | `original_booking_id` |
| `idx_change_requests_status` | booking_change_requests | `status` |
| `idx_priority_schedule_day` | or_priority_schedule | `weekday` |
| `idx_nurse_duty_date` | nurse_duty_assignments | `date` |

---

### 5.4 Realtime-Enabled Tables

The following tables have Supabase Realtime publications enabled:
- `bookings`
- `or_room_live_status`
- `notifications`
- `or_priority_schedule`
- `nurse_duty_assignments`

---

### 5.5 Migration History

| File | Purpose |
|------|---------|
| `001_initial_schema.sql` | Original schema — all core tables, triggers, indexes |
| `002_full_schema.sql` | **Canonical complete schema** — adds `nurse_duty_assignments`, `nurse` role, refined RLS, emergency bypass in conflict trigger |
| `003_fix_rls.sql` | Fixes recursive RLS on profiles via `is_super_admin()` SECURITY DEFINER function |
| `004_diagnose_and_fix_auth.sql` | Diagnostic queries for GoTrue 500 errors, identity fixes |
| `005_deep_diagnosis.sql` | Further diagnostics — email_confirmed_at, trigger inspection |
| `006_fix_department_accounts.sql` | Sets correct role/department_id for 11 department accounts + nurse |

---

## 6. Role-Based Access Control (RBAC)

### 6.1 Roles

| Role | Description |
|------|-------------|
| `super_admin` | Full system access — user management, all settings, all reports |
| `anesthesiology_admin` | Booking management, OR scheduling, priority schedule, documents, audit logs |
| `department_user` | Create bookings for own department, request changes, view calendar/live board |
| `nurse` | OR room status management, nurse duty assignments, view calendar/live board |
| `viewer` | Read-only access to calendar and live board |

### 6.2 Route Access Matrix

| Route | super_admin | anes_admin | dept_user | nurse | viewer |
|-------|:-----------:|:----------:|:---------:|:-----:|:------:|
| `/calendar` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/dashboard` | ✅ | ✅ | ❌ | ❌ | ❌ |
| `/live-board` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/bookings` | ✅ | ✅ | ✅ | ❌ | ❌ |
| `/or-rooms` | ✅ | ✅ | ❌ | ✅ | ❌ |
| `/notifications` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/reports` | ✅ | ❌ | ❌ | ❌ | ❌ |
| `/documents` | ✅ | ✅ | ❌ | ❌ | ❌ |
| `/audit-logs` | ✅ | ✅ | ❌ | ❌ | ❌ |
| `/users` | ✅ | ❌ | ❌ | ❌ | ❌ |
| `/settings` | ✅ | ✅ | ❌ | ❌ | ❌ |

### 6.3 RLS Policy Summary

| Table | SELECT | INSERT | UPDATE | DELETE |
|-------|--------|--------|--------|--------|
| profiles | All authenticated | super_admin | Own + super_admin | super_admin |
| or_rooms | All authenticated | Admin | Admin | Admin |
| or_room_live_status | All authenticated | Admin | Admin | Admin |
| bookings | All authenticated | Admin + dept user (own dept) | Admin + dept user (own dept) | — |
| booking_change_requests | All authenticated | Non-viewer/nurse | Admin | — |
| recurring_templates | All authenticated | Admin | Admin | Admin |
| notifications | Own only | All authenticated | Own only | — |
| audit_logs | Admin only | All authenticated | ❌ NEVER | ❌ NEVER |
| archive_snapshots | Admin only | — | — | — |
| or_priority_schedule | All authenticated | Admin | Admin | Admin |
| nurse_duty_assignments | All authenticated | Admin + nurse | Admin + nurse | Admin + nurse |

> **Admin** = `super_admin` or `anesthesiology_admin`

---

## 7. Real-Time Features

| Feature | Implementation |
|---------|---------------|
| **Notification Push** | `App.tsx` subscribes to `postgres_changes` INSERT on `notifications` table filtered by `user_id` |
| **Automated Reminders** | 5-minute interval scheduler in admin sessions checks all approved bookings for 24h/2h/purge thresholds |
| **Live Board** | Room statuses updated via `upsertLiveStatus()` — Supabase Realtime broadcasts to all connected clients |

---

## 8. Deployment & Infrastructure

### 8.1 Vercel Configuration (`vercel.json`)

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ],
  "headers": [
    {
      "source": "/assets/(.*)",
      "headers": [
        { "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }
      ]
    },
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "X-XSS-Protection", "value": "1; mode=block" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" }
      ]
    }
  ]
}
```

- **SPA Rewrite:** All paths → `index.html` (React Router handles client-side routing; prevents 404 on direct URL access or page refresh)
- **Asset Caching:** Vite-hashed files in `/assets/` get 1-year immutable cache
- **Security Headers:** XSS protection, clickjacking prevention, MIME sniffing prevention, strict referrer policy

### 8.2 Environment Variables

| Variable | Purpose |
|----------|---------|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous/public key |

### 8.3 Build Process

```bash
npm run build    # tsc -b && vite build → outputs to dist/
```

---

## 9. UI/UX Design System

### 9.1 Design Principles

- **Inspiration:** Linear, Vercel, Stripe, UntitledUI
- **Principle:** Clean, intentional, human-crafted
- **Mobile-first:** Bottom tab navigation, responsive grids, touch-friendly tap targets

### 9.2 Color System

| Token | Value | Usage |
|-------|-------|-------|
| Accent 500 | `#6366f1` (Indigo) | Primary actions, selected states |
| Accent 600 | `#4f46e5` | Hover states |
| Gray 50–950 | Zinc scale | Backgrounds, text, borders |
| Success | `#22c55e` | Approved, idle |
| Warning | `#eab308` | Pending, in-transit |
| Danger | `#ef4444` | Denied, errors |

### 9.3 Typography

- **Font:** Inter (variable weight)
- **Font features:** `cv02`, `cv03`, `cv04`, `cv11`
- **Base size:** 15px, line-height 1.5
- **Letter spacing:** −0.011em base

### 9.4 Component Library

| Component | Features |
|-----------|----------|
| `Button` | 5 variants × 3 sizes, Framer Motion tap/hover, loading spinner |
| `Modal` | AnimatePresence, spring animation, mobile bottom-sheet / desktop centered |
| `CustomSelect` | Keyboard nav, auto-width, Framer Motion |
| `DatePicker` | Calendar popup with month/year navigation |
| `TimePicker` | Scroll-based hour/minute selector |
| `StatusBadge` | Color-coded pills per status |
| `PageHelpButton` | Contextual help overlay |
| `DataPrivacyModal` | Full privacy agreement, staggered animations |

### 9.5 Animations

| Animation | Engine | Details |
|-----------|--------|---------|
| Page transitions | Framer Motion | `opacity + y` slide-up |
| Modal open/close | Framer Motion spring | `damping: 30, stiffness: 300` |
| Data Privacy Modal | Framer Motion spring | Staggered section fade-ins, backdrop blur |
| Sidebar indicator | Framer Motion `layoutId` | Spring-animated sliding active indicator |
| Idle warning banner | CSS `@keyframes slideDown` | Slides down from top on 25-min idle |
| Notification swipe | Framer Motion pan | Mobile swipe-to-delete gesture |
| Notification pagination | Framer Motion | Fade-up on "See Previous" button |
| Calendar date selection | Framer Motion `layoutId` | Animated circle around selected date |

---

## 10. File Manifest

### Pages (`src/pages/`)
| File | Lines | Description |
|------|-------|-------------|
| `LoginPage.tsx` | 177 | Authentication form with VMMC branding |
| `ORCalendarPage.tsx` | ~900 | 3-view OR calendar |
| `DashboardPage.tsx` | 395 | Admin dashboard with metrics and approvals |
| `LiveBoardPage.tsx` | 475 | Real-time OR status board |
| `BookingsPage.tsx` | 729 | Booking browser with CRUD |
| `ORRoomsPage.tsx` | 332 | Room management + nurse duty |
| `NotificationsPage.tsx` | 273 | Notification inbox with pagination |
| `ReportsPage.tsx` | 342 | Analytics dashboard |
| `DocumentsPage.tsx` | 212 | Daily schedule viewer + PDF |
| `AuditLogsPage.tsx` | 204 | Immutable audit log viewer |
| `UsersPage.tsx` | 352 | User account management |
| `SettingsPage.tsx` | 151 | System configuration |

### Components (`src/components/`)
| File | Description |
|------|-------------|
| `booking/BookingFormModal.tsx` | Booking creation/edit form |
| `booking/BookingDetailModal.tsx` | Booking detail view |
| `booking/ChangeScheduleModal.tsx` | Change request form |
| `booking/ORPriorityModal.tsx` | Priority schedule editor |
| `layout/AppLayout.tsx` | Sidebar + content wrapper |
| `layout/Sidebar.tsx` | Role-based navigation |
| `ui/Button.tsx` | Animated button component |
| `ui/CustomSelect.tsx` | Custom dropdown select |
| `ui/DataPrivacyModal.tsx` | Privacy agreement modal |
| `ui/DatePicker.tsx` | Calendar date picker |
| `ui/FormFields.tsx` | Input/Select/Textarea/Checkbox primitives |
| `ui/Modal.tsx` | Reusable modal wrapper |
| `ui/PageHelpButton.tsx` | Contextual help overlay |
| `ui/StatusBadge.tsx` | Status pill badges |
| `ui/TimePicker.tsx` | Time selector |

### Libraries (`src/lib/`)
| File | Description |
|------|-------------|
| `auditHelper.ts` | Audit log creation helpers |
| `constants.ts` | Departments, roles, statuses, equipment, rooms |
| `generateSchedulePDF.ts` | jsPDF daily schedule export |
| `helpContent.ts` | Per-page contextual help content |
| `mockData.ts` | Demo users, rooms, bookings |
| `notificationHelper.ts` | Notification creation + automated reminders |
| `privacyPolicy.ts` | RA 10173 policy content, version tracking |
| `supabase.ts` | Supabase client initialization |
| `supabaseService.ts` | All database CRUD operations |
| `types.ts` | TypeScript interfaces |
| `useIdleTimeout.ts` | Session idle timeout hook |
| `utils.ts` | Date/time/color/department utilities |

### Stores (`src/stores/`)
| File | Stores | Description |
|------|--------|-------------|
| `authStore.ts` | `useAuthStore` | Authentication state + login/logout/initAuth |
| `appStore.ts` | `useBookingsStore`, `useORRoomsStore`, `useNotificationsStore`, `useAuditLogsStore`, `useChangeRequestsStore`, `useORPriorityScheduleStore` | All application data stores |

### Database (`supabase/`)
| File | Description |
|------|-------------|
| `seed.sql` | Demo accounts + rooms |
| `migrations/001_initial_schema.sql` | Original schema |
| `migrations/002_full_schema.sql` | Canonical complete schema |
| `migrations/003_fix_rls.sql` | RLS recursion fix |
| `migrations/004_diagnose_and_fix_auth.sql` | Auth diagnostics |
| `migrations/005_deep_diagnosis.sql` | Deep diagnostics |
| `migrations/006_fix_department_accounts.sql` | Department account fixes |

### Config
| File | Description |
|------|-------------|
| `vercel.json` | SPA rewrite, security headers, asset caching |
| `vite.config.ts` | Vite + React + Tailwind CSS plugins |
| `tsconfig.json` | TypeScript project references |
| `eslint.config.js` | ESLint configuration |
| `package.json` | Dependencies and scripts |

---

*Document generated: February 28, 2026*
