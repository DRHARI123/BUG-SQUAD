import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import notificationService from '../services/notificationService';
import {
  Bug,
  LayoutDashboard,
  FolderGit2,
  BugPlay,
  PlusCircle,
  FileCheck2,
  BarChart3,
  ShieldAlert,
  User,
  Settings,
  LogOut,
  Moon,
  Sun,
  Menu,
  X,
  Search,
  Bell,
  ChevronDown,
  CheckCircle2,
  Clock,
  Sparkles,
  AlertCircle,
  Tag,
  Layers,
  PlayCircle,
  FileText,
  FileCheck,
} from 'lucide-react';

const MainLayout = () => {
  const { user, logout, theme, toggleTheme } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileDropdown, setProfileDropdown] = useState(false);
  const [notifDropdown, setNotifDropdown] = useState(false);
  const [notifications, setNotifications] = useState([]);

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const data = await notificationService.getNotifications();
        const list = Array.isArray(data) ? data : (data?.notifications || []);
        setNotifications(list);
      } catch (err) {
        console.error('Failed to load notifications:', err);
        setNotifications([]);
      }
    };
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleMarkAsRead = async (id) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications((prev) =>
        Array.isArray(prev) ? prev.map((n) => (n._id === id ? { ...n, read: true } : n)) : []
      );
    } catch (err) {
      console.error('Failed to mark read:', err);
    }
  };

  const handleTopSearchSubmit = (e) => {
    e.preventDefault();
    if (topSearch.trim()) {
      navigate(`/search?q=${encodeURIComponent(topSearch.trim())}`);
      setTopSearch('');
    }
  };

  const unreadCount = Array.isArray(notifications) ? notifications.filter((n) => !n.read).length : 0;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Analytics', path: '/analytics', icon: BarChart3 },
    { name: 'SLA Compliance', path: '/sla', icon: Clock },
    { name: 'Management View', path: '/management-dashboard', icon: LayoutDashboard, roles: ['Admin', 'QA Manager'] },
    { name: 'AI QA Assistant', path: '/ai-assistant', icon: Sparkles },
    { name: 'AI Bug Triage', path: '/ai/bug-triage', icon: Sparkles, roles: ['Admin', 'QA Manager'] },
    { name: 'Projects', path: '/projects', icon: FolderGit2 },
    { name: 'Bugs', path: '/bugs', icon: BugPlay },
    { name: 'Report Bug', path: '/report-bug', icon: PlusCircle },
    { name: 'Requirements', path: '/requirements', icon: FileCheck },
    { name: 'Test Plans', path: '/test-plans', icon: FileText },
    { name: 'Test Suites', path: '/test-suites', icon: Layers },
    { name: 'Test Cases', path: '/test-cases', icon: FileCheck2 },
    { name: 'Test Runs', path: '/test-runs', icon: PlayCircle },
    { name: 'Traceability', path: '/traceability', icon: FileCheck },
    { name: 'Releases', path: '/releases', icon: Tag },
    { name: 'Overdue Tasks', path: '/overdue', icon: AlertCircle },
    { name: 'QA Reports', path: '/qa-reports', icon: BarChart3 },
    { name: 'Notifications', path: '/notifications', icon: Bell },
    { name: 'Admin Panel', path: '/admin', icon: ShieldAlert, roles: ['Admin'] },
    { name: 'Profile', path: '/profile', icon: User },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-dark-950 flex flex-col md:flex-row text-slate-100">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside
        className={`fixed md:sticky top-0 left-0 h-screen w-64 bg-dark-900 border-r border-dark-800 flex flex-col justify-between z-50 transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div>
          {/* Logo & Header */}
          <div className="h-16 flex items-center justify-between px-6 border-b border-dark-800">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gradient-to-tr from-red-600 to-orange-500 rounded-xl flex items-center justify-center shadow-glow-red">
                <Bug className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-extrabold tracking-wider text-white">
                BUG <span className="text-red-500">SQUAD</span>
              </span>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="md:hidden text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1.5 overflow-y-auto max-h-[calc(100vh-140px)]">
            <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Menu Navigation
            </div>
            {navItems.map((item) => {
              // Role checking for menu items
              if (item.roles && user && !item.roles.includes(user.role)) {
                return null;
              }

              const Icon = item.icon;
              const isActive = location.pathname === item.path;

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-red-600 to-orange-600 text-white shadow-glow-red'
                      : 'text-slate-400 hover:text-white hover:bg-dark-850'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.name}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Footer User Widget */}
        <div className="p-4 border-t border-dark-800 bg-dark-900/80">
          <div className="flex items-center justify-between p-2 rounded-xl bg-dark-850 border border-dark-800">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center font-bold text-white text-xs shrink-0">
                {user?.name?.charAt(0) || 'U'}
              </div>
              <div className="truncate">
                <p className="text-xs font-bold text-white truncate">{user?.name || 'QA User'}</p>
                <p className="text-[10px] text-red-400 font-semibold">{user?.role || 'Tester'}</p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              title="Logout"
              className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-dark-800 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar */}
        <header className="h-16 bg-dark-900/70 backdrop-blur-md border-b border-dark-800 sticky top-0 z-30 px-4 md:px-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden text-slate-400 hover:text-white p-2"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Quick Search */}
            <div className="relative hidden sm:block w-64 md:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Search bugs, projects, test cases..."
                className="w-full pl-9 pr-4 py-1.5 bg-dark-950 border border-dark-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-red-500 transition-colors"
              />
            </div>
          </div>

          {/* Right Action Icons & Profile */}
          <div className="flex items-center gap-3">
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-dark-850 transition-colors"
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Notification Bell Dropdown */}
            <div className="relative">
              <button
                onClick={() => {
                  setNotifDropdown(!notifDropdown);
                  setProfileDropdown(false);
                }}
                className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-dark-850 relative transition-colors"
                title="Notifications"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <>
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full animate-ping" />
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
                  </>
                )}
              </button>

              {notifDropdown && (
                <div className="absolute right-0 mt-2 w-80 bg-dark-900 border border-dark-800 rounded-xl shadow-card-dark p-3 z-50 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-dark-800">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Bell className="w-3.5 h-3.5 text-red-500" /> System Notifications
                    </span>
                    <span className="text-[10px] font-bold text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full border border-red-500/20">
                      {unreadCount} Unread
                    </span>
                  </div>

                  <div className="max-h-64 overflow-y-auto space-y-2">
                    {!Array.isArray(notifications) || notifications.length === 0 ? (
                      <p className="text-xs text-slate-500 italic text-center py-4">No notifications.</p>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n._id}
                          onClick={() => handleMarkAsRead(n._id)}
                          className={`p-2.5 rounded-lg border text-xs cursor-pointer transition-colors ${
                            n.read
                              ? 'bg-dark-950/60 border-dark-800 text-slate-400'
                              : 'bg-red-500/10 border-red-500/30 text-white font-medium'
                          }`}
                        >
                          <p className="leading-snug">{n.message}</p>
                          <div className="flex items-center justify-between mt-1 text-[10px] text-slate-500">
                            <span className="font-mono text-red-400">{n.relatedBug || 'System'}</span>
                            <span>
                              {new Date(n.createdAt).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="h-4 w-px bg-dark-800 mx-1" />

            {/* User Profile Dropdown Menu */}
            <div className="relative">
              <button
                onClick={() => setProfileDropdown(!profileDropdown)}
                className="flex items-center gap-2 text-left focus:outline-none"
              >
                <div className="w-8 h-8 rounded-full bg-dark-800 border border-dark-700 flex items-center justify-center text-xs font-bold text-red-400">
                  {user?.name?.charAt(0) || 'U'}
                </div>
                <div className="hidden lg:block">
                  <span className="block text-xs font-semibold text-white leading-tight">
                    {user?.name || 'QA User'}
                  </span>
                  <span className="block text-[10px] text-slate-400">{user?.role}</span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {profileDropdown && (
                <div className="absolute right-0 mt-2 w-48 bg-dark-900 border border-dark-800 rounded-xl shadow-card-dark py-2 z-50">
                  <div className="px-4 py-2 border-b border-dark-800">
                    <p className="text-xs font-bold text-white">{user?.name}</p>
                    <p className="text-[10px] text-slate-400 truncate">{user?.email}</p>
                  </div>
                  <NavLink
                    to="/profile"
                    onClick={() => setProfileDropdown(false)}
                    className="flex items-center gap-2 px-4 py-2 text-xs text-slate-300 hover:bg-dark-850 hover:text-white"
                  >
                    <User className="w-4 h-4" /> View Profile
                  </NavLink>
                  <button
                    onClick={() => {
                      setProfileDropdown(false);
                      handleLogout();
                    }}
                    className="w-full flex items-center gap-2 px-4 py-2 text-xs text-red-400 hover:bg-dark-850 text-left"
                  >
                    <LogOut className="w-4 h-4" /> Logout Session
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content Container */}
        <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
