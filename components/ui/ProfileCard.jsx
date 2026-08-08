'use client';

import React from 'react';
import { Avatar } from './Avatar';
import { Badge } from './Badge';

export function ProfileCard({ user, onActionClick, actionLabel = 'Message' }) {
  if (!user) return null;

  return (
    <div className="bg-app-bg border border-white/10 rounded-xl p-6 flex flex-col items-center shadow-lg transition-transform hover:-translate-y-1 w-full max-w-sm">
      <div className="mb-4 relative">
        <Avatar src={user.image} name={user.name} size="lg" className="w-24 h-24 text-2xl border-4 border-app-bg" />
        {user.status === 'online' && (
          <span className="absolute bottom-1 right-1 w-5 h-5 bg-green-500 border-4 border-app-bg rounded-full"></span>
        )}
      </div>
      <h3 className="text-xl font-bold text-white mb-1">{user.name}</h3>
      <p className="text-gray-400 text-sm mb-3">{user.role || 'Member'}</p>
      
      {user.badges && user.badges.length > 0 && (
        <div className="flex flex-wrap gap-2 justify-center mb-6">
          {user.badges.map((badge, idx) => (
            <Badge key={idx} variant={badge.variant || 'default'}>
              {badge.label}
            </Badge>
          ))}
        </div>
      )}

      {user.bio && (
        <p className="text-center text-gray-300 text-sm mb-6 line-clamp-3">
          {user.bio}
        </p>
      )}

      {onActionClick && (
        <button
          onClick={() => onActionClick(user)}
          className="w-full py-2 bg-cyan-500/10 text-cyan-400 font-medium rounded-lg hover:bg-cyan-500/20 transition-colors border border-cyan-500/20"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
