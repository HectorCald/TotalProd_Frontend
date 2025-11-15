import { useState, useCallback, useMemo } from 'react';

const readFromSession = (key, fallback) => {
    if (typeof window === 'undefined') {
        return fallback;
    }

    try {
        const storedValue = sessionStorage.getItem(key);
        if (!storedValue) {
            return fallback;
        }
        return JSON.parse(storedValue);
    } catch (error) {
        console.warn(`[useSessionCache] No se pudo leer la clave ${key} del sessionStorage`, error);
        return fallback;
    }
};

const writeToSession = (key, value) => {
    if (typeof window === 'undefined') {
        return;
    }
    try {
        sessionStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
        console.warn(`[useSessionCache] No se pudo guardar la clave ${key} en sessionStorage`, error);
    }
};

function useSessionCache({ key, defaultValue }) {
    const [value, setValueState] = useState(() => readFromSession(key, defaultValue));

    const hasCache = useMemo(() => {
        if (Array.isArray(value)) {
            return value.length > 0;
        }
        return value !== undefined && value !== null && value !== defaultValue;
    }, [value, defaultValue]);

    const setValue = useCallback((updater) => {
        setValueState((prev) => {
            const nextValue = typeof updater === 'function' ? updater(prev) : updater;
            writeToSession(key, nextValue);
            return nextValue;
        });
    }, [key]);

    const clearValue = useCallback(() => {
        if (typeof window !== 'undefined') {
            sessionStorage.removeItem(key);
        }
        setValueState(defaultValue);
    }, [key, defaultValue]);

    return {
        value,
        setValue,
        clearValue,
        hasCache,
    };
}

export default useSessionCache;

