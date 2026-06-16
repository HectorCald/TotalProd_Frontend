import React from 'react';
import styles from '../../styles/Inicial.module.css';
import ViewModal from '../ui/ViewModal';
import HeaderModal from '../common/old/HeaderModal';
import ItemLine from '../common/old/ItemLine';

function FiltroEstadoTransferencia({ isOpen, setIsOpen, onEstadoSeleccionado }) {
    const handleEstadoSelect = (estado) => {
        onEstadoSeleccionado(estado);
        setIsOpen(false);
    };

    return (
        <ViewModal isOpen={isOpen} setIsOpen={setIsOpen}>
            <HeaderModal
                title="Estados de Transferencia"
                onClose={() => setIsOpen(false)}
            />
            <div className={styles.modalContent}>
                <p className={styles.subTitle}>Selecciona un estado para filtrar las transferencias.</p>

                {/* Opción para mostrar todos */}
                <ItemLine
                    title='Todos los estados'
                    icon='list-ul'
                    onClick={() => handleEstadoSelect(null)}
                />

                {/* Estados de transferencia */}
                <ItemLine
                    title='Transferidas'
                    icon='transfer'
                    onClick={() => handleEstadoSelect('Transferido')}
                />

                <ItemLine
                    title='Finalizadas'
                    icon='check-circle'
                    onClick={() => handleEstadoSelect('Finalizado')}
                />

                <ItemLine
                    title='Anuladas'
                    icon='x-circle'
                    onClick={() => handleEstadoSelect('Anulado')}
                />
            </div>
        </ViewModal>
    );
}

export default FiltroEstadoTransferencia;

