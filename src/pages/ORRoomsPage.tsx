import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit2, Clock } from 'lucide-react';
import { MOCK_OR_ROOMS } from '../lib/mockData';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import { Input } from '../components/ui/FormFields';
import type { ORRoom } from '../lib/types';

export default function ORRoomsPage() {
  const [rooms] = useState(MOCK_OR_ROOMS.map(r => ({ ...r })));
  const [editingRoom, setEditingRoom] = useState<ORRoom | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({ name: '', designation: '', buffer_time_minutes: '30' });

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

  const handleSave = () => {
    // In real app, save to Supabase
    setIsModalOpen(false);
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">OR Rooms</h1>
          <p className="text-xs md:text-sm text-gray-500 mt-0.5">Configure and manage operating rooms</p>
        </div>
      </div>

      {/* Rooms Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {rooms.map((room, i) => (
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
              <div>
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Designation</p>
                <p className="text-sm text-gray-700 font-medium">{room.designation}</p>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <Clock className="w-3.5 h-3.5" />
                <span>Buffer: {room.buffer_time_minutes} minutes</span>
              </div>
              <div className="flex gap-2 pt-2">
                <Button variant="secondary" size="sm" icon={<Edit2 className="w-3.5 h-3.5" />} onClick={() => openEditModal(room)}>
                  Edit
                </Button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Add Button */}
      <Button className="w-full" icon={<Plus className="w-4 h-4" />} onClick={openAddModal}>
        Add OR Room
      </Button>

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
    </div>
  );
}
