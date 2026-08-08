'use client';

import { useState, useEffect, useRef } from 'react';
import { Bell, Check, Trash2 } from 'lucide-react';
import clsx from 'clsx';

/**
 * Global Notifications Dropdown Component
 * Fetches and displays unread alerts. Provides a "Mark all as read" capability.
 */
export function NotificationsDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch notifications on mount and periodically (e.g., every 60s)
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications');
      if (res.ok) {
        const data = await res.json();
        setNotifications(data || []);
      }
    } catch (err) {
      console.error('Failed to fetch notifications', err);
    }
  };

  const markAllAsRead = async () => {
    setLoading(true);
    try {
      await fetch('/api/notifications', { method: 'POST' });
      setNotifications([]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id) => {
    try {
      await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: [id] }),
      });
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const unreadCount = notifications.length;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-neutral-secondary hover:text-white rounded-lg hover:bg-white/5 transition-colors"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 h-2.5 w-2.5 bg-red-500 rounded-full border-2 border-black"></span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-neutral-900 border border-neutral-border-glass rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center justify-between p-4 border-b border-neutral-border-glass bg-black/20">
            <h3 className="font-semibold text-white">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                disabled={loading}
                className="text-xs text-primary hover:text-primary-hover flex items-center gap-1 transition-colors"
              >
                <Check className="h-3 w-3" /> Mark all read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {unreadCount === 0 ? (
              <div className="p-8 text-center text-sm text-neutral-secondary flex flex-col items-center gap-2">
                <Bell className="h-6 w-6 opacity-50" />
                <p>You&apos;re all caught up!</p>
              </div>
            ) : (
              <div className="divide-y divide-neutral-border-glass">
                {notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className="p-4 hover:bg-white/[0.02] transition-colors relative group"
                  >
                    <div className="flex gap-3">
                      <div
                        className={clsx(
                          'mt-1 h-2 w-2 rounded-full flex-shrink-0',
                          notif.type === 'error'
                            ? 'bg-red-500'
                            : notif.type === 'success'
                              ? 'bg-green-500'
                              : notif.type === 'warning'
                                ? 'bg-yellow-500'
                                : 'bg-primary'
                        )}
                      ></div>
                      <div>
                        <p className="text-sm font-medium text-white">{notif.title}</p>
                        <p className="text-xs text-neutral-secondary mt-1">{notif.message}</p>
                        <p className="text-[10px] text-neutral-secondary/50 mt-2">
                          {new Date(notif.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => markAsRead(notif.id)}
                      className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 p-1 text-neutral-secondary hover:text-white transition-all bg-black/50 rounded-md"
                      title="Mark as read"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="p-3 border-t border-neutral-border-glass text-center bg-black/20">
            <button className="text-xs text-neutral-secondary hover:text-white transition-colors">
              View all history
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
