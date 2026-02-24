# VMMC OR Core Booking & Scheduling System — User Manual

## Table of Contents

1. [Introduction](#introduction)
2. [Accessing the System](#accessing-the-system)
3. [User Roles Overview](#user-roles-overview)
4. [Navigating the Interface](#navigating-the-interface)
5. [OR Calendar](#or-calendar)
6. [Creating a Booking](#creating-a-booking)
7. [Viewing Booking Details](#viewing-booking-details)
8. [Approving & Denying Bookings](#approving--denying-bookings)
9. [Changing a Schedule](#changing-a-schedule)
10. [Emergency Cases](#emergency-cases)
11. [Dashboard](#dashboard)
12. [Live Status Board](#live-status-board)
13. [My Bookings](#my-bookings)
14. [OR Room Management](#or-room-management)
15. [Notifications](#notifications)
16. [Reports & Analytics](#reports--analytics)
17. [Documents & Schedule Sheets](#documents--schedule-sheets)
18. [Audit Logs](#audit-logs)
19. [User Management](#user-management)
20. [System Settings](#system-settings)
21. [Frequently Asked Questions](#frequently-asked-questions)
22. [Troubleshooting](#troubleshooting)

---

## Introduction

Welcome to the **VMMC OR Core Booking & Scheduling System**. This system allows surgical departments to:

- Request operating room bookings
- Track the status of booking requests
- View the OR schedule in real-time
- Generate daily schedule sheets
- Manage change requests for existing bookings

The **Department of Anesthesiology** administers the system, reviewing and approving all OR booking requests.

---

## Accessing the System

### Login

1. Open your web browser and navigate to the system URL
2. Enter your **email address** and **password**
3. Click **Sign In**

### Demo Quick Login

In the demo environment, you can click any of the four quick-login buttons below the form to instantly sign in as a sample user:

| Demo User | Role |
|-----------|------|
| Dr. Admin | Super Admin |
| Dr. Anesthesia | Anesthesiology Admin |
| Dr. Surgeon | Department User (General Surgery) |
| Nurse Viewer | Viewer |

### Logging Out

Click your user avatar or name in the bottom-left corner of the sidebar, then click **Logout**.

---

## User Roles Overview

Your experience in the system depends on your assigned role:

### Super Admin
- Full access to all features
- Can manage users, settings, and system configuration
- Can create, approve, and deny any booking
- Can create emergency cases
- Can view audit logs and reports

### Anesthesiology Admin
- Can approve or deny booking requests from all departments
- Can create emergency cases
- Can view reports, documents, and audit logs
- Can manage OR rooms

### Department User
- Can create booking requests **for their own department only**
- Can request changes to their department's bookings
- Can view the OR calendar and their department's bookings
- Cannot approve/deny bookings

### Viewer
- Read-only access to the calendar and live board
- Cannot create, modify, or manage any bookings

---

## Navigating the Interface

### Sidebar Navigation

The left sidebar is your main navigation. It shows different menu items based on your role:

| Menu Item | Icon | Description | Available To |
|-----------|------|-------------|-------------|
| **Calendar** | Calendar icon | OR schedule views | All users |
| **Dashboard** | Grid icon | Overview & stats | All users |
| **Live Board** | Activity icon | Real-time OR status | All users |
| **Bookings** | Clipboard icon | Browse all bookings | All users |
| **OR Rooms** | Building icon | Room management | Admin only |
| **Notifications** | Bell icon | Your notifications | All users |
| **Reports** | Chart icon | Analytics dashboards | Admin only |
| **Documents** | File icon | Schedule sheet generator | Admin only |
| **Audit Logs** | Shield icon | Activity history | Admin only |
| **Users** | Users icon | User management | Super Admin only |
| **Settings** | Settings icon | System configuration | Super Admin only |

### Collapsing the Sidebar

Click the **chevron** button at the bottom of the sidebar to collapse it into icon-only mode. This gives you more screen space for the calendar and other views.

### Notification Badge

The bell icon in the sidebar shows a **red badge** with the count of unread notifications.

---

## OR Calendar

The calendar is the primary interface for viewing and managing the OR schedule.

### Day View

- Shows a **time grid** from 7:00 AM to 7:00 PM
- All 8 operating rooms are displayed as **columns**
- Each booking appears as a **colored block** positioned at its scheduled time
- The block's **left border color** matches the department's color
- Hover over a booking block to see it highlighted

#### Reading a Booking Block

Each booking block shows:
- **Department name** (top, colored text)
- **Status badge** (top-right)
- **Procedure name** (middle)
- **Patient name** and **surgeon** (below)
- **Time range** (bottom)

### Week View

- Shows 7 days (Monday–Sunday)
- Each day has a row with room cards showing that day's bookings
- More compact than day view — ideal for planning ahead

### Navigating Dates

| Action | How |
|--------|-----|
| Previous day/week | Click the **left arrow** (◀) |
| Next day/week | Click the **right arrow** (▶) |
| Jump to today | Click the **Today** button |
| Switch views | Toggle between **Day** and **Week** tabs |

### Creating a Booking from the Calendar

1. Click on any **empty time slot** in a room column
2. The booking form will open with the room and date pre-filled
3. Complete the remaining fields and submit

---

## Creating a Booking

### Step-by-Step

1. Click the **+ New Booking** button (top-right of calendar) or click an empty time slot
2. Fill in all required fields:

| # | Field | Description |
|---|-------|-------------|
| 1 | **Operating Room** | Select from available rooms (OR-1 through OR-8) |
| 2 | **Department** | Your surgical department (auto-filled for department users) |
| 3 | **Date** | The desired surgery date |
| 4 | **Start Time** | When the procedure begins |
| 5 | **End Time** | When the procedure is expected to end |
| 6 | **Patient Name** | Full name of the patient |
| 7 | **Patient Age** | Patient's age in years |
| 8 | **Patient Sex** | Male or Female |
| 9 | **Patient Category** | Select: RPV, RPVD, VMMCP, VMMCPD, VMMCPR, CP, CPNBB, CP-M |
| 10 | **Ward** | Hospital ward where patient is admitted |
| 11 | **Procedure** | Name/description of the surgical procedure |
| 12 | **Surgeon** | Name of the surgeon (or multiple separated by "/") |
| 13 | **Anesthesiologist** | Assigned anesthesiologist |
| 14 | **Medical Clearance** | Check if medical clearance is available |

3. **(Optional)** Check any **Special Equipment** needed:
   - C-Arm, Microscope, Laser, Laparoscopy Tower, Arthroscopy Tower, Cautery, Harmonic Scalpel, Tourniquet

4. **(Optional)** Add **Notes** for additional instructions

5. Click **Create Booking**

### Conflict Detection

If your booking conflicts with an existing approved or ongoing booking (same room and overlapping time, or same anesthesiologist at overlapping times), you will see a **red warning** message. You must adjust the time or room to resolve the conflict before submitting.

### After Submission

- Your booking will have a **Pending** status
- An Anesthesiology Admin will review and either **Approve** or **Deny** it
- You will receive a notification when the status changes

---

## Viewing Booking Details

Click on any **booking block** in the calendar or any booking row in the dashboard/bookings page to open the **Booking Detail Modal**.

The detail view shows:
- All booking fields (patient info, procedure, times, room, department)
- Current status with colored badge
- Emergency indicator (if applicable)
- Creation and last update timestamps

### Actions Available

| Role | Actions |
|------|---------|
| **Admin** | Approve, Deny (for pending bookings) |
| **Department User** | Request Change (if not within 24-hour cutoff) |
| **Viewer** | View only |

---

## Approving & Denying Bookings

*Available to: Super Admin, Anesthesiology Admin*

### From the Dashboard

1. Go to **Dashboard**
2. Scroll to the **Pending Approval Queue** section
3. Each pending booking shows department, patient, procedure, and time
4. Click **Approve** (green) to approve or **Deny** (red) to deny

### From the Booking Detail Modal

1. Click on any pending booking in the calendar
2. In the detail modal, click **Approve** or **Deny**
3. If denying, you may be asked for a denial reason

### Status Flow

```
Pending → Approved → Ongoing → Completed
           ↘ Denied
Pending → Cancelled (by requestor)
```

---

## Changing a Schedule

*Available to: Department User, Admin*

### How to Request a Change

1. Open the booking detail (click on a booking in the calendar)
2. Click **Request Change**
3. The **Change Schedule Form** appears with:

| Field | Description |
|-------|-------------|
| **New Date** | Proposed new date |
| **New Start Time** | Proposed new start time |
| **New End Time** | Proposed new end time |
| **Reason** | Select from: Surgeon unavailable, Patient request, Equipment unavailable, Emergency override, Room conflict, Schedule optimization, Other |
| **Remarks** | Free-text additional details |

4. Click **Submit Change Request**

### 24-Hour Cutoff Rule

**Important**: If the booking's scheduled date is **within 24 hours**, you **cannot** submit a change request through the system. Instead, you will see the message:

> *"This booking is within 24 hours. Please contact the Department of Anesthesia directly to request changes."*

This ensures same-day and next-day schedule changes are coordinated verbally with anesthesiology staff.

---

## Emergency Cases

*Available to: Super Admin, Anesthesiology Admin*

Emergency cases receive priority scheduling and bypass the normal approval workflow.

### Creating an Emergency Case

1. Click the red **Emergency Case** button (top-right of calendar page)
2. Toggle the **Emergency** switch ON in the booking form
3. Fill in the **Emergency Reason** (required)
4. Complete all other booking fields
5. Submit — the booking is immediately **Approved**

### Visual Indicators

Emergency bookings are marked with:
- A **red badge** on the calendar
- "EMERGENCY" label in the booking detail
- Special audit log entry

---

## Dashboard

The dashboard provides an at-a-glance overview:

### Stat Cards (Top Row)

| Card | Shows |
|------|-------|
| **Today's Cases** | Number of bookings for today |
| **Pending Approval** | Total pending requests awaiting admin review |
| **Ongoing** | Currently active OR cases today |
| **Completed** | Cases completed today |

### Pending Approval Queue (Admin Only)

A live list of all pending bookings with **Approve** and **Deny** buttons for quick action.

### All Bookings Table

A filterable, searchable table showing all bookings. Features:
- **Search**: Type patient name, procedure, or surgeon to filter
- **Status filter**: Dropdown to filter by Pending, Approved, Ongoing, etc.
- Department users see only their department's bookings

---

## Live Status Board

The live board shows the real-time status of all 8 operating rooms in a 4-column grid.

### Room Card Information

Each room card displays:
- **Room name** and designation
- **Current status**: Idle (blue), Ongoing (green with pulse animation), Ended (gray)
- **Current case** details (if ongoing): patient, surgeon, department, time
- **Today's Queue**: List of today's upcoming and completed cases

### Status Indicators

| Status | Color | Meaning |
|--------|-------|---------|
| **Idle** | Blue | No active case, room available |
| **Ongoing** | Green (pulsing) | Surgery in progress |
| **Ended** | Gray | All scheduled cases completed for the day |

---

## My Bookings

The bookings page shows all OR bookings in a card-based layout.

### Features

- Each booking displayed as a card with department color coding
- Shows key info: procedure, patient, date/time, room, surgeon, status
- Click a card to open the full detail modal
- Department users see their department's bookings by default

---

## OR Room Management

*Available to: Super Admin, Anesthesiology Admin*

### Viewing Rooms

Navigate to **OR Rooms** to see all 8 operating rooms with:
- Room name and number
- Designation (Major/Minor OR)
- Active/inactive status
- Buffer time between cases

### Adding a Room

1. Click **+ Add Room**
2. Enter Room Name, Designation, and Buffer Time
3. Click **Save**

### Editing a Room

1. Click the **Edit** icon on a room card
2. Modify the details
3. Click **Update**

### Default Rooms

| Room | Designation |
|------|-------------|
| OR-1 | Major OR |
| OR-2 | Major OR |
| OR-3 | Major OR |
| OR-4 | Major OR |
| OR-5 | Minor OR |
| OR-6 | Minor OR |
| OR-7 | Minor OR |
| OR-8 | Delivery Room / Minor |

---

## Notifications

### Viewing Notifications

1. Click the **Bell icon** in the sidebar
2. All notifications are listed with:
   - Type icon (approval, denial, change, emergency, system)
   - Title and message
   - Timestamp
   - Read/unread indicator

### Managing Notifications

| Action | How |
|--------|-----|
| Mark one as read | Click on the notification |
| Mark all as read | Click **Mark All Read** button |
| Filter by type | Use the type dropdown filter |
| Filter unread only | Click **Unread** filter |

### Notification Types

| Type | Triggered When |
|------|---------------|
| `booking_approved` | Your booking request is approved |
| `booking_denied` | Your booking request is denied |
| `change_requested` | A change request is submitted (admin notification) |
| `emergency_alert` | An emergency case is created |
| `system` | System announcements or maintenance notices |

---

## Reports & Analytics

*Available to: Super Admin, Anesthesiology Admin*

### Available Charts

1. **OR Utilization by Room** (Bar Chart)
   - Shows percentage of utilized time vs. available time for each OR
   - Helps identify underused or overbooked rooms

2. **Bookings by Department** (Pie Chart)
   - Proportional breakdown of bookings per surgical department
   - Color-coded to match department colors

3. **Estimated vs. Actual Duration** (Comparison)
   - Shows whether cases are running longer or shorter than estimated
   - Helps improve scheduling accuracy

4. **Booking Status Overview** (Stats)
   - Total bookings, completion rate, cancellation rate, emergency rate
   - Average OR utilization percentage

---

## Documents & Schedule Sheets

*Available to: Super Admin, Anesthesiology Admin*

### Generating a Schedule Sheet

1. Navigate to **Documents**
2. Select the **date** using the date picker
3. The schedule sheet preview table will display all bookings for that date

### Export Options

| Format | Button | Description |
|--------|--------|-------------|
| **PDF** | Download PDF | Generates a PDF document of the schedule |
| **Excel** | Download Excel | Exports schedule as an .xlsx spreadsheet |
| **Print** | Print | Opens browser print dialog for direct printing |

### Schedule Sheet Contents

The generated schedule includes:
- Date and "VMMC OR Daily Schedule" header
- Table with columns: OR Room, Time, Department, Patient, Procedure, Surgeon, Anesthesiologist, Status

---

## Audit Logs

*Available to: Super Admin, Anesthesiology Admin*

The audit log provides a complete, tamper-proof record of all system actions.

### Viewing Logs

Each log entry shows:
- **Timestamp** — When the action occurred
- **User** — Who performed the action
- **Action** — What was done (e.g., booking_created, booking_approved)
- **Details** — Additional context about the action

### Filtering

| Filter | Options |
|--------|---------|
| **Search** | Free text search across all fields |
| **Date Range** | Start and end date pickers |
| **User** | Filter by specific user |
| **Action Type** | Filter by action category |

### Immutability

Audit logs are **permanently immutable**. Database triggers prevent any modification or deletion. This ensures full compliance and accountability.

### Logged Actions

| Action | Description |
|--------|-------------|
| `booking_created` | New booking request submitted |
| `booking_approved` | Booking approved by admin |
| `booking_denied` | Booking denied by admin |
| `booking_modified` | Booking details modified |
| `booking_cancelled` | Booking cancelled |
| `schedule_changed` | Schedule change applied |
| `user_login` | User signed in |
| `user_logout` | User signed out |
| `room_updated` | OR room configuration changed |
| `settings_changed` | System settings modified |

---

## User Management

*Available to: Super Admin only*

### Viewing Users

Navigate to **Users** to see all system accounts in a table showing:
- Full name
- Email
- Role
- Department
- Active status

### Adding a User

1. Click **+ Add User**
2. Fill in:
   - Full Name
   - Email Address
   - Role (Super Admin, Anesthesiology Admin, Department User, Viewer)
   - Department (required for Department Users)
3. Click **Save**

### Editing a User

1. Click the **Edit** icon next to a user
2. Modify the details
3. Click **Update**

---

## System Settings

*Available to: Super Admin only*

### Buffer Time

Configure the minimum minutes between consecutive bookings in the same OR room. Default: **15 minutes**.

### Data Retention

| Setting | Description | Default |
|---------|-------------|---------|
| **Downloadable Data Retention** | How long booking data remains downloadable | 3 months |
| **Archive Retention** | How long archived data is kept | 12 months |
| **Purge Warning** | Hours before data purge to send notifications | 72 hours |

### Notification Preferences

Toggle on/off for each notification type:
- Email notifications
- In-app notifications
- Emergency alerts
- System announcements

---

## Frequently Asked Questions

### Q: Why can't I create a booking?
**A:** Only **Department Users** and **Admins** can create bookings. If you are a Viewer, you have read-only access. Contact your system administrator to change your role.

### Q: My booking shows "Pending" — what does that mean?
**A:** All new booking requests start as "Pending" and require approval from the Anesthesiology Admin. You will receive a notification once your booking is approved or denied.

### Q: I need to change my booking but the form says to contact Anesthesia directly.
**A:** The system enforces a **24-hour cutoff rule**. If your booking is scheduled within the next 24 hours, schedule changes must be coordinated directly with the Department of Anesthesia by phone or in person.

### Q: How do I know if my booking conflicts with another?
**A:** The system automatically checks for conflicts when you submit a booking. If there's a conflict (same room and overlapping time, or same anesthesiologist at overlapping times), you'll see a red warning message and the form will not submit until you resolve it.

### Q: Can I cancel my own booking?
**A:** Department Users can cancel their own pending bookings. Once a booking is approved, only an admin can cancel it.

### Q: Who can see my department's bookings?
**A:** Admins can see all departments' bookings. Department Users can see bookings from their own department. Viewers can see all bookings on the calendar but cannot modify them.

### Q: What is an emergency case?
**A:** Emergency cases are urgent, unscheduled surgeries that need immediate OR access. Only admins can create emergency cases. They bypass the normal approval process and are immediately approved.

### Q: Are audit logs editable?
**A:** No. Audit logs are **permanently immutable** — they cannot be modified or deleted by anyone, including Super Admins. This is enforced at the database level.

---

## Troubleshooting

### Login Issues

| Problem | Solution |
|---------|----------|
| "Invalid credentials" | Verify your email address. In demo mode, use one of the quick-login options. |
| Page shows blank after login | Clear browser cache and cookies, then try again. |
| Session expired | Log in again. The system maintains sessions via localStorage. |

### Booking Issues

| Problem | Solution |
|---------|----------|
| "Conflict detected" error | Choose a different time slot or room. Check the calendar to see what times are available. |
| Cannot change schedule | Check if the booking is within 24 hours. If so, contact Anesthesia directly. |
| Booking not visible on calendar | Make sure the correct date is selected and the booking wasn't cancelled or denied. |

### Display Issues

| Problem | Solution |
|---------|----------|
| Sidebar overlaps content | Close the sidebar using the collapse button, or resize your browser window. |
| Calendar looks cramped | Switch to Week View for a more compact display, or collapse the sidebar. |
| Charts not loading | Refresh the page. Ensure JavaScript is enabled in your browser. |

### Getting Help

For technical issues not covered here, contact:
- **IT Support**: Submit a ticket through the hospital IT helpdesk
- **System Admin**: Contact the VMMC OR Scheduling System administrator
- **Department of Anesthesia**: For urgent scheduling matters, call the Anesthesia department directly

---

*VMMC OR Core Booking & Scheduling System — Version 1.0*
*Veterans Memorial Medical Center*
