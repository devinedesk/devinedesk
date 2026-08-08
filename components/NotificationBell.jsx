'use client';

import { useState, useEffect, useRef } from 'react';
import { Bell, Check, BellRing } from 'lucide-react';
import { toast } from 'react-hot-toast';

export function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications');
      if (res.ok) {
        const data = await res.json();
        setNotifications(data || []);
      }
    } catch (err) {
      console.error('Failed to load notifications', err);
    }
  };

  useEffect(() => {
    fetchNotifications();

    const interval = setInterval(fetchNotifications, 60000); // Poll every minute
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAllRead = async () => {
    try {
      const res = await fetch('/api/notifications', { method: 'POST' });
      if (res.ok) {
        setNotifications([]);
        setIsOpen(false);
        toast.success('All caught up!');
      }
    } catch (err) {
      toast.error('Failed to mark read');
    }
  };

  const getIconColor = (type) => {
    switch (type) {
      case 'success':
        return 'text-green-400 bg-green-400/10';
      case 'error':
        return 'text-red-400 bg-red-400/10';
      case 'warning':
        return 'text-yellow-400 bg-yellow-400/10';
      default:
        return 'text-primary bg-primary/10';
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl text-neutral-secondary hover:text-white hover:bg-white/5 transition-colors"
      >
        <Bell className="h-5 w-5" />
        {notifications.length > 0 && (
          <span className="absolute top-1.5 right-1.5 h-2.5 w-2.5 bg-red-500 rounded-full border border-neutral-panel-bg shadow-[0_0_8px_rgba(239,68,68,0.6)] animate-pulse"></span>
        )}
      </button>

      {isOpen && (
        <div className="absolute bottom-full left-0 mb-2 w-80 bg-neutral-800/90 backdrop-blur-xl border border-neutral-border-glass rounded-xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="p-4 border-b border-neutral-border-glass flex items-center justify-between bg-white/5">
            <h3 className="font-semibold text-white flex items-center gap-2">
              Notifications
              {notifications.length > 0 && (
                <span className="bg-primary/20 text-primary text-xs font-bold px-2 py-0.5 rounded-md">
                  {notifications.length}
                </span>
              )}
            </h3>
            {notifications.length > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs text-neutral-secondary hover:text-white flex items-center gap-1 transition-colors"
              >
                <Check className="h-3 w-3" /> Mark all read
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-neutral-border-glass">
            {notifications.length === 0 ? (
              <div className="p-8 text-center flex flex-col items-center justify-center">
                <BellRing className="h-8 w-8 text-neutral-600 mb-3" />
                <p className="text-sm text-neutral-400">You're all caught up!</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  className="p-4 hover:bg-white/5 transition-colors cursor-pointer group"
                >
                  <div className="flex gap-3">
                    <div
                      className={`h-8 w-8 rounded-full flex shrink-0 items-center justify-center ${getIconColor(notif.type)}`}
                    >
                      {notif.type === 'success' ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Bell className="h-4 w-4" />
                      )}
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-white group-hover:text-primary transition-colors">
                        {notif.title}
                      </h4>
                      <p className="text-xs text-neutral-400 mt-1 line-clamp-2">{notif.message}</p>
                      <span className="text-[10px] text-neutral-500 mt-2 block">
                        {new Date(notif.createdAt).toLocaleDateString()} at{' '}
                        {new Date(notif.createdAt).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
