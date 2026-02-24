import { useState } from 'react';
import toast from 'react-hot-toast';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { Input, Select, Textarea } from '../ui/FormFields';
import { useAuthStore } from '../../stores/authStore';
import { DEPARTMENTS, CHANGE_REASONS, IM_SUBSPECIALTIES } from '../../lib/constants';
import { canModifyBooking, generateId } from '../../lib/utils';
import type { Booking } from '../../lib/types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  booking: Booking;
}

export default function ChangeScheduleModal({ isOpen, onClose, booking }: Props) {
  const { user } = useAuthStore();
  const canModify = canModifyBooking(booking);

  const [form, setForm] = useState({
    department_id: booking.department_id,
    im_subspecialty: '',
    im_subspecialty_other: '',
    new_date: booking.date,
    new_preferred_time: booking.start_time,
    patient_details: `${booking.patient_name} ${booking.patient_age}/${booking.patient_sex}/${booking.patient_category} Ward ${booking.ward}`,
    procedure: booking.procedure,
    preferred_anesthesiologist: booking.anesthesiologist,
    reason: '',
    reason_other: '',
    additional_info: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateField = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.reason) {
      toast.error('Please select a reason for the change.');
      return;
    }

    setIsSubmitting(true);
    await new Promise((r) => setTimeout(r, 600));

    toast.success('Change request submitted successfully!');
    setIsSubmitting(false);
    onClose();
  };

  if (!canModify) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Schedule Change" size="sm">
        <div className="text-center py-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-amber-50 flex items-center justify-center">
            <span className="text-3xl">⚠️</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Cannot Modify Schedule</h3>
          <p className="text-sm text-gray-500 mb-6">
            Changes can only be made at least 24 hours before the scheduled time.
          </p>
          <div className="p-4 bg-blue-50 rounded-[10px]">
            <p className="text-sm font-medium text-blue-800">
              Please contact the Department of Anesthesia
            </p>
            <p className="text-xs text-blue-600 mt-1">
              For urgent changes within 24 hours of the scheduled procedure
            </p>
          </div>
          <Button variant="secondary" className="mt-6" onClick={onClose}>
            Close
          </Button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Change in OR Schedule" size="xl">
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Department */}
        <Select
          label="Department"
          value={form.department_id}
          onChange={(e) => updateField('department_id', e.target.value)}
          options={DEPARTMENTS.map((d) => ({ value: d.id, label: d.name }))}
          required
        />

        {/* IM Subspecialty (conditional) */}
        {form.department_id === 'GI' || form.department_id === 'PULMO' || form.department_id === 'CARDIAC' ? (
          <div className="space-y-3">
            <Select
              label="For Department of IM, choose subspecialty"
              value={form.im_subspecialty}
              onChange={(e) => updateField('im_subspecialty', e.target.value)}
              options={IM_SUBSPECIALTIES.map((s) => ({ value: s, label: s }))}
              placeholder="Select subspecialty"
            />
            {form.im_subspecialty === 'Others' && (
              <Input
                label="Please Specify"
                value={form.im_subspecialty_other}
                onChange={(e) => updateField('im_subspecialty_other', e.target.value)}
                placeholder="Specify subspecialty"
              />
            )}
          </div>
        ) : null}

        {/* Date & Time */}
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="OR Date"
            type="date"
            value={form.new_date}
            onChange={(e) => updateField('new_date', e.target.value)}
            required
          />
          <Input
            label="Preferred Time"
            type="time"
            value={form.new_preferred_time}
            onChange={(e) => updateField('new_preferred_time', e.target.value)}
            required
          />
        </div>

        {/* Patient Details */}
        <Textarea
          label="Patient Details (Name LN, FN MI / Age / Sex / Category / Ward No.)"
          value={form.patient_details}
          onChange={(e) => updateField('patient_details', e.target.value)}
          required
        />

        {/* Procedure */}
        <Input
          label="Complete OR Procedure"
          value={form.procedure}
          onChange={(e) => updateField('procedure', e.target.value)}
          required
        />

        {/* Anesthesiologist preference */}
        <Input
          label="For CP, preferred Anesthesiologist"
          value={form.preferred_anesthesiologist}
          onChange={(e) => updateField('preferred_anesthesiologist', e.target.value)}
          placeholder="Dr. Name"
        />

        {/* Reason */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">Reason for Change in Scheduling *</label>
          <div className="space-y-2">
            {CHANGE_REASONS.map((reason) => (
              <label key={reason} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="reason"
                  value={reason}
                  checked={form.reason === reason}
                  onChange={(e) => updateField('reason', e.target.value)}
                  className="w-4 h-4 text-accent-600 focus:ring-accent-500 border-gray-300"
                />
                <span className="text-sm text-gray-700">{reason}</span>
              </label>
            ))}
          </div>
          {form.reason === 'Other' && (
            <Input
              label="Please specify"
              value={form.reason_other}
              onChange={(e) => updateField('reason_other', e.target.value)}
              placeholder="Describe reason..."
            />
          )}
        </div>

        {/* Additional info */}
        <Textarea
          label="Other Additional Information"
          value={form.additional_info}
          onChange={(e) => updateField('additional_info', e.target.value)}
          placeholder="Any other relevant information..."
        />

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
          <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={isSubmitting}>Submit Change Request</Button>
        </div>
      </form>
    </Modal>
  );
}
