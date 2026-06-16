import React from 'react';
import styles from './InfoDisplay.module.css';

const InfoDisplay = ({ label, value, subValue, subValueColor, icon }) => {
  return (
    <div className={styles.container}>
      {icon && (
        <div className={styles.iconWrapper}>
          <i className={`bx ${icon}`}></i>
        </div>
      )}
      <div className={styles.content}>
        <span className={styles.label}>{label}</span>
        <div className={styles.valueWrapper}>
           <span className={styles.value}>{value}</span>
        </div>
      </div>
      {subValue && (
        <span 
          className={styles.subValue} 
          style={subValueColor ? { color: subValueColor, borderColor: `color-mix(in srgb, ${subValueColor} 20%, transparent)`, backgroundColor: `color-mix(in srgb, ${subValueColor} 10%, transparent)` } : {}}
        >
          {subValue}
        </span>
      )}
    </div>
  );
};

export default InfoDisplay;
