import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import userService from '../services/userService';
import authService from '../services/authService';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  User,
  Mail,
  Shield,
  Building2,
  Phone,
  Calendar,
  Lock,
  Edit2,
  Save,
  Loader2,
  X,
  Clock
} from 'lucide-react';

const ProfilePage = () => {
  const { user, login } = useAuth();

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);

  // Edit Profile Form
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    department: user?.department || 'Quality Assurance',
  });

  // Change Password Form
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState({});

  const handleOpenEdit = () => {
    setProfileForm({
      name: user?.name || '',
      phone: user?.phone || '',
      department: user?.department || 'Quality Assurance',
    });
    setIsEditModalOpen(true);
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    try {
      setSavingProfile(true);
      const updated = await userService.updateUser(user._id, profileForm);
      toast.success('Profile updated successfully.');
      setIsEditModalOpen(false);
      // Update local auth state if possible
      window.location.reload();
    } catch (err) {
      toast.error('Failed to update profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  const validatePassword = () => {
    const errs = {};
    if (!passwordForm.currentPassword) errs.currentPassword = 'Current password required';
    if (!passwordForm.newPassword) errs.newPassword = 'New password required';
    if (passwordForm.newPassword.length < 8) errs.newPassword = 'New password must be at least 8 characters';
    if (passwordForm.newPassword === passwordForm.currentPassword) errs.newPassword = 'New password cannot equal current password';
    if (passwordForm.newPassword !== passwordForm.confirmPassword) errs.confirmPassword = 'Passwords do not match';
    setPasswordErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (!validatePassword()) {
      toast.error('Please fix password requirements.');
      return;
    }

    try {
      setChangingPassword(true);
      await authService.updatePassword(passwordForm.currentPassword, passwordForm.newPassword);
      toast.success('Password changed successfully.');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setPasswordErrors({});
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to change password.';
      toast.error(msg);
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-gradient-to-r from-dark-900 via-dark-850 to-dark-900 p-6 rounded-2xl border border-dark-800 shadow-card-dark">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-red-600 to-orange-500 flex items-center justify-center text-white shadow-glow-red font-extrabold text-2xl shrink-0">
            {user?.name?.charAt(0) || 'U'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold text-white">{user?.name || 'QA Account'}</h1>
              <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-red-500/10 text-red-400 border border-red-500/30">
                {user?.role || 'User'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">{user?.email}</p>
          </div>
        </div>

        <button
          onClick={handleOpenEdit}
          className="px-4 py-2.5 bg-dark-800 hover:bg-dark-700 text-slate-200 rounded-xl text-xs font-semibold border border-dark-700 flex items-center gap-1.5 transition-colors shrink-0"
        >
          <Edit2 className="w-4 h-4 text-slate-300" /> Edit Profile
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User Metadata Overview */}
        <div className="glass-card p-6 rounded-2xl border border-dark-800 shadow-card-dark space-y-4 lg:col-span-1">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300 border-b border-dark-800 pb-3">
            Account Specifications
          </h2>

          <div className="space-y-3 text-xs">
            <div className="flex items-center gap-3">
              <Mail className="w-4 h-4 text-red-400 shrink-0" />
              <div>
                <span className="text-[10px] text-slate-500 uppercase block">Email Address</span>
                <span className="font-semibold text-slate-200">{user?.email}</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Building2 className="w-4 h-4 text-orange-400 shrink-0" />
              <div>
                <span className="text-[10px] text-slate-500 uppercase block">Department</span>
                <span className="font-semibold text-slate-200">{user?.department || 'Quality Assurance'}</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Phone className="w-4 h-4 text-cyan-400 shrink-0" />
              <div>
                <span className="text-[10px] text-slate-500 uppercase block">Phone Contact</span>
                <span className="font-semibold text-slate-200">{user?.phone || 'Not provided'}</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Shield className="w-4 h-4 text-purple-400 shrink-0" />
              <div>
                <span className="text-[10px] text-slate-500 uppercase block">System Role</span>
                <span className="font-semibold text-slate-200">{user?.role}</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Clock className="w-4 h-4 text-emerald-400 shrink-0" />
              <div>
                <span className="text-[10px] text-slate-500 uppercase block">Last Login Timestamp</span>
                <span className="font-mono text-slate-200">{user?.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Active Now'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Change Password Form */}
        <div className="glass-card p-6 rounded-2xl border border-dark-800 shadow-card-dark space-y-4 lg:col-span-2">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300 border-b border-dark-800 pb-3 flex items-center gap-2">
            <Lock className="w-4 h-4 text-purple-400" /> Account Password Security
          </h2>

          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">Current Password *</label>
              <input
                type="password"
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-dark-950 border border-dark-700 rounded-xl text-xs text-slate-100"
              />
              {passwordErrors.currentPassword && <p className="text-[11px] text-red-400 mt-1">{passwordErrors.currentPassword}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">New Password (Min 8 Chars) *</label>
                <input
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-dark-950 border border-dark-700 rounded-xl text-xs text-slate-100"
                />
                {passwordErrors.newPassword && <p className="text-[11px] text-red-400 mt-1">{passwordErrors.newPassword}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">Confirm New Password *</label>
                <input
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-dark-950 border border-dark-700 rounded-xl text-xs text-slate-100"
                />
                {passwordErrors.confirmPassword && <p className="text-[11px] text-red-400 mt-1">{passwordErrors.confirmPassword}</p>}
              </div>
            </div>

            <div className="pt-3 border-t border-dark-800 flex justify-end">
              <button
                type="submit"
                disabled={changingPassword}
                className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold shadow-glow-red flex items-center gap-2 transition-all"
              >
                {changingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                <span>Update Password</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Edit Profile Modal */}
      <AnimatePresence>
        {isEditModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsEditModalOpen(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="glass-card w-full max-w-md bg-dark-900 border border-dark-800 rounded-2xl shadow-card-dark z-10 p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-dark-800">
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  <Edit2 className="w-4 h-4 text-red-500" /> Edit Profile Details
                </h2>
                <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-white"><X className="w-4 h-4"/></button>
              </div>

              <form onSubmit={handleProfileSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">Full Name</label>
                  <input type="text" value={profileForm.name} onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })} className="w-full px-3 py-2 bg-dark-950 border border-dark-700 rounded-lg text-sm text-slate-100" />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">Department</label>
                  <input type="text" value={profileForm.department} onChange={(e) => setProfileForm({ ...profileForm, department: e.target.value })} className="w-full px-3 py-2 bg-dark-950 border border-dark-700 rounded-lg text-sm text-slate-100" />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">Phone Contact</label>
                  <input type="text" value={profileForm.phone} onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })} className="w-full px-3 py-2 bg-dark-950 border border-dark-700 rounded-lg text-sm text-slate-100" />
                </div>

                <div className="pt-3 border-t border-dark-800 flex justify-end gap-3">
                  <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-4 py-2 bg-dark-800 text-slate-300 rounded-lg text-xs font-semibold">Cancel</button>
                  <button type="submit" disabled={savingProfile} className="px-4 py-2 bg-gradient-to-r from-red-600 to-orange-500 text-white rounded-lg text-xs font-bold shadow-glow-red flex items-center gap-2">
                    {savingProfile ? <Loader2 className="w-4 h-4 animate-spin"/> : <span>Save Profile</span>}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProfilePage;
