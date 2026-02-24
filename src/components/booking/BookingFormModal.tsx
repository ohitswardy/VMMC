import { useState } from 'react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { Input, Select, Textarea, CheckboxGroup } from '../ui/FormFields';
import { useBookingsStore } from '../../stores/appStore';
import { useAuthStore } from '../../stores/authStore';
import {
  DEPARTMENTS, PATIENT_CATEGORIES, SPECIAL_EQUIPMENT,
  type DepartmentId
} from '../../lib/constants';
import { hasRoomConflict, hasAnesthesiologistConflict, generateId } from '../../lib/utils';
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
  clearance_availability: true,
  special_equipment: [] as string[],
  estimated_duration_minutes: '120',
  notes: '',
  is_emergency: false,
  emergency_reason: '',
};

export default function BookingFormModal({ isOpen, onClose, rooms, bookings }: Props) {
  const { user } = useAuthStore();
  const { editingBooking, selectedRoom, selectedDate, addBooking } = useBookingsStore();

  const [form, setForm] = useState(() => ({
    ...defaultForm,
    or_room_id: selectedRoom || '',
    date: format(selectedDate, 'yyyy-MM-dd'),
  }));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isAdmin = user?.role === 'super_admin' || user?.role === 'anesthesiology_admin';
  const userDept = user?.department_id;

  const updateField = <K extends keyof typeof form>(key: K, value: typeof form[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
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
    if (!form.anesthesiologist.trim()) errs.anesthesiologist = 'Enter anesthesiologist';
    if (form.is_emergency && !form.emergency_reason.trim()) errs.emergency_reason = 'Enter emergency reason';

    if (form.start_time >= form.end_time) {
      errs.end_time = 'End time must be after start time';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    // Conflict detection
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

    const anesthConflict = hasAnesthesiologistConflict(newBookingCheck, bookings);
    if (anesthConflict) {
      toast.error(`Anesthesiologist conflict: Dr. is already assigned to ${anesthConflict.procedure}.`);
      return;
    }

    setIsSubmitting(true);
    await new Promise((r) => setTimeout(r, 600));

    const newBooking: Booking = {
      id: generateId(),
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
      clearance_availability: form.clearance_availability,
      special_equipment: form.special_equipment,
      estimated_duration_minutes: parseInt(form.estimated_duration_minutes),
      status: form.is_emergency ? 'approved' : 'pending',
      is_emergency: form.is_emergency,
      emergency_reason: form.emergency_reason || undefined,
      notes: form.notes || undefined,
      created_by: user?.id || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    addBooking(newBooking);
    toast.success(form.is_emergency ? 'Emergency case inserted!' : 'Booking request submitted successfully!');
    setIsSubmitting(false);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={form.is_emergency ? '🚨 Emergency Case Insertion' : 'New OR Booking Request'}
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
          <Textarea
            label="Emergency Reason"
            value={form.emergency_reason}
            onChange={(e) => updateField('emergency_reason', e.target.value)}
            error={errors.emergency_reason}
            placeholder="Describe the emergency..."
            required
          />
        )}

        {/* Row: Room & Date */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Select
            label="OR Room"
            value={form.or_room_id}
            onChange={(e) => updateField('or_room_id', e.target.value)}
            options={rooms.map((r) => ({ value: r.id, label: `${r.name} — ${r.designation}` }))}
            placeholder="Select room"
            error={errors.or_room_id}
            required
          />
          <Input
            label="Date"
            type="date"
            value={form.date}
            onChange={(e) => updateField('date', e.target.value)}
            error={errors.date}
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
          <Input
            label="Start Time"
            type="time"
            value={form.start_time}
            onChange={(e) => updateField('start_time', e.target.value)}
            error={errors.start_time}
            required
          />
          <Input
            label="End Time"
            type="time"
            value={form.end_time}
            onChange={(e) => updateField('end_time', e.target.value)}
            error={errors.end_time}
            required
          />
        </div>

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
          <Select
            label="Sex"
            value={form.patient_sex}
            onChange={(e) => updateField('patient_sex', e.target.value as 'M' | 'F')}
            options={[{ value: 'M', label: 'Male' }, { value: 'F', label: 'Female' }]}
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Category"
            value={form.patient_category}
            onChange={(e) => updateField('patient_category', e.target.value)}
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
          <Input
            label="Anesthesiologist"
            value={form.anesthesiologist}
            onChange={(e) => updateField('anesthesiologist', e.target.value)}
            placeholder="Dr. Name"
            error={errors.anesthesiologist}
            required
          />
        </div>

        {/* Clearance & Equipment */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Clearance Availability"
            value={form.clearance_availability ? 'yes' : 'no'}
            onChange={(e) => updateField('clearance_availability', e.target.value === 'yes')}
            options={[{ value: 'yes', label: 'Available' }, { value: 'no', label: 'Not Available' }]}
          />
          <CheckboxGroup
            label="Special Equipment Needed"
            options={[...SPECIAL_EQUIPMENT]}
            value={form.special_equipment}
            onChange={(v) => updateField('special_equipment', v)}
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
            variant={form.is_emergency ? 'danger' : 'primary'}
          >
            {form.is_emergency ? 'Insert Emergency Case' : 'Submit Booking Request'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
