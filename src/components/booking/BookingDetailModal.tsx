import { useState } from 'react';
import { parseISO, startOfDay, addDays } from 'date-fns';
import { motion } from 'framer-motion';
import { Clock, User, Stethoscope, Building2, FileText, AlertTriangle, Edit, Save, X, CheckCircle, XCircle, Pencil } from 'lucide-react';
import toast from 'react-hot-toast';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import StatusBadge from '../ui/StatusBadge';
import { Input, Textarea } from '../ui/FormFields';
import { CustomSelect } from '../ui/CustomSelect';
import { DatePicker } from '../ui/DatePicker';
import { TimePicker } from '../ui/TimePicker';
import { useAuthStore } from '../../stores/authStore';
import { useBookingsStore } from '../../stores/appStore';
import { ANES_DEPARTMENT_CONTACT } from '../../lib/constants';
import { getDeptColor, getDeptName, formatTime, canModifyBooking } from '../../lib/utils';
import type { Booking, ORRoom } from '../../lib/types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  booking: Booking;
  rooms?: ORRoom[];
}

export default function BookingDetailModal({ isOpen, onClose, booking, rooms = [] }: Props) {
  const { user } = useAuthStore();
  const { openChangeForm, updateBooking } = useBookingsStore();

  const isAdmin = user?.role === 'super_admin' || user?.role === 'anesthesiology_admin';
  const isAnesthAdmin = user?.role === 'anesthesiology_admin';

  // Anes admin: no restrictions on pending & future bookings
  const canAdminChange = isAdmin && !['completed', 'cancelled', 'denied'].includes(booking.status);

  // Noon block: non-admin can't change approved next-day bookings after 12 PM
  const _now = new Date();
  const _tomorrowStart = addDays(startOfDay(_now), 1);
  const noonBlocked = !isAdmin &&
    startOfDay(parseISO(booking.date)).getTime() === _tomorrowStart.getTime() &&
    _now.getHours() >= 12 && booking.status === 'approved';

  const canDeptChange = !isAdmin && user?.department_id === booking.department_id &&
    !['completed', 'cancelled', 'denied', 'ongoing'].includes(booking.status) && !noonBlocked;

  const canChange = canAdminChange || canDeptChange;
  const deptColor = getDeptColor(booking.department_id);

  // Assign anesthesiologist panel
  const isNonCPPending = booking.status === 'pending' && !booking.patient_category.startsWith('CP');
  const [anesthesiologist, setAnesthesiologist] = useState(booking.anesthesiologist || '');
  const [anesthSaving, setAnesthSaving] = useState(false);
  const [anesthSaved, setAnesthSaved] = useState(false);

  // Approve / Deny
  const [denyMode, setDenyMode] = useState(false);
  const [denyReason, setDenyReason] = useState('');
  const [actionLoading, setActionLoading] = useState<'approve' | 'deny' | null>(null);

  // Edit mode (anes admin)
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    date: booking.date,
    start_time: booking.start_time,
    end_time: booking.end_time,
    or_room_id: booking.or_room_id,
    anesthesiologist: booking.anesthesiologist || '',
    scrub_nurse: booking.scrub_nurse || '',
    circulating_nurse: booking.circulating_nurse || '',
    notes: booking.notes || '',
  });
  const [editSaving, setEditSaving] = useState(false);

  const handleSaveAnesthesiologist = async () => {
    if (!anesthesiologist.trim()) return;
    setAnesthSaving(true);
    await updateBooking(booking.id, { anesthesiologist: anesthesiologist.trim() });
    setAnesthSaving(false);
    setAnesthSaved(true);
    setTimeout(() => setAnesthSaved(false), 2000);
  };

  const handleApprove = async () => {
    setActionLoading('approve');
    await updateBooking(booking.id, { status: 'approved', approved_by: user?.id, updated_at: new Date().toISOString() });
    toast.success('Booking approved.');
    setActionLoading(null);
    onClose();
  };

  const handleDeny = async () => {
    if (!denyReason.trim()) { toast.error('Please enter a denial reason.'); return; }
    setActionLoading('deny');
    await updateBooking(booking.id, { status: 'denied', denial_reason: denyReason.trim(), updated_at: new Date().toISOString() });
    toast.success('Booking denied.');
    setActionLoading(null);
    onClose();
  };

  const handleSaveEdit = async () => {
    if (editForm.start_time >= editForm.end_time) {
      toast.error('End time must be after start time.');
      return;
    }
    setEditSaving(true);
    await updateBooking(booking.id, { ...editForm, updated_at: new Date().toISOString() });
    toast.success('Booking updated.');
    setEditSaving(false);
    setIsEditing(false);
  };

  const handleRequestChange = () => {
    onClose();
    openChangeForm(booking);
  };

  const createdLabel = `Created: ${new Date(booking.created_at).toLocaleString()}`;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Booking Details"
      titleExtra={<span className="font-medium text-gray-600">{createdLabel}</span>}
      size="lg"
    >
      <div className="space-y-5">
        {/* Status & Department header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-3 h-10 rounded-full" style={{ backgroundColor: deptColor }} />
            <div>
              <h3 className="text-lg font-bold text-gray-900">{booking.procedure}</h3>
              <p className="text-sm" style={{ color: deptColor }}>{getDeptName(booking.department_id)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={booking.status} />
            {isAnesthAdmin && !['completed', 'cancelled', 'denied', 'ongoing'].includes(booking.status) && (
              <button
                onClick={() => { setIsEditing((v) => !v); setDenyMode(false); }}
                className={`p-1.5 rounded-[7px] border transition-colors ${isEditing ? 'bg-accent-50 border-accent-200 text-accent-600' : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100'}`}
                title="Edit booking"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {booking.is_emergency && (
          <div className="flex items-center gap-2 p-3 rounded-[8px] bg-red-50 border border-red-100">
            <AlertTriangle className="w-4 h-4 text-red-500" />
            <span className="text-sm font-medium text-red-700">Emergency Case</span>
            {booking.emergency_reason && <span className="text-xs text-red-500">— {booking.emergency_reason}</span>}
          </div>
        )}

        {/* ── Edit Mode (anes admin) ── */}
        {isEditing ? (
          <div className="space-y-4 p-4 rounded-[10px] bg-accent-50 border border-accent-100">
            <p className="text-xs font-semibold text-accent-700 uppercase tracking-wide">Editing Booking</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <DatePicker label="Date" value={editForm.date} onChange={(v) => setEditForm((p) => ({ ...p, date: v }))} required />
              {rooms.length > 0 && (
                <CustomSelect
                  label="OR Room"
                  value={editForm.or_room_id}
                  onChange={(v) => setEditForm((p) => ({ ...p, or_room_id: v }))}
                  options={rooms.map((r) => ({ value: r.id, label: `${r.name} — ${r.designation}` }))}
                />
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <TimePicker label="Start Time" value={editForm.start_time} onChange={(v) => setEditForm((p) => ({ ...p, start_time: v }))} required />
              <TimePicker label="End Time" value={editForm.end_time} onChange={(v) => setEditForm((p) => ({ ...p, end_time: v }))} required />
            </div>
            <Input
              label="Anesthesiologist"
              value={editForm.anesthesiologist}
              onChange={(e) => setEditForm((p) => ({ ...p, anesthesiologist: e.target.value }))}
              placeholder="Dr. Name"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input label="Scrub Nurse" value={editForm.scrub_nurse} onChange={(e) => setEditForm((p) => ({ ...p, scrub_nurse: e.target.value }))} placeholder="Nurse Name" />
              <Input label="CN/NA" value={editForm.circulating_nurse} onChange={(e) => setEditForm((p) => ({ ...p, circulating_nurse: e.target.value }))} placeholder="Nurse Name" />
            </div>
            <Textarea label="Notes" value={editForm.notes} onChange={(e) => setEditForm((p) => ({ ...p, notes: e.target.value }))} placeholder="Additional notes..." />

            <div className="flex justify-end gap-2 pt-1">
              <Button variant="secondary" size="sm" type="button" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" type="button" loading={editSaving} icon={<Save className="w-3.5 h-3.5" />} onClick={handleSaveEdit}>
                Save Changes
              </Button>
            </div>
          </div>
        ) : (
          <>
            {/* Info grid */}
            <div className="grid grid-cols-2 gap-4">
              <InfoItem icon={<Clock className="w-4 h-4" />} label="Schedule" value={`${formatTime(booking.start_time)} – ${formatTime(booking.end_time)}`} />
              <InfoItem icon={<Building2 className="w-4 h-4" />} label="Date" value={booking.date} />
              <InfoItem icon={<User className="w-4 h-4" />} label="Patient" value={`${booking.patient_name} (${booking.patient_age}/${booking.patient_sex})`} />
              <InfoItem icon={<FileText className="w-4 h-4" />} label="Category" value={booking.patient_category} />
              <InfoItem icon={<Building2 className="w-4 h-4" />} label="Ward" value={booking.ward} />
              <InfoItem icon={<Stethoscope className="w-4 h-4" />} label="Surgeon" value={booking.surgeon} />
              <InfoItem icon={<Stethoscope className="w-4 h-4" />} label="Anesthesiologist" value={booking.anesthesiologist || '—  To be assigned'} />
              <InfoItem icon={<Clock className="w-4 h-4" />} label="Est. Duration" value={`${booking.estimated_duration_minutes} min`} />
              {booking.actual_duration_minutes && (
                <InfoItem icon={<Clock className="w-4 h-4" />} label="Actual Duration" value={`${booking.actual_duration_minutes} min`} />
              )}
              <InfoItem icon={<FileText className="w-4 h-4" />} label="Clearance" value={booking.clearance_availability ? 'Available' : 'Not Available'} />
            </div>

            {/* Assign anesthesiologist panel (non-CP pending) */}
            {isAnesthAdmin && isNonCPPending && (
              <div className="p-3 rounded-[10px] bg-blue-50 border border-blue-100 space-y-2">
                <p className="text-xs font-semibold text-blue-700">Assign Anesthesiologist</p>
                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <Input label="" value={anesthesiologist} onChange={(e) => { setAnesthesiologist(e.target.value); setAnesthSaved(false); }} placeholder="Dr. Name" />
                  </div>
                  <Button variant="primary" size="sm" icon={<Save className="w-3.5 h-3.5" />} loading={anesthSaving} onClick={handleSaveAnesthesiologist} type="button">
                    {anesthSaved ? 'Saved!' : 'Save'}
                  </Button>
                </div>
              </div>
            )}

            {booking.special_equipment.length > 0 && (
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1.5">Special Equipment</p>
                <div className="flex flex-wrap gap-1.5">
                  {booking.special_equipment.map((eq) => (
                    <span key={eq} className="px-2 py-1 rounded-[6px] bg-gray-100 text-xs text-gray-600">{eq}</span>
                  ))}
                </div>
              </div>
            )}

            {booking.notes && (
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">Notes</p>
                <p className="text-sm text-gray-700">{booking.notes}</p>
              </div>
            )}

            {booking.denial_reason && (
              <div className="p-3 rounded-[8px] bg-red-50 border border-red-100">
                <p className="text-xs font-semibold text-red-600 mb-0.5">Denial Reason</p>
                <p className="text-sm text-red-700">{booking.denial_reason}</p>
              </div>
            )}
          </>
        )}

        {/* ── Noon block: contact anes department ── */}
        {noonBlocked && (
          <div className="p-4 rounded-[10px] bg-amber-50 border border-amber-200 space-y-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <p className="text-sm font-semibold text-amber-700">Changes no longer available</p>
            </div>
            <p className="text-xs text-amber-600">
              The 12:00 PM cutoff for next-day booking changes has passed. Please contact the Department of Anesthesiology for any modifications.
            </p>
            <div className="p-3 rounded-[8px] bg-white border border-amber-100">
              <p className="text-sm font-semibold text-gray-800">📞 Contact {ANES_DEPARTMENT_CONTACT.name}</p>
              <p className="text-xs text-gray-600 mt-1">{ANES_DEPARTMENT_CONTACT.phone}</p>
              <p className="text-xs text-gray-600">✉️ {ANES_DEPARTMENT_CONTACT.email}</p>
            </div>
          </div>
        )}

        {/* Deny reason input */}
        {denyMode && !isEditing && (
          <div className="p-3 rounded-[10px] bg-red-50 border border-red-100 space-y-2">
            <p className="text-xs font-semibold text-red-700">Reason for Denial</p>
            <Textarea
              label=""
              value={denyReason}
              onChange={(e) => setDenyReason(e.target.value)}
              placeholder="Enter reason for denying this booking..."
              required
            />
            <div className="flex justify-end gap-2">
              <Button variant="secondary" size="sm" type="button" onClick={() => { setDenyMode(false); setDenyReason(''); }}>
                Cancel
              </Button>
              <Button variant="danger" size="sm" type="button" loading={actionLoading === 'deny'} onClick={handleDeny}>
                Confirm Deny
              </Button>
            </div>
          </div>
        )}

        {/* Actions */}
        {!isEditing && (
          <div className="flex justify-end items-center pt-4 border-t border-gray-100">
            <div className="flex gap-2 flex-wrap justify-end">
              {isAdmin && booking.status === 'pending' && !denyMode && (
                <>
                  <Button variant="accent" size="sm" type="button" loading={actionLoading === 'approve'} icon={<CheckCircle className="w-3.5 h-3.5" />} onClick={handleApprove}>
                    Approve
                  </Button>
                  <Button variant="danger" size="sm" type="button" icon={<XCircle className="w-3.5 h-3.5" />} onClick={() => setDenyMode(true)}>
                    Deny
                  </Button>
                </>
              )}
              {canChange && !denyMode && (
                <Button variant="secondary" size="sm" type="button" icon={<Edit className="w-3.5 h-3.5" />} onClick={handleRequestChange}>
                  Request Change
                </Button>
              )}
              {!denyMode && <Button variant="ghost" size="sm" type="button" onClick={onClose}>Close</Button>}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}

function InfoItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2.5 p-2.5 rounded-[8px] bg-gray-50">
      <div className="text-gray-400 mt-0.5">{icon}</div>
      <div>
        <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wide">{label}</p>
        <p className="text-sm font-medium text-gray-700">{value}</p>
      </div>
    </div>
  );
}
