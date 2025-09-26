import React from 'react';
import { BoxIcon } from 'boxicons-react';
import styles from './Table.module.css';

const Table = ({ headers = [], data = [], onRowClick = null, getBadge = null }) => {
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
      <div className={styles.tableWrapper}>
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
            </tr>
          </thead>
          <tbody>
            {data.map((item, rowIndex) => {
              const badge = getBadge ? getBadge(item) : null;
              return (
                <tr 
                  key={item.id || rowIndex} 
                  className={`${styles.row} ${onRowClick ? styles.clickableRow : ''}`}
                  onClick={() => onRowClick && onRowClick(item)}
                >
                  {headers.map((header, cellIndex) => (
                    <td key={cellIndex} className={styles.cell}>
                      {item[header.key] || '--'}
                    </td>
                  ))}
                  {badge && (
                    <div 
                      key={`${item.id}-${badge}`} 
                      className={styles.badge}
                    >
                      {badge}
                    </div>
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
