import React from 'react';
import InputSelect from '../inputs/InputSelect';

const SelectMetodoPago = ({ value, onChange, error, label = "Método de Pago", required = false, ...rest }) => {
    const options = [
        { value: 'qr', label: 'QR' },
        { value: 'transferencia', label: 'Transferencia' },
        { value: 'tarjeta', label: 'Tarjeta' },
        { value: 'efectivo', label: 'Efectivo' },
        { value: 'credito', label: 'Crédito' }
    ];

    return (
        <InputSelect
            label={label}
            value={value}
            onChange={onChange}
            options={options}
            error={error}
            required={required}
            {...rest}
        />
    );
};

export default SelectMetodoPago;
