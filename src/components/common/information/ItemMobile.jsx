import React from 'react';
import styles from './ItemMobile.module.css';
import { BoxIcon } from 'boxicons-react';

const ItemMobile = ({
  icon = 'box',
  iconType = 'default',
  title = '',
  subtitle = '',
  status = '',
  statusType = 'default',
  customControls = null,
  onClick,
  actions = [], // Optional actions array, maybe for future use
}) => {
  return (
    <div className={styles.container} onClick={onClick}>
      <div className={`${styles.iconWrapper} ${styles['icon_' + iconType] || styles.icon_default}`}>
        <BoxIcon name={icon} className={styles.icon} />
      </div>
      <div className={styles.content}>
        <h4 className={styles.title}>{title}</h4>
        <div className={styles.footer}>
          {status && (
            <span className={`${styles.badge} ${styles[statusType] || styles.default}`}>
              {status}
            </span>
          )}
          {customControls ? (
            customControls
          ) : (
            subtitle && <span className={styles.subtitle}>{subtitle}</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ItemMobile;
