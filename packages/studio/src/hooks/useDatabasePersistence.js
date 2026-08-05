import { useState, useEffect, useRef } from 'react';

const getDeviceId = () => {
    if (typeof window === 'undefined') return 'unknown';
    let id = localStorage.getItem('device_id');
    if (!id) {
        id = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15);
        localStorage.setItem('device_id', id);
    }
    return id;
};

export function useDatabasePersistence(key, initialState) {
    const [state, setState] = useState(initialState);
    const [isLoaded, setIsLoaded] = useState(false);
    const timerRef = useRef(null);

    // 1. Initial Load (Fast sync from localStorage, authoritative sync from DB)
    useEffect(() => {
        let isMounted = true;

        const load = async () => {
            // Fast load
            const localData = localStorage.getItem(key);
            if (localData) {
                try {
                    setState(JSON.parse(localData));
                } catch (e) {
                    console.error('Failed to parse local state for', key);
                }
            }
            setIsLoaded(true); // Enable rendering quickly based on local data

            // Authoritative load from DB
            try {
                const res = await fetch(`/api/state?key=${encodeURIComponent(key)}`, {
                    headers: { 'x-user-id': getDeviceId() }
                });
                if (res.ok && isMounted) {
                    const dbData = await res.json();
                    if (dbData && dbData.value) {
                        const parsedDbData = JSON.parse(dbData.value);
                        setState(parsedDbData);
                        localStorage.setItem(key, dbData.value);
                    }
                }
            } catch (err) {
                console.error('Failed to load state from DB for', key);
            }
        };

        load();
        return () => { isMounted = false; };
    }, [key]);

    // 2. Save wrapper
    const setPersistentState = (newState) => {
        setState(newState);

        if (!isLoaded) return; // Prevent overwriting DB before initial load

        // Save to local storage instantly
        const serialized = JSON.stringify(newState);
        localStorage.setItem(key, serialized);

        // Debounce DB sync to prevent spamming the backend
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => {
            fetch('/api/state', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-user-id': getDeviceId()
                },
                body: JSON.stringify({ key, value: serialized })
            }).catch(err => console.error('Failed to save state to DB for', key, err));
        }, 1000);
    };

    return [state, setPersistentState, isLoaded];
}
