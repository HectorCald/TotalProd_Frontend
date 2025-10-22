import React from 'react';
import styles from '../../styles/Inicial.module.css';
import ViewModal from '../ui/ViewModal';
import HeaderModal from '../common/HeaderModal';
import ItemLine from '../common/ItemLine';

function FiltroEstadoCotizacion({ isOpen, setIsOpen, onEstadoSeleccionado }) {
    const handleEstadoSelect = (estado) => {
        onEstadoSeleccionado(estado);
        setIsOpen(false);
    };

    return (
        <ViewModal isOpen={isOpen} setIsOpen={setIsOpen}>
            <HeaderModal
                title="Estados de Cotización"
                onClose={() => setIsOpen(false)}
            />
            <div className={styles.modalContent}>
                <p className={styles.subTitle}>Selecciona un estado para filtrar las cotizaciones.</p>

                {/* Opción para mostrar todos */}
                <ItemLine
                    title='Todos los estados'
                    icon='list-ul'
                    onClick={() => handleEstadoSelect(null)}
                />

                {/* Estados de cotización */}
                <ItemLine
                    title='Pendientes'
                    icon='history'
                    onClick={() => handleEstadoSelect('pendiente')}
                />

                <ItemLine
                    title='Aprobadas'
                    icon='check-circle'
                    onClick={() => handleEstadoSelect('aprobada')}
                />

                <ItemLine
                    title='Anuladas'
                    icon='x-circle'
                    onClick={() => handleEstadoSelect('anulado')}
                />
            </div>
        </ViewModal>
    );
}

export default FiltroEstadoCotizacion;
