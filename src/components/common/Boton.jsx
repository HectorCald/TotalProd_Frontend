import React, { useState, useEffect } from 'react';
import styles from './Boton.module.css';
import { BoxIcon } from 'boxicons-react';

function Boton({ label, onClick, className, icon, loading, disabled, style='', objeto, buttonIcon, segundosDisabled}) {
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

  const estaDeshabilitado = disabled || isDisabledPorSegundos || loading;
  // Si buttonIcon está activo, renderizar botón cuadrado sin texto
  if (buttonIcon) {
    return (
      <button 
        className={`${styles.btn} ${styles.btnSquare} ${styles[className] || ''} ${loading ? styles.loading : ''} ${estaDeshabilitado ? styles.disabledButton : ''}`} 
        onClick={estaDeshabilitado ? null : onClick} 
        style={{...style}}
      >
        {loading && <div className={styles.overlay}></div>}
        <BoxIcon name={buttonIcon} className={styles.buttonIcon} />
        {loading ? (
          <div className={styles.loadingDots}>
            <span className={styles.dot}></span>
            <span className={styles.dot}></span>
            <span className={styles.dot}></span>
            <span className={styles.dot}></span>
            <span className={styles.dot}></span>
          </div>
        ) : null}
      </button>
    );
  }

  return (
    <button className={`${styles.btn} ${styles[className] } ${loading ? styles.loading : ''} ${estaDeshabilitado ? styles.disabledButton : ''}`} onClick={estaDeshabilitado ? null : onClick} style={{...style}}>
      {loading && <div className={styles.overlay}></div>}
      {icon && <img src={icon} alt="icon" className={styles.icon}/>}
      {objeto && <span className={styles.objeto} >{objeto}</span>}
      
      {loading ? (
                <div className={styles.loadingDots}>
                    <span className={styles.dot}></span>
                    <span className={styles.dot}></span>
                    <span className={styles.dot}></span>
                    <span className={styles.dot}></span>
                    <span className={styles.dot}></span>
                </div>
            ) : (
                <span>
                  {label}
                  {segundosRestantes > 0 && ` (${segundosRestantes}s)`}
                </span>
            )}
    </button>
  );
}

export default Boton;