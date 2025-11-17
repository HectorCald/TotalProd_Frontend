import React from 'react';
import Select from '../common/Select';

const STORAGE_KEY = 'selectorMetodoPagoPreferencia';

function SelectorMetodoPago({ value, onChange, disabled = false, placeholder = 'Método de pago (obligatorio)' }) {
    // Opciones de métodos de pago
    const metodosPago = [
        { value: 'qr', label: 'QR', icon: 'qr-scan' },
        { value: 'tarjeta', label: 'Tarjeta', icon: 'credit-card' },
        { value: 'efectivo', label: 'Efectivo', icon: 'money' },
        { value: 'credito', label: 'A crédito', icon: 'credit-card-alt' }
    ];

    const storedValueRef = React.useRef(null);

    if (storedValueRef.current === null && typeof window !== 'undefined') {
        storedValueRef.current = localStorage.getItem(STORAGE_KEY);
    }

    // Establecer valor por defecto si no hay valor
    const valorActual = value || storedValueRef.current || 'efectivo';

    // Si no hay valor y onChange existe, establecer el valor almacenado o el valor por defecto
    React.useEffect(() => {
        if (!value && onChange) {
            if (storedValueRef.current) {
                onChange(storedValueRef.current);
            } else {
                onChange('efectivo');
            }
        }
    }, [value, onChange]);

    // Guardar en localStorage cuando el valor cambie
    React.useEffect(() => {
        if (value && typeof window !== 'undefined') {
            storedValueRef.current = value;
            localStorage.setItem(STORAGE_KEY, value);
        }
    }, [value]);

    return (
        <Select
            value={valorActual}
            onChange={onChange}
            options={metodosPago}
            placeholder={placeholder}
            disabled={disabled}
            icon='credit-card'
            openUpward={true}
        />
    );
}

export default SelectorMetodoPago;
