import React, { useState } from 'react';
import ViewModal from '../ui/ViewModal';
import HeaderModal from '../common/HeaderModal';
import ItemView from '../common/ItemView';
import styles from '../../styles/view.module.css';

function FiltroEstadoDeuda({ isOpen, setIsOpen, onEstadoSeleccionado }) {
    const [estadoSeleccionado, setEstadoSeleccionado] = useState(null);

    const estados = [
        { value: null, label: 'Todos los estados', icon: 'list' },
        { value: 'pendiente', label: 'Pendiente', icon: 'time', color: '#f39c12' },
        { value: 'pagada', label: 'Pagada', icon: 'check-circle', color: '#27ae60' },
        { value: 'vencida', label: 'Vencida', icon: 'x-circle', color: '#e74c3c' }
    ];

    const handleEstadoClick = (estado) => {
        setEstadoSeleccionado(estado.value);
        onEstadoSeleccionado(estado.value);
        setIsOpen(false);
    };

    return (
        <ViewModal isOpen={isOpen} setIsOpen={setIsOpen}>
            <HeaderModal
                title="Filtrar por Estado"
                onClose={() => setIsOpen(false)}
            />
            <div className={styles.modalContent}>
                <p className={styles.subTitle}>SELECCIONA UN ESTADO</p>
                
                {estados.map((estado) => (
                    <ItemView
                        key={estado.value || 'todos'}
                        title={estado.label}
                        description={estado.value ? `Mostrar solo deudas ${estado.label.toLowerCase()}` : 'Mostrar todas las deudas'}
                        icon={estado.icon}
                        onClick={() => handleEstadoClick(estado)}
                        transparent={false}
                        style={estado.color ? { borderLeft: `4px solid ${estado.color}` } : {}}
                    />
                ))}
            </div>
        </ViewModal>
    );
}

export default FiltroEstadoDeuda;
