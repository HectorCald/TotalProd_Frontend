import React from 'react';
import Select from '../common/Select';
import styles from '../views/almacen-general/CanastaMovimientos.module.css';

function SelectorMetodoPago({ value, onChange, disabled = false, placeholder = 'Método de pago (obligatorio)' }) {
    // Opciones de métodos de pago
    const metodosPago = [
        { value: 'qr', label: 'QR', icon: 'qr-scan' },
        { value: 'transferencia', label: 'Transferencia', icon: 'transfer' },
        { value: 'tarjeta', label: 'Tarjeta', icon: 'credit-card' },
        { value: 'efectivo', label: 'Efectivo', icon: 'money' },
        { value: 'credito', label: 'A crédito', icon: 'credit-card-alt' }
    ];

    return (
        <div className={styles.content} style={{ padding: '10px 15px' }}>
            <Select
                value={value}
                onChange={onChange}
                options={metodosPago}
                placeholder={placeholder}
                disabled={disabled}
                icon='credit-card'
            />
        </div>
    );
}

export default SelectorMetodoPago;
