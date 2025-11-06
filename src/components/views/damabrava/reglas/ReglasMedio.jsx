import React, { useState } from 'react';
import styles from '../../../../styles/view.module.css';
import ViewModal from '../../../ui/ViewModal';
import HeaderModal from '../../../common/HeaderModal';
import ItemView from '../../../common/ItemView';

function ReglasMedio({ isOpen, setIsOpen }) {
    const [tipoRegla, setTipoRegla] = useState('general');

    const handleTipoRegla = (tipo) => {
        setIsOpen(false);
        setTipoRegla(tipo);
        // Por ahora no hacer nada más
    };

    const handleClose = () => {
        setIsOpen(false);
        setTipoRegla('general');
    };

    return (
        <ViewModal isOpen={isOpen} setIsOpen={setIsOpen}>
            <HeaderModal
                title="Nueva Regla"
                onClose={handleClose}
            />
            <div className={styles.modalContent}>
                <ItemView
                    title='Gramaje'
                    description='Crear regla de gramaje'
                    icon='ruler'
                    arrow={true}
                    onClick={() => handleTipoRegla('gramaje')}
                />
                <ItemView
                    title='Producto'
                    description='Crear regla de producto'
                    icon='package'
                    arrow={true}
                    onClick={() => handleTipoRegla('producto')}
                />
                <ItemView
                    title='General'
                    description='Crear regla general'
                    icon='file'
                    arrow={true}
                    onClick={() => handleTipoRegla('general')}
                />
            </div>
        </ViewModal>
    );
}

export default ReglasMedio;

