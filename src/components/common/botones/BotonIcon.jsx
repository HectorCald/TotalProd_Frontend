import React from 'react';
import styles from './Boton.module.css';
import { BoxIcon } from 'boxicons-react';

function BotonIcon({ onClick, className, loading, disabled, readOnly, style='', buttonIcon, iconName, type = 'button' }) {
  const estaDeshabilitado = disabled || readOnly || loading;
  const iconToUse = buttonIcon || iconName;

  return (
    <button
      type={type}
      className={`${styles.btnSquare} ${styles[className] || ''} ${loading ? styles.loading : ''} ${estaDeshabilitado ? styles.disabledButton : ''}`}
      onClick={estaDeshabilitado ? null : onClick}
      style={{...style}}
    >
      {loading && <div className={styles.overlay}></div>}
      {iconToUse && !loading && <BoxIcon name={iconToUse} className={styles.buttonIcon} />}
      {loading ? (
        <div className={styles.spinner}></div>
      ) : null}
    </button>
  );
}

export default BotonIcon;
