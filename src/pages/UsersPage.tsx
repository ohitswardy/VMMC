import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import { MOCK_USERS } from '../lib/mockData';
import { DEPARTMENTS, USER_ROLES, type DepartmentId } from '../lib/constants';
import { getDeptName, getDeptColor } from '../lib/utils';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import { Input, Select } from '../components/ui/FormFields';

export default function UsersPage() {
  const [users] = useState(MOCK_USERS);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const roleLabel = (role: string) => role.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  const roleBadge = (role: string) => {
    switch (role) {
      case 'super_admin': return 'bg-purple-50 text-purple-700';
      case 'anesthesiology_admin': return 'bg-blue-50 text-blue-700';
      case 'department_user': return 'bg-emerald-50 text-emerald-700';
      case 'viewer': return 'bg-gray-100 text-gray-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">Users</h1>
          <p className="text-xs md:text-sm text-gray-500 mt-0.5">Manage system users and roles</p>
        </div>
        <Button size="sm" icon={<Plus className="w-4 h-4" />} onClick={() => setIsModalOpen(true)}>
          <span className="hidden sm:inline">Add User</span>
          <span className="sm:hidden">Add</span>
        </Button>
      </div>

      {/* Users */}
      <div className="bg-white rounded-[10px] border border-gray-200 overflow-hidden">

        {/* ─── Mobile: Card list ─── */}
        <div className="md:hidden divide-y divide-gray-100">
          {users.map((u, i) => (
            <motion.div
              key={u.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.04 }}
              className="px-4 py-3.5 active:bg-gray-50 transition-colors"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-accent-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                  {u.full_name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <p className="text-sm font-semibold text-gray-800 truncate">{u.full_name}</p>
                    <span className={`px-2 py-0.5 rounded-[6px] text-[10px] font-semibold flex-shrink-0 ${
                      u.is_active ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
                    }`}>
                      {u.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 truncate">{u.email}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className={`px-2 py-0.5 rounded-[6px] text-[10px] font-medium ${roleBadge(u.role)}`}>
                      {roleLabel(u.role)}
                    </span>
                    {u.department_id && (
                      <span className="text-[10px] font-medium" style={{ color: getDeptColor(u.department_id as DepartmentId) }}>
                        {getDeptName(u.department_id as DepartmentId)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* ─── Desktop: Table ─── */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-6 py-3">User</th>
                <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-6 py-3">Email</th>
                <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-6 py-3">Role</th>
                <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-6 py-3">Department</th>
                <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-6 py-3">Status</th>
                <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map((u, i) => (
                <motion.tr
                  key={u.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.05 }}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-accent-600 flex items-center justify-center text-white text-xs font-bold">
                        {u.full_name.charAt(0)}
                      </div>
                      <span className="text-sm font-medium text-gray-700">{u.full_name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-3 text-sm text-gray-500">{u.email}</td>
                  <td className="px-6 py-3">
                    <span className={`px-2.5 py-1 rounded-[6px] text-xs font-medium ${roleBadge(u.role)}`}>
                      {roleLabel(u.role)}
                    </span>
                  </td>
                  <td className="px-6 py-3">
                    {u.department_id ? (
                      <span className="text-sm" style={{ color: getDeptColor(u.department_id as DepartmentId) }}>
                        {getDeptName(u.department_id as DepartmentId)}
                      </span>
                    ) : (
                      <span className="text-sm text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-6 py-3">
                    <span className={`px-2 py-0.5 rounded-[6px] text-[10px] font-semibold ${
                      u.is_active ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
                    }`}>
                      {u.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-3">
                    <button className="text-xs text-accent-600 hover:text-accent-700 font-medium">Edit</button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add User Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add User" size="md">
        <div className="space-y-4">
          <Input label="Full Name" placeholder="Dr. Juan Dela Cruz" required />
          <Input label="Email" type="email" placeholder="user@vmmc.ph" required />
          <Select
            label="Role"
            options={USER_ROLES.map((r) => ({ value: r, label: r.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) }))}
            placeholder="Select role"
            required
          />
          <Select
            label="Department"
            options={DEPARTMENTS.map((d) => ({ value: d.id, label: d.name }))}
            placeholder="Select department (optional)"
          />
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button onClick={() => setIsModalOpen(false)}>Create User</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
