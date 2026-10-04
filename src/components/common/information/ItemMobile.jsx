import React, { useState, useEffect } from 'react';
import styles from './ItemMobile.module.css';
import { BoxIcon } from 'boxicons-react';

const QuantityControl = ({
  quantity = 0,
  onQuantityChange,
  min = 0,
  max,
  onMaxExceeded,
}) => {
  const [localVal, setLocalVal] = useState(quantity === 0 ? '0' : quantity.toString());

  useEffect(() => {
    setLocalVal(quantity === 0 ? '0' : quantity.toString());
  }, [quantity]);

  const handleChange = (e) => {
    const valStr = e.target.value;
    if (valStr.includes('-')) return;

    setLocalVal(valStr);

    if (valStr === '') return;

    let val = parseInt(valStr, 10);
    if (isNaN(val)) return;

    if (max !== undefined && max !== null && val > max) {
      if (onMaxExceeded) onMaxExceeded();
      val = max > 0 ? max : 1;
      setLocalVal(val.toString());
    }

    if (onQuantityChange) onQuantityChange(val);
  };

  const handleBlur = () => {
    let val = parseInt(localVal, 10);
    if (isNaN(val) || val < min) {
      setLocalVal(min.toString());
      if (onQuantityChange) onQuantityChange(min);
    } else {
      setLocalVal(val.toString());
    }
  };

  const handleDecrement = (e) => {
    e.stopPropagation();
    if (quantity > min) {
      if (onQuantityChange) onQuantityChange(quantity - 1);
    }
  };

  const handleIncrement = (e) => {
    e.stopPropagation();
    if (max !== undefined && max !== null && quantity >= max) {
      if (onMaxExceeded) onMaxExceeded();
      return;
    }
    if (onQuantityChange) onQuantityChange(quantity + 1);
  };

  return (
    <div className={styles.qtyControl} onClick={(e) => e.stopPropagation()}>
      <button 
        type="button" 
        className={styles.qtyButton} 
        onClick={handleDecrement}
      >
        <i className='bx bx-minus'></i>
      </button>
      <input
        type="number"
        min={min}
        value={localVal}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          if (e.key === '-' || e.key === 'e') {
            e.preventDefault();
          }
        }}
        onChange={handleChange}
        onBlur={handleBlur}
        className={styles.qtyInput}
      />
      <button 
        type="button" 
        className={styles.qtyButton} 
        onClick={handleIncrement}
      >
        <i className='bx bx-plus'></i>
      </button>
    </div>
  );
};

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
  quantityMode = false,
  quantity = 0,
  onQuantityChange,
  min = 0,
  max,
  onMaxExceeded,
  quantityControl = null,
}) => {
  const isQuantityActive = quantityMode || Boolean(quantityControl);
  const activeQuantity = quantityControl?.quantity ?? quantity;
  const activeChange = quantityControl?.onQuantityChange ?? onQuantityChange;
  const activeMin = quantityControl?.min ?? min;
  const activeMax = quantityControl?.max ?? max;
  const activeMaxExceeded = quantityControl?.onMaxExceeded ?? onMaxExceeded;

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
          {isQuantityActive ? (
            <QuantityControl
              quantity={activeQuantity}
              onQuantityChange={activeChange}
              min={activeMin}
              max={activeMax}
              onMaxExceeded={activeMaxExceeded}
            />
          ) : customControls ? (
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
