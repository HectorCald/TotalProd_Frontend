import React from 'react';
import styles from './Boton.module.css';

function Boton({ label, onClick, className, icon, loading, disabled, style='', objeto}) {
  return (
    <button className={`${styles.btn} ${styles[className] } ${loading ? styles.loading : ''} ${disabled ? styles.disabledButton : ''}`} onClick={onClick} style={{...style}}>
      {icon && <img src={icon} alt="icon" />}
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