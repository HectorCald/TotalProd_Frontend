import React from 'react';
import styles from './Boton.module.css';
import { BoxIcon } from 'boxicons-react';
import Tooltip from '../outputs/Tooltip';

function BotonIcon({ onClick, className, loading, disabled, readOnly, style='', buttonIcon, iconName, type = 'button', tooltip, tooltipPosition = 'top', tooltipAlign = 'center' }) {
  const estaDeshabilitado = disabled || readOnly || loading;
  const iconToUse = buttonIcon || iconName;

  const buttonContent = (
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

  if (tooltip) {
      return (
          <Tooltip text={tooltip} position={tooltipPosition} align={tooltipAlign}>
              {buttonContent}
          </Tooltip>
      );
  }

  return buttonContent;
}

export default BotonIcon;
