import React from 'react';
import styles from '../../styles/Inicial.module.css';
import ViewModal from '../ui/ViewModal';
import HeaderModal from '../common/old/HeaderModal';
import ItemLine from '../common/old/ItemLine';

function FiltroOrdenamiento({ isOpen, setIsOpen, onOrdenamientoSeleccionado, opciones = [] }) {
    // Opciones por defecto si no se proporcionan
    const opcionesDefault = [
        {
            value: 'fecha_desc',
            label: 'Más recientes',
            icon: 'time'
        },
        {
            value: 'fecha_asc',
            label: 'Más antiguos',
            icon: 'time-five'
        },
        {
            value: 'tipo_asc',
            label: 'Tipo A-Z',
            icon: 'sort-a-z'
        },
        {
            value: 'tipo_desc',
            label: 'Tipo Z-A',
            icon: 'sort-z-a'
        }
    ];

    const opcionesFinales = opciones.length > 0 ? opciones : opcionesDefault;

    const handleOrdenamientoSelect = (valor) => {
        onOrdenamientoSeleccionado(valor);
        setIsOpen(false);
    };

    return (
        <ViewModal isOpen={isOpen} setIsOpen={setIsOpen}>
            <HeaderModal
                title="Ordenamiento"
                onClose={() => setIsOpen(false)}
            />
            <div className={styles.modalContent}>
                <p className={styles.subTitle}>Selecciona una opción para ordenar los elementos</p>
                
                {opcionesFinales.map((opcion) => (
                    <ItemLine
                        key={opcion.value}
                        title={opcion.label}
                        icon={opcion.icon}
                        onClick={() => handleOrdenamientoSelect(opcion.value)}
                    />
                ))}
            </div>
        </ViewModal>
    );
}

export default FiltroOrdenamiento;