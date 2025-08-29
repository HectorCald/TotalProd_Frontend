import React from 'react';
import styles from './ItemView.module.css';
import { BoxIcon } from 'boxicons-react';

const ItemView = ({ title, description, icon, onClick, arrow, entrada, entradaData }) => {  

  return (
    <div className={styles.itemView} onClick={onClick}>
      <div className={styles.itemViewIcon}>
        <BoxIcon name={icon} className={styles.icon} />
      </div>
      <div className={styles.itemViewContent}>
        <h1>{title}</h1>
        {entrada ? null : <p>{description}</p>}

        {/* Inputs dinámicos según la longitud de entradaData */}
        {entrada && entradaData?.length > 0 && (
          <div className={styles.inputsEntrada}>
            {entradaData.map((item, i) => (
              <div key={i} className={styles.inputWithLabel}>
                <p>{item.name}</p>
                <input
                  type="number"
                  inputMode= 'numeric'
                  value={item.value}
                  onChange={(e) => console.log(item.name, e.target.value)}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {arrow && (
        <div className={styles.itemViewArrow}>
          <BoxIcon name="chevron-right" className={styles.icon} />
        </div>
      )}
    </div>
  );
};

export default ItemView;
