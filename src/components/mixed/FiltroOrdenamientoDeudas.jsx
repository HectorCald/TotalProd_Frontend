import React, { useState } from 'react';
import ViewModal from '../ui/ViewModal';
import HeaderModal from '../common/HeaderModal';
import ItemView from '../common/ItemView';
import styles from '../../styles/view.module.css';

function FiltroOrdenamientoDeudas({ isOpen, setIsOpen, onOrdenamientoSeleccionado }) {
    const [ordenamientoSeleccionado, setOrdenamientoSeleccionado] = useState('fecha_desc');

    const ordenamientos = [
        { value: 'fecha_desc', label: 'Más recientes', description: 'Por fecha de deuda descendente', icon: 'calendar' },
        { value: 'fecha_asc', label: 'Más antiguos', description: 'Por fecha de deuda ascendente', icon: 'calendar' },
        { value: 'vencimiento_desc', label: 'Vencimiento reciente', description: 'Por fecha de vencimiento descendente', icon: 'time' },
        { value: 'vencimiento_asc', label: 'Vencimiento lejano', description: 'Por fecha de vencimiento ascendente', icon: 'time' },
        { value: 'monto_desc', label: 'Mayor monto', description: 'Por monto total descendente', icon: 'dollar' },
        { value: 'monto_asc', label: 'Menor monto', description: 'Por monto total ascendente', icon: 'dollar' },
        { value: 'concepto_asc', label: 'Concepto A-Z', description: 'Por concepto ascendente', icon: 'sort-alpha-down' },
        { value: 'concepto_desc', label: 'Concepto Z-A', description: 'Por concepto descendente', icon: 'sort-alpha-up' }
    ];

    const handleOrdenamientoClick = (ordenamiento) => {
        setOrdenamientoSeleccionado(ordenamiento.value);
        onOrdenamientoSeleccionado(ordenamiento.value);
        setIsOpen(false);
    };

    return (
        <ViewModal isOpen={isOpen} setIsOpen={setIsOpen}>
            <HeaderModal
                title="Ordenar Deudas"
                onClose={() => setIsOpen(false)}
            />
            <div className={styles.modalContent}>
                <p className={styles.subTitle}>SELECCIONA UN ORDENAMIENTO</p>
                
                {ordenamientos.map((ordenamiento) => (
                    <ItemView
                        key={ordenamiento.value}
                        title={ordenamiento.label}
                        description={ordenamiento.description}
                        icon={ordenamiento.icon}
                        onClick={() => handleOrdenamientoClick(ordenamiento)}
                        transparent={false}
                        selected={ordenamientoSeleccionado === ordenamiento.value}
                    />
                ))}
            </div>
        </ViewModal>
    );
}

export default FiltroOrdenamientoDeudas;
