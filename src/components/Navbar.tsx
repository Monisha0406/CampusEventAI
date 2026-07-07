import { useState, useEffect } from 'react';
import { Bell, LogOut, Moon, Sun, User, Calendar, Award } from 'lucide-react';
import { apiFetch, removeToken, removeUser } from '../utils';
import { Notification } from '../types';

interface NavbarProps {
  currentUser: any;
  onLogout: () => void;
  onNavigate: (tab: string) => void;
  currentTab: string;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  notificationTrigger: number;
}

export default function Navbar({ currentUser, onLogout, onNavigate, currentTab, theme, toggleTheme, notificationTrigger }: NavbarProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);

  useEffect(() => {
    if (currentUser) {
      fetchNotifications();
    }
  }, [currentUser, notificationTrigger]);

  const fetchNotifications = async () => {
    try {
      const data = await apiFetch('/api/notifications');
      setNotifications(data);
    } catch (e) {
      console.error('Failed to load notifications:', e);
    }
  };

  const handleMarkAsRead = async () => {
    try {
      await apiFetch('/api/notifications/read', { method: 'POST' });
      setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
    } catch (e) {
      console.error(e);
    }
  };

  const unreadCount = notifications.filter(n => n.is_read === 0).length;

  return (
    <nav className="sticky top-0 z-40 bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-800 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo & Platform Name */}
          <div className="flex items-center">
            <div 
              onClick={() => onNavigate('dashboard')} 
              className="flex items-center space-x-2 cursor-pointer group"
              id="nav-logo-container"
            >
              <div className="bg-blue-600 dark:bg-blue-500 p-2 rounded-lg text-white group-hover:bg-blue-700 transition" id="nav-logo-icon">
                <Calendar className="w-5 h-5 animate-pulse" />
              </div>
              <div className="flex flex-col" id="nav-logo-text">
                <span className="font-display font-bold text-lg leading-tight text-gray-900 dark:text-white">CampusEvent AI</span>
                <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">XYZ TechFest &apos;26</span>
              </div>
            </div>

            {/* Main Tabs */}
            <div className="hidden md:ml-10 md:flex md:space-x-4" id="nav-tabs-desktop">
              <button
                id="tab-dashboard-btn"
                onClick={() => onNavigate('dashboard')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition ${
                  currentTab === 'dashboard'
                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400'
                    : 'text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800'
                }`}
              >
                Dashboard
              </button>
              <button
                id="tab-events-btn"
                onClick={() => onNavigate('events')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition ${
                  currentTab === 'events'
                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400'
                    : 'text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800'
                }`}
              >
                Browse Events
              </button>
              {currentUser?.role === 'student' && (
                <button
                  id="tab-registrations-btn"
                  onClick={() => onNavigate('registrations')}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition ${
                    currentTab === 'registrations'
                      ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400'
                      : 'text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800'
                  }`}
                >
                  My Registrations
                </button>
              )}
              {currentUser?.role === 'admin' && (
                <button
                  id="tab-admin-btn"
                  onClick={() => onNavigate('admin')}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition ${
                    currentTab === 'admin'
                      ? 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400'
                      : 'text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800'
                  }`}
                >
                  Admin Console
                </button>
              )}
            </div>
          </div>

          {/* Action Buttons & Utilities */}
          <div className="flex items-center space-x-3">
            {/* Theme Toggle */}
            <button
              id="theme-toggle-btn"
              onClick={toggleTheme}
              className="p-2 rounded-full text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 transition"
              title="Toggle Dark Mode"
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            {/* Notifications Dropdown */}
            {currentUser && (
              <div className="relative" id="notifications-menu">
                <button
                  id="notif-dropdown-trigger"
                  onClick={() => {
                    setShowNotifDropdown(!showNotifDropdown);
                    if (!showNotifDropdown && unreadCount > 0) {
                      handleMarkAsRead();
                    }
                  }}
                  className="p-2 rounded-full text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 transition relative"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span 
                      id="notif-badge" 
                      className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center animate-bounce"
                    >
                      {unreadCount}
                    </span>
                  )}
                </button>

                {showNotifDropdown && (
                  <div 
                    id="notif-dropdown-box" 
                    className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-gray-100 dark:border-slate-700 py-1 overflow-hidden z-50 text-sm"
                  >
                    <div className="px-4 py-2 border-b border-gray-100 dark:border-slate-700 font-bold text-gray-900 dark:text-white flex justify-between items-center">
                      <span>Recent Notifications</span>
                      {unreadCount > 0 && <span className="text-xs bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full">New</span>}
                    </div>
                    <div className="max-h-64 overflow-y-auto divide-y divide-gray-50 dark:divide-slate-700" id="notif-items-list">
                      {notifications.length === 0 ? (
                        <div className="px-4 py-6 text-center text-gray-400 dark:text-slate-500">
                          No notifications yet.
                        </div>
                      ) : (
                        notifications.map(notif => (
                          <div 
                            key={notif.id} 
                            className={`p-3 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition ${notif.is_read === 0 ? 'bg-blue-50/40 dark:bg-blue-950/20' : ''}`}
                          >
                            <p className="font-semibold text-gray-800 dark:text-slate-200">{notif.title}</p>
                            <p className="text-xs text-gray-600 dark:text-slate-400 mt-0.5">{notif.message}</p>
                            <p className="text-[10px] text-gray-400 dark:text-slate-500 mt-1">
                              {notif.created_at ? new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* User Profile Info & Profile navigation button */}
            {currentUser && (
              <div className="flex items-center space-x-2" id="user-profile-widget">
                <button
                  id="go-profile-btn"
                  onClick={() => onNavigate('profile')}
                  className="flex items-center space-x-2 hover:bg-gray-50 dark:hover:bg-slate-800 p-1.5 rounded-full transition"
                >
                  <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-700 dark:text-blue-300 text-sm font-bold border border-blue-200 dark:border-blue-800">
                    {currentUser.profile_image ? (
                      <img src={currentUser.profile_image} alt="User profile" className="w-full h-full rounded-full object-cover" />
                    ) : (
                      currentUser.name.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="hidden lg:block text-left">
                    <p className="text-xs font-bold text-gray-900 dark:text-slate-100 leading-tight">{currentUser.name}</p>
                    <p className="text-[10px] text-gray-500 dark:text-slate-400 capitalize">{currentUser.role}</p>
                  </div>
                </button>

                <button
                  id="logout-btn"
                  onClick={onLogout}
                  className="p-2 rounded-full text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition"
                  title="Logout Session"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
