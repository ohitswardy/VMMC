# Amber UX — Changelog

> Branch: `Amber-UX`
> Date: February 25, 2026
> Summary: UntitledUI-inspired design overhaul — mobile-first, cleaner components, modernized metrics and calendar.

---

## 🧩 New Components

### `CustomSelect` — `src/components/ui/CustomSelect.tsx`
- Fully custom dropdown select replacing native `<select>` elements
- UntitledUI-style: rounded-xl, subtle shadow, smooth open/close animation (Framer Motion)
- Keyboard navigation (arrow keys, Enter, Escape)
- Click-outside-to-close, highlighted + selected states
- Dropdown auto-sizes to content width (`w-max`) and anchors right to prevent overflow
- Integrated across **14 locations** app-wide

### `DatePicker` — `src/components/ui/DatePicker.tsx`
- Custom date picker with calendar popup
- Clean minimal design with month/year navigation
- Integrated across **5 locations** (Audit Logs, Booking Forms, etc.)

### `TimePicker` — `src/components/ui/TimePicker.tsx`
- Custom time picker for booking start/end times
- Scroll-based hour/minute selection
- Integrated in **3 locations** (BookingFormModal, ChangeScheduleModal)

---

## 📊 Dashboard Page — `src/pages/DashboardPage.tsx`

### Metric Cards (UntitledUI Chart 03 Style)
- Redesigned all 4 stat cards with:
  - **Label + icon** (top row, no background container)
  - **Large bold value** (2xl/3xl)
  - **Trend badge** with arrow icon and contextual label
  - **Mini sparkline chart** at the bottom of each card
- Per-card customization:
  | Card | Chart Type | Color | Trend |
  |------|-----------|-------|-------|
  | Today's Cases | BarChart (indigo) | `#6366f1` | +8% vs yesterday |
  | Pending | AreaChart (amber) | `#f59e0b` | +2 new today |
  | Ongoing | AreaChart (emerald) | `#10b981` | 1 active now |
  | Completed | AreaChart (blue) | `#3b82f6` | +15% vs last week |
- All icons use `text-teal-900` (VMMC branding)

### Search & Filter Bar
- Search icon overlap fixed with inline `paddingLeft` override
- Status dropdown given `min-w-[120px]` for proper display
- Stacked on mobile, inline on desktop

---

## 📈 Reports Page — `src/pages/ReportsPage.tsx`

### Metric Cards (UntitledUI Chart 03 Style)
- Same redesign pattern as Dashboard — 4 cards with sparklines and trends:
  | Card | Icon | Chart Type | Color |
  |------|------|-----------|-------|
  | Avg Utilization | `ChartLine` | AreaChart | Indigo `#6366f1` |
  | Total Cases | `BriefcaseMedical` | BarChart | Blue `#3b82f6` |
  | Cancellation | `Ban` | AreaChart | Amber `#f59e0b` |
  | Emergency | `Siren` | LineChart (step) | Red `#ef4444` |
- Icons: `text-teal-900`, no background containers, `w-5 h-5`

### Chart Fixes (Mobile)
- **By Department donut**: Reduced radius (50/85), chart shifted up (`cy="45%"`), taller container (280px), compact legend text
- **Status Distribution pie**: Reduced radius (80), replaced default labels with inline value-only labels (`labelLine={false}`), compact legend

---

## 📅 OR Calendar Page — `src/pages/ORCalendarPage.tsx`

### Full Rewrite — UntitledUI-Inspired Calendar
- Three view modes: **Day** (default) / **Week** / **Month**
- **Month View**: 7-column grid, animated date selection circle (`layoutId`), booking dots on mobile, event chips on desktop, selected-day booking panel below
- **Week View**: Stacked mobile cards + 7-column desktop grid
- **Day View**: Mobile single-room timeline with room tab selector + desktop multi-room time grid
- Default view changed from Month → **Day**

---

## 🏥 OR Rooms Page — `src/pages/ORRoomsPage.tsx`

- "Add OR Room" button moved from header to **full-width button below the grid**

---

## 👥 Users Page — `src/pages/UsersPage.tsx`

- "Add User" button moved from header to **full-width button below the users list**

---

## 🔍 Audit Logs Page — `src/pages/AuditLogsPage.tsx`

### Search & Filter Bar Fix
- Search icon overlap fixed (`pointer-events-none z-10`, inline `paddingLeft: 2.25rem`)
- Filter buttons changed from `overflow-x-auto` to `flex-wrap` for proper mobile display

---

## 📋 Bookings Page — `src/pages/BookingsPage.tsx`

### Search & Filter Bar Fix
- Same fix pattern as Audit Logs — inline padding for search icon, `flex-wrap` for dropdowns

---

## 📱 Mobile Navigation — `src/components/layout/Sidebar.tsx`

- Bottom nav icons: no labels, larger `w-7 h-7` icons
- Sliding spring indicator animation for active tab
- **Elderly-friendly contrast**: Inactive icons darkened from `text-gray-400` → `text-gray-600`
- Inactive stroke width increased from `1.5` → `1.8` for better visibility
- Menu (hamburger) icon matches the same darker style

---

## 🔧 Global — `src/components/ui/CustomSelect.tsx`

### Dropdown Overflow Fix
- Dropdown panel changed from `w-full` to `min-w-full w-max right-0`
- Prevents truncated option text (e.g., "Pe...", "Ap...") when trigger is narrow
- Options now display full text regardless of trigger button width

---

## 📦 Dependencies Added

- `react-aria-components` — installed (unused, custom components built instead)
- `@internationalized/date` — installed (unused)

---

## Files Modified

| File | Change |
|------|--------|
| `src/pages/DashboardPage.tsx` | Metric cards + search bar redesign |
| `src/pages/ReportsPage.tsx` | Metric cards + chart fixes |
| `src/pages/ORCalendarPage.tsx` | Full calendar rewrite |
| `src/pages/ORRoomsPage.tsx` | Add button moved to bottom |
| `src/pages/UsersPage.tsx` | Add button moved to bottom |
| `src/pages/AuditLogsPage.tsx` | Filter bar fix |
| `src/pages/BookingsPage.tsx` | Filter bar fix |
| `src/pages/DocumentsPage.tsx` | CustomSelect integration |
| `src/pages/NotificationsPage.tsx` | CustomSelect integration |
| `src/components/layout/Sidebar.tsx` | Mobile nav polish |
| `src/components/booking/BookingFormModal.tsx` | DatePicker/TimePicker/CustomSelect |
| `src/components/booking/ChangeScheduleModal.tsx` | DatePicker/TimePicker/CustomSelect |
| `src/components/ui/CustomSelect.tsx` | **New** — custom dropdown select |
| `src/components/ui/DatePicker.tsx` | **New** — custom date picker |
| `src/components/ui/TimePicker.tsx` | **New** — custom time picker |
| `package.json` | New dependencies |
