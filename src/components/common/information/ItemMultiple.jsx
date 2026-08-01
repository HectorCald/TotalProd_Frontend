import React, { useState, useEffect } from 'react';
import styles from './ItemMultiple.module.css';
import { BoxIcon } from 'boxicons-react';

const ItemMultiple = ({ title, description, onEdit, onDelete, onHeart, isHearted, icon = "dollar", logo }) => {
  const hasActions = onEdit || onDelete || onHeart;
  const [hearted, setHearted] = useState(isHearted || false);
  const [isFlipped, setIsFlipped] = useState(false);

  useEffect(() => {
    setHearted(isHearted);
  }, [isHearted]);

  const handleCardClick = () => {
    if (hasActions && window.innerWidth <= 768) {
      setIsFlipped(prev => !prev);
    }
  };

  const handleHeartClick = (e) => {
    e.stopPropagation();
    const newState = !hearted;
    setHearted(newState);
    if (onHeart) onHeart(newState);
  };

  const handleEditClick = (e) => {
    e.stopPropagation();
    setIsFlipped(false);
    if (onEdit) onEdit(e);
  };

  const handleDeleteClick = (e) => {
    e.stopPropagation();
    setIsFlipped(false);
    if (onDelete) onDelete(e);
  };

  return (
    <div className={`${styles.card} ${!hasActions ? styles.noActions : ''}`} onClick={handleCardClick}>
      <div className={`${styles.inner} ${isFlipped ? styles.flipped : ''}`}>
        {/* Lado frontal con información */}
        <div className={styles.front}>
          <div className={styles.iconContainer}>
            {logo ? (
              <img src={logo} alt={title} className={styles.logo} style={{ width: '24px', height: '24px', borderRadius: '4px', objectFit: 'contain' }} />
            ) : (
              <BoxIcon name={icon} className={styles.icon} />
            )}
          </div>
          <div className={styles.textContainer}>
            <h3 className={styles.title}>{title}</h3>
            <p className={styles.description}>{description}</p>
          </div>
        </div>
        
        {/* Lado reverso con acciones */}
        {hasActions && (
          <div className={styles.back}>
            {onHeart ? (
              <button 
                className={`${styles.actionButton} ${styles.heartButton}`} 
                onClick={handleHeartClick} 
                aria-label="Vincular"
                style={{ color: hearted ? '#e53935' : 'inherit' }}
              >
                <BoxIcon name="heart" type={hearted ? "solid" : "regular"} className={styles.actionIcon} />
                <span className={styles.actionText}>{hearted ? 'Vinculado' : 'Vincular'}</span>
              </button>
            ) : (
              <>
                {onEdit && (
                  <button className={`${styles.actionButton} ${styles.editButton}`} onClick={handleEditClick} aria-label="Editar">
                    <BoxIcon name="edit-alt" className={styles.actionIcon} />
                    <span className={styles.actionText}>Editar</span>
                  </button>
                )}
                {onDelete && (
                  <button className={`${styles.actionButton} ${styles.deleteButton}`} onClick={handleDeleteClick} aria-label="Eliminar">
                    <BoxIcon name="trash" className={styles.actionIcon} />
                    <span className={styles.actionText}>Eliminar</span>
                  </button>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ItemMultiple;
