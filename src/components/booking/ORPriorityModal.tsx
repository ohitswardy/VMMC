import { useState, useMemo } from 'react';
import { Save, X, Pencil } from 'lucide-react';
import toast from 'react-hot-toast';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { DEPARTMENTS, WEEKDAYS } from '../../lib/constants';
import { useORPriorityScheduleStore } from '../../stores/appStore';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  readOnly?: boolean;
}

// Departments that appear in the OR schedule (matching the reference image)
const SCHEDULE_DEPTS = [
  'GS', 'URO', 'ORTHO', 'TCVS', 'NEURO', 'PLASTICS',
  'PEDIA', 'OBGYNE', 'OPHTHA', 'ENT',
] as const;

function getDeptName(id: string) {
  return DEPARTMENTS.find((d) => d.id === id)?.name || id;
}

function getDeptColor(id: string) {
  return DEPARTMENTS.find((d) => d.id === id)?.color || '#6b7280';
}

function getDeptBg(id: string) {
  return DEPARTMENTS.find((d) => d.id === id)?.bg || '#f3f4f6';
}

export default function ORPriorityModal({ isOpen, onClose, readOnly = false }: Props) {
  const { schedule, setCell, clearCell } = useORPriorityScheduleStore();

  // Which cell is being edited: `${deptId}-${day}`
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const startEdit = (key: string) => {
    if (readOnly) return;
    setEditingKey(key);
    setEditValue(schedule[key] || '');
  };

  const saveEdit = () => {
    if (!editingKey) return;
    const trimmed = editValue.trim();
    if (trimmed) {
      setCell(editingKey, trimmed);
    } else {
      clearCell(editingKey);
    }
    setEditingKey(null);
    setEditValue('');
  };

  const cancelEdit = () => {
    setEditingKey(null);
    setEditValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') saveEdit();
    if (e.key === 'Escape') cancelEdit();
  };

  const handleSaveAll = () => {
    toast.success('Priority schedule saved.');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="OR Priority Schedule"
      size="xl"
    >
      <div className="space-y-4">
        <p className="text-xs text-gray-500">
          {readOnly
            ? 'View the weekly department priority assignments per OR schedule.'
            : 'Click any cell to assign or edit department priority for that day. Empty cells mean no priority assigned.'}
        </p>

        {/* Schedule Table */}
        <div className="overflow-x-auto -mx-1">
          <table className="w-full border-collapse text-[12px]">
            <thead>
              <tr>
                <th className="sticky left-0 z-10 bg-gray-50 px-3 py-2.5 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-200 min-w-[120px]">
                  Department
                </th>
                {WEEKDAYS.map((day) => (
                  <th
                    key={day}
                    className="px-2 py-2.5 text-center text-[10px] font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-200 min-w-[120px]"
                  >
                    {day}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {SCHEDULE_DEPTS.map((deptId) => (
                <tr key={deptId} className="group">
                  {/* Department name */}
                  <td className="sticky left-0 z-10 bg-white px-3 py-2 border-b border-gray-100 font-medium text-gray-700 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: getDeptColor(deptId) }}
                      />
                      {getDeptName(deptId)}
                    </div>
                  </td>

                  {/* Day cells */}
                  {WEEKDAYS.map((day) => {
                    const key = `${deptId}-${day}`;
                    const val = schedule[key];
                    const isEditing = editingKey === key;

                    return (
                      <td
                        key={day}
                        className={`px-1.5 py-1.5 border-b border-gray-100 text-center align-middle ${
                          !readOnly ? 'cursor-pointer hover:bg-gray-50' : ''
                        }`}
                        onClick={() => !isEditing && startEdit(key)}
                      >
                        {isEditing ? (
                          <div className="flex items-center gap-1">
                            <input
                              autoFocus
                              type="text"
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              onKeyDown={handleKeyDown}
                              className="w-full px-1.5 py-1 text-[11px] border border-accent-300 rounded-[5px] focus:outline-none focus:ring-1 focus:ring-accent-400 bg-white"
                              placeholder="e.g., PRIORITY"
                            />
                            <button
                              onClick={(e) => { e.stopPropagation(); saveEdit(); }}
                              className="p-0.5 text-emerald-500 hover:text-emerald-600 shrink-0"
                            >
                              <Save className="w-3 h-3" />
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); cancelEdit(); }}
                              className="p-0.5 text-gray-400 hover:text-gray-500 shrink-0"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ) : val ? (
                          <span
                            className="inline-block px-2 py-1 rounded-[5px] text-[11px] font-semibold leading-tight max-w-[140px]"
                            style={{
                              backgroundColor: getDeptBg(deptId),
                              color: getDeptColor(deptId),
                            }}
                          >
                            {val}
                          </span>
                        ) : (
                          <span className="text-gray-300 text-[11px]">—</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-3 text-[11px] text-gray-500 pt-1">
          <span><strong>PRIORITY</strong> = Department has OR priority that day</span>
          <span><strong>Dr. Name</strong> = Specific anesthesiologist assigned</span>
          <span><strong>—</strong> = No assignment</span>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
          <Button variant="secondary" size="sm" type="button" onClick={onClose}>
            {readOnly ? 'Close' : 'Cancel'}
          </Button>
          {!readOnly && (
            <Button
              variant="primary"
              size="sm"
              type="button"
              icon={<Save className="w-3.5 h-3.5" />}
              onClick={handleSaveAll}
            >
              Save Schedule
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}
