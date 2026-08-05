"use client";

import { useNotifications } from '@/src/contexts/NotificationContext';

export default function ToastContainer() {
  const { notifications, markAsRead } = useNotifications();

  // Only show the top 5 to avoid cluttering the screen
  const visibleNotifications = notifications?.slice(0, 5) || [];

  if (visibleNotifications.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      {visibleNotifications.map((n) => (
        <Toast key={n.id} notification={n} onClose={() => markAsRead(n.id)} />
      ))}
    </div>
  );
}

function Toast({ notification, onClose }) {
  const colors = {
    info: 'bg-blue-900/40 border-blue-500/50 text-blue-100',
    success: 'bg-green-900/40 border-green-500/50 text-green-100',
    warning: 'bg-orange-900/40 border-orange-500/50 text-orange-100',
    error: 'bg-red-900/40 border-red-500/50 text-red-100',
  };

  const icons = {
    info: 'ℹ️',
    success: '✅',
    warning: '⚠️',
    error: '❌',
  };

  const style = colors[notification.type] || colors.info;
  const icon = icons[notification.type] || icons.info;

  return (
    <div className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border backdrop-blur-md shadow-2xl transition-all duration-300 animate-in slide-in-from-right-8 w-80 ${style}`}>
      <div className="mt-0.5">{icon}</div>
      <div className="flex-1">
        <h4 className="font-bold text-sm">{notification.title}</h4>
        <p className="text-xs opacity-80 mt-1">{notification.message}</p>
      </div>
      <button 
        onClick={onClose}
        className="opacity-50 hover:opacity-100 transition-opacity p-1"
        aria-label="Dismiss"
      >
        ✕
      </button>
    </div>
  );
}
