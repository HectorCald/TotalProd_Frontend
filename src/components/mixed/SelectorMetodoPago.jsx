import React, { useEffect, useRef } from 'react';
import InputSelect from '../common/inputs/InputSelect';

const STORAGE_KEY = 'selectorMetodoPagoPreferencia';

const METODOS_PAGO = [
  { value: 'qr', label: 'QR' },
  { value: 'tarjeta', label: 'Tarjeta' },
  { value: 'efectivo', label: 'Efectivo' },
  { value: 'credito', label: 'A crédito' }
];

function SelectorMetodoPago({
  value,
  onChange,
  disabled = false,
  readOnly,
  placeholder = 'Método de pago (obligatorio)',
  label,
  required,
  error,
  onClearError
}) {
  const storedValueRef = useRef(null);

  if (storedValueRef.current === null && typeof window !== 'undefined') {
    storedValueRef.current = localStorage.getItem(STORAGE_KEY);
  }

  const valorActual = value ?? storedValueRef.current ?? 'efectivo';

  useEffect(() => {
    if ((value === '' || value == null) && onChange) {
      if (storedValueRef.current) {
        onChange(storedValueRef.current);
      } else {
        onChange('efectivo');
      }
    }
  }, [value, onChange]);

  useEffect(() => {
    if (value && typeof window !== 'undefined') {
      storedValueRef.current = value;
      localStorage.setItem(STORAGE_KEY, value);
    }
  }, [value]);

  return (
    <InputSelect
      label={label}
      value={valorActual}
      onChange={onChange}
      options={METODOS_PAGO}
      placeholder={placeholder}
      required={required}
      disabled={disabled}
      readOnly={readOnly}
      error={error}
      onClearError={onClearError}
    />
  );
}

export default SelectorMetodoPago;
