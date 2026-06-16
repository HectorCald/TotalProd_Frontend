import React, { useRef, useState } from 'react';
import Input from '../inputs/Input';
import InputSelect from '../inputs/InputSelect';
import InputSelectMultiple from '../inputs/InputSelectMultiple';
import Skeleton from '../widgets/Skeleton';
import styles from './TablaEditable.module.css';

/**
 * Tabla editable para importación de datos.
 * columns: [{ header, accessor, colConfig: { type, required }, options: [{value, label}] }]
 * rows: array de objetos
 * onCellChange: (rowIdx, key, value) => void
 * rowErrors: { [rowIdx]: { [key]: boolean } }
 */
const TablaEditable = ({ columns = [], rows = [], onCellChange, rowErrors = {}, isLoading = false, readOnly = false }) => {
  const scrollRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, scrollLeft: 0 });

  const handleMouseDown = (e) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    dragStart.current = { x: e.clientX, scrollLeft: scrollRef.current.scrollLeft };
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    e.preventDefault();
    const dx = e.clientX - dragStart.current.x;
    scrollRef.current.scrollLeft = dragStart.current.scrollLeft - dx;
  };

  const stopDrag = () => setIsDragging(false);

  if (columns.length === 0) return null;

  return (
    <div className={styles.wrapper}>
      <div
        ref={scrollRef}
        className={`${styles.scrollContainer} ${isDragging ? styles.dragging : ''}`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={stopDrag}
        onMouseLeave={stopDrag}
      >
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.thIndex}>#</th>
              {columns.map((col) => (
                <th key={col.accessor} className={`${styles.th} ${col.accessor === 'name' ? styles.stickyNameCol : ''}`}>
                  {col.header.toUpperCase()}
                  {col.colConfig?.required && <span className={styles.required}> *</span>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 6 }).map((_, index) => (
                <tr key={`skeleton-${index}`} className={styles.tr}>
                  <td className={styles.tdIndex}>{index + 1}</td>
                  {columns.map((col, colIdx) => {
                    const cellMinWidth = col.colConfig?.type === 'number' ? '120px' : '280px';
                    return (
                      <td key={colIdx} className={`${styles.td} ${col.accessor === 'name' ? styles.stickyNameCol : ''}`} style={{ minWidth: cellMinWidth }}>
                        <Skeleton width="100%" height="36px" borderRadius="8px" />
                      </td>
                    );
                  })}
                </tr>
              ))
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 1} className={styles.empty}>
                  Sin datos. Cargue un archivo Excel.
                </td>
              </tr>
            ) : (
              rows.map((row, rowIdx) => (
                <tr key={rowIdx} className={styles.tr}>
                  <td className={styles.tdIndex} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', height: '100%', minHeight: '60px' }}>
                    {rowIdx + 1}
                    {row.id && (
                      <span style={{
                        backgroundColor: 'var(--success-color, #2ecc71)',
                        color: 'white',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        fontSize: '0.7rem',
                        fontWeight: 'bold',
                        lineHeight: '1'
                      }}>
                        ID
                      </span>
                    )}
                  </td>
                  {columns.map((col) => {
                    const hasError = rowErrors[rowIdx]?.[col.accessor];
                    const val = row[col.accessor] ?? '';
                    const cellMinWidth = col.colConfig?.type === 'number' ? '120px' : '280px';
                    const tdClass = `${styles.td} ${col.accessor === 'name' ? styles.stickyNameCol : ''}`;

                    if (col.colConfig?.type === 'select' && col.options?.length > 0) {
                      return (
                        <td key={col.accessor} className={tdClass} style={{ minWidth: cellMinWidth }}>
                          <InputSelect
                            value={val}
                            onChange={(v) => onCellChange(rowIdx, col.accessor, v)}
                            options={col.options}
                            placeholder="—"
                            error={hasError}
                            readOnly={readOnly || col.colConfig?.readOnly}
                          />
                        </td>
                      );
                    }

                    if (col.colConfig?.type === 'multiselect' && col.options?.length > 0) {
                      return (
                        <td key={col.accessor} className={tdClass} style={{ minWidth: cellMinWidth }}>
                          <InputSelectMultiple
                            value={Array.isArray(val) ? val : []}
                            onChange={(v) => onCellChange(rowIdx, col.accessor, v)}
                            options={col.options}
                            placeholder="—"
                            error={hasError}
                            readOnly={readOnly || col.colConfig?.readOnly}
                          />
                        </td>
                      );
                    }

                    return (
                      <td key={col.accessor} className={tdClass} style={{ minWidth: cellMinWidth }}>
                        <Input
                          tipo={col.colConfig?.type === 'number' ? 'number' : 'text'}
                          value={val}
                          onChange={(e) => onCellChange(rowIdx, col.accessor, e.target.value)}
                          error={hasError}
                          min={col.colConfig?.type === 'number' ? '0' : undefined}
                          readOnly={readOnly || col.colConfig?.readOnly}
                        />
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
  );
};

export default TablaEditable;
