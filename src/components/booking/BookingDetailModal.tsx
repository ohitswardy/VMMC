import { motion } from 'framer-motion';
import { Clock, User, Stethoscope, Building2, FileText, AlertTriangle, Edit, X } from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import StatusBadge from '../ui/StatusBadge';
import { useAuthStore } from '../../stores/authStore';
import { useBookingsStore } from '../../stores/appStore';
import { getDeptColor, getDeptName, formatTime, canModifyBooking } from '../../lib/utils';
import type { Booking } from '../../lib/types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  booking: Booking;
}

export default function BookingDetailModal({ isOpen, onClose, booking }: Props) {
  const { user } = useAuthStore();
  const { openChangeForm } = useBookingsStore();

  const isAdmin = user?.role === 'super_admin' || user?.role === 'anesthesiology_admin';
  const canChange = (user?.department_id === booking.department_id || isAdmin) &&
    !['completed', 'cancelled', 'denied', 'ongoing'].includes(booking.status);
  const deptColor = getDeptColor(booking.department_id);

  const handleRequestChange = () => {
    onClose();
    openChangeForm(booking);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Booking Details" size="lg">
      <div className="space-y-5">
        {/* Status & Department header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-3 h-10 rounded-full"
              style={{ backgroundColor: deptColor }}
            />
            <div>
              <h3 className="text-lg font-bold text-gray-900">{booking.procedure}</h3>
              <p className="text-sm" style={{ color: deptColor }}>
                {getDeptName(booking.department_id)}
              </p>
            </div>
          </div>
          <StatusBadge status={booking.status} />
        </div>

        {booking.is_emergency && (
          <div className="flex items-center gap-2 p-3 rounded-[8px] bg-red-50 border border-red-100">
            <AlertTriangle className="w-4 h-4 text-red-500" />
            <span className="text-sm font-medium text-red-700">Emergency Case</span>
            {booking.emergency_reason && (
              <span className="text-xs text-red-500">— {booking.emergency_reason}</span>
            )}
          </div>
        )}

        {/* Info grid */}
        <div className="grid grid-cols-2 gap-4">
          <InfoItem icon={<Clock className="w-4 h-4" />} label="Schedule" value={`${formatTime(booking.start_time)} – ${formatTime(booking.end_time)}`} />
          <InfoItem icon={<Building2 className="w-4 h-4" />} label="Date" value={booking.date} />
          <InfoItem icon={<User className="w-4 h-4" />} label="Patient" value={`${booking.patient_name} (${booking.patient_age}/${booking.patient_sex})`} />
          <InfoItem icon={<FileText className="w-4 h-4" />} label="Category" value={booking.patient_category} />
          <InfoItem icon={<Building2 className="w-4 h-4" />} label="Ward" value={booking.ward} />
          <InfoItem icon={<Stethoscope className="w-4 h-4" />} label="Surgeon" value={booking.surgeon} />
          <InfoItem icon={<Stethoscope className="w-4 h-4" />} label="Anesthesiologist" value={booking.anesthesiologist} />
          <InfoItem icon={<Clock className="w-4 h-4" />} label="Est. Duration" value={`${booking.estimated_duration_minutes} min`} />
          {booking.actual_duration_minutes && (
            <InfoItem icon={<Clock className="w-4 h-4" />} label="Actual Duration" value={`${booking.actual_duration_minutes} min`} />
          )}
          <InfoItem
            icon={<FileText className="w-4 h-4" />}
            label="Clearance"
            value={booking.clearance_availability ? 'Available' : 'Not Available'}
          />
        </div>

        {booking.special_equipment.length > 0 && (
          <div>
            <p className="text-xs font-medium text-gray-500 mb-1.5">Special Equipment</p>
            <div className="flex flex-wrap gap-1.5">
              {booking.special_equipment.map((eq) => (
                <span key={eq} className="px-2 py-1 rounded-[6px] bg-gray-100 text-xs text-gray-600">
                  {eq}
                </span>
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

        {/* Actions */}
        <div className="flex justify-between items-center pt-4 border-t border-gray-100">
          <div className="text-[10px] text-gray-400">
            Created: {new Date(booking.created_at).toLocaleString()}
          </div>
          <div className="flex gap-2">
            {/* Admin approve/deny */}
            {isAdmin && booking.status === 'pending' && (
              <>
                <Button variant="accent" size="sm" onClick={() => { /* approve logic */ }}>
                  Approve
                </Button>
                <Button variant="danger" size="sm" onClick={() => { /* deny logic */ }}>
                  Deny
                </Button>
              </>
            )}
            {canChange && (
              <Button
                variant="secondary"
                size="sm"
                icon={<Edit className="w-3.5 h-3.5" />}
                onClick={handleRequestChange}
              >
                Request Change
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={onClose}>Close</Button>
          </div>
        </div>
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
