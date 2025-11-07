import React from 'react';
import ViewModal from '../ui/ViewModal';
import HeaderModal from '../common/HeaderModal';
import Boton from '../common/Boton';
import styles from '../styles/Canasta.module.css';

function LimpiarCanasta({ isOpen, setIsOpen, onConfirmar, titulo = "Limpiar Canasta", mensaje = "¿Estás seguro que deseas limpiar toda la canasta? Esta acción no se puede deshacer." }) {
    return (
        <ViewModal isOpen={isOpen} setIsOpen={setIsOpen}>
            <HeaderModal
                title={titulo}
                onClose={() => setIsOpen(false)}
            />
            <div className={styles.modalContent}>
                <p className={styles.subTitle}>{mensaje}</p>
                <div className={styles.buttons}>
                    <Boton
                        className='btn-default'
                        label='Cancelar'
                        onClick={() => setIsOpen(false)}
                    />
                    <Boton
                        className='btn-red'
                        label='Si, limpiar'
                        onClick={onConfirmar}
                    />
                </div>
            </div>
        </ViewModal>
    );
}

export default LimpiarCanasta;
