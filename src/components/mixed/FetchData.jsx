import { useCallback, useEffect } from 'react';

// Cache global con expiración de 1 segundo
const fetchCache = new Map();

function FetchData({ service, method = 'getAll', methodParams = [], isOpen, onDataLoaded, onLoadingStart, onLoadingEnd, onError, serviceName }) {
    const cacheKey = `${serviceName || service.constructor.name}-${method}-${JSON.stringify(methodParams)}`;

    const fetchData = useCallback(async () => {
        if (onLoadingStart) onLoadingStart();
        
        try {
            const response = await service[method](...methodParams);
            if (response.success) {
                console.log('✅ Petición completada:', serviceName || service.constructor.name, '-', response.data?.length, 'elementos');
                if (onDataLoaded) {
                    onDataLoaded(response.data);
                }
            }
        } catch (error) {
            console.log('❌ Error obteniendo datos:', serviceName || service.constructor.name, error);
            if (onError) {
                onError(error);
            }
        } finally {
            if (onLoadingEnd) onLoadingEnd();
        }
    }, [method, methodParams, onDataLoaded, onError, onLoadingEnd, onLoadingStart, service, serviceName]);

    useEffect(() => {
        if (isOpen && !fetchCache.has(cacheKey)) {
            fetchCache.set(cacheKey, true);
            fetchData();
            
            // Limpiar cache después de 1 segundo
            setTimeout(() => {
                fetchCache.delete(cacheKey);
            }, 1000);
        }
    }, [cacheKey, fetchData, isOpen]);

    return null;
}

export default FetchData;
