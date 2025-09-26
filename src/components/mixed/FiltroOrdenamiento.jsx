import React from 'react';
import styles from '../../styles/Inicial.module.css';
import ViewModal from '../ui/ViewModal';
import HeaderModal from '../common/HeaderModal';
import ItemLine from '../common/ItemLine';

function FiltroOrdenamiento({ isOpen, setIsOpen, onOrdenamientoSeleccionado }) {
    const opcionesOrdenamiento = [
        { id: 'nombre_asc', title: 'Nombre A-Z', icon: 'sort-a-z' },
        { id: 'nombre_desc', title: 'Nombre Z-A', icon: 'sort-z-a' },
        { id: 'stock_asc', title: 'Stock Menor-Mayor', icon: 'up-arrow-alt' },
        { id: 'stock_desc', title: 'Stock Mayor-Menor', icon: 'down-arrow-alt' }
    ];

    const handleOrdenamientoSelect = (ordenamientoId) => {
        onOrdenamientoSeleccionado(ordenamientoId);
        setIsOpen(false);
    };

    return (
        <ViewModal isOpen={isOpen} setIsOpen={setIsOpen}>
            <HeaderModal
                title="Ordenamiento"
                onClose={() => setIsOpen(false)}
            />
            <div className={styles.modalContent}>
                <p className={styles.subTitle}>Selecciona una opción para ordenar los productos</p>
                {opcionesOrdenamiento.map((opcion) => (
                    <ItemLine
                        key={opcion.id}
                        title={opcion.title}
                        icon={opcion.icon}
                        onClick={() => handleOrdenamientoSelect(opcion.id)}
                    />
                ))}
            </div>
        </ViewModal>
    );
}

export default FiltroOrdenamiento;
