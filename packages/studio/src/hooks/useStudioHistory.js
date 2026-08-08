import { useCallback } from 'react';

export function useStudioHistory(setLocalHistory, setActiveHistoryIdx) {
  const addToHistory = useCallback(
    (entry) => {
      setLocalHistory((prev) => [entry, ...prev].slice(0, 50));
      if (setActiveHistoryIdx) setActiveHistoryIdx(0);
    },
    [setLocalHistory, setActiveHistoryIdx]
  );

  const deleteFromHistory = useCallback(
    (idx) => {
      setLocalHistory((prev) => prev.filter((_, i) => i !== idx));
    },
    [setLocalHistory]
  );

  return { addToHistory, deleteFromHistory };
}
