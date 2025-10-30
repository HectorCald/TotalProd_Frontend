import { useState, useEffect } from 'react';
import styles from './Version.module.css';

function Version() {
    const [cacheVersion, setCacheVersion] = useState('');

    useEffect(() => {
        try {
            const stored = localStorage.getItem('cacheVersion');
            setCacheVersion(stored || 'N/A');
        } catch (e) {
            setCacheVersion('N/A');
        }
    }, []);

    return (
        <div className={styles.versionContainer}>
            <p className={styles.version}>
                Versión BETA {cacheVersion || 'Cargando...'}
            </p>
        </div>
    )
}
export default Version