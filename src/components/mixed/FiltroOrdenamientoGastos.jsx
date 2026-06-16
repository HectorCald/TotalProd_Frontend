import React from 'react';
import ViewModal from '../ui/ViewModal';
import HeaderModal from '../common/old/HeaderModal';
import ItemLine from '../common/old/ItemLine';
import styles from '../../styles/Inicial.module.css';

function FiltroOrdenamientoGastos({ isOpen, setIsOpen, onOrdenamientoSeleccionado }) {
    const ordenamientos = [
        { value: 'fecha_desc', label: 'Más recientes', icon: 'time' },
        { value: 'fecha_asc', label: 'Más antiguos', icon: 'time-five' },
        { value: 'valor_desc', label: 'Mayor valor', icon: 'trending-up' },
        { value: 'valor_asc', label: 'Menor valor', icon: 'trending-down' },
        { value: 'concepto_asc', label: 'Concepto A-Z', icon: 'sort-a-z' },
        { value: 'concepto_desc', label: 'Concepto Z-A', icon: 'sort-z-a' }
    ];

    return (
        <ViewModal isOpen={isOpen} setIsOpen={setIsOpen}>
            <HeaderModal
                title="Ordenamiento"
                onClose={() => setIsOpen(false)}
            />
            <div className={styles.modalContent}>
                <p className={styles.subTitle}>Selecciona una opción para ordenar los gastos</p>
                {ordenamientos.map((orden) => (
                    <ItemLine
                        key={orden.value}
                        title={orden.label}
                        icon={orden.icon}
                        onClick={() => {
                            onOrdenamientoSeleccionado(orden.value);
                            setIsOpen(false);
                        }}
                    />
                ))}
            </div>
        </ViewModal>
    );
}

export default FiltroOrdenamientoGastos;
