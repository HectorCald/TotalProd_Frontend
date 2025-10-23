import React, { useState } from 'react';
import ViewModal from '../../ui/ViewModal';
import HeaderModal from '../../common/HeaderModal';
import Boton from '../../common/Boton';
import styles from '../../../styles/view.module.css';

const ModalOffline = ({ isOpen, setIsOpen, onRetry }) => {
    const [isLoading, setIsLoading] = useState(false);

    const handleRetry = () => {
        // Activar estado loading
        setIsLoading(true);
        // Recargar la página
        window.location.reload();
    };

    return (
        <ViewModal isOpen={isOpen} setIsOpen={setIsOpen} closed={true}>
            <HeaderModal
                title="Sin conexión a internet"
                onClose={() => setIsOpen(false)}
                closed={true}
            />
            <div className={styles.modalContent}>
                <p className={styles.subTitle}>No es posible continuar si no estás conectado a internet.</p>

                <div className={styles.buttons} style={{ marginTop: '30px' }}>
                    <Boton
                        className='btn-default'
                        label='Reintentar conexión'
                        onClick={handleRetry}
                        loading={isLoading}
                        disabled={isLoading}
                    />
                </div>
            </div>
        </ViewModal>
    );
};

export default ModalOffline;
