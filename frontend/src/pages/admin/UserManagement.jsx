import React, { useState, useEffect, useCallback } from 'react';
import userService from '../../services/userService';
import projectService from '../../services/projectService';
import DeleteConfirmModal from '../../components/projects/DeleteConfirmModal';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  RefreshCw,
  Edit2,
  Lock,
  UserCheck,
  UserX,
  Trash2,
  X,
  Loader2,
  AlertCircle,
  Building2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);

  // Filters & Search
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  const [projectsList, setProjectsList] = useState([]);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const [selectedUser, setSelectedUser] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State for Add / Edit
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'Tester',
    status: 'Active',
    department: 'Quality Assurance',
    phone: '',
    assignedProjects: [],
  });

  const [resetPasswordInput, setResetPasswordInput] = useState('');
  const [errors, setErrors] = useState({});

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await userService.getUsers({
        search,
        role: roleFilter,
        status: statusFilter,
        page,
        limit: 10,
      });

      setUsers(res.users || []);
      setTotalPages(res.pages || 1);
      setTotalUsers(res.total || 0);
    } catch (err) {
      console.error('[FETCH USERS ERROR]:', err);
      toast.error('Unable to fetch users.');
    } finally {
      setLoading(false);
    }
  }, [search, roleFilter, statusFilter, page]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const pList = await projectService.getProjects();
        setProjectsList(pList);
      } catch (err) {
        console.error(err);
      }
    };
    fetchProjects();
  }, []);

  const handleOpenAdd = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      role: 'Tester',
      status: 'Active',
      department: 'Quality Assurance',
      phone: '',
      assignedProjects: [],
    });
    setErrors({});
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (u) => {
    setSelectedUser(u);
    setFormData({
      name: u.name || '',
      email: u.email || '',
      password: '',
      confirmPassword: '',
      role: u.role || 'Tester',
      status: u.status || 'Active',
      department: u.department || 'Quality Assurance',
      phone: u.phone || '',
      assignedProjects: (u.assignedProjects || []).map((p) => p._id || p),
    });
    setErrors({});
    setIsEditModalOpen(true);
  };

  const handleOpenReset = (u) => {
    setSelectedUser(u);
    setResetPasswordInput('');
    setIsResetModalOpen(true);
  };

  const validateAdd = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Full name is required';
    if (!formData.email.trim()) newErrors.email = 'Email address is required';
    if (!formData.password) newErrors.password = 'Password is required';
    if (formData.password.length < 8) newErrors.password = 'Password must be at least 8 characters';
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!validateAdd()) {
      toast.error('Please resolve form validation errors.');
      return;
    }

    try {
      setIsSubmitting(true);
      await userService.createUser(formData);
      toast.success(`User '${formData.name}' created successfully.`);
      setIsAddModalOpen(false);
      fetchUsers();
    } catch (err) {
      const msg = err.response?.data?.message || 'Unable to create user.';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim()) {
      toast.error('Name and Email are required.');
      return;
    }

    try {
      setIsSubmitting(true);
      await userService.updateUser(selectedUser._id, formData);
      toast.success(`User '${formData.name}' updated successfully.`);
      setIsEditModalOpen(false);
      fetchUsers();
    } catch (err) {
      const msg = err.response?.data?.message || 'Unable to update user.';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (u) => {
    const nextStatus = u.status === 'Active' ? 'Inactive' : 'Active';
    try {
      await userService.toggleStatus(u._id, nextStatus);
      toast.success(`User '${u.name}' set to ${nextStatus}.`);
      fetchUsers();
    } catch (err) {
      toast.error('Failed to change user status.');
    }
  };

  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    if (!resetPasswordInput || resetPasswordInput.length < 8) {
      toast.error('Password must be at least 8 characters.');
      return;
    }

    try {
      setIsSubmitting(true);
      await userService.resetPassword(selectedUser._id, resetPasswordInput);
      toast.success(`Password for '${selectedUser.name}' reset successfully.`);
      setIsResetModalOpen(false);
    } catch (err) {
      toast.error('Failed to reset password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedUser) return;
    try {
      setIsSubmitting(true);
      await userService.deleteUser(selectedUser._id);
      toast.success(`User '${selectedUser.name}' deactivated and historical records preserved.`);
      setIsDeleteModalOpen(false);
      fetchUsers();
    } catch (err) {
      toast.error('Failed to delete user.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'Admin':
        return 'bg-red-500/10 text-red-400 border-red-500/30';
      case 'QA Manager':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/30';
      case 'Developer':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
      default:
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-gradient-to-r from-dark-900 via-dark-850 to-dark-900 p-6 rounded-2xl border border-dark-800 shadow-card-dark">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-red-600 to-orange-500 flex items-center justify-center text-white shadow-glow-red shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-white">User Accounts Governance</h1>
            <p className="text-xs text-slate-400">
              Provision QA user accounts, assign roles, reset credentials, and manage status
            </p>
          </div>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2.5 bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-500 hover:to-orange-400 text-white rounded-xl text-xs font-bold shadow-glow-red flex items-center justify-center gap-2 transition-all shrink-0"
        >
          <UserPlus className="w-4 h-4" /> Add New User
        </button>
      </div>

      {/* Filter and Search Toolbar */}
      <div className="glass-card p-5 rounded-2xl border border-dark-800 shadow-card-dark space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search users by name or email address..."
              className="w-full pl-10 pr-4 py-2.5 bg-dark-950 border border-dark-700 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500 transition-all"
            />
          </div>

          <div className="flex items-center gap-3">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-2 bg-dark-950 border border-dark-700 rounded-lg text-xs text-slate-200 cursor-pointer"
            >
              <option value="All">All Roles</option>
              <option value="Admin">Admin</option>
              <option value="QA Manager">QA Manager</option>
              <option value="Tester">Tester</option>
              <option value="Developer">Developer</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-dark-950 border border-dark-700 rounded-lg text-xs text-slate-200 cursor-pointer"
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>

            <button
              onClick={() => {
                setSearch('');
                setRoleFilter('All');
                setStatusFilter('All');
              }}
              className="px-3 py-2 bg-dark-800 hover:bg-dark-700 text-red-400 rounded-lg text-xs font-semibold flex items-center gap-1 border border-dark-700"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Clear
            </button>
          </div>
        </div>
      </div>

      {/* Users Data Table */}
      <div className="glass-card rounded-2xl border border-dark-800 p-6 shadow-card-dark overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300">
            Registered Users ({totalUsers})
          </h2>
          <span className="text-xs text-slate-500 font-mono">Page {page} of {totalPages}</span>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-red-500 mb-2" />
            <p className="text-xs font-medium">Fetching registered user directory...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-12 text-slate-400">No users found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-dark-800 text-slate-400 uppercase font-semibold">
                  <th className="pb-3 px-2">User</th>
                  <th className="pb-3 px-2">Role</th>
                  <th className="pb-3 px-2">Status</th>
                  <th className="pb-3 px-2">Department</th>
                  <th className="pb-3 px-2">Last Login</th>
                  <th className="pb-3 px-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-800/60 text-slate-300">
                {users.map((u) => (
                  <tr key={u._id} className="hover:bg-dark-900/60 transition-colors">
                    <td className="py-3 px-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-dark-800 border border-dark-700 flex items-center justify-center text-xs font-bold text-red-400">
                          {u.name?.charAt(0) || 'U'}
                        </div>
                        <div>
                          <span className="font-bold text-white block">{u.name}</span>
                          <span className="text-[10px] text-slate-400 block">{u.email}</span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-2">
                      <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold border ${getRoleBadge(u.role)}`}>
                        {u.role}
                      </span>
                    </td>

                    <td className="py-3 px-2">
                      <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold ${
                        u.status === 'Active'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          : 'bg-slate-500/10 text-slate-400 border border-slate-500/30'
                      }`}>
                        {u.status}
                      </span>
                    </td>

                    <td className="py-3 px-2 text-slate-300">{u.department || 'QA'}</td>

                    <td className="py-3 px-2 text-slate-400 font-mono text-[11px]">
                      {u.lastLogin ? new Date(u.lastLogin).toLocaleDateString() : 'Never'}
                    </td>

                    <td className="py-3 px-2 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleToggleStatus(u)}
                          className="p-1.5 text-slate-300 hover:text-white bg-dark-800 hover:bg-dark-700 rounded-lg text-xs"
                          title={u.status === 'Active' ? 'Deactivate User' : 'Activate User'}
                        >
                          {u.status === 'Active' ? <UserX className="w-3.5 h-3.5 text-amber-400" /> : <UserCheck className="w-3.5 h-3.5 text-emerald-400" />}
                        </button>

                        <button
                          onClick={() => handleOpenReset(u)}
                          className="p-1.5 text-slate-300 hover:text-white bg-dark-800 hover:bg-dark-700 rounded-lg text-xs"
                          title="Reset Password"
                        >
                          <Lock className="w-3.5 h-3.5 text-purple-400" />
                        </button>

                        <button
                          onClick={() => handleOpenEdit(u)}
                          className="p-1.5 text-slate-300 hover:text-white bg-dark-800 hover:bg-dark-700 rounded-lg text-xs"
                          title="Edit User"
                        >
                          <Edit2 className="w-3.5 h-3.5 text-slate-300" />
                        </button>

                        <button
                          onClick={() => {
                            setSelectedUser(u);
                            setIsDeleteModalOpen(true);
                          }}
                          className="p-1.5 text-slate-300 hover:text-red-400 bg-dark-800 hover:bg-dark-700 rounded-lg text-xs"
                          title="Delete / Deactivate User"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-red-400" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {!loading && users.length > 0 && (
          <div className="pt-4 mt-4 border-t border-dark-800 flex items-center justify-between text-xs text-slate-400">
            <span>Showing {users.length} of {totalUsers} users</span>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 bg-dark-850 hover:bg-dark-800 disabled:opacity-40 text-slate-200 rounded-lg border border-dark-700 flex items-center gap-1"
              >
                <ChevronLeft className="w-3.5 h-3.5" /> Previous
              </button>
              <span className="font-bold text-white px-2">{page} / {totalPages}</span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="px-3.5 py-1.5 bg-dark-850 hover:bg-dark-800 disabled:opacity-40 text-slate-200 rounded-lg border border-dark-700 flex items-center gap-1"
              >
                Next <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add User Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsAddModalOpen(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="glass-card w-full max-w-lg bg-dark-900 border border-dark-800 rounded-2xl shadow-card-dark z-10 overflow-hidden">
              <div className="px-6 py-4 border-b border-dark-800 flex items-center justify-between bg-dark-850">
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-red-500" /> Provision New User Account
                </h2>
                <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-white"><X className="w-5 h-5"/></button>
              </div>

              <form onSubmit={handleAddSubmit} className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">Full Name *</label>
                    <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-3 py-2 bg-dark-950 border border-dark-700 rounded-lg text-sm text-slate-100" />
                    {errors.name && <p className="text-[11px] text-red-400 mt-1">{errors.name}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">Email Address *</label>
                    <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full px-3 py-2 bg-dark-950 border border-dark-700 rounded-lg text-sm text-slate-100" />
                    {errors.email && <p className="text-[11px] text-red-400 mt-1">{errors.email}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">Password *</label>
                    <input type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} className="w-full px-3 py-2 bg-dark-950 border border-dark-700 rounded-lg text-sm text-slate-100" />
                    {errors.password && <p className="text-[11px] text-red-400 mt-1">{errors.password}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">Confirm Password *</label>
                    <input type="password" value={formData.confirmPassword} onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })} className="w-full px-3 py-2 bg-dark-950 border border-dark-700 rounded-lg text-sm text-slate-100" />
                    {errors.confirmPassword && <p className="text-[11px] text-red-400 mt-1">{errors.confirmPassword}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">User Role *</label>
                    <select value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })} className="w-full px-3 py-2 bg-dark-950 border border-dark-700 rounded-lg text-sm text-slate-100">
                      <option value="QA Manager">QA Manager</option>
                      <option value="Tester">Tester</option>
                      <option value="Developer">Developer</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">Department</label>
                    <input type="text" value={formData.department} onChange={(e) => setFormData({ ...formData, department: e.target.value })} className="w-full px-3 py-2 bg-dark-950 border border-dark-700 rounded-lg text-sm text-slate-100" />
                  </div>
                </div>

                <div className="pt-4 border-t border-dark-800 flex justify-end gap-3">
                  <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 bg-dark-800 text-slate-300 rounded-lg text-xs font-semibold">Cancel</button>
                  <button type="submit" disabled={isSubmitting} className="px-5 py-2 bg-gradient-to-r from-red-600 to-orange-500 text-white rounded-lg text-xs font-semibold shadow-glow-red flex items-center gap-2">
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin"/> : <span>Create Account</span>}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit User Modal */}
      <AnimatePresence>
        {isEditModalOpen && selectedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsEditModalOpen(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="glass-card w-full max-w-lg bg-dark-900 border border-dark-800 rounded-2xl shadow-card-dark z-10 overflow-hidden">
              <div className="px-6 py-4 border-b border-dark-800 flex items-center justify-between bg-dark-850">
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Edit2 className="w-5 h-5 text-red-500" /> Edit User Profile: {selectedUser.name}
                </h2>
                <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-white"><X className="w-5 h-5"/></button>
              </div>

              <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">Full Name</label>
                    <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-3 py-2 bg-dark-950 border border-dark-700 rounded-lg text-sm text-slate-100" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">Email</label>
                    <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full px-3 py-2 bg-dark-950 border border-dark-700 rounded-lg text-sm text-slate-100" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">Role</label>
                    <select value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })} className="w-full px-3 py-2 bg-dark-950 border border-dark-700 rounded-lg text-sm text-slate-100">
                      {selectedUser?.role === 'Admin' && <option value="Admin">Admin</option>}
                      <option value="QA Manager">QA Manager</option>
                      <option value="Tester">Tester</option>
                      <option value="Developer">Developer</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">Status</label>
                    <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} className="w-full px-3 py-2 bg-dark-950 border border-dark-700 rounded-lg text-sm text-slate-100">
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                </div>

                <div className="pt-4 border-t border-dark-800 flex justify-end gap-3">
                  <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-4 py-2 bg-dark-800 text-slate-300 rounded-lg text-xs font-semibold">Cancel</button>
                  <button type="submit" disabled={isSubmitting} className="px-5 py-2 bg-gradient-to-r from-red-600 to-orange-500 text-white rounded-lg text-xs font-semibold shadow-glow-red flex items-center gap-2">
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin"/> : <span>Save Changes</span>}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Reset Password Modal */}
      <AnimatePresence>
        {isResetModalOpen && selectedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsResetModalOpen(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="glass-card w-full max-w-md bg-dark-900 border border-dark-800 rounded-2xl shadow-card-dark z-10 p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-dark-800">
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  <Lock className="w-4 h-4 text-purple-400" /> Reset Password: {selectedUser.name}
                </h2>
                <button onClick={() => setIsResetModalOpen(false)} className="text-slate-400 hover:text-white"><X className="w-4 h-4"/></button>
              </div>

              <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">New Password (Min 8 Chars)</label>
                  <input type="password" value={resetPasswordInput} onChange={(e) => setResetPasswordInput(e.target.value)} placeholder="Enter new password" className="w-full px-3 py-2 bg-dark-950 border border-dark-700 rounded-lg text-sm text-slate-100" />
                </div>

                <div className="pt-3 border-t border-dark-800 flex justify-end gap-3">
                  <button type="button" onClick={() => setIsResetModalOpen(false)} className="px-4 py-2 bg-dark-800 text-slate-300 rounded-lg text-xs font-semibold">Cancel</button>
                  <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-bold shadow-glow-red flex items-center gap-2">
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin"/> : <span>Reset Password</span>}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete / Deactivate Confirmation */}
      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        title={`Deactivate '${selectedUser?.name}'?`}
        message="Deactivating this user will prevent login. All historical bug reports, test cases, and activity records will be safely preserved."
        isDeleting={isSubmitting}
      />
    </div>
  );
};

export default UserManagement;
