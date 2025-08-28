import React from 'react';
import styles from './Boton.module.css';

function Boton({ label, onClick, className, icon, loading, disabled, style=''}) {
  return (
    <button className={`${styles.btn} ${styles[className]} ${loading ? styles.loading : ''}`} onClick={onClick} style={{opacity: disabled ? 0.5 : 1, ...style}}>
      {icon && <img src={icon} alt="icon" />}
      
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