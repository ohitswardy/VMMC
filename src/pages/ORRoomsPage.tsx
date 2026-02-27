import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Plus, Edit2, Clock, CalendarClock, UserCheck, Save, X, Trash2 } from 'lucide-react';
import { useORRoomsStore } from '../stores/appStore';
import { useAuthStore } from '../stores/authStore';
import { upsertNurseDuty, fetchNurseDutyForDate } from '../lib/supabaseService';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import { Input } from '../components/ui/FormFields';
import ORPriorityModal from '../components/booking/ORPriorityModal';
import PageHelpButton from '../components/ui/PageHelpButton';
import { OR_ROOMS_HELP } from '../lib/helpContent';
import type { ORRoom } from '../lib/types';
import { format } from 'date-fns';

interface NurseDuty { scrub: string; circ: string; }

export default function ORRoomsPage() {
  const { user } = useAuthStore();
  const { rooms, addRoom, updateRoom, deleteRoom } = useORRoomsStore();
  const [editingRoom, setEditingRoom] = useState<ORRoom | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPriorityOpen, setIsPriorityOpen] = useState(false);
  const [form, setForm] = useState({ name: '', designation: '', buffer_time_minutes: '30' });

  // Delete confirmation state
  const [deletingRoom, setDeletingRoom] = useState<ORRoom | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const today = format(new Date(), 'yyyy-MM-dd');

  // Nurse-on-duty assignments per room
  const [nurseDuty, setNurseDuty] = useState<Record<string, NurseDuty>>({});
  const [editingNurseRoom, setEditingNurseRoom] = useState<string | null>(null);
  const [nurseForm, setNurseForm] = useState<NurseDuty>({ scrub: '', circ: '' });

  const isAnesthAdmin = user?.role === 'anesthesiology_admin';
  const isAdmin = user?.role === 'super_admin' || isAnesthAdmin;
  const isNurse = user?.role === 'nurse';
  const canManageNurses = isAdmin || isNurse;

  // Load today's nurse duty assignments on mount
  useEffect(() => {
    fetchNurseDutyForDate(today).then((rows) => {
      const map: Record<string, NurseDuty> = {};
      for (const r of rows) {
        map[r.or_room_id] = { scrub: r.scrub_nurse, circ: r.circulating_nurse };
      }
      setNurseDuty(map);
    }).catch(console.error);
  }, [today]);

  const openAddModal = () => {
    setEditingRoom(null);
    setForm({ name: `OR ${rooms.length + 1}`, designation: '', buffer_time_minutes: '30' });
    setIsModalOpen(true);
  };

  const openEditModal = (room: ORRoom) => {
    setEditingRoom(room);
    setForm({ name: room.name, designation: room.designation, buffer_time_minutes: String(room.buffer_time_minutes) });
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    try {
      if (editingRoom) {
        await updateRoom(editingRoom.id, {
          name: form.name,
          designation: form.designation,
          buffer_time_minutes: parseInt(form.buffer_time_minutes),
        });
        toast.success('Room updated.');
      } else {
        await addRoom({
          number: rooms.length + 1,
          name: form.name,
          designation: form.designation,
          is_active: true,
          buffer_time_minutes: parseInt(form.buffer_time_minutes),
        });
        toast.success('Room added.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to save room.');
    }
    setIsModalOpen(false);
  };

  const startEditNurse = (roomId: string) => {
    const existing = nurseDuty[roomId] || { scrub: '', circ: '' };
    setNurseForm({ ...existing });
    setEditingNurseRoom(roomId);
  };

  const saveNurse = async (roomId: string) => {
    try {
      await upsertNurseDuty(roomId, today, nurseForm.scrub, nurseForm.circ, user?.id || '');
      setNurseDuty((prev) => ({ ...prev, [roomId]: { ...nurseForm } }));
      toast.success('Nurse duty saved.');
    } catch (err) {
      console.error(err);
      toast.error('Failed to save nurse duty.');
    }
    setEditingNurseRoom(null);
  };

  const cancelNurseEdit = () => setEditingNurseRoom(null);

  const handleDeleteConfirm = async () => {
    if (!deletingRoom) return;
    setIsDeleting(true);
    try {
      await deleteRoom(deletingRoom.id);
      toast.success(`${deletingRoom.name} deleted.`);
      setDeletingRoom(null);
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete room.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="flex items-start gap-3">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900">OR Rooms</h1>
            <p className="text-xs md:text-sm text-gray-500 mt-0.5">
              {isNurse ? 'Assign nurses on duty to each OR room' : 'Configure and manage operating rooms'}
            </p>
          </div>
          <PageHelpButton {...OR_ROOMS_HELP} />
        </div>
        {isAdmin && (
          <Button
            variant={isAnesthAdmin ? 'primary' : 'secondary'}
            size="sm"
            icon={<CalendarClock className="w-4 h-4" />}
            onClick={() => setIsPriorityOpen(true)}
          >
            Priority Schedule
          </Button>
        )}
      </div>

      {/* Rooms Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {rooms.map((room, i) => {
          const duty = nurseDuty[room.id] || { scrub: '', circ: '' };
          const isEditingThisRoom = editingNurseRoom === room.id;

          return (
            <motion.div
              key={room.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-white rounded-[10px] border border-gray-200 overflow-hidden"
            >
              <div className="px-4 md:px-5 py-3 md:py-4 bg-gray-50 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-gray-900">{room.name}</h3>
                  <div className={`px-2 py-0.5 rounded-[6px] text-[10px] font-semibold ${room.is_active ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-red-50 text-red-600 border border-red-100'}`}>
                    {room.is_active ? 'Active' : 'Inactive'}
                  </div>
                </div>
              </div>
              <div className="px-4 md:px-5 py-3 md:py-4 space-y-3">
                {/* Room info — hidden from pure nurse role */}
                {!isNurse && (
                  <>
                    <div>
                      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Designation</p>
                      <p className="text-sm text-gray-700 font-medium">{room.designation}</p>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Buffer: {room.buffer_time_minutes} minutes</span>
                    </div>
                  </>
                )}

                {/* Nurses on Duty section */}
                {canManageNurses && (
                  <div className="border-t border-gray-100 pt-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                        <UserCheck className="w-3 h-3" /> Nurses on Duty
                      </p>
                      {!isEditingThisRoom && (
                        <button
                          onClick={() => startEditNurse(room.id)}
                          className="text-[10px] font-medium text-accent-600 hover:text-accent-700 px-1.5 py-0.5 rounded hover:bg-accent-50 transition-colors"
                        >
                          {duty.scrub || duty.circ ? 'Edit' : '+ Assign'}
                        </button>
                      )}
                    </div>

                    {isEditingThisRoom ? (
                      <div className="space-y-2">
                        <Input
                          label="Scrub Nurse"
                          value={nurseForm.scrub}
                          onChange={(e) => setNurseForm((p) => ({ ...p, scrub: e.target.value }))}
                          placeholder="Nurse Name"
                        />
                        <Input
                          label="CN / NA"
                          value={nurseForm.circ}
                          onChange={(e) => setNurseForm((p) => ({ ...p, circ: e.target.value }))}
                          placeholder="Nurse Name"
                        />
                        <div className="flex gap-2 pt-1">
                          <Button
                            variant="primary" size="sm" type="button"
                            icon={<Save className="w-3 h-3" />}
                            onClick={() => saveNurse(room.id)}
                          >
                            Save
                          </Button>
                          <Button variant="ghost" size="sm" type="button" icon={<X className="w-3 h-3" />} onClick={cancelNurseEdit}>
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-400">Scrub</span>
                          <span className="text-gray-700 font-medium">{duty.scrub || <span className="text-gray-300 italic">Unassigned</span>}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-400">CN / NA</span>
                          <span className="text-gray-700 font-medium">{duty.circ || <span className="text-gray-300 italic">Unassigned</span>}</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Admin-only Edit Room button */}
                {isAdmin && !isEditingThisRoom && (
                  <div className="flex gap-2 pt-1">
                    <Button variant="secondary" size="sm" icon={<Edit2 className="w-3.5 h-3.5" />} onClick={() => openEditModal(room)}>
                      Edit
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      icon={<Trash2 className="w-3.5 h-3.5" />}
                      onClick={() => setDeletingRoom(room)}
                    >
                      Delete
                    </Button>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Add OR Room button — admin only */}
      {isAdmin && (
        <Button className="w-full" icon={<Plus className="w-4 h-4" />} onClick={openAddModal}>
          Add OR Room
        </Button>
      )}

      {/* Add/Edit Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingRoom ? 'Edit OR Room' : 'Add OR Room'} size="md">
        <div className="space-y-4">
          <Input
            label="Room Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <Input
            label="Designation"
            value={form.designation}
            onChange={(e) => setForm({ ...form, designation: e.target.value })}
            placeholder="e.g., General Surgery Priority"
            required
          />
          <Input
            label="Buffer Time (minutes)"
            type="number"
            value={form.buffer_time_minutes}
            onChange={(e) => setForm({ ...form, buffer_time_minutes: e.target.value })}
            min="0"
            max="120"
          />
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>{editingRoom ? 'Save Changes' : 'Add Room'}</Button>
          </div>
        </div>
      </Modal>

      {/* Priority Schedule Modal */}
      <ORPriorityModal
        isOpen={isPriorityOpen}
        onClose={() => setIsPriorityOpen(false)}
        readOnly={!isAnesthAdmin}
      />

      {/* Delete Confirmation Modal */}
      <Modal isOpen={!!deletingRoom} onClose={() => setDeletingRoom(null)} title="Delete OR Room" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-gray-700">
            Are you sure you want to delete <span className="font-semibold">{deletingRoom?.name}</span>?
            This action <span className="font-semibold text-red-600">cannot be undone</span> and will remove all associated data.
          </p>
          <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
            <Button variant="secondary" onClick={() => setDeletingRoom(null)}>Cancel</Button>
            <Button variant="danger" loading={isDeleting} onClick={handleDeleteConfirm}>
              Delete Room
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
