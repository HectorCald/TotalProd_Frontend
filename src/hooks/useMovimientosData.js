import { useState, useEffect, useCallback } from 'react';
import movimientosAlmacenService from '../services/movimientosAlmacenService';
import { logDataSize } from '../components/utils/DataSizeLogger';

// Cache global para evitar cargas múltiples
let cacheData = null;
let cachePromise = null;

export const useMovimientosData = () => {
    const [data, setData] = useState(cacheData);
    const [loading, setLoading] = useState(!cacheData);
    const [error, setError] = useState(null);

    const fetchData = useCallback(() => {
        // Limpiar cache y promise para forzar nueva petición
        cacheData = null;
        cachePromise = null;

        // Hacer la petición
        setLoading(true);
        setError(null);
        cachePromise = movimientosAlmacenService.getStatsForCharts();

        cachePromise.then(result => {
            if (result.success) {
                cacheData = result.data;
                setData(result.data);
                
                // Registrar el tamaño de los datos obtenidos
                logDataSize(
                    result.data,
                    'movimientosAlmacenService',
                    'getStatsForCharts'
                );
                
                setLoading(false);
            } else {
                setError(result.message);
                setLoading(false);
            }
        }).catch(err => {
            setError(err.message);
            setLoading(false);
        });
    }, []);

    useEffect(() => {
        // Si ya tenemos datos en cache, usarlos
        if (cacheData) {
            setData(cacheData);
            setLoading(false);
            return;
        }

        // Si ya hay una petición en curso, esperar a que termine
        if (cachePromise) {
            cachePromise.then(result => {
                setData(result.data);
                setLoading(false);
            }).catch(err => {
                setError(err);
                setLoading(false);
            });
            return;
        }

        // Hacer la petición solo si no hay datos ni petición en curso
        fetchData();
    }, [fetchData]);

    // Escuchar evento de cambio de sucursal
    useEffect(() => {
        const handleSucursalChange = () => {
            fetchData();
        };

        window.addEventListener('sucursal-changed', handleSucursalChange);
        return () => {
            window.removeEventListener('sucursal-changed', handleSucursalChange);
        };
    }, [fetchData]);

    return { data, loading, error, refresh: fetchData };
};
