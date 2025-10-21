import { useState, useEffect } from 'react';
import movimientosAlmacenService from '../services/movimientosAlmacenService';

// Cache global para evitar cargas múltiples
let cacheData = null;
let cachePromise = null;

export const useMovimientosData = () => {
    const [data, setData] = useState(cacheData);
    const [loading, setLoading] = useState(!cacheData);
    const [error, setError] = useState(null);

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
        setLoading(true);
        cachePromise = movimientosAlmacenService.getAllSinLimite();

        cachePromise.then(result => {
            if (result.success) {
                cacheData = result.data;
                setData(result.data);
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

    return { data, loading, error };
};
