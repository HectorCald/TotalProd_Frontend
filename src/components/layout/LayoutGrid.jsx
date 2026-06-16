import React from 'react';
import Skeleton from '../common/widgets/Skeleton';
import styles from './LayoutGrid.module.css';

const LayoutGrid = ({
  columns = 3,
  isLoading = false,
  empty = false,
  emptyMessage = 'No hay precios cargados.',
  children
}) => {
  if (isLoading) {
    return (
      <div className={styles.layoutGrid} style={{ '--columns': columns }}>
        {Array.from({ length: 6 }).map((_, idx) => (
          <div key={idx} className={styles.skeletonCard}>
            <Skeleton width="40px" height="40px" borderRadius="50%" />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <Skeleton width="40%" height="16px" />
              <Skeleton width="75%" height="12px" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (empty) {
    return (
      <div className={styles.emptyStateContainer}>
        <div className={styles.emptyState}>{emptyMessage}</div>
      </div>
    );
  }

  return (
    <div className={styles.layoutGrid} style={{ '--columns': columns }}>
      {children}
    </div>
  );
};

export default LayoutGrid;
