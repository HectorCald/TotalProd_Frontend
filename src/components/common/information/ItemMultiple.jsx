import React from 'react';
import styles from './ItemMultiple.module.css';
import { BoxIcon } from 'boxicons-react';

const ItemMultiple = ({ title, description, onEdit, onDelete, icon = "dollar" }) => {
  const hasActions = onEdit || onDelete;

  return (
    <div className={`${styles.card} ${!hasActions ? styles.noActions : ''}`}>
      <div className={styles.inner}>
        {/* Lado frontal con información */}
        <div className={styles.front}>
          <div className={styles.iconContainer}>
            <BoxIcon name={icon} className={styles.icon} />
          </div>
          <div className={styles.textContainer}>
            <h3 className={styles.title}>{title}</h3>
            <p className={styles.description}>{description}</p>
          </div>
        </div>
        
        {/* Lado reverso con acciones (efecto hover de vuelta) */}
        {hasActions && (
          <div className={styles.back}>
            {onEdit && (
              <button className={`${styles.actionButton} ${styles.editButton}`} onClick={onEdit} aria-label="Editar">
                <BoxIcon name="edit-alt" className={styles.actionIcon} />
                <span className={styles.actionText}>Editar</span>
              </button>
            )}
            {onDelete && (
              <button className={`${styles.actionButton} ${styles.deleteButton}`} onClick={onDelete} aria-label="Eliminar">
                <BoxIcon name="trash" className={styles.actionIcon} />
                <span className={styles.actionText}>Eliminar</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ItemMultiple;
