import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Plus, Pencil } from 'lucide-react';
import toast from 'react-hot-toast';
import { fetchAllProfiles, updateProfile } from '../lib/supabaseService';
import { supabase } from '../lib/supabase';
import type { UserProfile } from '../lib/types';
import { DEPARTMENTS, USER_ROLES, type DepartmentId, type UserRole } from '../lib/constants';
import { getDeptName, getDeptColor } from '../lib/utils';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import { Input } from '../components/ui/FormFields';
import { CustomSelect } from '../components/ui/CustomSelect';
import PageHelpButton from '../components/ui/PageHelpButton';
import { USERS_HELP } from '../lib/helpContent';

export default function UsersPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal state — shared for add/edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form fields
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formRole, setFormRole] = useState<string>('viewer');
  const [formDept, setFormDept] = useState<string>('');
  const [formActive, setFormActive] = useState(true);

  const loadUsers = useCallback(() => {
    setIsLoading(true);
    fetchAllProfiles()
      .then(setUsers)
      .catch((err) => { console.error(err); toast.error('Failed to load users'); })
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  // ── Open modal for editing ──
  const openEdit = (u: UserProfile) => {
    setEditingUser(u);
    setFormName(u.full_name);
    setFormEmail(u.email);
    setFormPassword('');
    setFormRole(u.role);
    setFormDept(u.department_id || '');
    setFormActive(u.is_active);
    setIsModalOpen(true);
  };

  // ── Open modal for adding ──
  const openAdd = () => {
    setEditingUser(null);
    setFormName('');
    setFormEmail('');
    setFormPassword('Vmmc@2026!');
    setFormRole('viewer');
    setFormDept('');
    setFormActive(true);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
  };

  // ── Save (create or update) ──
  const handleSave = async () => {
    if (!formName.trim()) { toast.error('Name is required'); return; }
    if (!formEmail.trim()) { toast.error('Email is required'); return; }

    setIsSaving(true);
    try {
      if (editingUser) {
        // ── UPDATE existing user ──
        await updateProfile(editingUser.id, {
          full_name: formName.trim(),
          role: formRole as UserRole,
          department_id: (formDept || null) as DepartmentId | null,
          is_active: formActive,
        });
        toast.success('User updated');
      } else {
        // ── CREATE new user via Supabase Auth signUp ──
        // The handle_new_user() trigger auto-creates a profiles row
        if (!formPassword || formPassword.length < 6) {
          toast.error('Password must be at least 6 characters');
          setIsSaving(false);
          return;
        }
        const { data, error } = await supabase.auth.signUp({
          email: formEmail.trim(),
          password: formPassword,
          options: {
            data: {
              full_name: formName.trim(),
              role: formRole,
              department_id: formDept || null,
            },
          },
        });
        if (error) throw error;

        // Update the auto-created profile with the correct role/dept
        if (data.user) {
          await updateProfile(data.user.id, {
            full_name: formName.trim(),
            role: formRole as UserRole,
            department_id: (formDept || null) as DepartmentId | null,
            is_active: formActive,
          });
        }
        toast.success('User created');
      }
      closeModal();
      loadUsers();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Operation failed';
      toast.error(msg);
    } finally {
      setIsSaving(false);
    }
  };

  const roleLabel = (role: string) => role.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  const roleBadge = (role: string) => {
    switch (role) {
      case 'super_admin': return 'bg-purple-50 text-purple-700';
      case 'anesthesiology_admin': return 'bg-blue-50 text-blue-700';
      case 'department_user': return 'bg-emerald-50 text-emerald-700';
      case 'nurse': return 'bg-pink-50 text-pink-700';
      case 'viewer': return 'bg-gray-100 text-gray-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="flex items-start gap-3">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900">Users</h1>
            <p className="text-xs md:text-sm text-gray-500 mt-0.5">Manage system users and roles</p>
          </div>
          <PageHelpButton {...USERS_HELP} />
        </div>
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
                  <button
                    onClick={() => openEdit(u)}
                    className="mt-2 text-xs text-accent-600 hover:text-accent-700 font-medium flex items-center gap-1"
                  >
                    <Pencil className="w-3 h-3" /> Edit
                  </button>
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
                    <button
                      onClick={() => openEdit(u)}
                      className="text-xs text-accent-600 hover:text-accent-700 font-medium flex items-center gap-1"
                    >
                      <Pencil className="w-3 h-3" /> Edit
                    </button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {isLoading && users.length === 0 && (
          <div className="px-4 py-14 text-center text-sm text-gray-400">Loading users...</div>
        )}
      </div>

      {/* Add Button */}
      <Button className="w-full" icon={<Plus className="w-4 h-4" />} onClick={openAdd}>
        Add User
      </Button>

      {/* Add / Edit User Modal */}
      <Modal isOpen={isModalOpen} onClose={closeModal} title={editingUser ? 'Edit User' : 'Add User'} size="md">
        <div className="space-y-4">
          <Input
            label="Full Name"
            placeholder="Dr. Juan Dela Cruz"
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
            required
          />
          <Input
            label="Email"
            type="email"
            placeholder="user@vmmc.gov.ph"
            value={formEmail}
            onChange={(e) => setFormEmail(e.target.value)}
            disabled={!!editingUser}
            required
          />
          {!editingUser && (
            <Input
              label="Password"
              type="password"
              placeholder="Vmmc@2026!"
              value={formPassword}
              onChange={(e) => setFormPassword(e.target.value)}
              required
            />
          )}
          <CustomSelect
            label="Role"
            value={formRole}
            onChange={(val) => setFormRole(val)}
            options={USER_ROLES.map((r) => ({ value: r, label: r.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) }))}
            placeholder="Select role"
            required
          />
          <CustomSelect
            label="Department"
            value={formDept}
            onChange={(val) => setFormDept(val)}
            options={[
              { value: '', label: 'None' },
              ...DEPARTMENTS.map((d) => ({ value: d.id, label: d.name })),
            ]}
            placeholder="Select department (optional)"
          />
          {editingUser && (
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formActive}
                  onChange={(e) => setFormActive(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-accent-600 focus:ring-accent-400"
                />
                <span className="text-sm font-medium text-gray-700">Active</span>
              </label>
            </div>
          )}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <Button variant="secondary" onClick={closeModal}>Cancel</Button>
            <Button onClick={handleSave} loading={isSaving}>
              {editingUser ? 'Save Changes' : 'Create User'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
