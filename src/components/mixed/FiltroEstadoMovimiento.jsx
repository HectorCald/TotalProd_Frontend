import React from 'react';
import styles from '../../styles/Inicial.module.css';
import ViewModal from '../ui/ViewModal';
import HeaderModal from '../common/old/HeaderModal';
import ItemLine from '../common/old/ItemLine';

function FiltroEstadoMovimiento({ isOpen, setIsOpen, onEstadoSeleccionado }) {
    const opcionesEstado = [
        {
            value: null,
            label: 'Todos los estados',
            icon: 'list-ul'
        },
        {
            value: 'finalizado',
            label: 'Finalizados',
            icon: 'check-circle'
        },
        {
            value: 'anulado',
            label: 'Anulados',
            icon: 'x-circle'
        }
    ];

    const handleEstadoSelect = (valor) => {
        onEstadoSeleccionado(valor);
        setIsOpen(false);
    };

    return (
        <ViewModal isOpen={isOpen} setIsOpen={setIsOpen}>
            <HeaderModal
                title="Estado del Movimiento"
                onClose={() => setIsOpen(false)}
            />
            <div className={styles.modalContent}>
                <p className={styles.subTitle}>Selecciona el estado de movimiento a mostrar</p>
                
                {opcionesEstado.map((opcion) => (
                    <ItemLine
                        key={opcion.value || 'todos'}
                        title={opcion.label}
                        icon={opcion.icon}
                        onClick={() => handleEstadoSelect(opcion.value)}
                    />
                ))}
            </div>
        </ViewModal>
    );
}

export default FiltroEstadoMovimiento;
