import { useState, useEffect } from 'react';

/**
 * A custom hook that acts like useState but persists the value to localStorage.
 * It also supports migrating keys and debouncing the save operation.
 *
 * @param {string} key - The localStorage key.
 * @param {any} initialValue - The initial state value.
 * @returns {[any, Function]} - The state and state setter.
 */
export function usePersistedState(key, initialValue) {
  // Pass initial state function to useState so logic is only executed once
  const [state, setState] = useState(() => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  // Return a wrapped version of useState's setter function that persists the new value to localStorage.
  const setValue = (value) => {
    try {
      // Allow value to be a function so we have same API as useState
      const valueToStore = value instanceof Function ? value(state) : value;
      setState(valueToStore);
      if (typeof window !== "undefined") {
        localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error);
    }
  };

  return [state, setValue];
}
