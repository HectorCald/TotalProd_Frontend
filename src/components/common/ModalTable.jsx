import React, { useEffect, useMemo, useState } from 'react';
import styles from './ModalTable.module.css';
import HeaderModal from './HeaderModal';
import Select from './Select';
import { formatCurrency } from '../../utils/numberUtils';

const currencyHeaderRegex = /(total|subtotal|monto|saldo|precio)/i;
const numericStringRegex = /^-?\d+(?:\.\d+)?$/;

const ModalTable = ({ isOpen, title, headers = [], rows = [], onClose, getCellBadge = null, filters = {}, columnWidths = {}, onScroll = null }) => {
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

    const currencyColumnSet = useMemo(() => {
        const set = new Set();
        headers.forEach((header, idx) => {
            const headerText = typeof header === 'string' ? header : String(header ?? '');
            if (currencyHeaderRegex.test(headerText.toLowerCase())) {
                set.add(idx);
            }
        });
        return set;
    }, [headers]);

    if (!isOpen) return null;

    return (
        <div className={`${styles.overlay} ${isVisible ? styles.overlayVisible : ''}`} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <HeaderModal title={title} onClose={onClose} />
                <div className={styles.contentWrapper}>
                    <div className={styles.tableScroll} onScroll={onScroll}>
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
                                                        containerStyle={{ padding: '0', margin: '0', height: '40px', background: 'none' }}
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
                                                let displayCell = cell;

                                                if (
                                                    !badge &&
                                                    currencyColumnSet.has(cIdx) &&
                                                    !React.isValidElement(cell)
                                                ) {
                                                    if (typeof cell === 'number' && Number.isFinite(cell)) {
                                                        displayCell = formatCurrency(cell);
                                                    } else if (typeof cell === 'string') {
                                                        const trimmed = cell.trim();
                                                        if (numericStringRegex.test(trimmed)) {
                                                            displayCell = formatCurrency(parseFloat(trimmed));
                                                        }
                                                    } else if (cell && typeof cell === 'object' && cell.type === 'currency') {
                                                        const value = Number(cell.value) || 0;
                                                        const includePrefix = cell.includePrefix !== false;
                                                        displayCell = formatCurrency(value, includePrefix);
                                                    }
                                                }

                                                return (
                                                    <td key={cIdx} style={{ width: columnWidths[cIdx] || 'auto' }}>
                                                        {badge ? (
                                                            <span className={`${styles.cellBadge} ${badge.className ? styles[badge.className] : ''}`}>{badge.text}</span>
                                                        ) : (
                                                            displayCell
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


