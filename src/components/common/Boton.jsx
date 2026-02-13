import React, { useState, useEffect } from 'react';
import styles from './Boton.module.css';
import { BoxIcon } from 'boxicons-react';

function Boton({ label, onClick, className, icon, loading, disabled, readOnly, style='', objeto, buttonIcon, segundosDisabled, iconName, hideTextOnMobile, type = 'button' }) {
  const [segundosRestantes, setSegundosRestantes] = useState(segundosDisabled && segundosDisabled > 0 ? segundosDisabled : 0);
  const [isDisabledPorSegundos, setIsDisabledPorSegundos] = useState(segundosDisabled && segundosDisabled > 0);
  const [isMobile, setIsMobile] = useState(false);

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

  // Detectar si es móvil cuando hideTextOnMobile está activo
  useEffect(() => {
    if (hideTextOnMobile) {
      const checkMobile = () => {
        setIsMobile(window.innerWidth < 768);
      };
      
      checkMobile();
      window.addEventListener('resize', checkMobile);
      
      return () => window.removeEventListener('resize', checkMobile);
    }
  }, [hideTextOnMobile]);

  const estaDeshabilitado = disabled || readOnly || isDisabledPorSegundos || loading;
  // Si buttonIcon está activo, renderizar botón con icono
  if (buttonIcon) {
    // Si hay label, mostrar botón normal con icono y texto
    if (label) {
      return (
        <button
          type={type}
          className={`${styles.btn} ${styles[className] || ''} ${loading ? styles.loading : ''} ${estaDeshabilitado ? styles.disabledButton : ''}`}
          onClick={estaDeshabilitado ? null : onClick}
          style={{...style, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'}}
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
          ) : (
            <span>{label}</span>
          )}
        </button>
      );
    }
    // Si no hay label, renderizar botón cuadrado solo con icono
    return (
      <button
        type={type}
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

  // Si hideTextOnMobile está activo y es móvil, mostrar solo icono (botón cuadrado)
  if (hideTextOnMobile && isMobile && iconName) {
    return (
      <button
        type={type}
        className={`${styles.btn} ${styles.btnSquare} ${styles[className] || ''} ${loading ? styles.loading : ''} ${estaDeshabilitado ? styles.disabledButton : ''}`}
        onClick={estaDeshabilitado ? null : onClick}
        style={{...style}}
      >
        {loading && <div className={styles.overlay}></div>}
        <BoxIcon name={iconName} className={styles.buttonIcon} />
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
    <button type={type} className={`${styles.btn} ${styles[className] } ${loading ? styles.loading : ''} ${estaDeshabilitado ? styles.disabledButton : ''}`} onClick={estaDeshabilitado ? null : onClick} style={{...style, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: iconName || icon ? '8px' : '0'}}>
      {loading && <div className={styles.overlay}></div>}
      {icon && <img src={icon} alt="icon" className={styles.icon}/>}
      {iconName && !loading && <BoxIcon name={iconName} className={styles.buttonIcon} />}
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