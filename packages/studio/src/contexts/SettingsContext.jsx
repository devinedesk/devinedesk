import React, { createContext, useContext, useState, useEffect } from 'react';

const SettingsContext = createContext();

export function SettingsProvider({ children }) {
  const [keys, setKeys] = useState({
    platform_api_key: '', // Kept for legacy standalone testing
  });

  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // 1. Initial load from localStorage (fast sync)
    const localKeys = {
      platform_api_key: localStorage.getItem('platform_api_key') || '',
    };
    setKeys(localKeys);

    // 2. Fetch from DB (authoritative)
    const fetchDbSettings = async () => {
      try {
        const res = await fetch('/api/settings');
        if (res.ok) {
          const dbKeys = await res.json();
          // Merge and save to localStorage
          const merged = { ...localKeys, ...dbKeys };
          setKeys(merged);
          Object.entries(merged).forEach(([k, v]) => {
            if (v) localStorage.setItem(k, v);
          });
        }
      } catch (err) {
        console.error('Failed to sync settings from DB', err);
      } finally {
        setIsLoaded(true);
      }
    };

    fetchDbSettings();
  }, []);

  const updateKey = (keyName, value) => {
    const trimmed = value.trim();
    if (trimmed) {
      localStorage.setItem(keyName, trimmed);
    } else {
      localStorage.removeItem(keyName);
    }
    setKeys((prev) => ({ ...prev, [keyName]: trimmed }));

    // Sync to DB
    fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [keyName]: trimmed }),
    }).catch((err) => console.error('Failed to save setting to DB', err));
  };

  const updateMultipleKeys = (newKeys) => {
    const updated = { ...keys };
    const payload = {};
    Object.entries(newKeys).forEach(([key, value]) => {
      const trimmed = value.trim();
      if (trimmed) {
        localStorage.setItem(key, trimmed);
      } else {
        localStorage.removeItem(key);
      }
      updated[key] = trimmed;
      payload[key] = trimmed;
    });
    setKeys(updated);

    // Sync to DB
    fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).catch((err) => console.error('Failed to save settings to DB', err));
  };

  return (
    <SettingsContext.Provider value={{ keys, updateKey, updateMultipleKeys, isLoaded }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
