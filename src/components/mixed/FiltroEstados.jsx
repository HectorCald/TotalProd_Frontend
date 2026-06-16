import React from 'react';
import ViewModal from '../ui/ViewModal';
import HeaderModal from '../common/old/HeaderModal';
import styles from '../../styles/Inicial.module.css';
import ItemLine from '../common/old/ItemLine';

function FiltroEstados({ isOpen, setIsOpen, onEstadoSeleccionado, estadoSeleccionado }) {
    const estados = [
        {
            value: null,
            label: 'Todos los estados',
            icon: 'list-ul'
        },
        {
            value: 'pendiente',
            label: 'Pendientes',
            icon: 'time'
        },
        {
            value: 'verificado',
            label: 'Verificados',
            icon: 'check-circle'
        },
        {
            value: 'Ingresado',
            label: 'Ingresados',
            icon: 'package'
        }
    ];

    const handleSeleccionar = (valor) => {
        onEstadoSeleccionado(valor);
        setIsOpen(false);
    };

    return (
        <ViewModal isOpen={isOpen} setIsOpen={setIsOpen}>
            <HeaderModal
                title="Filtrar por Estado"
                onClose={() => setIsOpen(false)}
            />
            <div className={styles.modalContent}>
                <p className={styles.subTitle}>Selecciona el estado de los registros a mostrar</p>
                
                {estados.map((estado) => (
                    <ItemLine
                        key={estado.value || 'todos'}
                        title={estado.label}
                        icon={estado.icon}
                        onClick={() => handleSeleccionar(estado.value)}
                    />
                ))}
            </div>
        </ViewModal>
    );
}

export default FiltroEstados;
