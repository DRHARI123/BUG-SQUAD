import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../utils/api';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  Bell,
  CheckCheck,
  Trash2,
  Bug,
  FileCheck,
  FolderGit2,
  MessageSquare,
  Clock,
  Filter,
  ChevronLeft,
  ChevronRight,
  Loader2
} from 'lucide-react';

const NotificationsPage = () => {
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [filterType, setFilterType] = useState('All');

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: 15,
        unreadOnly: filterType === 'Unread' ? 'true' : 'false',
      };
      const response = await API.get('/notifications', { params });
      setNotifications(response.data.notifications || []);
      setUnreadCount(response.data.unreadCount || 0);
      setTotalPages(response.data.pages || 1);
      setTotal(response.data.total || 0);
    } catch (err) {
      console.error(err);
      toast.error('Unable to fetch notifications.');
    } finally {
      setLoading(false);
    }
  }, [page, filterType]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleMarkRead = async (id) => {
    try {
      await API.patch(`/notifications/${id}/read`);
      fetchNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await API.patch('/notifications/read-all');
      toast.success('All notifications marked as read.');
      fetchNotifications();
    } catch (err) {
      toast.error('Failed to mark all as read.');
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    try {
      await API.delete(`/notifications/${id}`);
      toast.success('Notification removed.');
      fetchNotifications();
    } catch (err) {
      toast.error('Failed to delete notification.');
    }
  };

  const handleNotificationClick = (item) => {
    handleMarkRead(item._id);
    if (item.relatedBug) {
      navigate(`/bugs/${item.relatedBug._id || item.relatedBug}`);
    } else if (item.relatedTestCase) {
      navigate(`/test-cases/${item.relatedTestCase._id || item.relatedTestCase}`);
    } else if (item.relatedProject) {
      navigate(`/projects/${item.relatedProject._id || item.relatedProject}`);
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'BUG_ASSIGNED':
      case 'BUG_STATUS_CHANGED':
      case 'BUG_REOPENED':
      case 'BUG_FIXED':
        return <Bug className="w-4 h-4 text-red-400" />;
      case 'TEST_FAILED':
      case 'TEST_PASSED':
        return <FileCheck className="w-4 h-4 text-cyan-400" />;
      case 'PROJECT_ASSIGNED':
        return <FolderGit2 className="w-4 h-4 text-orange-400" />;
      case 'COMMENT_ADDED':
        return <MessageSquare className="w-4 h-4 text-purple-400" />;
      default:
        return <Bell className="w-4 h-4 text-amber-400" />;
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-gradient-to-r from-dark-900 via-dark-850 to-dark-900 p-6 rounded-2xl border border-dark-800 shadow-card-dark">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-red-600 to-orange-500 flex items-center justify-center text-white shadow-glow-red shrink-0 relative">
            <Bell className="w-6 h-6" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white font-bold text-[9px] rounded-full flex items-center justify-center border border-dark-900">
                {unreadCount}
              </span>
            )}
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-white">QA Notification Hub</h1>
            <p className="text-xs text-slate-400">
              Defect assignments, status changes, execution outcomes, and project updates
            </p>
          </div>
        </div>

        <button
          onClick={handleMarkAllRead}
          className="px-3.5 py-2.5 bg-dark-800 hover:bg-dark-700 text-emerald-400 rounded-xl text-xs font-semibold border border-dark-700 flex items-center gap-1.5 transition-colors shrink-0"
        >
          <CheckCheck className="w-4 h-4" /> Mark All as Read
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {['All', 'Unread'].map((t) => (
          <button
            key={t}
            onClick={() => { setFilterType(t); setPage(1); }}
            className={`px-4 py-2 rounded-xl text-xs font-bold shrink-0 transition-all border ${
              filterType === t
                ? 'bg-gradient-to-r from-red-600 to-orange-500 text-white border-red-500 shadow-glow-red'
                : 'bg-dark-900 border-dark-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            {t} Notifications
          </button>
        ))}
      </div>

      {/* Notifications List Card */}
      <div className="glass-card p-6 rounded-2xl border border-dark-800 shadow-card-dark space-y-3">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-red-500 mb-2" />
            <p className="text-xs font-medium">Fetching notifications...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-12 text-slate-400">No notifications found.</div>
        ) : (
          <div className="divide-y divide-dark-800/60 space-y-2">
            {notifications.map((item) => (
              <div
                key={item._id}
                onClick={() => handleNotificationClick(item)}
                className={`p-4 rounded-xl transition-all cursor-pointer flex items-start justify-between gap-4 ${
                  !item.read ? 'bg-dark-850/80 border border-red-500/30' : 'bg-dark-950 hover:bg-dark-900'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="p-2.5 bg-dark-900 rounded-xl border border-dark-800 mt-0.5">
                    {getIcon(item.type)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-100 text-xs">{item.title}</span>
                      {!item.read && (
                        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">{item.message}</p>
                    <span className="text-[10px] font-mono text-slate-500 block mt-1">
                      {new Date(item.createdAt).toLocaleString()}
                    </span>
                  </div>
                </div>

                <button
                  onClick={(e) => handleDelete(item._id, e)}
                  className="p-1.5 text-slate-500 hover:text-red-400 transition-colors"
                  title="Delete Notification"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Pagination Footer */}
        {!loading && notifications.length > 0 && (
          <div className="pt-4 border-t border-dark-800 flex items-center justify-between text-xs text-slate-400">
            <span>Showing {notifications.length} of {total} notifications</span>
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
    </div>
  );
};

export default NotificationsPage;
