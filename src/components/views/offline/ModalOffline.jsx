import React from 'react';
import ViewModal from '../../ui/ViewModal';
import HeaderModal from '../../common/HeaderModal';
import Boton from '../../common/Boton';
import styles from '../../../styles/view.module.css';

const ModalOffline = ({ isOpen, setIsOpen, onRetry }) => {
    const handleRetry = () => {
        if (onRetry) {
            onRetry();
        }
        setIsOpen(false);
    };

    const handleAccept = () => {
        setIsOpen(false);
    };

    return (
        <ViewModal isOpen={isOpen} setIsOpen={setIsOpen}>
            <HeaderModal
                title="Sin conexión a internet"
                onClose={() => setIsOpen(false)}
            />
            <div className={styles.modalContent}>
                <p className={styles.subTitle}>No se detecta conexión a internet. Algunas funciones pueden no estar disponibles.</p>

                <div className={styles.buttons} style={{ marginTop: '30px' }}>
                    <Boton
                        className='btn-blue'
                        label='Cambiar a modo offline'
                        onClick={handleRetry}
                    />
                    <Boton
                        className='btn-default'
                        label='Reintentar conexión'
                        onClick={handleRetry}
                    />
                </div>
            </div>
        </ViewModal>
    );
};

export default ModalOffline;
