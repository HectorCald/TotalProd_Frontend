import React from 'react';
import ViewModal from '../ui/ViewModal';
import HeaderModal from '../common/HeaderModal';
import ItemLine from '../common/ItemLine';
import styles from '../../styles/Inicial.module.css';

function FiltroEstadoPago({ isOpen, setIsOpen, onEstadoSeleccionado }) {
    const opcionesEstado = [
        { value: null, label: 'Todos los estados', icon: 'list-ul' },
        { value: 'pendiente', label: 'Pendientes', icon: 'history' },
        { value: 'pagado', label: 'Pagados', icon: 'check-circle' }
    ];

    const handleSeleccion = (estado) => {
        onEstadoSeleccionado(estado);
        setIsOpen(false);
    };

    return (
        <ViewModal isOpen={isOpen} setIsOpen={setIsOpen}>
            <HeaderModal
                title="Estado del Pago"
                onClose={() => setIsOpen(false)}
            />
            <div className={styles.modalContent}>
                <p className={styles.subTitle}>Selecciona el estado de pago a mostrar</p>
                {opcionesEstado.map((opcion) => (
                    <ItemLine
                        key={opcion.value ?? 'todos'}
                        title={opcion.label}
                        icon={opcion.icon}
                        onClick={() => handleSeleccion(opcion.value)}
                    />
                ))}
            </div>
        </ViewModal>
    );
}

export default FiltroEstadoPago;

