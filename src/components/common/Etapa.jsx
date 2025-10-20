import React from 'react';
import styles from './Etapa.module.css';
import { BoxIcon } from 'boxicons-react';

function Etapa({ etapas, etapaActual = 0 }) {
    return (
        <div className={styles.container}>
            <div className={styles.tracker}>
                {etapas.map((etapa, index) => {
                    const isActive = index === etapaActual;
                    const isCompleted = etapaActual >= 0 && index < etapaActual;
                    const isPending = etapaActual >= 0 && index > etapaActual;
                    
                    return (
                        <div key={index} className={styles.etapaContainer}>
                            <div 
                                className={`${styles.etapa} ${
                                    isActive ? styles.active : 
                                    isCompleted ? styles.completed : 
                                    styles.pending
                                }`}
                            >
                                <div className={styles.iconContainer}>
                                    <BoxIcon 
                                        name={etapa.icon} 
                                        size="sm" 
                                        className={`${styles.icon} ${
                                            isActive && etapa.icon === 'loader-alt' ? styles.spinning : ''
                                        }`}
                                    />
                                </div>
                            </div>
                            <div className={`${styles.label} ${
                                isActive ? styles.labelActive : 
                                isCompleted ? styles.labelCompleted : 
                                styles.labelPending
                            }`}>
                                {etapa.label}
                            </div>
                            {index < etapas.length - 1 && (
                                <div className={`${styles.line} ${
                                    isCompleted ? styles.lineCompleted : styles.linePending
                                }`} />
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default Etapa;
