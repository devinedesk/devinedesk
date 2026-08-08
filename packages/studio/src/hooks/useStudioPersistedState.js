import { useEffect } from 'react';

/**
 * A custom hook that abstracts the loading and debounced saving of a massive state object
 * to and from localStorage. This replaces the huge boilerplate useEffects in Studio components.
 *
 * @param {string} key - The localStorage key
 * @param {Object} stateObject - The current state values as an object
 * @param {Object} setStateFunctions - The corresponding setter functions for each state key
 */
export function useStudioPersistedState(key, stateObject, setStateFunctions) {
  // Persistence: Load
  useEffect(() => {
    try {
      const stored = localStorage.getItem(key);
      if (stored) {
        const data = JSON.parse(stored);
        Object.keys(data).forEach((k) => {
          if (data[k] !== undefined && setStateFunctions[k]) {
            setStateFunctions[k](data[k]);
          }
        });
      }
    } catch (err) {
      console.warn('Failed to load studio persistence:', err);
    }
  }, [key]); // Only run on mount or key change

  // Persistence: Save
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        if (typeof window !== 'undefined') {
          localStorage.setItem(key, JSON.stringify(stateObject));
        }
      } catch (err) {
        console.warn('Failed to save studio persistence:', err);
      }
    }, 500); // 500ms debounce
    return () => clearTimeout(timer);
  }, [key, ...Object.values(stateObject)]);
}
