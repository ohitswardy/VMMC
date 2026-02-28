// ── Data Privacy Policy & User Agreement ──
// Bump PRIVACY_POLICY_VERSION whenever the policy text is updated.
// The modal will re-appear for users who have not yet acknowledged the new version.

export const PRIVACY_POLICY_VERSION = '1.0.0';

export const PRIVACY_POLICY_EFFECTIVE_DATE = 'February 28, 2026';

export const PRIVACY_POLICY_SECTIONS = [
  {
    title: 'Introduction',
    content:
      'The VMMC Operating Room Booking System ("the System") is committed to protecting the privacy and security of all personal data processed through this platform. This Data Privacy Policy and User Agreement outlines the types of information we collect, how it is used, who may access it, and the measures in place to safeguard it in compliance with Republic Act No. 10173 (Data Privacy Act of 2012) and its Implementing Rules and Regulations.',
  },
  {
    title: '1. Information We Collect',
    content:
      'The System collects and processes the following categories of data:\n\n' +
      '• Patient Information — name, age, sex, ward, patient category, procedure details, and other medical scheduling data necessary for operating room bookings.\n\n' +
      '• User Account Information — full name, email address, role, department affiliation, and authentication credentials of authorized hospital personnel.\n\n' +
      '• Operational Data — booking records, schedule changes, OR room statuses, audit logs, and system-generated notifications.\n\n' +
      '• Technical Data — browser type, IP address, session tokens, and activity timestamps for security and audit purposes.',
  },
  {
    title: '2. Purpose of Data Processing',
    content:
      'All personal data collected is processed solely for the following legitimate purposes:\n\n' +
      '• Scheduling and managing operating room bookings and resources.\n\n' +
      '• Facilitating communication between departments, nurses, anesthesiologists, and administrators.\n\n' +
      '• Generating reports and analytics to improve hospital operational efficiency.\n\n' +
      '• Maintaining audit trails for accountability, compliance, and quality assurance.\n\n' +
      '• Ensuring the security and integrity of the System.',
  },
  {
    title: '3. Data Access & Sharing',
    content:
      'Access to data within the System is role-based and restricted to authorized personnel only:\n\n' +
      '• System Administrators — full access for system management and user administration.\n\n' +
      '• Anesthesiology Administrators — access to booking management, scheduling, and reporting.\n\n' +
      '• Department Users — access limited to their own department\'s bookings and related data.\n\n' +
      '• OR Nurses — access to room statuses and live board information.\n\n' +
      'Personal data will not be shared with third parties unless required by law, court order, or lawful government request.',
  },
  {
    title: '4. Data Security Measures',
    content:
      'The System implements organizational and technical security measures to protect personal data from unauthorized access, disclosure, alteration, or destruction, including:\n\n' +
      '• Encrypted data transmission (HTTPS/TLS).\n\n' +
      '• Secure authentication with hashed passwords and session management.\n\n' +
      '• Role-based access control (RBAC) with row-level security.\n\n' +
      '• Comprehensive audit logging of all significant actions.\n\n' +
      '• Regular security reviews and system updates.',
  },
  {
    title: '5. Data Retention',
    content:
      'Personal and operational data will be retained only for as long as necessary to fulfill the purposes described in this policy or as required by applicable laws and regulations. Booking records and audit logs may be retained for the duration mandated by hospital record-keeping policies.',
  },
  {
    title: '6. User Rights',
    content:
      'In accordance with the Data Privacy Act of 2012, you have the right to:\n\n' +
      '• Be informed about how your personal data is being processed.\n\n' +
      '• Access your personal data held by the System.\n\n' +
      '• Request correction of inaccurate or incomplete data.\n\n' +
      '• Object to or suspend the processing of your data under certain conditions.\n\n' +
      '• Lodge a complaint with the National Privacy Commission (NPC) if you believe your data privacy rights have been violated.\n\n' +
      'To exercise any of these rights, please contact the System Administrator or your department head.',
  },
  {
    title: '7. User Agreement',
    content:
      'By using the VMMC OR Booking System, you acknowledge and agree to the following:\n\n' +
      '• You will use the System solely for its intended purpose of managing operating room schedules and related hospital operations.\n\n' +
      '• You will not share your login credentials with any unauthorized person.\n\n' +
      '• You will handle all patient and personnel data with the highest degree of confidentiality.\n\n' +
      '• You understand that all actions within the System are logged and subject to audit.\n\n' +
      '• You will comply with all applicable hospital policies and the Data Privacy Act of 2012.\n\n' +
      '• Misuse of the System or unauthorized disclosure of data may result in disciplinary action and/or legal liability.',
  },
  {
    title: '8. Policy Updates',
    content:
      'This policy may be updated from time to time to reflect changes in law, technology, or hospital operations. Users will be notified of significant changes through the System, and the updated policy will be presented upon login.',
  },
  {
    title: '9. Contact',
    content:
      'For questions, concerns, or requests regarding this Data Privacy Policy and User Agreement, please contact:\n\n' +
      'VMMC Data Privacy Officer\n' +
      'Veterans Memorial Medical Center\n' +
      'North Avenue, Diliman, Quezon City\n' +
      'Email: dpo@vmmc.gov.ph',
  },
] as const;

// ── Local storage helpers for version acknowledgment ──
const STORAGE_KEY = 'vmmc-privacy-policy-ack';

interface PrivacyAck {
  version: string;
  userId: string;
  timestamp: string;
}

/**
 * Check if the user has acknowledged the current policy version.
 */
export function hasAcknowledgedCurrentPolicy(userId: string): boolean {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    const ack: PrivacyAck = JSON.parse(raw);
    return ack.userId === userId && ack.version === PRIVACY_POLICY_VERSION;
  } catch {
    return false;
  }
}

/**
 * Record that the user acknowledged the current policy version.
 */
export function acknowledgePolicy(userId: string): void {
  const ack: PrivacyAck = {
    version: PRIVACY_POLICY_VERSION,
    userId,
    timestamp: new Date().toISOString(),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ack));
}

/**
 * Clear the acknowledgment so the modal re-appears on the next login.
 * Call this on logout.
 */
export function clearPrivacyAcknowledgment(): void {
  localStorage.removeItem(STORAGE_KEY);
}
