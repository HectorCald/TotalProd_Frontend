import React from 'react';
import styles from './Boton.module.css';
import { BoxIcon } from 'boxicons-react';

function BotonFlotante({ onClick, iconName = 'plus', ariaLabel = 'Agregar', style, badgeCount }) {
  return (
    <button
      type="button"
      className={styles.btnFloat}
      onClick={onClick}
      aria-label={ariaLabel}
      style={style}
    >
      <BoxIcon name={iconName} className={styles.buttonIcon} />
      {badgeCount > 0 && (
        <span className={styles.badge}>{badgeCount}</span>
      )}
    </button>
  );
}

export default BotonFlotante;
