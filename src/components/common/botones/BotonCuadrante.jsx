import React from 'react';
import styles from './BotonCuadrante.module.css';

const BotonCuadrante = ({ icon, title, onClick, isNew }) => {
  return (
    <div className={styles.menuItem} onClick={onClick}>
      {isNew && <span className={styles.newBadge}>NEW</span>}
      <i className={`bx bx-${icon} ${styles.icon}`}></i>
      <span className={styles.title}>{typeof title === 'string' ? title.toUpperCase() : title}</span>
    </div>
  );
};

export default BotonCuadrante;
