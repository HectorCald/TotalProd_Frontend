import { useState, useEffect } from 'react';
import styles from './Version.module.css';

function Version() {
    const [cacheVersion, setCacheVersion] = useState('');

    useEffect(() => {
        const getCacheVersion = async () => {
            try {
                // Obtener todas las claves del cache
                const cacheNames = await caches.keys();
                
                // Buscar el cache que empiece con 'totalprod-cache-v'
                const totalprodCache = cacheNames.find(name => name.startsWith('totalprod-cache-v'));
                
                if (totalprodCache) {
                    // Extraer solo el número de la versión
                    const versionMatch = totalprodCache.match(/totalprod-cache-v(\d+)/);
                    if (versionMatch) {
                        setCacheVersion(versionMatch[1]);
                    }
                }
            } catch (error) {
                console.warn('Error obteniendo versión del cache:', error);
            }
        };

        getCacheVersion();
    }, []);

    return (
        <div className={styles.versionContainer}>
            <p className={styles.version}>
                Versión TP {cacheVersion && `${cacheVersion}`}
            </p>
        </div>
    )
}
export default Version