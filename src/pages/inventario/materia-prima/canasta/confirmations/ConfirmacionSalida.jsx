import React, { useState, useEffect } from 'react';
import ModalCentro from '../../../../../components/common/modals/ModalCentro';
import Input from '../../../../../components/common/inputs/Input';
import SelectCliente from '../../../../../components/common/fast/SelectCliente';
import InfoDisplay from '../../../../../components/common/outputs/InfoDisplay';

const ConfirmacionSalida = ({ isOpen, onClose, producto }) => {
  const [cantidad, setCantidad] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [cliente, setCliente] = useState(null);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!isOpen) {
      setCantidad('');
      setObservaciones('');
      setCliente(null);
      setErrors({});
    }
  }, [isOpen]);

  const handleConfirm = () => {
    const newErrors = {};
    if (!cantidad || Number(cantidad) <= 0) newErrors.cantidad = true;
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    setErrors({});
    console.log('Realizar Salida directa', { producto, cantidad, observaciones, cliente });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <ModalCentro
      isOpen={isOpen}
      onClose={onClose}
      title="Confirmar Salida"
      confirmText="Generar Salida"
      onConfirm={handleConfirm}
      width="450px"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
        {producto && (() => {
          let color;
          const qty = Number(producto.quantity ?? 0);
          const min = Number(producto.stock_minimo ?? 0);
          if (min > 0) {
            if (qty <= min) color = 'var(--error-color)';
            else if (qty <= min * 1.5) color = 'var(--warning-color)';
            else color = 'var(--info-color)';
          } else {
            if (qty <= 0) color = 'var(--error-color)';
            else if (qty <= 5) color = 'var(--warning-color)';
            else color = 'var(--info-color)';
          }

          return (
             <div style={{ marginBottom: '10px' }}>
               <InfoDisplay 
                 label="Producto Seleccionado"
                 value={producto.name}
                 subValue={`Stock: ${qty} ${producto.type_measure?.code || ''}`}
                 subValueColor={color}
                 icon="bx-box"
               />
             </div>
          );
        })()}
        
        <Input 
          label="Cantidad"
          tipo="number"
          value={cantidad}
          onChange={(e) => { setCantidad(e.target.value); setErrors(prev => ({ ...prev, cantidad: false })); }}
          placeholder="0"
          required={true}
          error={errors.cantidad}
        />

        <Input 
          label="Observaciones"
          tipo="textarea"
          value={observaciones}
          onChange={(e) => setObservaciones(e.target.value)}
          placeholder="Observaciones de la salida..."
        />

        <SelectCliente 
          value={cliente}
          onChange={(val) => setCliente(val)}
          fetchTrigger={isOpen}
          openDirection="up"
        />
      </div>
    </ModalCentro>
  );
};

export default ConfirmacionSalida;
