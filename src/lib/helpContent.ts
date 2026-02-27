import type { HelpStep } from '../components/ui/PageHelpButton';

/* ═══════════════════════════════════════════════
   Per-page help content — written in plain,
   non-technical language for all users.
   ═══════════════════════════════════════════════ */

export const DASHBOARD_HELP = {
  title: 'Dashboard Help',
  intro: 'This is your home screen. It gives you a quick summary of everything happening today — bookings, pending requests, and current OR activity.',
  steps: [
    { icon: '📊', title: 'Metric cards at the top', body: 'These boxes show how many cases are scheduled today, how many are waiting for approval, how many are currently ongoing, and how many are finished.' },
    { icon: '⏳', title: 'Pending Approval section', body: 'If you\'re an admin, you\'ll see a list of bookings waiting for your approval. The most recent one appears first. You can approve or deny each one directly from here.' },
    { icon: '📋', title: 'All Bookings table', body: 'Scroll down to see every booking in the system. You can search by patient name, procedure, or surgeon, and filter by status (Pending, Approved, etc.).' },
    { icon: '🕐', title: 'Timestamps', body: 'Each booking shows when it was submitted so you can tell who booked first.' },
  ] as HelpStep[],
};

export const BOOKINGS_HELP = {
  title: 'Bookings Help',
  intro: 'This page shows all the bookings for a specific day. You can browse day by day or, if you\'re an admin, view a full 2-week window to plan ahead.',
  steps: [
    { icon: '📅', title: 'Changing the date', body: 'Use the left and right arrows at the top to go to the previous or next day. You can also click the date label to open a calendar and jump to any date.' },
    { icon: '📆', title: '2-Week view (admin only)', body: 'Admins see a "Day / 2 Weeks" toggle. Switch to 2-Week view to see all bookings for the next 14 days, grouped by date — great for planning ahead.' },
    { icon: '🔍', title: 'Searching & filtering', body: 'Type a patient name, procedure, or surgeon in the search box. Use the dropdowns to filter by department or status.' },
    { icon: '🗂️', title: 'Booking cards', body: 'Each card shows the procedure, patient info, scheduled time, room, and department. Click any card to see full details.' },
    { icon: '✅', title: 'Approve or edit', body: 'If a booking is pending and you\'re an admin, you\'ll see an "Approve / Edit" label. Click the card to take action.' },
  ] as HelpStep[],
};

export const OR_CALENDAR_HELP = {
  title: 'OR Schedule Help',
  intro: 'This is the main scheduling calendar. It shows which operating rooms are booked and at what times, so everyone knows the plan for the day.',
  steps: [
    { icon: '🗓️', title: 'Viewing the schedule', body: 'Each column is an OR room. Colored blocks represent booked time slots. The color tells you which department the case belongs to.' },
    { icon: '➕', title: 'Creating a new booking', body: 'Click the "New Booking" button (or "Book" on mobile) to submit a request. Fill in the patient info, procedure, preferred time, and room.' },
    { icon: '🚨', title: 'Emergency cases', body: 'Admins can click "Emergency" to fast-track an urgent case directly onto the schedule.' },
    { icon: '🖨️', title: 'Printing the schedule', body: 'Click "Print PDF" to download today\'s OR schedule as a printable document you can post on the board.' },
    { icon: '🖱️', title: 'Clicking a booking', body: 'Click any colored block on the calendar to see the full details of that booking — patient, surgeon, nurses, anesthesiologist, and more.' },
  ] as HelpStep[],
};

export const OR_ROOMS_HELP = {
  title: 'OR Rooms Help',
  intro: 'This page lets you see all operating rooms and, if you\'re allowed, manage nurse assignments or room settings.',
  steps: [
    { icon: '🏥', title: 'Room cards', body: 'Each card is one operating room. It shows the room name, designation (what it\'s typically used for), and the nurses assigned today.' },
    { icon: '👩‍⚕️', title: 'Assigning nurses', body: 'If you\'re a nurse admin, click "Edit" on a room card to assign or change the scrub nurse and circulating nurse for that room.' },
    { icon: '⚙️', title: 'Room settings (admin)', body: 'Admins can add or remove rooms, change their names, or toggle rooms on and off.' },
    { icon: '📊', title: 'Priority Schedule', body: 'Click "Priority Schedule" to open the weekly priority assignment — which departments get first pick of which rooms on which days.' },
  ] as HelpStep[],
};

export const LIVE_BOARD_HELP = {
  title: 'Live Board Help',
  intro: 'This is the real-time board that shows what\'s happening in each OR right now. Think of it like a status monitor you\'d see in a hospital hallway.',
  steps: [
    { icon: '🟢', title: 'Status colors', body: 'Each room shows a colored status — Blue (Idle, no case), Amber (In Transit, patient moving to OR), Green (Ongoing, surgery in progress), Gray (Ended), Red (Deferred, postponed).' },
    { icon: '📺', title: 'Current case details', body: 'When a room is Ongoing or In Transit, you\'ll see the procedure name, patient, surgeon, and scheduled time.' },
    { icon: '📋', title: 'Today\'s queue', body: 'At the bottom of each room card is the list of cases planned for today, so you know what\'s coming up next.' },
    { icon: '🔄', title: 'Updating status (admin)', body: 'If you\'re an anesthesiology admin, you\'ll see buttons to change a room\'s status (Idle → In Transit → Ongoing → Ended). A confirmation popup will appear before the change is saved.' },
  ] as HelpStep[],
};

export const NOTIFICATIONS_HELP = {
  title: 'Notifications Help',
  intro: 'This page collects all your alerts — new booking requests, approvals, emergencies, and status changes — so you never miss anything important.',
  steps: [
    { icon: '🔔', title: 'Notification list', body: 'Each item shows what happened, when it happened, and who did it. Unread items are highlighted so they stand out.' },
    { icon: '🔍', title: 'Filtering', body: 'Use the dropdown to show only certain types — Requests, Approvals, Emergencies, or just Unread items.' },
    { icon: '✅', title: 'Marking as read', body: 'Click "Mark All Read" to clear all unread badges at once. You can also dismiss individual notifications with the X button.' },
  ] as HelpStep[],
};

export const AUDIT_LOGS_HELP = {
  title: 'Audit Trail Help',
  intro: 'This is a tamper-proof record of every important action taken in the system — who did what, when, and what changed. It can\'t be edited or deleted.',
  steps: [
    { icon: '📜', title: 'Log entries', body: 'Each row shows the action (e.g., "Booking approved"), the user who did it, and the exact date and time.' },
    { icon: '🔍', title: 'Searching', body: 'Type in the search box to look for a specific action, user, or detail.' },
    { icon: '🔒', title: 'Tamper-proof', body: 'The "Tamper-proof" badge means these records are permanent and reliable — useful for accountability and compliance.' },
  ] as HelpStep[],
};

export const REPORTS_HELP = {
  title: 'Reports Help',
  intro: 'This page shows charts and statistics about OR performance — how rooms are being used, case volumes, and department activity.',
  steps: [
    { icon: '📊', title: 'Metric cards', body: 'The top cards show key numbers at a glance — average utilization, total cases, cancellation rate, and emergency count.' },
    { icon: '📈', title: 'Charts', body: 'Scroll down to see visual charts — utilization over time, cases by department, and completion trends. These help leadership spot patterns quickly.' },
    { icon: '💡', title: 'What is utilization?', body: 'Utilization is the percentage of available OR time that was actually used for surgeries. Higher is generally better — it means rooms aren\'t sitting empty.' },
  ] as HelpStep[],
};

export const DOCUMENTS_HELP = {
  title: 'Documents Help',
  intro: 'Use this page to download printable OR schedule sheets for any date. Handy for posting on the wall or handing out in briefings.',
  steps: [
    { icon: '📅', title: 'Picking a date', body: 'Select the date you want using the date picker. The schedule for that day will appear below.' },
    { icon: '🖨️', title: 'Downloading', body: 'Click the download or print button to get a PDF of the schedule you can print out or share.' },
    { icon: '📄', title: 'What\'s included', body: 'The document lists each OR room, the cases booked, patient names, surgeons, and scheduled times — everything the team needs for the day.' },
  ] as HelpStep[],
};

export const SETTINGS_HELP = {
  title: 'Settings Help',
  intro: 'This page lets administrators configure how the system behaves — scheduling rules, buffer times, and other policies.',
  steps: [
    { icon: '⏱️', title: 'Buffer time', body: 'Buffer time is the gap between surgeries for cleaning and setup. Changing this affects how tightly cases can be scheduled back-to-back.' },
    { icon: '⚙️', title: 'Other settings', body: 'As the system grows, more configuration options will appear here — notification preferences, department rules, and more.' },
    { icon: '💾', title: 'Saving changes', body: 'After changing a setting, click "Save" to apply it. Changes take effect immediately for everyone in the system.' },
  ] as HelpStep[],
};

export const USERS_HELP = {
  title: 'Users Help',
  intro: 'This page shows all the accounts in the system. Admins can see who has access, what role they have, and which department they belong to.',
  steps: [
    { icon: '👤', title: 'User list', body: 'Each row (or card on mobile) shows the user\'s name, email, role, and department.' },
    { icon: '🏷️', title: 'Roles', body: 'Roles control what each person can do — "super_admin" can do everything, "anesthesiology_admin" manages the schedule, and department accounts can only manage their own bookings.' },
    { icon: '✅', title: 'Active / Inactive', body: 'A green badge means the account is active. Inactive accounts can\'t log in.' },
  ] as HelpStep[],
};
