import React from 'react';
import styles from './Boton.module.css';
import { BoxIcon } from 'boxicons-react';

function BotonFlotante({ onClick, iconName = 'plus', ariaLabel = 'Agregar' }) {
  return (
    <button
      type="button"
      className={styles.btnFloat}
      onClick={onClick}
      aria-label={ariaLabel}
    >
      <BoxIcon name={iconName} className={styles.buttonIcon} />
    </button>
  );
}

export default BotonFlotante;
