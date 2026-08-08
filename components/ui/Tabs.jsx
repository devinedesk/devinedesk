import React, { useState } from 'react';
import clsx from 'clsx';

export function Tabs({ tabs, defaultTab, onChange, className }) {
  const [activeTab, setActiveTab] = useState(defaultTab || (tabs.length > 0 ? tabs[0].id : null));

  const handleTabClick = (id) => {
    setActiveTab(id);
    if (onChange) {
      onChange(id);
    }
  };

  return (
    <div className={clsx('w-full', className)}>
      <div className="flex space-x-1 bg-black/40 p-1 rounded-xl border border-neutral-border-glass backdrop-blur-md">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              className={clsx(
                'w-full rounded-lg py-2.5 text-sm font-medium leading-5 transition-all',
                'ring-white/60 ring-offset-2 ring-offset-primary focus:outline-none focus:ring-2',
                isActive
                  ? 'bg-white/10 text-white shadow-sm border border-white/10'
                  : 'text-neutral-secondary hover:bg-white/[0.03] hover:text-white'
              )}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
      <div className="mt-4">{tabs.find((tab) => tab.id === activeTab)?.content}</div>
    </div>
  );
}
