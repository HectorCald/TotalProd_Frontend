import React, { useState, useEffect } from 'react';
import styles from './Boton.module.css';
import { BoxIcon } from 'boxicons-react';

function Boton({ label, onClick, className, icon, loading, disabled, readOnly, style='', objeto, segundosDisabled, iconName, type = 'button' }) {
  const [segundosRestantes, setSegundosRestantes] = useState(segundosDisabled && segundosDisabled > 0 ? segundosDisabled : 0);
  const [isDisabledPorSegundos, setIsDisabledPorSegundos] = useState(segundosDisabled && segundosDisabled > 0);

  useEffect(() => {
    if (segundosDisabled && segundosDisabled > 0) {
      setSegundosRestantes(segundosDisabled);
      setIsDisabledPorSegundos(true);
    } else {
      setSegundosRestantes(0);
      setIsDisabledPorSegundos(false);
    }
  }, [segundosDisabled]);

  useEffect(() => {
    if (segundosRestantes > 0) {
      const timer = setTimeout(() => {
        const nuevosSegundos = segundosRestantes - 1;
        setSegundosRestantes(nuevosSegundos);
        if (nuevosSegundos === 0) {
          setIsDisabledPorSegundos(false);
        }
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [segundosRestantes]);

  const estaDeshabilitado = disabled || readOnly || isDisabledPorSegundos || loading;

  return (
    <button type={type} className={`${styles.btn} ${styles[className] || ''} ${loading ? styles.loading : ''} ${estaDeshabilitado ? styles.disabledButton : ''}`} onClick={estaDeshabilitado ? null : onClick} style={{...style, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: iconName || icon ? '8px' : '0'}}>
      {loading && <div className={styles.overlay}></div>}
      {icon && <img src={icon} alt="icon" className={styles.icon}/>}
      {iconName && !loading && <BoxIcon name={iconName} className={styles.buttonIcon} />}
      {objeto && <span className={styles.objeto} >{objeto}</span>}
      
      {loading ? (
        <div className={styles.spinner}></div>
      ) : (
        <span>
          {typeof label === 'string' ? label.toUpperCase() : label}
          {segundosRestantes > 0 && ` (${segundosRestantes}s)`}
        </span>
      )}
    </button>
  );
}

export default Boton;
