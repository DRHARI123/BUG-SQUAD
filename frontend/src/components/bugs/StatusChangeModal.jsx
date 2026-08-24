import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, RefreshCw, Loader2 } from 'lucide-react';

const StatusChangeModal = ({
  isOpen,
  onClose,
  onConfirm,
  currentStatus = 'New',
  userRole = 'Tester',
  isSubmitting = false,
}) => {
  const [selectedStatus, setSelectedStatus] = useState(currentStatus);
  const [comment, setComment] = useState('');

  if (!isOpen) return null;

  // Determine allowed options based on role and current status
  const allStatuses = [
    'New',
    'Assigned',
    'In Progress',
    'Fixed',
    'Retest',
    'Closed',
    'Reopened',
    'Rejected',
  ];

  let allowedStatuses = allStatuses;
  if (userRole === 'Developer') {
    allowedStatuses = ['In Progress', 'Fixed'];
  } else if (userRole === 'Tester') {
    allowedStatuses = ['Assigned', 'Retest', 'Closed', 'Reopened'];
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    onConfirm(selectedStatus, comment);
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
              <div className="w-8 h-8 rounded-lg bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-400">
                <RefreshCw className="w-4 h-4" />
              </div>
              <h2 className="text-base font-bold text-white">Update Bug Lifecycle Status</h2>
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
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Target Status
              </label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-3 py-2 bg-dark-950 border border-dark-700 rounded-lg text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-red-500 cursor-pointer"
              >
                {allowedStatuses.map((st) => (
                  <option key={st} value={st}>
                    {st} {st === currentStatus ? '(Current)' : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Transition Note / Verification Comment (Optional)
              </label>
              <textarea
                rows={3}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Reason for status update, test case result, or fix commit reference..."
                className="w-full px-3 py-2 bg-dark-950 border border-dark-700 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500"
              />
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
                disabled={isSubmitting || selectedStatus === currentStatus}
                className="px-5 py-2 bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-500 hover:to-orange-400 text-white rounded-lg text-xs font-semibold shadow-glow-red flex items-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Updating...
                  </>
                ) : (
                  <span>Update Status</span>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default StatusChangeModal;
