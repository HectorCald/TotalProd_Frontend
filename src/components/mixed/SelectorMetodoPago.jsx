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

    // Establecer valor por defecto si no hay valor
    const valorActual = value || 'efectivo';

    // Si no hay valor y onChange existe, establecer el valor por defecto
    React.useEffect(() => {
        if (!value && onChange) {
            onChange('efectivo');
        }
    }, [value, onChange]);

    return (
        <Select
            value={valorActual}
            onChange={onChange}
            options={metodosPago}
            placeholder={placeholder}
            disabled={disabled}
            icon='credit-card'
        />
    );
}

export default SelectorMetodoPago;
