import React, { useEffect, useState } from 'react';
import styles from './ModalTable.module.css';
import HeaderModal from './HeaderModal';
import Select from './Select';

const ModalTable = ({ isOpen, title, headers = [], rows = [], onClose, getCellBadge = null, filters = {}, columnWidths = {} }) => {
    // filters: { [columnIndex]: { value, onChange, options: [{value,label}] } }
    const [isVisible, setIsVisible] = useState(false);

    // Manejar animación de entrada
    useEffect(() => {
        if (isOpen) {
            setIsVisible(false); // Resetear estado inicial
            // Pequeño delay para que se vea la animación de entrada
            const timer = setTimeout(() => {
                setIsVisible(true);
            }, 10);
            return () => clearTimeout(timer);
        } else {
            setIsVisible(false); // Limpiar estado al cerrar
        }
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') onClose?.();
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className={`${styles.overlay} ${isVisible ? styles.overlayVisible : ''}`} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <HeaderModal title={title} onClose={onClose} />
                <div className={styles.contentWrapper}>
                    <div className={styles.tableScroll}>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    {headers.map((header, idx) => (
                                        <th key={idx} style={{ width: columnWidths[idx] || 'auto' }}>
                                            <div className={styles.filterHeader}>
                                                <span>{header}</span>
                                                {filters[idx] ? (
                                                    <Select
                                                        iconOnly
                                                        icon='filter'
                                                        value={filters[idx].value}
                                                        onChange={(v) => filters[idx].onChange?.(v)}
                                                        options={(filters[idx].options || []).map(op => ({ value: op.value, label: op.label }))}
                                                    />
                                                ) : null}
                                            </div>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {rows.length === 0 ? (
                                    <tr>
                                        <td className={styles.emptyCell} colSpan={headers.length}>Sin datos</td>
                                    </tr>
                                ) : (
                                    rows.map((row, rIdx) => (
                                        <tr key={rIdx}>
                                            {(Array.isArray(row) ? row : headers.map((_, cIdx) => row?.[cIdx])).map((cell, cIdx) => {
                                                const badge = typeof getCellBadge === 'function' ? getCellBadge(row, cIdx) : null;
                                                return (
                                                    <td key={cIdx} style={{ width: columnWidths[cIdx] || 'auto' }}>
                                                        {badge ? (
                                                            <span className={`${styles.cellBadge} ${badge.className ? styles[badge.className] : ''}`}>{badge.text}</span>
                                                        ) : (
                                                            cell
                                                        )}
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ModalTable;


