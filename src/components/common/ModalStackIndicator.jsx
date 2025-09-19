import React from 'react';
import { useModalStack } from '../../context/ModalStackContext';
import styles from './ModalStackIndicator.module.css';

const ModalStackIndicator = () => {
  const { getOpenModalsCount, modalStack } = useModalStack();
  const count = getOpenModalsCount();

  if (count === 0) return null;

  return (
    <div className={styles.indicator}>
      <div className={styles.badge}>
        {count} modal{count > 1 ? 'es' : ''} abierto{count > 1 ? 's' : ''}
      </div>
      <div className={styles.stack}>
        {modalStack.map((modal, index) => (
          <div key={modal.id} className={styles.modalItem}>
            #{modal.counter} - {modal.id.split('-')[0]}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ModalStackIndicator;
