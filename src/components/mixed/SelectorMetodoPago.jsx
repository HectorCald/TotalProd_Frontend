import React from 'react';
import Select from '../common/Select';
import styles from '../views/almacen-general/CanastaMovimientos.module.css';

function SelectorMetodoPago({ value, onChange, disabled = false, placeholder = 'Método de pago (obligatorio)' }) {
    // Opciones de métodos de pago
    const metodosPago = [
        { value: 'qr', label: 'QR', icon: 'qr-scan' },
        { value: 'tarjeta', label: 'Tarjeta', icon: 'credit-card' },
        { value: 'efectivo', label: 'Efectivo', icon: 'money' },
        { value: 'credito', label: 'A crédito', icon: 'credit-card-alt' }
    ];

    return (

            <Select
                value={value || 'efectivo'}
                onChange={onChange}
                options={metodosPago}
                placeholder={placeholder}
                disabled={disabled}
                icon='credit-card'
            />

    );
}

export default SelectorMetodoPago;
