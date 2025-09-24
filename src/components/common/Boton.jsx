import React from 'react';
import styles from './Boton.module.css';

function Boton({ label, onClick, className, icon, loading, disabled, style='', objeto}) {
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