import { useEffect, useRef } from 'react';

const getDeviceId = () => {
    if (typeof window === 'undefined') return 'unknown';
    let id = localStorage.getItem('device_id');
    if (!id) {
        id = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15);
        localStorage.setItem('device_id', id);
    }
    return id;
};

export function useDatabaseSync(key, currentState, onLoad) {
    const timerRef = useRef(null);
    const hasLoadedRef = useRef(false);

    // 1. Initial Load from DB
    useEffect(() => {
        let isMounted = true;
        
        const load = async () => {
            try {
                const res = await fetch(`/api/state?key=${encodeURIComponent(key)}`, {
                    headers: { 'x-user-id': getDeviceId() }
                });
                if (res.ok && isMounted) {
                    const dbData = await res.json();
                    if (dbData && dbData.value) {
                        localStorage.setItem(key, dbData.value);
                        try {
                            const parsed = JSON.parse(dbData.value);
                            if (onLoad) onLoad(parsed);
                        } catch (e) {
                            console.error('Failed to parse DB state', e);
                        }
                    }
                }
            } catch (err) {
                console.error('Failed to sync state from DB', err);
            } finally {
                hasLoadedRef.current = true;
            }
        };

        load();

        return () => { isMounted = false; };
    }, [key]); // Intentionally not including onLoad to avoid infinite loops if passed as inline function

    // 2. Save on state change
    useEffect(() => {
        if (!hasLoadedRef.current || !currentState) return;

        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => {
            fetch('/api/state', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-user-id': getDeviceId()
                },
                body: JSON.stringify({ key, value: JSON.stringify(currentState) })
            }).catch(err => console.error('Failed to save state to DB', err));
        }, 2000);

    }, [currentState, key]);
}
