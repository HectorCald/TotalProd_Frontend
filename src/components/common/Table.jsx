import React from 'react';
import { BoxIcon } from 'boxicons-react';
import styles from './Table.module.css';

const Table = ({ headers = [], data = [], onRowClick = null, getBadge = null, getCellBadge = null, onScroll = null, getRowInputs = null, inputsHeader = 'Valores', renderCell = null }) => {
  if (!data || data.length === 0) {
    return (
      <div className={styles.tableContainer}>
        <div className={styles.emptyState}>
          <BoxIcon name="inbox" size="48px" />
          <p>No hay datos disponibles</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.tableContainer}>
      {/* Header fijo */}
      <div className={styles.tableHeaderWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              {headers.map((header, index) => (
                <th key={index} className={styles.header}>
                  <div className={styles.headerContent}>
                    <div className={styles.headerText}> 
                      <span>{header.label}</span>
                    </div>
                  </div>
                </th>
              ))}
              {typeof getRowInputs === 'function' && (
                <th className={styles.header}>
                  <div className={styles.headerContent}>
                    <div className={styles.headerText}>
                      <span>{inputsHeader}</span>
                    </div>
                  </div>
                </th>
              )}
            </tr>
          </thead>
        </table>
      </div>
      
      {/* Body con scroll */}
      <div className={styles.tableBodyWrapper} onScroll={onScroll}>
        <table className={styles.table}>
          <tbody>
            {data.map((item, rowIndex) => {
              const badge = getBadge ? getBadge(item) : null;
              return (
                <tr 
                  key={item.id || rowIndex} 
                  className={`${styles.row} ${onRowClick ? styles.clickableRow : ''}`}
                  onClick={() => onRowClick && onRowClick(item)}
                >
                  {headers.map((header, cellIndex) => {
                    const cellBadge = getCellBadge ? getCellBadge(item, header.key) : null;
                    const isFirstCell = cellIndex === 0;
                    const customContent = typeof renderCell === 'function' ? renderCell(item, header.key) : null;
                    const enhancedContent = (() => {
                      if (customContent && React.isValidElement(customContent) && customContent.type === 'input') {
                        const prevClass = customContent.props.className || '';
                        const nextClass = `${prevClass} ${styles.inputTable}`.trim();
                        return React.cloneElement(customContent, { className: nextClass });
                      }
                      return customContent;
                    })();
                    return (
                      <td key={cellIndex} className={styles.cell}>
                        <div className={isFirstCell ? styles.cellWithBadge : ''}>
                          {cellBadge ? (
                            <span 
                              className={`${styles.cellBadge} ${cellBadge.className ? styles[cellBadge.className] : ''}`}
                            >
                              {cellBadge.text}
                            </span>
                          ) : (
                            (enhancedContent !== null && enhancedContent !== undefined)
                              ? enhancedContent
                              : (item[header.key] || '--')
                          )}
                          {badge && isFirstCell && (
                            <div 
                              key={`${item.id}-${badge}`} 
                              className={styles.badge}
                            >
                              {badge}
                            </div>
                          )}
                        </div>
                      </td>
                    );
                  })}
                  {typeof getRowInputs === 'function' && (
                    <td className={styles.cell} onClick={(e) => e.stopPropagation()}>
                      <div>
                        {(getRowInputs(item) || []).map((input, idx) => (
                          <div key={input.name || idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                            {input.label ? (
                              <label htmlFor={input.name || `input-${rowIndex}-${idx}`} style={{ fontSize: '12px', color: 'var(--senary-color)', minWidth: '70px' }}>{input.label}</label>
                            ) : null}
                            <input
                              id={input.name || `input-${rowIndex}-${idx}`}
                              type={input.type || 'text'}
                              placeholder={input.placeholder || ''}
                              value={input.value}
                              className={styles.inputTable}
                              onChange={input.onChange}
                              {...(input.inputProps || {})} 
                            />
                          </div>
                        ))}
                      </div>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Table;
