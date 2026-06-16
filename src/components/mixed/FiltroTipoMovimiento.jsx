import React from 'react';
import styles from '../../styles/Inicial.module.css';
import ViewModal from '../ui/ViewModal';
import HeaderModal from '../common/old/HeaderModal';
import ItemLine from '../common/old/ItemLine';

function FiltroTipoMovimiento({ isOpen, setIsOpen, onTipoSeleccionado, showTransferencia = true }) {
    const opcionesTipo = [
        {
            value: null,
            label: 'Todos los tipos',
            icon: 'list-ul'
        },
        {
            value: 'entrada',
            label: 'Entradas',
            icon: 'plus-circle'
        },
        {
            value: 'salida',
            label: 'Salidas',
            icon: 'minus-circle'
        },
        ...(showTransferencia ? [{
            value: 'transferencia',
            label: 'Transferencias',
            icon: 'transfer'
        }] : [])
    ];

    const handleTipoSelect = (valor) => {
        onTipoSeleccionado(valor);
        setIsOpen(false);
    };

    return (
        <ViewModal isOpen={isOpen} setIsOpen={setIsOpen}>
            <HeaderModal
                title="Tipo de Movimiento"
                onClose={() => setIsOpen(false)}
            />
            <div className={styles.modalContent}>
                <p className={styles.subTitle}>Selecciona el tipo de movimiento a mostrar</p>
                
                {opcionesTipo.map((opcion) => (
                    <ItemLine
                        key={opcion.value || 'todos'}
                        title={opcion.label}
                        icon={opcion.icon}
                        onClick={() => handleTipoSelect(opcion.value)}
                    />
                ))}
            </div>
        </ViewModal>
    );
}

export default FiltroTipoMovimiento;
