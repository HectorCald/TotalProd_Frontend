import { useCallback, useEffect, useRef } from 'react';
import { logDataSize } from '../utils/DataSizeLogger';

function FetchDataProgressive({
    service,
    method = 'getAll',
    methodParams = [],
    isOpen,
    onDataLoaded,
    onLoadingStart,
    onLoadingEnd,
    onError,
    serviceName,
    page = 1,
    limit = 30,
    // Callback para cuando cambia hasMorePages
    onHasMorePagesChange,
    // Callback para cuando se acumulan datos (página > 1)
    onDataAccumulated
}) {
    const lastFetchKeyRef = useRef(null);
    const isFetchingRef = useRef(false);

    // Crear una clave única basada en los parámetros de la petición (sin incluir page)
    // Esto permite detectar cuando cambian los filtros/búsqueda
    const baseParams = methodParams.filter((_, index) => {
        // Excluir el primer parámetro si es page, o usar todos los params excepto page
        return true;
    });
    const cacheKey = `${serviceName || service.constructor.name}-${method}-${JSON.stringify(baseParams)}-page${page}`;

    const fetchData = useCallback(async () => {
        // Prevenir múltiples peticiones simultáneas
        if (isFetchingRef.current) {
            console.log('⏸️ Petición ya en curso, ignorando...');
            return;
        }

        isFetchingRef.current = true;

        if (onLoadingStart) onLoadingStart();

        try {
            // Construir los parámetros de la petición
            // page y limit se pasan primero, luego los demás filtros de methodParams
            const params = [page, limit, ...methodParams];
            
            const response = await service[method](...params);
            
            if (response.success) {
                const data = response.data || [];
                const hasMorePages = response.pagination?.hasNextPage || false;
                
                console.log(
                    `✅ Petición completada (Página ${page}):`,
                    serviceName || service.constructor.name,
                    '-',
                    data.length,
                    'elementos',
                    hasMorePages ? '(hay más páginas)' : '(última página)'
                );
                
                // Registrar el tamaño de los datos obtenidos
                logDataSize(
                    data,
                    serviceName || service.constructor.name,
                    `${method}_page${page}`
                );
                
                // Notificar sobre hasMorePages
                if (onHasMorePagesChange) {
                    onHasMorePagesChange(hasMorePages);
                }
                
                // Si es página 1, reemplazar datos; si es > 1, acumular
                if (page === 1) {
                    if (onDataLoaded) {
                        onDataLoaded(data);
                    }
                } else {
                    // Para páginas siguientes, acumular datos
                    if (onDataAccumulated) {
                        onDataAccumulated(data);
                    }
                }
            } else {
                throw new Error(response.message || 'Error en la respuesta del servidor');
            }
        } catch (error) {
            console.log('❌ Error obteniendo datos:', serviceName || service.constructor.name, error);
            if (onError) {
                onError(error);
            }
        } finally {
            isFetchingRef.current = false;
            if (onLoadingEnd) onLoadingEnd();
        }
    }, [method, methodParams, onDataLoaded, onError, onLoadingEnd, onLoadingStart, service, serviceName, page, limit, onHasMorePagesChange, onDataAccumulated]);

    useEffect(() => {
        if (isOpen) {
            const shouldFetch = lastFetchKeyRef.current !== cacheKey;

            if (shouldFetch) {
                lastFetchKeyRef.current = cacheKey;
                fetchData();
            }
        } else {
            lastFetchKeyRef.current = null;
            isFetchingRef.current = false;
        }
    }, [cacheKey, fetchData, isOpen]);

    return null;
}

export default FetchDataProgressive;

