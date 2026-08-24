import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, UserPlus, Loader2 } from 'lucide-react';
import userService from '../../services/userService';

const AssignModal = ({ isOpen, onClose, onConfirm, currentAssignee = null, isSubmitting = false }) => {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(currentAssignee?._id || '');

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const uList = await userService.getUsers();
        setUsers(uList);
      } catch (err) {
        console.error('Failed to load users for assignment modal:', err);
      }
    };
    if (isOpen) {
      fetchUsers();
    }
  }, [isOpen]);

  useEffect(() => {
    if (currentAssignee) {
      setSelectedUser(currentAssignee._id || currentAssignee);
    } else {
      setSelectedUser('');
    }
  }, [currentAssignee, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onConfirm(selectedUser);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm"
          onClick={onClose}
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="glass-card w-full max-w-md bg-dark-900 border border-dark-800 rounded-2xl shadow-card-dark z-10 overflow-hidden"
        >
          <div className="px-6 py-4 border-b border-dark-800 flex items-center justify-between bg-dark-850">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
                <UserPlus className="w-4 h-4" />
              </div>
              <h2 className="text-base font-bold text-white">Assign Bug Responsibility</h2>
            </div>
            <button
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-dark-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Select Assignee (Developer / QA Tester)
              </label>
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {users.map((u) => {
                  const isSelected = selectedUser === u._id;
                  return (
                    <div
                      key={u._id}
                      onClick={() => setSelectedUser(u._id)}
                      className={`flex items-center justify-between p-3 rounded-xl border text-xs cursor-pointer select-none transition-colors ${
                        isSelected
                          ? 'bg-red-500/10 border-red-500/40 text-white'
                          : 'bg-dark-950 border-dark-800 text-slate-300 hover:border-dark-700'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-500/20 to-orange-500/20 flex items-center justify-center font-bold text-red-400 text-xs">
                          {u.name?.charAt(0) || 'U'}
                        </div>
                        <div>
                          <p className="font-bold text-white">{u.name}</p>
                          <p className="text-[10px] text-slate-400">{u.email}</p>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-dark-800 text-red-400 border border-dark-700">
                        {u.role}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="pt-4 border-t border-dark-800 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-dark-800 hover:bg-dark-700 text-slate-300 rounded-lg text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !selectedUser}
                className="px-5 py-2 bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-500 hover:to-orange-400 text-white rounded-lg text-xs font-semibold shadow-glow-red flex items-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Assigning...
                  </>
                ) : (
                  <span>Save Assignment</span>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default AssignModal;
