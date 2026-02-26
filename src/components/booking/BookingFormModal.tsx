import { useState, useEffect } from 'react';
import { format, parseISO, startOfDay, addDays, isAfter } from 'date-fns';
import { AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { Input, Textarea } from '../ui/FormFields';
import { CustomSelect } from '../ui/CustomSelect';
import { DatePicker } from '../ui/DatePicker';
import { TimePicker } from '../ui/TimePicker';
import { useBookingsStore } from '../../stores/appStore';
import { useAuthStore } from '../../stores/authStore';
import {
  DEPARTMENTS, PATIENT_CATEGORIES, ANES_DEPARTMENT_CONTACT,
  type DepartmentId
} from '../../lib/constants';
import { hasRoomConflict, hasAnesthesiologistConflict, timeRangesOverlap, formatTime } from '../../lib/utils';
import {
  auditBookingCreate,
  auditBookingUpdate,
  auditEmergencyInsert,
} from '../../lib/auditHelper';
import {
  notifyNewBookingRequest,
  notifyBookingConfirmation,
  notifyEmergencyInsertion,
  notifyBumpedCases,
} from '../../lib/notificationHelper';
import type { Booking, ORRoom } from '../../lib/types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  rooms: ORRoom[];
  bookings: Booking[];
}

const defaultForm = {
  or_room_id: '',
  date: format(new Date(), 'yyyy-MM-dd'),
  start_time: '08:00',
  end_time: '10:00',
  patient_name: '',
  patient_age: '',
  patient_sex: 'M' as 'M' | 'F',
  patient_category: '' as string,
  ward: '',
  procedure: '',
  surgeon: '',
  anesthesiologist: '',
  scrub_nurse: '',
  circulating_nurse: '',
  clearance_availability: true,
  special_equipment: '' as string,
  estimated_duration_minutes: '120',
  notes: '',
  is_emergency: false,
  emergency_reason: '',
};

export default function BookingFormModal({ isOpen, onClose, rooms, bookings }: Props) {
  const { user } = useAuthStore();
  const { editingBooking, selectedRoom, selectedDate, addBooking, updateBooking } = useBookingsStore();

  const isEditing = !!editingBooking;

  const [form, setForm] = useState(() => {
    if (editingBooking) {
      return {
        or_room_id: editingBooking.or_room_id || '',
        date: editingBooking.date || format(selectedDate, 'yyyy-MM-dd'),
        start_time: editingBooking.start_time || '08:00',
        end_time: editingBooking.end_time || '10:00',
        patient_name: editingBooking.patient_name || '',
        patient_age: String(editingBooking.patient_age || ''),
        patient_sex: (editingBooking.patient_sex || 'M') as 'M' | 'F',
        patient_category: (editingBooking.patient_category || '') as string,
        ward: editingBooking.ward || '',
        procedure: editingBooking.procedure || '',
        surgeon: editingBooking.surgeon || '',
        anesthesiologist: editingBooking.anesthesiologist || '',
        scrub_nurse: editingBooking.scrub_nurse || '',
        circulating_nurse: editingBooking.circulating_nurse || '',
        clearance_availability: editingBooking.clearance_availability ?? true,
        special_equipment: Array.isArray(editingBooking.special_equipment)
          ? editingBooking.special_equipment.join(', ')
          : (editingBooking.special_equipment || '') as string,
        estimated_duration_minutes: String(editingBooking.estimated_duration_minutes || '120'),
        notes: editingBooking.notes || '',
        is_emergency: editingBooking.is_emergency || false,
        emergency_reason: editingBooking.emergency_reason || '',
      };
    }
    return {
      ...defaultForm,
      or_room_id: selectedRoom || '',
      date: format(selectedDate, 'yyyy-MM-dd'),
    };
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showBumpConfirm, setShowBumpConfirm] = useState(false);

  // Reset form whenever the modal opens so room & date match the calendar selection
  useEffect(() => {
    if (!isOpen) return;
    if (editingBooking) {
      setForm({
        or_room_id: editingBooking.or_room_id || '',
        date: editingBooking.date || format(selectedDate, 'yyyy-MM-dd'),
        start_time: editingBooking.start_time || '08:00',
        end_time: editingBooking.end_time || '10:00',
        patient_name: editingBooking.patient_name || '',
        patient_age: String(editingBooking.patient_age || ''),
        patient_sex: (editingBooking.patient_sex || 'M') as 'M' | 'F',
        patient_category: (editingBooking.patient_category || '') as string,
        ward: editingBooking.ward || '',
        procedure: editingBooking.procedure || '',
        surgeon: editingBooking.surgeon || '',
        anesthesiologist: editingBooking.anesthesiologist || '',
        scrub_nurse: editingBooking.scrub_nurse || '',
        circulating_nurse: editingBooking.circulating_nurse || '',
        clearance_availability: editingBooking.clearance_availability ?? true,
        special_equipment: Array.isArray(editingBooking.special_equipment)
          ? editingBooking.special_equipment.join(', ')
          : (editingBooking.special_equipment || '') as string,
        estimated_duration_minutes: String(editingBooking.estimated_duration_minutes || '120'),
        notes: editingBooking.notes || '',
        is_emergency: editingBooking.is_emergency || false,
        emergency_reason: editingBooking.emergency_reason || '',
      });
    } else {
      setForm({
        ...defaultForm,
        or_room_id: selectedRoom || '',
        date: format(selectedDate, 'yyyy-MM-dd'),
      });
    }
    setErrors({});
    setShowBumpConfirm(false);
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  const isAdmin = user?.role === 'super_admin' || user?.role === 'anesthesiology_admin';
  const userDept = user?.department_id;

  // CP categories are the only ones where anesthesiologist is selected during booking
  const isCP = form.patient_category.startsWith('CP');

  // ── "To follow" cases that will be bumped by an emergency insertion ──
  const bumpedCases: Booking[] = (() => {
    if (!form.is_emergency || !form.or_room_id || !form.date || !form.start_time || !form.end_time) return [];
    return bookings.filter((b) => {
      if (b.or_room_id !== form.or_room_id) return false;
      if (b.date !== form.date) return false;
      if (['cancelled', 'denied', 'completed'].includes(b.status)) return false;
      // Bump cases whose time overlaps with the emergency OR that start at/after the emergency start
      return b.start_time >= form.start_time || timeRangesOverlap(form.start_time, form.end_time, b.start_time, b.end_time);
    }).sort((a, b) => a.start_time.localeCompare(b.start_time));
  })();

  // ── Elective booking restrictions (non-admin, non-emergency) ──
  const bookingRestriction = (() => {
    if (isAdmin || form.is_emergency || !form.date) return null;
    const selected = parseISO(form.date);
    const now = new Date();
    const today = startOfDay(now);
    const maxDate = addDays(today, 14);
    const selectedDay = startOfDay(selected);
    const dayOfWeek = selected.getDay();

    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return { type: 'weekend' as const, title: 'Weekend Booking Not Available', message: 'Elective cases are only available Monday through Friday. Please select a weekday or contact the Department of Anesthesiology for assistance.' };
    }
    if (selectedDay.getTime() === today.getTime() && now.getHours() >= 12) {
      return { type: 'noon' as const, title: 'Same-Day Booking Restricted (Past 12:00 PM)', message: 'Elective bookings for today cannot be submitted after 12:00 PM. Please contact the Department of Anesthesiology for urgent scheduling.' };
    }
    if (isAfter(selectedDay, maxDate)) {
      return { type: 'max_date' as const, title: 'Maximum Booking Range Exceeded', message: 'Elective bookings can only be made up to 2 weeks (14 days) in advance. Please select an earlier date.' };
    }
    return null;
  })();

  const updateField = <K extends keyof typeof form>(key: K, value: typeof form[K]) => {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      // Clear anesthesiologist when switching away from a CP category
      if (key === 'patient_category' && typeof value === 'string' && !value.startsWith('CP')) {
        next.anesthesiologist = '';
      }
      return next;
    });
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: '' }));
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!form.or_room_id) errs.or_room_id = 'Select an OR room';
    if (!form.date) errs.date = 'Select a date';
    if (!form.start_time) errs.start_time = 'Set start time';
    if (!form.end_time) errs.end_time = 'Set end time';
    if (!form.patient_name.trim()) errs.patient_name = 'Enter patient name';
    if (!form.patient_age) errs.patient_age = 'Enter age';
    if (!form.patient_category) errs.patient_category = 'Select category';
    if (!form.ward.trim()) errs.ward = 'Enter ward';
    if (!form.procedure.trim()) errs.procedure = 'Enter procedure';
    if (!form.surgeon.trim()) errs.surgeon = 'Enter surgeon';
    // Anesthesiologist is only required for CP cases (filled during booking)
    if (isCP && !form.anesthesiologist.trim()) errs.anesthesiologist = 'Enter anesthesiologist';
    if (form.is_emergency && !form.emergency_reason.trim()) errs.emergency_reason = 'Enter emergency reason';

    if (form.start_time >= form.end_time) {
      errs.end_time = 'End time must be after start time';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (bookingRestriction) return;
    if (!validate()) return;

    // ── Emergency: show bump confirmation if there are affected cases ──
    if (form.is_emergency && bumpedCases.length > 0 && !showBumpConfirm) {
      setShowBumpConfirm(true);
      return;
    }

    // ── Non-emergency: standard conflict detection ──
    if (!form.is_emergency) {
      const newBookingCheck = {
        or_room_id: form.or_room_id,
        date: form.date,
        start_time: form.start_time,
        end_time: form.end_time,
        anesthesiologist: form.anesthesiologist,
      };

      const roomConflict = hasRoomConflict(newBookingCheck, bookings);
      if (roomConflict) {
        toast.error(`Room conflict: ${roomConflict.procedure} is already booked at this time.`);
        return;
      }

      if (isCP) {
        const anesthConflict = hasAnesthesiologistConflict(newBookingCheck, bookings);
        if (anesthConflict) {
          toast.error(`Anesthesiologist conflict: Dr. is already assigned to ${anesthConflict.procedure}.`);
          return;
        }
      }
    }

    setIsSubmitting(true);

    // ── Bump off to-follow cases for emergency insertion ──
    if (form.is_emergency && bumpedCases.length > 0) {
      const now = new Date().toISOString();
      for (const bc of bumpedCases) {
        await updateBooking(bc.id, {
          status: 'rescheduled',
          notes: `${bc.notes ? bc.notes + ' | ' : ''}Bumped off by emergency case: ${form.patient_name} — ${form.procedure} (${form.emergency_reason})`,
          updated_at: now,
        });
      }
    }

    const newBooking: Omit<Booking, 'id' | 'created_at' | 'updated_at'> = {
      or_room_id: form.or_room_id,
      department_id: (isAdmin ? 'GS' : userDept || 'GS') as DepartmentId,
      date: form.date,
      start_time: form.start_time,
      end_time: form.end_time,
      patient_name: form.patient_name,
      patient_age: parseInt(form.patient_age),
      patient_sex: form.patient_sex,
      patient_category: form.patient_category as any,
      ward: form.ward,
      procedure: form.procedure,
      surgeon: form.surgeon,
      anesthesiologist: form.anesthesiologist,
      scrub_nurse: form.scrub_nurse,
      circulating_nurse: form.circulating_nurse,
      clearance_availability: form.clearance_availability,
      special_equipment: form.special_equipment
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      estimated_duration_minutes: parseInt(form.estimated_duration_minutes),
      status: form.is_emergency ? 'approved' : 'pending',
      is_emergency: form.is_emergency,
      emergency_reason: form.emergency_reason || undefined,
      notes: form.notes || undefined,
      created_by: user?.id || '',
    };

    if (isEditing && editingBooking) {
      await updateBooking(editingBooking.id, newBooking);
      toast.success('Booking updated successfully!');
      if (user) auditBookingUpdate(user.id, editingBooking.id, { status: editingBooking.status }, newBooking as Record<string, unknown>);
    } else {
      const created = await addBooking(newBooking as Booking);

      // ── Send notifications ──
      if (form.is_emergency) {
        // Notify all users about emergency insertion
        notifyEmergencyInsertion(created, user?.full_name || 'Admin');
        if (user) auditEmergencyInsert(user.id, created, bumpedCases.map(b => b.id));
        if (bumpedCases.length > 0) {
          // Notify bumped case creators
          notifyBumpedCases(bumpedCases, form.patient_name, form.procedure);
          toast.success(`Emergency case inserted! ${bumpedCases.length} to-follow case(s) bumped off.`);
        } else {
          toast.success('Emergency case inserted!');
        }
      } else {
        // Notify admins about the new request
        notifyNewBookingRequest(created);
        // Confirm to the creator
        notifyBookingConfirmation(created);
        if (user) auditBookingCreate(user.id, created);
        toast.success('Booking request submitted successfully!');
      }
    }
    setIsSubmitting(false);
    setShowBumpConfirm(false);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit OR Booking' : form.is_emergency ? '🚨 Emergency Case Insertion' : 'New OR Booking Request'}
      size="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Emergency toggle (admin only) */}
        {isAdmin && (
          <div className="flex items-center gap-3 p-3 rounded-[8px] bg-red-50 border border-red-100">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.is_emergency}
                onChange={(e) => updateField('is_emergency', e.target.checked)}
                className="w-4 h-4 rounded border-red-300 text-red-500 focus:ring-red-400"
              />
              <span className="text-sm font-medium text-red-700">Emergency Case</span>
            </label>
            <span className="text-xs text-red-500">Bypasses approval queue</span>
          </div>
        )}

        {form.is_emergency && (
          <>
            <Textarea
              label="Emergency Reason"
              value={form.emergency_reason}
              onChange={(e) => updateField('emergency_reason', e.target.value)}
              error={errors.emergency_reason}
              placeholder="Describe the emergency..."
              required
            />

            {/* Bump-off preview: cases that will be displaced */}
            {bumpedCases.length > 0 && (
              <div className="p-4 rounded-[10px] bg-amber-50 border border-amber-200 space-y-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <p className="text-sm font-bold text-amber-700">
                    {bumpedCases.length} To-Follow Case{bumpedCases.length > 1 ? 's' : ''} Will Be Bumped Off
                  </p>
                </div>
                <p className="text-xs text-amber-600">
                  The following bookings in this OR room will be marked as <span className="font-semibold">Rescheduled</span> to
                  accommodate the emergency case:
                </p>
                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {bumpedCases.map((bc) => (
                    <div
                      key={bc.id}
                      className="flex items-center justify-between px-3 py-2 rounded-[8px] bg-white border border-amber-100 text-xs"
                    >
                      <div>
                        <span className="font-semibold text-gray-800">{bc.patient_name}</span>
                        <span className="text-gray-400 mx-1.5">·</span>
                        <span className="text-gray-600">{bc.procedure}</span>
                      </div>
                      <span className="text-amber-700 font-medium shrink-0 ml-3">
                        {formatTime(bc.start_time)} – {formatTime(bc.end_time)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Bump confirmation overlay */}
            {showBumpConfirm && (
              <div className="p-4 rounded-[10px] bg-red-50 border-2 border-red-300 space-y-3">
                <p className="text-sm font-bold text-red-700">
                  ⚠️ Confirm Emergency Insertion
                </p>
                <p className="text-xs text-red-600">
                  This will insert the emergency case and bump off <span className="font-bold">{bumpedCases.length}</span> existing
                  booking{bumpedCases.length > 1 ? 's' : ''}. Affected departments will be notified. This action cannot be undone.
                </p>
                <div className="flex gap-2 justify-end">
                  <Button
                    variant="secondary"
                    size="sm"
                    type="button"
                    onClick={() => setShowBumpConfirm(false)}
                  >
                    Go Back
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    type="submit"
                    loading={isSubmitting}
                  >
                    Confirm &amp; Bump Off {bumpedCases.length} Case{bumpedCases.length > 1 ? 's' : ''}
                  </Button>
                </div>
              </div>
            )}
          </>
        )}

        {/* Row: Room & Date */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <CustomSelect
            label="OR Room"
            value={form.or_room_id}
            onChange={(val) => updateField('or_room_id', val)}
            options={rooms.map((r) => ({ value: r.id, label: r.name }))}
            placeholder="Select room"
            error={errors.or_room_id}
            required
          />
          <DatePicker
            label="Date"
            value={form.date}
            onChange={(val) => updateField('date', val)}
            error={errors.date}
            minDate={startOfDay(new Date())}
            required
          />
          <Input
            label="Estimated Duration (min)"
            type="number"
            value={form.estimated_duration_minutes}
            onChange={(e) => updateField('estimated_duration_minutes', e.target.value)}
            min="15"
            max="720"
          />
        </div>

        {/* Row: Time */}
        <div className="grid grid-cols-2 gap-4">
          <TimePicker
            label="Start Time"
            value={form.start_time}
            onChange={(val) => updateField('start_time', val)}
            error={errors.start_time}
            required
          />
          <TimePicker
            label="End Time"
            value={form.end_time}
            onChange={(val) => updateField('end_time', val)}
            error={errors.end_time}
            required
          />
        </div>

        {/* ── Booking restriction alert ── */}
        {bookingRestriction && (
          <div className="p-4 rounded-[10px] bg-red-50 border border-red-200 space-y-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
              <p className="text-sm font-bold text-red-700">{bookingRestriction.title}</p>
            </div>
            <p className="text-sm text-red-600">{bookingRestriction.message}</p>
            {(bookingRestriction.type === 'weekend' || bookingRestriction.type === 'noon') && (
              <div className="p-3 rounded-[8px] bg-white border border-red-100">
                <p className="text-sm font-semibold text-gray-800">📞 Contact {ANES_DEPARTMENT_CONTACT.name}</p>
              </div>
            )}
          </div>
        )}

        {/* Divider */}
        <div className="border-t border-gray-100 pt-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Patient Information</h3>
        </div>

        {/* Patient details */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input
            label="Patient's Name"
            value={form.patient_name}
            onChange={(e) => updateField('patient_name', e.target.value)}
            placeholder="Last Name, First Name MI"
            error={errors.patient_name}
            required
          />
          <Input
            label="Age"
            type="number"
            value={form.patient_age}
            onChange={(e) => updateField('patient_age', e.target.value)}
            min="0"
            max="150"
            error={errors.patient_age}
            required
          />
          <CustomSelect
            label="Sex"
            value={form.patient_sex}
            onChange={(val) => updateField('patient_sex', val as 'M' | 'F')}
            options={[{ value: 'M', label: 'Male' }, { value: 'F', label: 'Female' }]}
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <CustomSelect
            label="Category"
            value={form.patient_category}
            onChange={(val) => updateField('patient_category', val)}
            options={PATIENT_CATEGORIES.map((c) => ({ value: c, label: c }))}
            placeholder="Select category"
            error={errors.patient_category}
            required
          />
          <Input
            label="Ward"
            value={form.ward}
            onChange={(e) => updateField('ward', e.target.value)}
            placeholder="e.g., 3A, OB Ward"
            error={errors.ward}
            required
          />
        </div>

        {/* Procedure & Team */}
        <div className="border-t border-gray-100 pt-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Procedure & Surgical Team</h3>
        </div>

        <Input
          label="Procedure"
          value={form.procedure}
          onChange={(e) => updateField('procedure', e.target.value)}
          placeholder="Complete procedure name"
          error={errors.procedure}
          required
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Surgeon(s) (Consultant / Residents)"
            value={form.surgeon}
            onChange={(e) => updateField('surgeon', e.target.value)}
            placeholder="Dr. Name / Dr. Resident (R)"
            error={errors.surgeon}
            required
          />
          {isCP && (
            <Input
              label="Anesthesiologist"
              value={form.anesthesiologist}
              onChange={(e) => updateField('anesthesiologist', e.target.value)}
              placeholder="Dr. Name"
              error={errors.anesthesiologist}
              required
            />
          )}
        </div>
        {!isCP && form.patient_category && (
          <p className="text-xs text-amber-600 bg-amber-50 border border-amber-100 rounded-[8px] px-3 py-2">
            Anesthesiologist will be assigned by the Anesthesiology department after submission.
          </p>
        )}

        {/* Nursing Team */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Scrub Nurse"
            value={form.scrub_nurse}
            onChange={(e) => updateField('scrub_nurse', e.target.value)}
            placeholder="Nurse Name"
          />
          <Input
            label="CN/NA (Circulating Nurse / Nurse Aid)"
            value={form.circulating_nurse}
            onChange={(e) => updateField('circulating_nurse', e.target.value)}
            placeholder="Nurse Name"
          />
        </div>

        {/* Clearance & Equipment */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <CustomSelect
            label="Clearance Availability"
            value={form.clearance_availability ? 'yes' : 'no'}
            onChange={(val) => updateField('clearance_availability', val === 'yes')}
            options={[{ value: 'yes', label: 'Cleared' }, { value: 'no', label: 'Pending' }]}
          />
          <Input
            label="Special Equipment Needed"
            value={form.special_equipment}
            onChange={(e) => updateField('special_equipment', e.target.value)}
            placeholder="e.g., Lap, Tower, Microscope"
          />
        </div>

        <Textarea
          label="Additional Notes"
          value={form.notes}
          onChange={(e) => updateField('notes', e.target.value)}
          placeholder="Any additional information..."
        />

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
          <Button variant="secondary" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            loading={isSubmitting}
            disabled={!!bookingRestriction}
            variant={form.is_emergency ? 'danger' : 'primary'}
          >
            {isEditing ? 'Update Booking' : form.is_emergency ? 'Insert Emergency Case' : 'Submit Booking Request'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
