import React, {useEffect} from 'react';

// Cache global con expiración de 1 segundo
const fetchCache = new Map();

function FetchData({ service, method = 'getAll', methodParams = [], isOpen, onDataLoaded, onLoadingStart, onLoadingEnd, serviceName }) {
    const cacheKey = `${serviceName || service.constructor.name}-${method}-${JSON.stringify(methodParams)}`;

    useEffect(() => {
        if (isOpen && !fetchCache.has(cacheKey)) {
            fetchCache.set(cacheKey, true);
            fetchData();
            
            // Limpiar cache después de 1 segundo
            setTimeout(() => {
                fetchCache.delete(cacheKey);
            }, 1000);
        }
    }, [isOpen, cacheKey]);

    const fetchData = async () => {
        if (onLoadingStart) onLoadingStart();
        
        try {
            const response = await service[method](...methodParams);
            if (response.success) {
                console.log('✅ Datos obtenidos del backend:', serviceName || service.constructor.name, '-', response.data?.length, 'elementos');
                if (onDataLoaded) {
                    onDataLoaded(response.data);
                }
            }
        } catch (error) {
            console.log('❌ Error obteniendo datos:', serviceName || service.constructor.name, error);
        } finally {
            if (onLoadingEnd) onLoadingEnd();
        }
    };

    return null;
}

export default FetchData;
