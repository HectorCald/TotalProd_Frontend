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
  status2 = '',
  status2Type = 'default',
  status3 = '',
  status3Type = 'default',
  customControls = null,
  onClick,
  actions = [],
}) => {
  return (
    <div className={styles.container} onClick={onClick}>
      <div className={`${styles.iconWrapper} ${styles['icon_' + iconType] || styles.icon_default}`}>
        <BoxIcon name={icon} className={styles.icon} />
      </div>
      <div className={styles.content}>
        <h4 className={styles.title}>{title}</h4>
        <div className={styles.footer}>
          <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
            {status && (
              <span className={`${styles.badge} ${styles[statusType] || styles.default}`}>
                {status}
              </span>
            )}
            {status2 && (
              <span className={`${styles.badge} ${styles[status2Type] || styles.default}`}>
                {status2}
              </span>
            )}
            {status3 && (
              <span className={`${styles.badge} ${styles[status3Type] || styles.default}`}>
                {status3}
              </span>
            )}
          </div>
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
