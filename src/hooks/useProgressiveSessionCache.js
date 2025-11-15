import { useMemo, useRef, useEffect, useCallback } from 'react';
import useSessionCache from './useSessionCache';

function useProgressiveSessionCache({
    baseKey,
    filtersSignature,
    pageSize = 30,
}) {
    const cacheKey = useMemo(() => `${baseKey}::${filtersSignature}`, [baseKey, filtersSignature]);

    const {
        value: cachedItems,
        setValue: setCachedItems,
    } = useSessionCache({
        key: cacheKey,
        defaultValue: [],
    });

    const hydratedRef = useRef(false);

    useEffect(() => {
        hydratedRef.current = false;
    }, [cacheKey]);

    const hydrateFromCache = useCallback((setter) => {
        if (hydratedRef.current) {
            return false;
        }
        if (cachedItems.length === 0) {
            return false;
        }
        setter(cachedItems);
        hydratedRef.current = true;
        console.log(`[${baseKey}] Hidratación desde cache de sesión. Registros: ${cachedItems.length}`);
        return true;
    }, [cachedItems, baseKey]);

    const persistFirstPage = useCallback((items) => {
        setCachedItems(items.slice(0, pageSize));
        hydratedRef.current = true;
        console.log(`[${baseKey}] Datos actualizados desde servidor. Registros recibidos: ${items.length}`);
    }, [baseKey, pageSize, setCachedItems]);

    const mutateCachedItems = useCallback((updater) => {
        setCachedItems(prev => {
            const next = typeof updater === 'function' ? updater(prev) : updater;
            if (!next) {
                return [];
            }
            return next.slice(0, pageSize);
        });
    }, [pageSize, setCachedItems]);

    const hasCachedItems = cachedItems.length > 0;

    return {
        cacheKey,
        cachedItems,
        hasCachedItems,
        hydrateFromCache,
        persistFirstPage,
        mutateCachedItems,
    };
}

export default useProgressiveSessionCache;

