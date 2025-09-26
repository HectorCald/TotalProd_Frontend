import React from 'react';
import ViewModal from '../ui/ViewModal';
import HeaderModal from '../common/HeaderModal';
import ItemLine from '../common/ItemLine';
import styles from '../../styles/Inicial.module.css';

function FiltroMetodoPago({ isOpen, setIsOpen, onMetodoSeleccionado }) {
    const metodosPago = [
        { value: null, label: 'Todos los métodos' },
        { value: 'qr', label: 'QR' },
        { value: 'transferencia', label: 'Transferencia' },
        { value: 'tarjeta', label: 'Tarjeta' },
        { value: 'efectivo', label: 'Efectivo' }
    ];

    return (
        <ViewModal isOpen={isOpen} setIsOpen={setIsOpen}>
            <HeaderModal
                title="Método de Pago"
                onClose={() => setIsOpen(false)}
            />
            <div className={styles.modalContent}>
                <p className={styles.subTitle}>Selecciona el método de pago a mostrar</p>
                {metodosPago.map((metodo) => (
                    <ItemLine
                        key={metodo.value || 'todos'}
                        title={metodo.label}
                        icon='credit-card'
                        onClick={() => {
                            onMetodoSeleccionado(metodo.value);
                            setIsOpen(false);
                        }}
                    />
                ))}
            </div>
        </ViewModal>
    );
}

export default FiltroMetodoPago;
