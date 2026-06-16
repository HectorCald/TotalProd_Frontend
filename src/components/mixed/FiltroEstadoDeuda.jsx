import React from 'react';
import ViewModal from '../ui/ViewModal';
import HeaderModal from '../common/old/HeaderModal';
import ItemLine from '../common/old/ItemLine';
import styles from '../../styles/Inicial.module.css';

function FiltroEstadoDeuda({ isOpen, setIsOpen, onEstadoSeleccionado }) {
    const opcionesEstado = [
        { value: null, label: 'Todos los estados', icon: 'list-ul' },
        { value: 'pendiente', label: 'Pendientes', icon: 'history' },
        { value: 'pagada', label: 'Pagadas', icon: 'check-circle' },
        { value: 'vencida', label: 'Vencidas', icon: 'x-circle' }
    ];

    const handleEstadoSelect = (valor) => {
        onEstadoSeleccionado(valor);
        setIsOpen(false);
    };

    return (
        <ViewModal isOpen={isOpen} setIsOpen={setIsOpen}>
            <HeaderModal
                title="Estado de la Deuda"
                onClose={() => setIsOpen(false)}
            />
            <div className={styles.modalContent}>
                <p className={styles.subTitle}>Selecciona el estado de deuda a mostrar</p>
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

export default FiltroEstadoDeuda;
