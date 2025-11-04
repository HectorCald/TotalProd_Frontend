import React from 'react';
import styles from './Boton.module.css';
import { BoxIcon } from 'boxicons-react';

function Boton({ label, onClick, className, icon, loading, disabled, style='', objeto, buttonIcon}) {
  // Si buttonIcon está activo, renderizar botón cuadrado sin texto
  if (buttonIcon) {
    return (
      <button 
        className={`${styles.btn} ${styles.btnSquare} ${styles[className] || ''} ${loading ? styles.loading : ''} ${disabled ? styles.disabledButton : ''}`} 
        onClick={loading ? null : onClick} 
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
    <button className={`${styles.btn} ${styles[className] } ${loading ? styles.loading : ''} ${disabled ? styles.disabledButton : ''}`} onClick={loading ? null : onClick} style={{...style}}>
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
                <span>{label}</span>
            )}
    </button>
  );
}

export default Boton;