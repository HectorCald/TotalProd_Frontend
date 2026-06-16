import React, { useState } from 'react';
import styles from '../../../../styles/view.module.css';
import ViewModal from '../../../ui/ViewModal';
import HeaderModal from '../../../common/old/HeaderModal';
import ItemView from '../../../common/old/ItemView';
import ModalNuevaRegla from './ModalNuevaRegla';

function ReglasMedio({ isOpen, setIsOpen, onReglaRegistrada }) {
    const [activeModal, setActiveModal] = useState(null); // 'general' | 'especial' | 'gramaje' | null

    const handleTipoRegla = (tipo) => {
        setIsOpen(false);
        if (tipo === 'general') {
            setActiveModal('general');
            return;
        }
        if (tipo === 'especial') {
            setActiveModal('especial');
            return;
        }
        if (tipo === 'gramaje') {
            setActiveModal('gramaje');
        }
    };

    const handleCloseFormModal = () => {
        setActiveModal(null);
    };

    const handleReglaRegistrada = (nuevaRegla) => {
        setActiveModal(null);
        if (onReglaRegistrada) onReglaRegistrada(nuevaRegla);
    };

    const handleClose = () => {
        setIsOpen(false);
        setActiveModal(null);
    };

    return (
        <>
            <ViewModal isOpen={isOpen} setIsOpen={setIsOpen}>
                <HeaderModal title="Nueva Regla" onClose={handleClose} />
                <div className={styles.modalContent}>
                    <ItemView
                        title="General"
                        description="Crear regla general"
                        icon="file"
                        arrow={true}
                        onClick={() => handleTipoRegla('general')}
                    />
                    <ItemView
                        title="Especial"
                        description="Crear regla especial"
                        icon="star"
                        arrow={true}
                        onClick={() => handleTipoRegla('especial')}
                    />
                    <ItemView
                        title="Por gramaje"
                        description="Crear regla por gramaje"
                        icon="ruler"
                        arrow={true}
                        onClick={() => handleTipoRegla('gramaje')}
                    />
                </div>
            </ViewModal>

            <ModalNuevaRegla
                isOpen={!!activeModal}
                setIsOpen={handleCloseFormModal}
                tipoRegla={activeModal}
                onReglaRegistrada={handleReglaRegistrada}
            />
        </>
    );
}

export default ReglasMedio;
